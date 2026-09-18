# iPhone 在庫監視 → Discord 通知

`is-checker.com` の在庫表を定期的に取得し、**対象モデルに在庫マーカー（○ △ ◎ 在庫あり など）が出た瞬間**に Discord Webhook へ通知します。

- 依存パッケージなし（Node 18+ の標準 `fetch` のみ）
- 監視対象はキーワードで指定（既定: `Pro Max` と `256` を両方含む行）
- ページ構造が変わって対象行が見つからなくなった場合も Discord に警告が飛ぶ（無言の故障を防ぐ）

---

## ⚠️ 未検証の前提

**このスクリプトを書いた環境からは `is-checker.com` にネットワーク到達できませんでした**（egress ブロック）。
そのため以下は**未確認**です。使い始める前に必ず `--dump` で照合してください。

1. 在庫表が HTML に直接書かれているか、JavaScript で後から描画されているか
2. 在庫の表現（`○/×` なのか `在庫あり/なし` なのか、画像なのか）
3. 「Pro Max」「256」という表記が実際に使われているか

`--dump` はこの3点をすべて出力します。

---

## 1. セットアップ（3分）

### Discord Webhook を作る
1. 通知を受けたいサーバーのチャンネル → 歯車（チャンネルの編集）
2. **連携サービス** → **ウェブフック** → **新しいウェブフック** → **ウェブフックURLをコピー**

スマホに通知を飛ばしたいので、Discord アプリ側でそのチャンネルの通知を「すべてのメッセージ」にしておくこと。

### 動作確認

```bash
cd tools/stock-watcher

# ① まずページ構造を確認（通知しない）
node check.js --dump
```

出力の見かた:

| 出力 | 意味 | 対応 |
|---|---|---|
| `マッチした行 (1件)` かつ `在庫マーカー: なし` | **正常**。このまま監視できる | そのまま次へ |
| `マッチした行 (0件)` | キーワードが合っていない | `Pro Max を含む行` の一覧を見て `MATCH_KEYWORDS` を調整 |
| `生HTMLに "Pro Max" が存在 : NO` | **JSで描画されている** | このスクリプトでは取れない。下の「JS描画だった場合」へ |
| `マッチした行` が複数件 | 色違い等で複数行ある | 色名を足して絞る（例 `MATCH_KEYWORDS="Pro Max,256,ブラック"`） |

```bash
# ② Discord への疎通テスト
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." node check.js --test

# ③ 送信せずに判定だけ見る
DRY_RUN=1 node check.js
```

## 2. 常時監視する

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export MATCH_KEYWORDS="Pro Max,256"
export INTERVAL_SEC=60

node check.js --watch
```

PC を閉じても動かしたい場合は VPS か、下の GitHub Actions を使う。

macOS で常駐させるなら:
```bash
nohup node check.js --watch >> watch.log 2>&1 &
tail -f watch.log
```

## 3. GitHub Actions で動かす（PCを開けっぱなしにしない方法）

リポジトリの `.github/workflows/stock-watch.yml` が5分おきに実行します。

1. GitHub → Settings → **Secrets and variables** → **Actions**
2. **Secrets** タブ → `DISCORD_WEBHOOK_URL` を登録
3. （任意）**Variables** タブ → `MATCH_KEYWORDS` / `MENTION` / `TARGET_URL` を登録
4. Actions タブ → 「iPhone 在庫監視」→ **Run workflow** → mode に `dump` を選んで、まず構造を確認

**重要な制約**: GitHub Actions の cron は最短5分間隔で、かつ**混雑時は実行が10〜30分遅れることがあります**。
発売直後の在庫争奪には向きません。速さが要るなら `--watch` を手元か VPS で回してください。

## 4. 設定できる環境変数

| 変数 | 既定値 | 説明 |
|---|---|---|
| `DISCORD_WEBHOOK_URL` | （必須） | Discord Webhook URL |
| `TARGET_URL` | `https://is-checker.com/i18_stock_4.html?411` | 監視するページ |
| `MATCH_KEYWORDS` | `Pro Max,256` | **すべて**含む行を対象にする（AND） |
| `EXCLUDE_KEYWORDS` | （空） | 含む行を除外する |
| `INTERVAL_SEC` | `60` | `--watch` の間隔（秒）。±15%のゆらぎを自動で入れる |
| `MENTION` | （空） | 通知の先頭に付ける。例 `@everyone` / `<@あなたのID>` |
| `REPEAT_MIN` | `30` | 在庫ありが続く間、何分おきに再通知するか。`0` で再通知なし |
| `TREAT_TRIANGLE_AS_IN` | `1` | `△`（残りわずか）を在庫ありとみなす。`0` で ○ のみ |
| `NOTIFY_ON_ANY_CHANGE` | `0` | `1` にすると在庫以外の表示変化でも通知（デバッグ用） |
| `DRY_RUN` | `0` | `1` で送信せず標準出力に表示 |
| `STATE_FILE` | `./state.json` | 前回状態の保存先 |

## 5. 通知の判定ロジック

1. HTML から `<tr>` 単位（なければブロック要素単位）で行テキストを抽出
2. `MATCH_KEYWORDS` を**すべて**含む行だけ残す
3. その行から「入荷待ち」「在庫なし」等の**否定表現を先に除去**
4. 残りに含まれる在庫マーカー（`○ ◯ 〇 ● ◎ △ ▲ ✓ 在庫あり 残りわずか 受取可 …`）の**個数**を数える
5. 前回より**個数が増えていたら通知**（0→1 は「在庫が出ました」、1→2 は「在庫が増えました」）

行の識別キーは在庫記号を除いた部分（例 `iPhone 18 Pro Max 256GB ブラック`）なので、
在庫が変わってもキーは変わらず、変化を正しく追えます。

## 6. JS描画だった場合

`--dump` で `生HTMLに "Pro Max" が存在 : NO` と出たら、在庫表は JavaScript が後から描いています。
その場合は `--dump` が出力する `参照されている json/php/cgi` の URL を見てください。
たいていそこに在庫データの実体があるので、`TARGET_URL` をその URL に差し替えるだけで動くことがあります。
それでも駄目ならヘッドレスブラウザ（Playwright）版が必要です。

## 7. 既知の限界

- `is-checker.com` は Apple 非公式の集計サイトです。**サイト側の更新が遅れれば通知も遅れます**。
  最速を狙うなら Apple 公式の在庫確認エンドポイントを直接叩く方が有利です（本スクリプトは未対応）。
- サイトに負荷をかけないよう、`INTERVAL_SEC` は 30 秒未満にしないでください。
- 在庫が画像（`<img src="maru.png">`）で表現されている場合、テキスト抽出では拾えません。
  その場合は `MATCH_KEYWORDS` は効きますが在庫判定が常に0になるため、`--dump` で必ず確認してください。
