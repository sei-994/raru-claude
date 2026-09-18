/**
 * 買取価格表のパーサー（依存ゼロ）
 *
 * ページ構造を決め打ちしない。<table> でも div + CSS grid でも同じ方法で読む:
 *
 *   1. HTML を小さな DOM ツリーにする
 *   2. 「子要素を3つ以上持ち、その中に『容量』の見出しがある要素」を見出し行とみなす
 *   3. 見出し行の近くの祖先の中から、同じ子要素数で「〜円」を含む要素を集めてデータ行とする
 *   4. 列の意味は見出しの文言で決める（機種 / 容量 / 定価）。残りの列は全部「買取店」
 *
 * クラス名・id・列の位置には依存しない。
 */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr']);

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", yen: '¥', times: '×' };
function decode(s) {
  return s
    .replace(/&([a-z][a-z0-9]*);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

/** 寛容な HTML → ツリー。閉じ忘れは祖先の閉じタグでまとめて閉じる。 */
function parseHtml(html) {
  const src = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, '');
  const root = { tag: '#root', children: [], parent: null };
  let cur = root;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[4] !== undefined) {
      const t = decode(m[4]);
      if (t.trim()) cur.children.push({ text: t });
      continue;
    }
    const tag = m[2].toLowerCase();
    if (m[1]) {
      // 対応する開きタグまで遡って閉じる。無ければ無視
      let n = cur;
      while (n && n.tag !== tag) n = n.parent;
      if (n && n.parent) cur = n.parent;
      continue;
    }
    const el = { tag, attrs: m[3] || '', children: [], parent: cur };
    cur.children.push(el);
    if (!VOID.has(tag) && !/\/\s*$/.test(m[3] || '')) cur = el;
  }
  return root;
}

const elems = n => n.children.filter(c => c.tag);
function textOf(n) {
  if (n.text !== undefined) return n.text;
  if (n.tag === 'br') return ' ';
  return n.children.map(textOf).join(' ');
}
const clean = s => s.replace(/\s+/g, ' ').trim();

function* walk(n) {
  yield n;
  for (const c of n.children) if (c.tag) yield* walk(c);
}

/**
 * セル文字列から「〜円」の金額を1つ取り出す。
 * 括弧内（利益表示の "(+32,200円)" など）は除外してから探す。無ければ null。
 */
function yenOf(s) {
  const t = s.replace(/[（(][^）)]*[）)]/g, ' ');
  const m = t.match(/(?:¥|￥)\s*(\d{1,3}(?:,\d{3})+|\d{4,})|(\d{1,3}(?:,\d{3})+|\d{4,})\s*円/);
  return m ? Number((m[1] || m[2]).replace(/,/g, '')) : null;
}

const HEAD = {
  model: /機種|モデル|model/i,
  capacity: /容量|ストレージ|storage|capacity/i,
  retail: /定価|apple|販売価格|msrp/i,
};

/** 「256」「256GB」「1 TB」→「256GB」「1TB」。容量らしくなければ null */
function normCapacity(s) {
  const m = String(s).replace(/\s+/g, '').match(/^(\d+)(GB|TB)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2] ? m[2].toUpperCase() : (n <= 16 ? 'TB' : 'GB');
  return `${n}${unit}`;
}

/** 「iPhone 18 Pro Max」「Pro Max」→「promax」。機種の突き合わせ用 */
function normModel(s) {
  return String(s).replace(/iphone\s*\d*/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

/**
 * HTML から買取価格表を探して返す。見つからなければ例外。
 * @returns {{ shops: string[], rows: {model, capacity, retail, prices: Object<string, number>}[], updated: string|null }}
 */
function parseBuyback(html) {
  const root = parseHtml(html);

  // 見出し行: 子要素の中に「容量」があり、ほかに2列以上ある
  const headers = [];
  for (const n of walk(root)) {
    const kids = elems(n);
    if (kids.length < 3) continue;
    const texts = kids.map(k => clean(textOf(k)));
    if (texts.some(t => HEAD.capacity.test(t) && t.length <= 8)
      && texts.every(t => t.length <= 30 && yenOf(t) === null)) {
      headers.push({ n, texts });
    }
  }

  for (const h of headers) {
    const width = h.texts.length;
    // 見出しから最大3階層上まで広げ、同じ列数で金額を含む行を探す
    let rows = [];
    for (let scope = h.n.parent, i = 0; scope && i < 3 && !rows.length; scope = scope.parent, i++) {
      for (const n of walk(scope)) {
        if (n === h.n) continue;
        const kids = elems(n);
        if (kids.length !== width) continue;
        const cells = kids.map(k => clean(textOf(k)));
        if (cells.some(c => yenOf(c) !== null)) rows.push(cells);
      }
    }
    if (!rows.length) continue;

    const col = { model: -1, capacity: -1, retail: -1 };
    h.texts.forEach((t, i) => {
      for (const k of Object.keys(col)) if (col[k] < 0 && HEAD[k].test(t)) { col[k] = i; return; }
    });
    if (col.capacity < 0) continue;
    const shopCols = h.texts.map((t, i) => i).filter(i => !Object.values(col).includes(i) && h.texts[i]);

    const out = [];
    for (const cells of rows) {
      const capacity = normCapacity(cells[col.capacity]);
      if (!capacity) continue;
      const prices = {};
      for (const i of shopCols) {
        const v = yenOf(cells[i]);
        if (v !== null) prices[h.texts[i]] = v;
      }
      out.push({
        model: col.model >= 0 ? cells[col.model] : '',
        capacity,
        retail: col.retail >= 0 ? yenOf(cells[col.retail]) : null,
        prices,
      });
    }
    if (!out.length) continue;

    const all = clean(textOf(root));
    const upd = all.match(/更新\s*[：:]\s*(\d{4}\/\d{1,2}\/\d{1,2}(?:\s+\d{1,2}:\d{2})?)/);
    return { shops: shopCols.map(i => h.texts[i]), rows: out, updated: upd ? upd[1] : null };
  }
  throw new Error('買取価格表が見つかりません。`node check.js --scan` でページ構造を確認してください');
}

module.exports = { parseHtml, parseBuyback, normCapacity, normModel, yenOf, textOf, walk, elems };
