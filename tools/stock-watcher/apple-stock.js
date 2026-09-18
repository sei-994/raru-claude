#!/usr/bin/env node
/**
 * Apple 公式エンドポイントを直接叩く在庫監視 → Discord 通知
 *
 * 依存ゼロ (Node 18+ の global fetch)
 *
 *   node apple-stock.js --find-parts 256      購入ページから品番(MXXXXJ/A)を探す
 *   node apple-stock.js --raw                 生JSONを保存して構造を確認する
 *   node apple-stock.js --check               1回チェック
 *   node apple-stock.js --watch               常駐監視
 *   node apple-stock.js --test                Discord疎通テスト
 */

const fs = require('fs');
const path = require('path');

const CFG = {
  region: process.env.APPLE_REGION || 'jp',          // 'jp' / 'us'(空文字) など
  parts: (process.env.APPLE_PARTS || '').split(',').map(s => s.trim()).filter(Boolean),
  location: process.env.APPLE_LOCATION || '',        // 郵便番号 例 "150-0002" / 都市名
  storeFilter: process.env.STORE_FILTER || '',       // 店舗名の部分一致で絞る 例 "渋谷"
  buyPage: process.env.APPLE_BUY_PAGE || '',         // --find-parts 用
  webhook: process.env.DISCORD_WEBHOOK_URL || '',
  mention: process.env.MENTION || '',
  intervalSec: Number(process.env.INTERVAL_SEC || 60),
  repeatMin: Number(process.env.REPEAT_MIN || 30),
  includeDelivery: process.env.INCLUDE_DELIVERY === '1',
  stateFile: process.env.STATE_FILE || path.join(__dirname, 'apple-state.json'),
  dryRun: process.env.DRY_RUN === '1',
};

const BASE = `https://www.apple.com${CFG.region ? '/' + CFG.region : ''}`;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

// ---------------------------------------------------------------- endpoints
// fulfillment-messages は 541 を返すようになったとの報告があるため、
// pickup-message を先に試し、駄目なら fulfillment-messages にフォールバックする。
function endpointUrls() {
  const qs = new URLSearchParams();
  qs.set('pl', 'true');
  CFG.parts.forEach((p, i) => {
    qs.set(`parts.${i}`, p);
    qs.set(`mts.${i}`, 'regular');
  });
  if (CFG.location) qs.set('location', CFG.location);

  const overrides = (process.env.APPLE_ENDPOINTS || '').split(',').map(s => s.trim()).filter(Boolean);
  const paths = overrides.length ? overrides : ['/shop/retail/pickup-message', '/shop/fulfillment-messages'];
  return paths.map(p => (p.startsWith('http') ? p : BASE + p) + '?' + qs.toString());
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
               : res.status === 403 ? ' — UA/Referer 拒否、またはレート制限の可能性'
               : '';
    throw Object.assign(new Error(`HTTP ${res.status}${hint}`), { status: res.status, body: text.slice(0, 400) });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('JSONとして解析できません（HTMLが返された可能性）'), { body: text.slice(0, 400) });
  }
}

/** 複数エンドポイントを順に試し、最初に成功したものを返す */
async function fetchAvailabilityJson() {
  const errors = [];
  for (const url of endpointUrls()) {
    try {
      const json = await getJson(url);
      return { json, url };
    } catch (e) {
      errors.push(`${url.split('?')[0]} → ${e.message}`);
    }
  }
  throw new Error('全エンドポイントが失敗:\n  ' + errors.join('\n  '));
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
  if (!CFG.storeFilter) return rows;
  const f = CFG.storeFilter.toLowerCase();
  return rows.filter(r => r.kind === 'delivery' || `${r.store} ${r.city}`.toLowerCase().includes(f));
}

// ------------------------------------------------------------------ Discord
async function notify(content) {
  if (!CFG.webhook || CFG.dryRun) {
    console.log(`[DRY RUN / 未送信]\n${content}\n`);
    return;
  }
  const body = JSON.stringify({
    content: (CFG.mention ? CFG.mention + ' ' : '') + content,
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
async function findParts(filter) {
  const url = CFG.buyPage || `${BASE}/shop/buy-iphone`;
  console.log('購入ページ:', url);
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'ja-JP,ja;q=0.9' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — APPLE_BUY_PAGE で具体的な機種ページを指定してください`);
  const html = await res.text();
  console.log('HTML長:', html.length, 'bytes\n');

  const re = /"partNumber"\s*:\s*"([A-Z0-9]{3,8}(?:[A-Z]{1,3})?\/A)"/g;
  const seen = new Map();
  let m;
  while ((m = re.exec(html))) {
    const part = m[1];
    if (seen.has(part)) continue;
    const start = Math.max(0, m.index - 600);
    const win = html.slice(start, m.index + 600);
    const rel = m.index - start;
    // 窓内に同じキーが複数あるため、品番の位置に「最も近い」出現を採用する
    const grab = k => {
      const re2 = new RegExp(`"${k}"\\s*:\\s*"([^"]{1,60})"`, 'g');
      let best = '', bestDist = Infinity, mm;
      while ((mm = re2.exec(win))) {
        const d = Math.abs(mm.index - rel);
        if (d < bestDist) { bestDist = d; best = mm[1]; }
      }
      return best;
    };
    seen.set(part, {
      part,
      capacity: grab('dimensionCapacity') || grab('capacity'),
      color: grab('dimensionColor') || grab('color'),
      title: grab('productTitle') || grab('name') || grab('displayName'),
    });
  }

  let list = [...seen.values()];
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
  console.log('品番'.padEnd(14) + '容量'.padEnd(10) + '色'.padEnd(16) + '名称');
  console.log('-'.repeat(78));
  for (const r of list) {
    console.log(r.part.padEnd(14) + (r.capacity || '-').padEnd(10) + (r.color || '-').padEnd(16) + (r.title || '-').slice(0, 34));
  }
  console.log('\nこの品番を APPLE_PARTS に設定してください。');
}

// ------------------------------------------------------------------ raw出力
async function raw() {
  requireConfig({ webhook: false });
  const { json, url } = await fetchAvailabilityJson();
  const out = path.join(__dirname, 'apple-raw.json');
  fs.writeFileSync(out, JSON.stringify(json, null, 2));

  const pickup = extractPickup(json);
  const delivery = extractDelivery(json);

  console.log('='.repeat(76));
  console.log('成功したエンドポイント:', url.split('?')[0]);
  console.log('生JSON保存先          :', out);
  console.log('品番                  :', CFG.parts.join(', '));
  console.log('location              :', CFG.location || '(未指定)');
  console.log('='.repeat(76));

  console.log(`\n▼ 受け取り(pickup) 抽出結果: ${pickup.length}件`);
  if (!pickup.length) {
    console.log('  0件 — partsAvailability が見つかりません。apple-raw.json を確認してください。');
    console.log('  よくある原因: location 未指定 / 品番が不正 / 地域(APPLE_REGION)違い');
  }
  for (const r of applyStoreFilter(pickup)) {
    console.log(`  [${isInStock(r) ? '在庫あり' : '在庫なし'}] ${r.store}${r.city ? `(${r.city})` : ''} | ${r.part} | display=${r.display || '-'} | ${r.quote || '-'}`);
  }

  console.log(`\n▼ 配送(delivery) 抽出結果: ${delivery.length}件`);
  for (const r of delivery) {
    console.log(`  [${isInStock(r) ? '購入可' : '購入不可'}] ${r.part} | isBuyable=${r.display || '-'} | ${r.quote || '-'}`);
  }
}

// ------------------------------------------------------------------- check
function rowKey(r) {
  return `${r.kind}|${r.part}|${r.store}`;
}

async function checkOnce(state) {
  let json, url;
  try {
    ({ json, url } = await fetchAvailabilityJson());
    state.failStreak = 0;
  } catch (e) {
    state.failStreak = (state.failStreak || 0) + 1;
    console.error(`[${ts()}] 取得失敗 (${state.failStreak}回連続): ${e.message}`);
    if (state.failStreak === 5) {
      await notify(`⚠️ Apple在庫監視: 5回連続で取得に失敗しています\n\`\`\`\n${e.message.slice(0, 800)}\n\`\`\``);
    }
    return;
  }

  let rows = extractPickup(json);
  if (CFG.includeDelivery) rows = rows.concat(extractDelivery(json));
  rows = applyStoreFilter(rows);

  if (!rows.length) {
    console.error(`[${ts()}] 抽出0件 — レスポンス構造が変わった可能性`);
    if (Date.now() - (state.emptyAt || 0) > 60 * 60 * 1000) {
      state.emptyAt = Date.now();
      await notify(`⚠️ Apple在庫監視: 在庫情報を抽出できませんでした（${url.split('?')[0]}）\n\`--raw\` で構造を確認してください。`);
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
      console.log(`[${ts()}] 初回記録: ${now ? '在庫あり' : '在庫なし'} ${r.store} ${r.part}`);
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

  const lines = inStock.map(({ r }) =>
    `• **${r.store}**${r.city ? `（${r.city}）` : ''} — ${r.part}${r.quote ? ` / ${r.quote}` : ''}`);
  const heading = inStock.every(x => x.repeat) ? '🟢 **在庫あり（継続中）**' : '🟢 **在庫が出ました**';

  await notify(
    `${heading}\n` +
    lines.join('\n') + '\n' +
    `\n${BASE}/shop/buy-iphone`
  );
  console.log(`[${ts()}] 通知送信: ${inStock.length}件`);
}

// --------------------------------------------------------------------- main
function requireConfig({ webhook = true } = {}) {
  const missing = [];
  if (!CFG.parts.length) missing.push('APPLE_PARTS（品番。--find-parts で探せます）');
  if (!CFG.location) missing.push('APPLE_LOCATION（郵便番号や都市名。例 "150-0002"）');
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
  if (cmd === '--test') {
    await notify(`✅ Apple在庫監視 テスト通知 (${ts()})\n品番: \`${CFG.parts.join(', ') || '(未設定)'}\`\nlocation: \`${CFG.location || '(未設定)'}\``);
    return console.log('テスト通知を送信しました');
  }

  requireConfig();
  const state = loadState();

  if (cmd === '--watch') {
    console.log(`[${ts()}] 監視開始: ${CFG.parts.join(', ')} @ ${CFG.location} / ${CFG.intervalSec}秒間隔`);
    for (;;) {
      await checkOnce(state);
      saveState(state);
      const jitter = Math.floor((Math.random() - 0.5) * CFG.intervalSec * 0.3 * 1000);
      await sleep(CFG.intervalSec * 1000 + jitter);
    }
  }

  await checkOnce(state);
  saveState(state);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
