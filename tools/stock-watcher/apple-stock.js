#!/usr/bin/env node
/**
 * Apple 公式エンドポイントを直接叩く在庫監視 → Discord 通知
 *
 * 依存ゼロ (Node 18+ の global fetch)
 *
 *   node apple-stock.js --doctor              設定から通知まで一気通貫で自己診断（まずこれ）
 *   node apple-stock.js --find-parts 256      購入ページから品番(MXXXXJ/A)を探す
 *   node apple-stock.js --fetch-prices        定価と買取価格を取得して prices.json を更新
 *   node apple-stock.js --profit              買取価格と利益の一覧（ネット接続不要）
 *   node apple-stock.js --raw                 生JSONを保存して構造を確認する
 *   node apple-stock.js --check               1回チェック
 *   node apple-stock.js --watch               常駐監視
 *   node apple-stock.js --test                Discord疎通テスト
 */

const fs = require('fs');
const path = require('path');
const { normCapacity, normModel } = require('./buyback');

/** 同じディレクトリの .env を読む。実際の環境変数が優先される。 */
function loadEnvFile() {
  const f = process.env.ENV_FILE || path.join(__dirname, '.env');
  if (!fs.existsSync(f)) return null;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    } else {
      v = v.replace(/\s+#.*$/, '').trim();   // 行末コメントを除去
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
  return f;
}
const ENV_FILE_USED = loadEnvFile();

const CFG = {
  region: process.env.APPLE_REGION || 'jp',          // 'jp' / 'us'(空文字) など
  parts: (process.env.APPLE_PARTS || '').split(',').map(s => s.trim()).filter(Boolean),
  // 郵便番号/都市名。カンマ区切りで複数指定すると、それぞれ問い合わせて結果をまとめる
  locations: (process.env.APPLE_LOCATIONS || process.env.APPLE_LOCATION || '')
    .split(',').map(s => s.trim()).filter(Boolean),
  // 店舗名の部分一致で絞る。カンマ区切りでOR 例 "川崎,渋谷,新宿"
  storeFilter: (process.env.STORE_FILTER || '').split(',').map(s => s.trim()).filter(Boolean),
  buyPage: process.env.APPLE_BUY_PAGE || '',         // --find-parts / --fetch-prices 用（空なら機種ページ）
  // 買取価格の取得元（--fetch-prices）。非公式の集計サイトなので値は参考扱い
  buybackUrl: process.env.BUYBACK_URL || 'https://is-checker.com/i18_stock_4.html?411',
  // --watch 中に買取価格を取り直す間隔（分）。0 で自動更新しない
  priceRefreshMin: Number(process.env.PRICE_REFRESH_MIN ?? 60),
  webhook: process.env.DISCORD_WEBHOOK_URL || '',
  mention: process.env.MENTION || '',
  intervalSec: Number(process.env.INTERVAL_SEC || 60),
  repeatMin: Number(process.env.REPEAT_MIN || 30),
  includeDelivery: process.env.INCLUDE_DELIVERY === '1',
  stateFile: process.env.STATE_FILE || path.join(__dirname, 'apple-state.json'),
  dryRun: process.env.DRY_RUN === '1',
};

const BASE = `https://www.apple.com${CFG.region ? '/' + CFG.region : ''}`;

// --------------------------------------------------------- 表示名と買取価格
// prices.json（任意）。無ければラベルは品番そのまま、利益計算は行わない。
const PRICES_FILE = process.env.PRICES_FILE || path.join(__dirname, 'prices.json');

function loadPrices() {
  const f = PRICES_FILE;
  if (!fs.existsSync(f)) return { file: null, labels: {}, cost: {}, buyers: {}, meta: {} };
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    return {
      file: f,
      mtime: fs.statSync(f).mtimeMs,
      labels: j.labels || {},
      cost: j.cost || {},
      buyers: j.buyers || {},
      meta: j._meta || {},
    };
  } catch (e) {
    console.error(`価格ファイルを読めません (${f}): ${e.message}`);
    return { file: f, labels: {}, cost: {}, buyers: {}, meta: {}, error: e.message };
  }
}
let PRICES = loadPrices();

/** --watch 中に prices.json が書き換わったら読み直す（再起動不要にするため） */
function reloadPricesIfChanged() {
  try {
    if (!fs.existsSync(PRICES_FILE)) return;
    if (fs.statSync(PRICES_FILE).mtimeMs !== PRICES.mtime) {
      const next = loadPrices();
      if (!next.error) PRICES = next;
    }
  } catch { /* 読めなければ前回の値で続行 */ }
}

/** 品番を人が読める名前に。未登録なら品番そのまま。 */
function label(part) {
  return PRICES.labels[part] || part;
}

const yen = n => '¥' + Number(n).toLocaleString('ja-JP');

/**
 * その品番の買取価格の最高値と最低値（同額の店はまとめる）。価格が1件も無ければ null。
 * @returns {{ best: {buyers, price, profit}, worst: {buyers, price, profit}, cost, count } | null}
 */
function offers(part) {
  const list = [];
  for (const [buyer, table] of Object.entries(PRICES.buyers)) {
    const price = Number(table?.[part] || 0);
    if (price > 0) list.push({ buyer, price });
  }
  if (!list.length) return null;
  const cost = Number(PRICES.cost[part] || 0) || null;
  const pick = price => ({
    buyers: list.filter(o => o.price === price).map(o => o.buyer),
    price,
    profit: cost ? price - cost : null,
  });
  const prices = list.map(o => o.price);
  return { best: pick(Math.max(...prices)), worst: pick(Math.min(...prices)), cost, count: list.length };
}

const signedYen = n => (n >= 0 ? '+' : '−') + yen(Math.abs(n)).slice(1);
const shopNames = (names, max = 2) =>
  names.length > max ? `${names.slice(0, max).join('/')} 他${names.length - max}店` : names.join('/');

/** 買取価格の出典。通知と表に必ず添える（非公式集計のため） */
function priceSourceNote() {
  const m = PRICES.meta || {};
  if (!m.source) return '※ 買取価格は手入力の値です。';
  const at = m.sourceUpdated || (m.fetchedAt || '').slice(0, 16).replace('T', ' ');
  return `※ 買取価格は ${m.source} の非公式集計による参考値（${at} 時点）。各社の実際の買取額と異なる場合があります。`;
}

/** 在庫が出た品番について、買取見込みの行を組み立てる */
function profitLines(parts) {
  const lines = [];
  for (const part of [...new Set(parts)]) {
    const o = offers(part);
    if (!o) continue;
    const fmt = x => `${shopNames(x.buyers)} ${yen(x.price)}${x.profit === null ? '' : `（${signedYen(x.profit)}）`}`;
    lines.push(`${label(part)}${o.cost ? `　定価 ${yen(o.cost)}` : '　仕入未設定'}`);
    lines.push(`  最高 ${fmt(o.best)}`);
    if (o.worst.price !== o.best.price) lines.push(`  最低 ${fmt(o.worst)}`);
  }
  return lines;
}
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

// ---------------------------------------------------------------- endpoints
// fulfillment-messages は 541 を返すようになったとの報告があるため、
// pickup-message を先に試し、駄目なら fulfillment-messages にフォールバックする。
function endpointUrls(location) {
  const qs = new URLSearchParams();
  qs.set('pl', 'true');
  CFG.parts.forEach((p, i) => {
    qs.set(`parts.${i}`, p);
    qs.set(`mts.${i}`, 'regular');
  });
  if (location) qs.set('location', location);

  const overrides = (process.env.APPLE_ENDPOINTS || '').split(',').map(s => s.trim()).filter(Boolean);
  const paths = overrides.length ? overrides : ['/shop/retail/pickup-message', '/shop/fulfillment-messages'];
  return paths.map(p => (p.startsWith('http') ? p : BASE + p) + '?' + qs.toString());
}

/** プロキシ設定があれば、その環境変数名を返す（403の原因切り分け用） */
function proxyEnv() {
  for (const k of ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy']) {
    if (process.env[k]) return k;
  }
  return null;
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': CFG.region === 'jp' ? 'ja-JP,ja;q=0.9,en;q=0.8' : 'en-US,en;q=0.9',
      'Referer': `${BASE}/shop/buy-iphone`,
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) {
    const hint = res.status === 541 ? ' — このエンドポイントは現在ブロックされている可能性があります'
               : res.status === 403 ? (proxyEnv()
                   ? ` — 403。プロキシ(${proxyEnv()})が設定されています。Appleの拒否ではなく`
                     + `ネットワーク側の遮断かもしれません`
                   : ' — UA/Referer 拒否、またはレート制限の可能性')
               : res.status === 429 ? ' — レート制限。間隔を空けてください'
               : '';
    throw Object.assign(new Error(`HTTP ${res.status}${hint}`), { status: res.status, body: text.slice(0, 400) });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('JSONとして解析できません（HTMLが返された可能性）'), { body: text.slice(0, 400) });
  }
}

/** 1地点について、複数エンドポイントを順に試し最初に成功したものを返す */
async function fetchOneLocation(location) {
  const errors = [];
  for (const url of endpointUrls(location)) {
    try {
      return { json: await getJson(url), url, location };
    } catch (e) {
      errors.push(`${url.split('?')[0]} → ${e.message}`);
    }
  }
  throw new Error(`[${location || '地点未指定'}] 全エンドポイントが失敗:\n    ` + errors.join('\n    '));
}

/**
 * 全地点を順に問い合わせる。1地点でも成功すればその結果を返す。
 * Apple は location を中心に近隣店舗を返すため、離れた店舗を見たい場合は
 * 地点を複数指定する必要がある（例: 川崎と渋谷）。
 */
async function fetchAllLocations() {
  const results = [], errors = [];
  for (const [i, loc] of CFG.locations.entries()) {
    if (i > 0) await sleep(800);   // 連続アクセスを避ける
    try {
      results.push(await fetchOneLocation(loc));
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (!results.length) throw new Error('全地点で取得失敗:\n  ' + errors.join('\n  '));
  if (errors.length) console.error('一部の地点で取得失敗:\n  ' + errors.join('\n  '));
  return results;
}

/** 複数地点の結果を1つの配列にまとめる（店舗×品番で重複排除） */
function mergeRows(results, { delivery = false } = {}) {
  const map = new Map();
  for (const { json, location } of results) {
    let rows = extractPickup(json);
    if (delivery) rows = rows.concat(extractDelivery(json));
    for (const r of rows) {
      const k = `${r.kind}|${r.part}|${r.store}`;
      // 同じ店舗が複数地点から返った場合、在庫ありの情報を優先して残す
      if (!map.has(k) || (isInStock(r) && !isInStock(map.get(k)))) {
        map.set(k, { ...r, location });
      }
    }
  }
  return [...map.values()];
}

// ------------------------------------------------------- 汎用JSONウォーカー
// レスポンス構造を決め打ちせず、partsAvailability を持つオブジェクトを全部拾う。
// （fulfillment-messages は body.content.pickupMessage.stores[]、
//   pickup-message は body.stores[] など、形が違う/変わるため）
function extractPickup(json) {
  const rows = [];
  const walk = (node, ctx) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(n => walk(n, ctx));

    const store = node.storeName || node.storeDisplayName || node.name || ctx.store;
    const city = node.city || node.storecity || ctx.city;
    const nextCtx = { store, city };

    const pa = node.partsAvailability;
    if (pa && typeof pa === 'object' && !Array.isArray(pa)) {
      for (const [part, info] of Object.entries(pa)) {
        if (!info || typeof info !== 'object') continue;
        const quote =
          info.pickupSearchQuote ||
          info.storePickupQuote ||
          info.messageTypes?.regular?.storePickupQuote ||
          info.messageTypes?.compact?.storePickupQuote || '';
        const display = info.pickupDisplay || info.pickupType || '';
        rows.push({
          kind: 'pickup',
          store: store || '(店舗名不明)',
          city: city || '',
          part,
          title: info.storePickupProductTitle || info.messageTypes?.regular?.storePickupProductTitle || '',
          display: String(display),
          quote: String(quote),
        });
      }
    }
    for (const v of Object.values(node)) walk(v, nextCtx);
  };
  walk(json, {});
  return rows;
}

function extractDelivery(json) {
  const rows = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    const dm = node.deliveryMessage;
    if (dm && typeof dm === 'object') {
      for (const [part, info] of Object.entries(dm)) {
        if (!info || typeof info !== 'object' || !/\//.test(part)) continue;
        const msg = info.regular?.deliveryOptionMessages?.[0]
          || info.regular?.deliveryOptionMessages
          || info.compact?.deliveryOptionMessages?.[0] || '';
        rows.push({
          kind: 'delivery',
          store: 'オンライン配送',
          city: '',
          part,
          title: '',
          display: info.isBuyable === true ? 'available' : info.isBuyable === false ? 'unavailable' : '',
          quote: typeof msg === 'string' ? msg : JSON.stringify(msg).slice(0, 120),
        });
      }
    }
    for (const v of Object.values(node)) walk(v);
  };
  walk(json);
  return rows;
}

const UNAVAILABLE_RE = /unavailable|ineligible|not available|取り扱いなし|受け取れません|利用できません|在庫なし/i;
const AVAILABLE_RE = /\bavailable\b|本日|受け取り可能|受取可能|お受け取り/i;

function isInStock(row) {
  const d = row.display.toLowerCase();
  if (d === 'available') return true;
  if (d === 'unavailable' || d === 'ineligible') return false;
  const text = `${row.display} ${row.quote}`;
  if (UNAVAILABLE_RE.test(text)) return false;
  return AVAILABLE_RE.test(text);
}

function applyStoreFilter(rows) {
  if (!CFG.storeFilter.length) return rows;
  const fs_ = CFG.storeFilter.map(f => f.toLowerCase());
  // 店舗名だけで判定する。住所(city)まで含めると、例えば "渋谷" が
  // 渋谷区にある表参道店にもマッチしてしまい、指定していない店舗が混ざる。
  return rows.filter(r =>
    r.kind === 'delivery' || fs_.some(f => r.store.toLowerCase().includes(f)));
}

// ------------------------------------------------------------------ Discord
async function notify(content) {
  // メンションを先に組み立てる。DRY RUN の表示が実際の送信内容と一致するように。
  let text = (CFG.mention ? CFG.mention + ' ' : '') + content;
  if (text.length > 1900) text = text.slice(0, 1890) + '\n…（省略）';

  if (!CFG.webhook || CFG.dryRun) {
    console.log(`[DRY RUN / 未送信]\n${text}\n`);
    return;
  }
  const body = JSON.stringify({
    content: text,
    allowed_mentions: { parse: ['everyone', 'users', 'roles'] },
  });
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(CFG.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        await sleep((j.retry_after || 2) * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`Discord HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return;
    } catch (e) {
      if (i === 2) return console.error('Discord送信失敗:', e.message);
      await sleep(2000 * (i + 1));
    }
  }
}

// -------------------------------------------------------------------- state
function loadState() {
  try { return JSON.parse(fs.readFileSync(CFG.stateFile, 'utf8')); }
  catch { return { rows: {}, lastAlertAt: {}, failStreak: 0, emptyAt: 0 }; }
}
function saveState(s) {
  fs.mkdirSync(path.dirname(CFG.stateFile), { recursive: true });
  fs.writeFileSync(CFG.stateFile, JSON.stringify(s, null, 2));
}

// ----------------------------------------------------------------- 品番探索
const productPage = () => CFG.buyPage || `${BASE}/shop/buy-iphone/iphone-18-pro`;

async function getHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'ja-JP,ja;q=0.9' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  return res.text();
}

/** pos を含む最小の {...} を返す（文字列リテラル内の括弧は無視）。見つからなければ null */
function enclosingObject(s, pos) {
  for (let start = s.lastIndexOf('{', pos); start >= 0 && pos - start < 4000; start = s.lastIndexOf('{', start - 1)) {
    let depth = 0, inStr = false;
    for (let i = start; i < s.length && i - start < 8000; i++) {
      const c = s[i];
      if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) {
        if (i < pos) break;                // pos を含まない（手前で閉じた）→ さらに外側へ
        try { return JSON.parse(s.slice(start, i + 1)); } catch { break; }
      }
    }
  }
  return null;
}

/** オブジェクトを再帰探索し、最初に見つかった key の値を返す */
function findKey(o, keys, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 4) return undefined;
  for (const k of keys) if (o[k] !== undefined && typeof o[k] !== 'object') return o[k];
  for (const v of Object.values(o)) {
    const r = findKey(v, keys, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

/**
 * Apple の機種ページから品番ごとの名称・容量・色・定価を取り出す。
 * JSON の階層やキー順は決め打ちせず、"partNumber" を含む最小のオブジェクトを丸ごと読む。
 * （以前は品番の「近く」の文字列を拾っていたため、隣の商品の名前を取り違えていた）
 */
function extractProducts(html) {
  const re = /"partNumber"\s*:\s*"([A-Z0-9]{3,8}\/A)"/g;
  const seen = new Map();
  let m;
  while ((m = re.exec(html))) {
    const part = m[1];
    if (seen.get(part)?.title) continue;
    const o = enclosingObject(html, m.index);
    if (!o) continue;
    // 名称にノーブレークスペースが混ざるので普通の空白にそろえる（"Pro Max" で検索できるように）
    const title = String(findKey(o, ['name', 'productTitle', 'displayName', 'title']) || '').replace(/\s+/g, ' ').trim();
    const price = Number(findKey(o, ['fullPrice', 'amount', 'currentPrice']) || 0) || null;
    const cm = title.match(/^(.*?)\s*(\d+\s*(?:GB|TB))\s*(.*)$/i);
    seen.set(part, {
      part,
      title,
      model: cm ? cm[1].trim() : '',
      capacity: cm ? normCapacity(cm[2]) : (findKey(o, ['dimensionCapacity', 'capacity']) || ''),
      color: cm ? cm[3].trim() : (findKey(o, ['dimensionColor', 'color']) || ''),
      price,
    });
  }
  return [...seen.values()].filter(p => p.title);
}

async function findParts(filter) {
  const url = productPage();
  console.log('購入ページ:', url);
  const html = await getHtml(url);
  console.log('HTML長:', html.length, 'bytes\n');

  let list = extractProducts(html);
  if (filter) {
    const f = filter.toLowerCase();
    list = list.filter(r => Object.values(r).join(' ').toLowerCase().includes(f));
  }

  if (!list.length) {
    console.log('品番が見つかりませんでした。');
    console.log('  - 機種ページを直接指定してください:');
    console.log(`    APPLE_BUY_PAGE="${BASE}/shop/buy-iphone/iphone-18-pro" node apple-stock.js --find-parts 256`);
    console.log('  - ページがJS描画の場合は、ブラウザで構成を選び、URLの product= または');
    console.log('    「購入手続きへ」直前のカート画面に出る MXXXXJ/A 形式の品番を控えてください。');
    return;
  }

  console.log(`見つかった品番: ${list.length}件${filter ? ` (フィルタ: ${filter})` : ''}\n`);
  list.sort((a, b) => a.title.localeCompare(b.title));
  console.log('品番'.padEnd(12) + '定価'.padEnd(12) + '名称');
  console.log('-'.repeat(72));
  for (const r of list) {
    console.log(r.part.padEnd(12) + (r.price ? yen(r.price) : '-').padEnd(12) + r.title);
  }
  console.log('\nこの品番を APPLE_PARTS に設定してください。');
}

// ------------------------------------------------------------ 価格の自動取得
/**
 * prices.json を実データで更新する。
 *   labels / cost : Apple 公式の機種ページ（名称と定価）。手で入れた値は上書きしない
 *   buyers        : BUYBACK_URL の買取価格表。毎回取り直して置き換える
 *
 * 買取表は「機種×容量」単位で、色は区別されない。そのため同じ容量の色違いには同じ価格が入る。
 * 表に無い機種・容量の品番には何も入れない（推測で埋めない）。
 */
async function fetchPrices({ quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const cur = fs.existsSync(PRICES_FILE) ? JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8')) : {};
  const parts = CFG.parts.length ? CFG.parts : Object.keys(cur.labels || {});
  if (!parts.length) throw new Error('APPLE_PARTS が未設定です');

  // 1. Apple: 品番 → 機種・容量・定価
  const products = new Map(extractProducts(await getHtml(productPage())).map(p => [p.part, p]));
  const known = parts.filter(p => products.has(p));
  const unknown = parts.filter(p => !products.has(p));
  log(`Apple 機種ページ: ${productPage()}`);
  log(`  品番 ${parts.length}件中 ${known.length}件を確認${unknown.length ? `（見つからない: ${unknown.join(', ')}）` : ''}`);

  // 2. 買取価格表
  const { parseBuyback } = require('./buyback');
  const table = parseBuyback(await getHtml(CFG.buybackUrl));
  log(`買取価格表: ${CFG.buybackUrl}`);
  log(`  ${table.rows.length}行 × ${table.shops.length}店 / サイト側の更新 ${table.updated || '(不明)'}`);

  const labels = { ...(cur.labels || {}) };
  const cost = { ...(cur.cost || {}) };
  const buyers = {};
  const unmatched = [];
  for (const part of known) {
    const p = products.get(part);
    if (!labels[part]) labels[part] = `${p.capacity} ${p.color}`.trim();
    if (!Number(cost[part]) && p.price) cost[part] = p.price;
    const row = table.rows.find(r => normModel(r.model) === normModel(p.model) && r.capacity === p.capacity);
    if (!row) { unmatched.push(`${part}(${p.title})`); continue; }
    for (const [shop, price] of Object.entries(row.prices)) {
      (buyers[shop] ||= {})[part] = price;
    }
  }
  if (unmatched.length) log(`  買取表に該当行なし: ${unmatched.join(', ')}`);

  const out = {
    _README: [
      'node apple-stock.js --fetch-prices で自動生成・更新されるファイルです。',
      'labels / cost は空欄のときだけ Apple 公式の値で埋めます。手で書き換えた値は保持されます。',
      'buyers は毎回取り直して置き換えます。',
      '買取価格は非公式の集計サイトの値で、色の区別はありません（同じ容量なら同じ価格）。',
    ],
    _meta: {
      source: new URL(CFG.buybackUrl).hostname,
      sourceUrl: CFG.buybackUrl,
      sourceUpdated: table.updated,
      fetchedAt: new Date().toISOString(),
      costSource: productPage(),
      colorSpecific: false,
    },
    labels,
    cost,
    buyers,
  };
  fs.writeFileSync(PRICES_FILE, JSON.stringify(out, null, 2) + '\n');
  PRICES = loadPrices();
  log(`書き込み: ${PRICES_FILE}（買取店 ${Object.keys(buyers).length}店）`);
  return { unknown, unmatched };
}

// ------------------------------------------------------------------ raw出力
async function raw() {
  requireConfig({ webhook: false });
  const results = await fetchAllLocations();
  const out = path.join(__dirname, 'apple-raw.json');
  fs.writeFileSync(out, JSON.stringify(
    results.map(r => ({ location: r.location, url: r.url, json: r.json })), null, 2));

  console.log('='.repeat(76));
  console.log('品番        :', CFG.parts.join(', '));
  console.log('地点        :', CFG.locations.join(' / '));
  console.log('店舗フィルタ:', CFG.storeFilter.join(' / ') || '(なし)');
  console.log('生JSON保存先:', out);
  for (const r of results) console.log(`  ${r.location} → ${r.url.split('?')[0]}`);
  console.log('='.repeat(76));

  const pickup = mergeRows(results);
  console.log(`\n▼ 返ってきた店舗すべて: ${pickup.length}件`);
  if (!pickup.length) {
    console.log('  0件 — partsAvailability が見つかりません。apple-raw.json を確認してください。');
    console.log('  よくある原因: 地点の指定ミス / 品番が不正 / 地域(APPLE_REGION)違い');
  }
  for (const r of pickup) {
    console.log(`  [${isInStock(r) ? '在庫あり' : '在庫なし'}] ${r.store}${r.city ? `(${r.city})` : ''} | ${r.part} | 取得元地点=${r.location} | display=${r.display || '-'} | ${r.quote || '-'}`);
  }

  const kept = applyStoreFilter(pickup);
  console.log(`\n▼ STORE_FILTER 適用後（実際に監視される店舗）: ${kept.length}件`);
  if (CFG.storeFilter.length && !kept.length) {
    console.log('  0件 — 店舗名が一致していません。上の一覧の表記に合わせてください。');
  }
  for (const r of kept) console.log(`  ${r.store}${r.city ? `(${r.city})` : ''}`);

  const delivery = mergeRows(results, { delivery: true }).filter(r => r.kind === 'delivery');
  console.log(`\n▼ 配送(delivery) 抽出結果: ${delivery.length}件`);
  for (const r of delivery) {
    console.log(`  [${isInStock(r) ? '購入可' : '購入不可'}] ${r.part} | isBuyable=${r.display || '-'} | ${r.quote || '-'}`);
  }
}

// ------------------------------------------------------------------ profit
// 品番 × 買取店の価格表と利益を一覧表示する。ネットワークは使わない。
function showProfit() {
  if (!PRICES.file) {
    console.log('価格ファイルがありません。作ってください:');
    console.log('  cp prices.example.json prices.json');
    console.log('  open -e prices.json      # 金額を埋める');
    process.exitCode = 1;
    return;
  }
  if (PRICES.error) { console.log('価格ファイルが壊れています:', PRICES.error); process.exitCode = 1; return; }

  const parts = CFG.parts.length ? CFG.parts
    : [...new Set([...Object.keys(PRICES.cost), ...Object.values(PRICES.buyers).flatMap(t => Object.keys(t))])];
  const buyers = Object.keys(PRICES.buyers);

  if (!parts.length) { console.log('品番が1つも設定されていません。'); process.exitCode = 1; return; }

  const pad = (str, w) => {
    // 全角を2文字幅として揃える
    const width = [...String(str)].reduce((a, c) => a + (/[\x00-\xff]/.test(c) ? 1 : 2), 0);
    return String(str) + ' '.repeat(Math.max(0, w - width));
  };

  const W = 100;
  console.log('='.repeat(W));
  console.log(`買取価格と利益  (価格ファイル: ${PRICES.file} / 買取店 ${buyers.length}店)`);
  console.log('='.repeat(W));
  console.log(pad('機種', 22) + pad('仕入', 11) + pad('最高値（利益）', 34) + '最低値（利益）');
  console.log('-'.repeat(W));

  let anyPrice = false;
  for (const part of parts) {
    const cost = Number(PRICES.cost[part] || 0);
    const o = offers(part);
    if (o) anyPrice = true;
    const cell = x => `${yen(x.price)}${x.profit === null ? '' : `(${signedYen(x.profit)})`} ${shopNames(x.buyers)}`;
    console.log(pad(label(part), 22) + pad(cost > 0 ? yen(cost) : '-', 11)
      + (o ? pad(cell(o.best), 34) + ' ' + cell(o.worst) : '買取価格なし'));
  }
  console.log('='.repeat(W));
  if (!anyPrice) {
    console.log('買取価格が1件も入っていません。node apple-stock.js --fetch-prices で取得してください。');
  } else if (parts.some(p => !Number(PRICES.cost[p]))) {
    console.log('※ 仕入価格が未設定の品番があります。利益を出すには cost を埋めてください。');
  }
  console.log(priceSourceNote());
  if (PRICES.meta?.colorSpecific === false) console.log('※ 取得元の買取表は色を区別していません（同じ容量なら同じ価格）。');
}

// ------------------------------------------------------------------ doctor
// 設定から実際の通知までを一気通貫で自己診断し、次にやることを指示する。
async function doctor() {
  const problems = [], warns = [];
  const line = () => console.log('-'.repeat(72));

  console.log('='.repeat(72));
  console.log('Apple 在庫監視 セルフチェック');
  console.log('='.repeat(72));
  console.log('設定ファイル :', ENV_FILE_USED || '(.env なし。環境変数から読み込み)');
  console.log('地域         :', CFG.region, `(${BASE})`);
  console.log('品番         :', CFG.parts.join(', ') || '(未設定)');
  console.log('地点         :', CFG.locations.join(' / ') || '(未設定)');
  console.log('店舗フィルタ :', CFG.storeFilter.join(' / ') || '(絞り込みなし)');
  console.log('監視間隔     :', CFG.intervalSec + '秒');
  const nBuyers = Object.keys(PRICES.buyers).length;
  const nCost = Object.values(PRICES.cost).filter(v => Number(v) > 0).length;
  console.log('価格ファイル :', PRICES.file
    ? `${PRICES.file} (仕入 ${nCost}件 / 買取店 ${nBuyers}店)`
    : '(なし。--fetch-prices で作成できます)');
  if (PRICES.meta?.fetchedAt) {
    console.log('買取価格     :', `${PRICES.meta.source} ${PRICES.meta.sourceUpdated || ''} 時点`
      + `（取得 ${PRICES.meta.fetchedAt.slice(0, 16).replace('T', ' ')} UTC）`);
    const ageH = (Date.now() - Date.parse(PRICES.meta.fetchedAt)) / 3600e3;
    if (ageH > 24) warns.push(`買取価格が ${Math.floor(ageH)} 時間前のものです。--fetch-prices で更新してください`);
  }
  if (PRICES.error) warns.push(`prices.json が壊れています: ${PRICES.error}`);

  if (!CFG.parts.length) problems.push('APPLE_PARTS が未設定です（--find-parts で品番を調べてください）');
  if (!CFG.locations.length) problems.push('APPLE_LOCATION が未設定です');
  if (problems.length) return verdict(problems, warns);

  // --- 1. 各地点への問い合わせ -------------------------------------------
  line();
  console.log('[1/4] 各地点に問い合わせ中...');
  let results;
  try {
    results = await fetchAllLocations();
  } catch (e) {
    console.log('\n  ✗ 全地点で失敗しました:\n' + e.message.split('\n').map(l => '    ' + l).join('\n'));
    problems.push('Apple のエンドポイントに到達できません。'
      + '\n      541 なら APPLE_ENDPOINTS を変更、403 なら間隔を空けるかブラウザのCookieが必要です。'
      + (proxyEnv()
        ? `\n      ※ ${proxyEnv()} が設定されています。社内プロキシやサンドボックスによる遮断の可能性が高いです。`
          + '\n         別のネットワーク（自宅のPCなど）で試してください。'
        : '')
      + '\n      どうしても駄目なら check.js（is-checker.com 版）に切り替えてください。');
    return verdict(problems, warns);
  }
  if (results.length < CFG.locations.length) {
    warns.push(`${CFG.locations.length - results.length}件の地点で取得に失敗しました（残りで継続します）`);
  }

  const perLocation = results.map(r => ({
    loc: r.location,
    rows: extractPickup(r.json),
  }));
  for (const { loc, rows } of perLocation) {
    const names = [...new Set(rows.map(r => r.store))];
    console.log(`  ${loc} → ${names.length}店舗: ${names.join(', ') || '(なし)'}`);
  }

  const all = mergeRows(results);
  if (!all.length) {
    problems.push('店舗情報を1件も抽出できませんでした。apple-raw.json を確認してください'
      + '（--raw で保存されます）。品番や地域(APPLE_REGION)の指定ミスが多いです。');
    return verdict(problems, warns);
  }

  // --- 2. 品番のカバレッジ ------------------------------------------------
  line();
  console.log('[2/4] 品番の確認');
  const seenParts = new Set(all.map(r => r.part));
  for (const part of CFG.parts) {
    const ok = seenParts.has(part);
    const name = label(part) === part ? '' : `  ${label(part)}`;
    console.log(`  ${ok ? '✓' : '✗'} ${part}${name}${ok ? '' : '  ← 結果に出てきません。品番が誤っている可能性'}`);
    if (!ok) problems.push(`品番 ${part} が Apple 側の応答に出てきません。--find-parts で調べ直してください`);
  }
  const extra = [...seenParts].filter(p => !CFG.parts.includes(p));
  if (extra.length) warns.push('指定していない品番も返ってきています: ' + extra.join(', '));

  // --- 3. 店舗フィルタ ----------------------------------------------------
  line();
  console.log('[3/4] 監視対象の店舗');
  const kept = applyStoreFilter(all);
  const keptStores = [...new Set(kept.map(r => r.store))];
  if (!kept.length) {
    console.log('  ✗ 0件');
    problems.push('STORE_FILTER がどの店舗にも一致しません。上の店舗名の表記に合わせてください'
      + '（フィルタを空にすれば全店舗が対象になります）');
  } else {
    keptStores.forEach(n => console.log(`  ✓ ${n}`));
    for (const f of CFG.storeFilter) {
      if (!keptStores.some(n => n.toLowerCase().includes(f.toLowerCase()))) {
        warns.push(`店舗フィルタ "${f}" に一致する店舗が返ってきていません。地点(APPLE_LOCATION)を見直してください`);
      }
    }
    const inNow = kept.filter(isInStock);
    console.log(`\n  現在の在庫: ${inNow.length}件` +
      (inNow.length ? ' → ' + inNow.map(r => r.store).join(', ') : '（すべて在庫なし＝監視の出発点として正常）'));
  }

  // --- 4. 地点の最小セット ------------------------------------------------
  if (kept.length && perLocation.length > 1) {
    const sets = perLocation.map(pl => ({
      loc: pl.loc,
      stores: new Set(applyStoreFilter(pl.rows).map(r => r.store)),
    }));
    const target = new Set(keptStores);
    const covered = new Set(), chosen = [];
    while (covered.size < target.size) {
      let best = null, gain = 0;
      for (const st of sets) {
        if (chosen.includes(st.loc)) continue;
        const g = [...st.stores].filter(x => target.has(x) && !covered.has(x)).length;
        if (g > gain) { gain = g; best = st; }
      }
      if (!best) break;
      chosen.push(best.loc);
      best.stores.forEach(x => { if (target.has(x)) covered.add(x); });
    }
    if (chosen.length && chosen.length < CFG.locations.length) {
      warns.push(`地点は ${chosen.join(',')} の${chosen.length}つで同じ店舗を全部カバーできます。`
        + `\n      APPLE_LOCATION を減らすとリクエスト数が ${CFG.locations.length}→${chosen.length} になり、`
        + `403やIP遮断のリスクが下がります。`);
    }
  }

  // --- 5. Discord --------------------------------------------------------
  line();
  console.log('[4/4] Discord');
  if (!CFG.webhook) {
    problems.push('DISCORD_WEBHOOK_URL が未設定です。これがないと通知が飛びません');
    console.log('  ✗ 未設定');
  } else if (CFG.dryRun) {
    console.log('  - DRY_RUN=1 のため送信をスキップしました');
    warns.push('DRY_RUN=1 が有効です。本番監視の前に外してください');
  } else {
    await notify(`✅ セルフチェック (${ts()})\n` +
      `品番: \`${CFG.parts.join(', ')}\`\n` +
      `監視店舗: ${keptStores.join(', ') || '(なし)'}`);
    console.log('  ✓ テスト通知を送信しました。Discord に届いたか確認してください');
  }

  verdict(problems, warns);
}

function verdict(problems, warns) {
  console.log('\n' + '='.repeat(72));
  if (warns.length) {
    console.log('警告:');
    warns.forEach(w => console.log('  ! ' + w));
    console.log('');
  }
  if (problems.length) {
    console.log('要対応:');
    problems.forEach(p => console.log('  ✗ ' + p));
    console.log('\n判定: NG — 上を直してから もう一度 --doctor を実行してください');
    console.log('='.repeat(72));
    process.exitCode = 1;
    return;
  }
  console.log('判定: OK — このまま監視を開始できます');
  console.log('\n  node apple-stock.js --watch');
  console.log('\n  バックグラウンドで動かす場合:');
  console.log('  nohup node apple-stock.js --watch >> watch.log 2>&1 &');
  console.log('  tail -f watch.log');
  console.log('='.repeat(72));
}

// ------------------------------------------------------------------- check
function rowKey(r) {
  return `${r.kind}|${r.part}|${r.store}`;
}

async function checkOnce(state) {
  reloadPricesIfChanged();
  let results;
  try {
    results = await fetchAllLocations();
    state.failStreak = 0;
  } catch (e) {
    state.failStreak = (state.failStreak || 0) + 1;
    console.error(`[${ts()}] 取得失敗 (${state.failStreak}回連続): ${e.message}`);
    if (state.failStreak === 5) {
      await notify(`⚠️ Apple在庫監視: 5回連続で取得に失敗しています\n\`\`\`\n${e.message.slice(0, 800)}\n\`\`\``);
    }
    return;
  }

  let rows = applyStoreFilter(mergeRows(results, { delivery: CFG.includeDelivery }));

  if (!rows.length) {
    console.error(`[${ts()}] 抽出0件 — レスポンス構造が変わった可能性`);
    if (Date.now() - (state.emptyAt || 0) > 60 * 60 * 1000) {
      state.emptyAt = Date.now();
      await notify('⚠️ Apple在庫監視: 在庫情報を抽出できませんでした。\n`--raw` で構造と店舗フィルタを確認してください。');
    }
    return;
  }
  state.emptyAt = 0;

  const inStock = [];
  for (const r of rows) {
    const key = rowKey(r);
    const now = isInStock(r);
    const prev = state.rows[key];
    const was = prev ? prev.inStock : null;

    if (was === null) {
      console.log(`[${ts()}] 初回記録: ${now ? '在庫あり' : '在庫なし'} ${r.store} ${label(r.part)}`);
      if (now) inStock.push({ r, first: true });
    } else if (now && !was) {
      inStock.push({ r, first: false });
    } else if (now && was && CFG.repeatMin > 0) {
      const last = state.lastAlertAt[key] || 0;
      if (Date.now() - last > CFG.repeatMin * 60 * 1000) inStock.push({ r, repeat: true });
    }

    state.rows[key] = { inStock: now, display: r.display, at: Date.now() };
  }

  if (!inStock.length) {
    const nowIn = rows.filter(isInStock).length;
    console.log(`[${ts()}] 通知対象なし (${rows.length}件中 在庫あり${nowIn}件)`);
    return;
  }

  for (const { r } of inStock) state.lastAlertAt[rowKey(r)] = Date.now();

  // 同じ店舗で複数の品番（色違い）に在庫が出ることがあるため、店舗単位でまとめる
  const byStore = new Map();
  for (const { r } of inStock) {
    const k = `${r.store}|${r.city}`;
    if (!byStore.has(k)) byStore.set(k, { store: r.store, city: r.city, parts: [], quote: r.quote });
    byStore.get(k).parts.push(r.part);
  }
  const lines = [...byStore.values()].map(g =>
    `• **${g.store}**${g.city ? `（${g.city}）` : ''} — ${g.parts.map(label).join(', ')}`
    + `${g.quote ? ` / ${g.quote}` : ''}`);
  const profit = profitLines(inStock.map(x => x.r.part));
  const heading = inStock.every(x => x.repeat) ? '🟢 **在庫あり（継続中）**' : '🟢 **在庫が出ました**';

  await notify(
    `${heading}\n` +
    lines.join('\n') +
    (profit.length
      ? '\n\n💰 **買取見込み（参考値）**\n```\n' + profit.join('\n') + '\n```\n' + priceSourceNote() + '\n'
      : '\n') +
    `\n${BASE}/shop/buy-iphone`
  );
  console.log(`[${ts()}] 通知送信: ${byStore.size}店舗 / ${inStock.length}件`);
}

// --------------------------------------------------------------------- main
function requireConfig({ webhook = true } = {}) {
  const missing = [];
  if (!CFG.parts.length) missing.push('APPLE_PARTS（品番。--find-parts で探せます）');
  if (!CFG.locations.length) missing.push('APPLE_LOCATION（郵便番号や都市名。カンマ区切りで複数可。例 "150-0002,210-0007"）');
  if (webhook && !CFG.webhook && !CFG.dryRun) missing.push('DISCORD_WEBHOOK_URL（DRY_RUN=1 なら不要）');
  if (missing.length) {
    console.error('必要な環境変数が未設定です:\n  - ' + missing.join('\n  - '));
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || '--check';

  if (cmd === '--find-parts') return findParts(args[1] || '');
  if (cmd === '--raw') return raw();
  if (cmd === '--doctor') return doctor();
  if (cmd === '--profit') return showProfit();
  if (cmd === '--fetch-prices') {
    await fetchPrices();
    console.log('');
    return showProfit();
  }
  if (cmd === '--test') {
    const profit = profitLines(CFG.parts);
    await notify(`✅ Apple在庫監視 テスト通知 (${ts()})\n品番: \`${CFG.parts.map(label).join(', ') || '(未設定)'}\`\n地点: \`${CFG.locations.join(' / ') || '(未設定)'}\`\n店舗: \`${CFG.storeFilter.join(' / ') || '(絞り込みなし)'}\``
      + (profit.length ? '\n\n💰 **買取見込み（参考値）** ※在庫通知ではこの形で付きます\n```\n' + profit.join('\n') + '\n```\n' + priceSourceNote() : ''));
    return console.log('テスト通知を送信しました');
  }

  requireConfig();
  const state = loadState();

  if (cmd === '--watch') {
    console.log(`[${ts()}] 監視開始: ${CFG.parts.join(', ')} @ ${CFG.locations.join('/')} ` +
      `${CFG.storeFilter.length ? `[${CFG.storeFilter.join('/')}]` : ''} / ${CFG.intervalSec}秒間隔`);
    let pricesAt = 0;
    for (;;) {
      // 買取価格の定期更新。失敗しても在庫監視は続け、前回の価格を使う
      if (CFG.priceRefreshMin > 0 && Date.now() - pricesAt > CFG.priceRefreshMin * 60 * 1000) {
        pricesAt = Date.now();
        try {
          await fetchPrices({ quiet: true });
          console.log(`[${ts()}] 買取価格を更新（${PRICES.meta.source} ${PRICES.meta.sourceUpdated || ''} 時点 / ${Object.keys(PRICES.buyers).length}店）`);
        } catch (e) {
          console.error(`[${ts()}] 買取価格の更新に失敗（前回の値で継続）: ${e.message}`);
        }
      }
      try {
        await checkOnce(state);
        saveState(state);
      } catch (e) {
        // 想定外の例外でも監視を止めない
        state.failStreak = (state.failStreak || 0) + 1;
        console.error(`[${ts()}] 想定外のエラー (${state.failStreak}回連続): ${e.message}`);
      }
      // 連続失敗中は間隔を伸ばす（403/レート制限で叩き続けないため。最大8倍）
      const backoff = Math.min(2 ** (state.failStreak || 0), 8);
      const base = CFG.intervalSec * backoff;
      if (backoff > 1) console.error(`[${ts()}] 次回まで ${base}秒 待機（バックオフ x${backoff}）`);
      const jitter = Math.floor((Math.random() - 0.5) * base * 0.3 * 1000);
      await sleep(base * 1000 + jitter);
    }
  }

  await checkOnce(state);
  saveState(state);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
