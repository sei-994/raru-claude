#!/usr/bin/env node
/**
 * is-checker.com 在庫監視 → Discord 通知
 *
 * 依存ゼロ (Node 18+ の global fetch を使用)
 *
 *   node check.js --dump     ページ構造を確認する（通知しない / 最初にこれを実行する）
 *   node check.js --test     Discord への疎通テスト
 *   DRY_RUN=1 node check.js  送信せずに通知内容だけ確認
 *   node check.js            1回だけチェック（cron / GitHub Actions 向け）
 *   node check.js --watch    常駐してINTERVAL_SEC間隔でチェック
 */

const fs = require('fs');
const path = require('path');

const CFG = {
  url: process.env.TARGET_URL || 'https://is-checker.com/i18_stock_4.html?411',
  webhook: process.env.DISCORD_WEBHOOK_URL || '',
  // 行がこのキーワードを「すべて」含むとき、監視対象とみなす（カンマ区切り）
  keywords: (process.env.MATCH_KEYWORDS || 'Pro Max,256').split(',').map(s => s.trim()).filter(Boolean),
  // この語を含む行は除外（カンマ区切り、空なら除外なし）
  exclude: (process.env.EXCLUDE_KEYWORDS || '').split(',').map(s => s.trim()).filter(Boolean),
  intervalSec: Number(process.env.INTERVAL_SEC || 60),
  stateFile: process.env.STATE_FILE || path.join(__dirname, 'state.json'),
  mention: process.env.MENTION || '',           // 例: '@everyone' / '<@123456789>'
  triangleIsStock: process.env.TREAT_TRIANGLE_AS_IN !== '0',  // △ を在庫ありとみなす
  notifyOnAnyChange: process.env.NOTIFY_ON_ANY_CHANGE === '1',
  // 在庫ありの状態が続く間、何分おきに再通知するか（0で再通知なし）
  repeatMin: Number(process.env.REPEAT_MIN || 30),
  dryRun: process.env.DRY_RUN === '1',   // 送信せず内容を標準出力に表示
};

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ---------- 在庫マーカー ----------
const IN_MARKERS = [
  '在庫あり', '在庫有り', '残りわずか', '受取可', '予約可', '販売中', '購入可',
  '○', '◯', '〇', '●', '◎', '✓', '✔', 'available', 'in stock',
];
const TRIANGLE = ['△', '▲', '▵'];

// 「入荷待ち」等の否定表現を先に除去してから在庫マーカーを数える（誤検知防止）
const OUT_PHRASES = [
  '在庫なし', '在庫無し', '入荷待ち', '入荷未定', '取扱なし', '取り扱いなし',
  '販売終了', '受付終了', '予約不可', '受取不可', '購入不可', '取扱終了',
  'sold out', 'unavailable', 'out of stock',
];
function stripOutPhrases(text) {
  let t = text;
  for (const p of OUT_PHRASES) {
    t = t.replace(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  }
  return t;
}

function inMarkersOf(text) {
  const list = CFG.triangleIsStock ? IN_MARKERS.concat(TRIANGLE) : IN_MARKERS;
  const t = stripOutPhrases(text);
  const hits = [];
  for (const m of list) {
    const re = new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const n = (t.match(re) || []).length;
    if (n > 0) hits.push(`${m}x${n}`);
  }
  return hits;
}
// 在庫記号・在庫語を除いた「行の識別子」。在庫が変化してもキーが変わらないようにする。
const STATUS_CHARS = /[\u25cb\u25ef\u3007\u25cf\u25ce\u25b3\u25b2\u25b5\u00d7\u2715\u2716\u2717\u2713\u2714\u2212\u2013\u2014\-]/g;
const STATUS_WORDS = new RegExp(
  IN_MARKERS.filter(m => /[^\x00-\x7f]/.test(m)).concat(OUT_PHRASES).join('|'), 'gi');
function rowIdentity(row) {
  return row
    .replace(STATUS_WORDS, ' ')
    .replace(STATUS_CHARS, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function inCountOf(text) {
  return inMarkersOf(text).reduce((a, h) => a + Number(h.split('x').pop()), 0);
}

// ---------- HTML → 行テキスト ----------
const NAMED_ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  times: '\u00d7', cir: '\u25cb', bigcirc: '\u25ef', xutri: '\u25b3', utri: '\u25b5',
  check: '\u2713', cross: '\u2717', bull: '\u2022', middot: '\u00b7',
  deg: '\u00b0', hellip: '\u2026', mdash: '\u2014', ndash: '\u2013', minus: '\u2212',
};
function decodeEntities(s) {
  return s
    .replace(/&([a-z][a-z0-9]*);/gi, (m, name) => {
      const v = NAMED_ENTITIES[name.toLowerCase()];
      return v === undefined ? m : v;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

function toText(chunk) {
  return decodeEntities(
    chunk
      .replace(/<\/(?:td|th)>/gi, ' | ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s*\|\s*/g, ' | ').replace(/\s+/g, ' ').replace(/(?:\s*\|)+\s*$/, '').trim();
}

function extractRows(html) {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const trs = clean.match(/<tr[\s\S]*?<\/tr>/gi);
  const chunks = (trs && trs.length)
    ? trs
    : clean.split(/<\/(?:li|p|div|section|article|h[1-6])>/i);

  return chunks.map(toText).filter(t => t.length > 0);
}

function matches(row) {
  const hay = row.toLowerCase();
  if (!CFG.keywords.every(k => hay.includes(k.toLowerCase()))) return false;
  if (CFG.exclude.some(k => hay.includes(k.toLowerCase()))) return false;
  return true;
}

// ---------- 取得 ----------
async function fetchPage() {
  const res = await fetch(CFG.url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ja,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.text();
}

// ---------- Discord ----------
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
      if (!res.ok) throw new Error(`Discord HTTP ${res.status}: ${await res.text()}`);
      return;
    } catch (e) {
      if (i === 2) { console.error('Discord送信失敗:', e.message); return; }
      await sleep(2000 * (i + 1));
    }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- 状態 ----------
function loadState() {
  try { return JSON.parse(fs.readFileSync(CFG.stateFile, 'utf8')); }
  catch { return { rows: {}, lastAlertAt: {}, brokenAt: 0, failStreak: 0 }; }
}
function saveState(s) {
  fs.mkdirSync(path.dirname(CFG.stateFile), { recursive: true });
  fs.writeFileSync(CFG.stateFile, JSON.stringify(s, null, 2));
}

// ---------- モード ----------
async function dump() {
  const html = await fetchPage();
  const rows = extractRows(html);
  const hit = rows.filter(matches);
  const loose = rows.filter(r => /pro\s*max/i.test(r));

  console.log('='.repeat(72));
  console.log('URL          :', CFG.url);
  console.log('HTML長        :', html.length, 'bytes');
  console.log('抽出行数      :', rows.length, `(<tr>ベース: ${/<tr[\s>]/i.test(html) ? 'YES' : 'NO'})`);
  console.log('キーワード    :', CFG.keywords.join(' AND ') || '(なし)');
  console.log('除外          :', CFG.exclude.join(', ') || '(なし)');
  console.log('='.repeat(72));

  console.log(`\n▼ マッチした行 (${hit.length}件) ← ここが監視対象`);
  if (!hit.length) console.log('  (0件) → MATCH_KEYWORDS を調整してください');
  hit.forEach((r, i) => {
    const m = inMarkersOf(r);
    console.log(`\n [${i}] 在庫マーカー: ${m.length ? m.join(',') + '  → 在庫ありと判定' : 'なし → 在庫なしと判定'}`);
    console.log(`     ${r.slice(0, 400)}`);
  });

  console.log(`\n▼ "Pro Max" を含む行 (${loose.length}件) ← キーワード調整の参考に`);
  loose.slice(0, 25).forEach((r, i) => console.log(` [${i}] ${r.slice(0, 200)}`));

  // JS描画かどうかの判定材料
  console.log('\n▼ 診断');
  console.log('  生HTMLに "Pro Max" が存在 :', /pro\s*max/i.test(html) ? 'YES' : 'NO ← JSで後から描画されている可能性大');
  console.log('  生HTMLに "256" が存在      :', /256/.test(html) ? 'YES' : 'NO');
  const apis = [...new Set((html.match(/["'`]([^"'`\s]*\.(?:json|php|cgi)(?:\?[^"'`\s]*)?)["'`]/gi) || []))];
  console.log('  参照されている json/php/cgi:', apis.length ? apis.slice(0, 15).join('\n    ') : '(なし)');
  const srcs = [...new Set((html.match(/<script[^>]+src=["']([^"']+)["']/gi) || []))];
  console.log('  外部script:', srcs.length ? '\n    ' + srcs.slice(0, 15).join('\n    ') : '(なし)');
}

async function checkOnce(state) {
  let html;
  try {
    html = await fetchPage();
    state.failStreak = 0;
  } catch (e) {
    state.failStreak = (state.failStreak || 0) + 1;
    console.error(`[${ts()}] 取得失敗 (${state.failStreak}回連続): ${e.message}`);
    if (state.failStreak === 5) {
      await notify(`⚠️ 在庫監視: ページ取得に5回連続で失敗しています\n\`${e.message}\`\n${CFG.url}`);
    }
    return;
  }

  const rows = extractRows(html).filter(matches);

  if (rows.length === 0) {
    console.error(`[${ts()}] マッチ0件 — キーワードかページ構造が変わった可能性`);
    if (Date.now() - (state.brokenAt || 0) > 60 * 60 * 1000) {
      state.brokenAt = Date.now();
      await notify(`⚠️ 在庫監視: 対象行が見つかりません（キーワード: ${CFG.keywords.join(' AND ')}）\nページ構造が変わったかもしれません。\`--dump\` で確認してください。\n${CFG.url}`);
    }
    return;
  }
  state.brokenAt = 0;

  const seen = Object.create(null);
  for (const row of rows) {
    const id = rowIdentity(row);
    const n = (seen[id] = (seen[id] || 0) + 1);
    const key = n > 1 ? `${id}#${n}` : id;

    const count = inCountOf(row);
    const prev = state.rows[key];
    const prevCount = prev ? prev.count : null;

    let reason = null;
    if (prevCount === null) {
      console.log(`[${ts()}] 初回記録: 在庫マーカー${count}個 / ${row.slice(0, 120)}`);
      if (count > 0) reason = '\u{1F7E2} **すでに在庫あり**（監視開始時点）';
    } else if (count > prevCount) {
      reason = prevCount === 0 ? '\u{1F7E2} **在庫が出ました**' : '\u{1F7E2} **在庫が増えました**';
    } else if (CFG.notifyOnAnyChange && prev.text !== row) {
      reason = 'ℹ️ 表示が変化しました';
    }

    // 在庫ありが続く間の再通知（既知の行のみ）
    if (!reason && prevCount !== null && count > 0 && CFG.repeatMin > 0) {
      const last = state.lastAlertAt[key] || 0;
      if (Date.now() - last > CFG.repeatMin * 60 * 1000) reason = '\u{1F7E2} **在庫あり（継続中）**';
    }

    if (reason) {
      state.lastAlertAt[key] = Date.now();
      await notify(
        `${reason}\n` +
        `対象: \`${CFG.keywords.join(' + ')}\`\n` +
        `在庫マーカー: ${inMarkersOf(row).join(', ') || 'なし'}\n` +
        '```\n' + row.slice(0, 900) + '\n```\n' +
        CFG.url
      );
      console.log(`[${ts()}] 通知送信: ${reason}`);
    }

    state.rows[key] = { count, text: row, at: Date.now() };
  }
}

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

async function main() {
  const arg = process.argv[2] || '';

  if (arg === '--dump') return dump();

  if (arg === '--test') {
    await notify(`✅ 在庫監視テスト通知 (${ts()})\n監視対象: \`${CFG.keywords.join(' + ')}\`\n${CFG.url}`);
    console.log('テスト通知を送信しました');
    return;
  }

  if (!CFG.webhook && !CFG.dryRun) {
    console.error('エラー: 環境変数 DISCORD_WEBHOOK_URL が未設定です (DRY_RUN=1 で送信なし実行)');
    process.exit(1);
  }

  const state = loadState();

  if (arg === '--watch') {
    console.log(`[${ts()}] 監視開始: ${CFG.keywords.join(' + ')} / ${CFG.intervalSec}秒間隔`);
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

main().catch(e => { console.error(e); process.exit(1); });
