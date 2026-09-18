# iPhone 在庫監視 → Discord 通知

在庫が出た瞬間に Discord Webhook へ通知します。依存パッケージなし（Node 18+ の標準 `fetch` のみ）。

| スクリプト | 取得元 | 位置づけ |
|---|---|---|
| **`apple-stock.js`** | **Apple公式エンドポイント** | **本命。** 店舗ごとの受け取り可否を直接取得 |
| `check.js` | `is-checker.com` | 保険。Apple側がブロックされた時用（ページ下部「保険」参照） |

---

## ⚠️ 未検証の前提

**これを書いた環境から apple.com にネットワーク到達できませんでした**（egressブロック）。
実レスポンスは一度も見ていません。次の点は**未確認**です。

1. どのエンドポイントが今も生きているか（`/shop/retail/pickup-message` か `/shop/fulfillment-messages` か）
2. レスポンスのJSON構造
3. UA/Referer だけでブロックされずに通るか（Cookie が要る可能性）

そのため **JSONの階層を決め打ちしていません。** `partsAvailability` を持つオブジェクトを再帰探索して
拾う実装なので、`body.stores[]` でも `body.content.pickupMessage.stores[]` でも動きます。
エンドポイントも複数を順に試してフォールバックします。

まず `--raw` で実物を確認してください。

---

## セットアップ

### 1. 品番（Part Number）を調べる

Apple の在庫APIは商品名ではなく **`MXYZ3J/A` 形式の品番**で引きます。容量・色・地域ごとに別番号です。

```bash
cd tools/stock-watcher

APPLE_BUY_PAGE="https://www.apple.com/jp/shop/buy-iphone/iphone-18-pro" \
  node apple-stock.js --find-parts 256
```

```
品番            容量        色               名称
------------------------------------------------------------------------------
MXYZ3J/A      256GB     ブラック          iPhone 18 Pro Max
MXYZ5J/A      256GB     ホワイト          iPhone 18 Pro Max
```

#### 調べた品番（2026-09-18 時点・要検証）

iPhone 18 Pro Max 256GB / SIMフリー。**必ず `--find-parts` か `--raw` で裏を取ってください。**

| 品番 | 色 | 確度 | 根拠 |
|---|---|---|---|
| `MJX74J/A` | バーガンディ | 高 | ヨドバシ商品ページのタイトルに明記 |
| `MJX84J/A` | グレイシャー | 高 | エディオン商品ページのタイトルに明記 |
| `MJX54J/A` | ブラック | 中 | 検索結果の要約のみ。商品ページのタイトルで未確認 |
| `MJX64J/A` | シルバー | 中 | 同上 |

> **キャリア版は品番が別です。** 上記はSIMフリー版です。ドコモ/au/ソフトバンク版を
> 狙う場合は別の品番になるので、`--find-parts` で調べ直してください。

**見つからない場合**（購入ページがJS描画だと起こり得ます）:
ブラウザで構成を選び、「バッグに追加」後のカート画面か、URL の `product=` パラメータに出る
`MXXXXJ/A` 形式の文字列を控えてください。

> 機種ページのURLは年ごとに変わります。`--find-parts` が0件なら `APPLE_BUY_PAGE` に
> 実際の購入ページURLを指定し直してください。

### 2. Discord Webhook を作る

対象チャンネル → 歯車 → **連携サービス** → **ウェブフック** → **新しいウェブフック** → URLをコピー。
スマホに飛ばすなら、Discordアプリでそのチャンネルの通知を「すべてのメッセージ」にしておくこと。

### 3. 実物のレスポンスを確認する（最重要）

Apple は `location` を**中心とした近隣店舗**を返します。離れた店舗（例: 渋谷と川崎）を
両方見たい場合は、**地点をカンマ区切りで複数指定**してください。それぞれ問い合わせて結果を
まとめます（同じ店舗が複数地点から返っても1件に統合されます）。

```bash
export APPLE_PARTS="MJX54J/A"
export APPLE_LOCATION="150-0041,160-0022,212-0013"   # 渋谷 / 新宿 / 川崎 の目安
export STORE_FILTER="川崎,渋谷,新宿"                  # この3店舗だけ監視

node apple-stock.js --raw
```

`--raw` は「返ってきた店舗すべて」と「STORE_FILTER 適用後」の両方を出します。
**郵便番号は目安なので、まず一覧を見て狙った3店舗が含まれているか確認してください。**
含まれていなければ郵便番号を調整します。

出力の見かた:

| 出力 | 意味 | 対応 |
|---|---|---|
| `受け取り(pickup) 抽出結果: 3件` のように店舗が並ぶ | **正常。** そのまま監視できる | 次へ |
| `抽出結果: 0件` | 構造が想定外 | 保存された `apple-raw.json` を確認。`location` 未指定/品番ミスが多い |
| `全エンドポイントが失敗 … HTTP 541` | 両方ブロックされている | `APPLE_ENDPOINTS` で別パスを試すか、`check.js` に切り替え |
| `HTTP 403` | UA/Referer 拒否かレート制限 | 間隔を空ける。それでも駄目ならブラウザのCookieが必要 |

### 4. 監視開始

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
node apple-stock.js --test     # 疎通テスト
node apple-stock.js --watch    # 常駐監視
```

macOS で常駐させるなら:
```bash
nohup node apple-stock.js --watch >> watch.log 2>&1 &
tail -f watch.log
```

---

## 設定できる環境変数

| 変数 | 既定値 | 説明 |
|---|---|---|
| `APPLE_PARTS` | （必須） | 品番。カンマ区切りで複数可 例 `MXYZ3J/A,MXYZ5J/A` |
| `APPLE_LOCATION` | （必須） | 郵便番号や都市名。**カンマ区切りで複数指定可** 例 `150-0041,160-0022,212-0013` |
| `DISCORD_WEBHOOK_URL` | （必須） | Discord Webhook URL（`DRY_RUN=1` なら不要） |
| `APPLE_LOCATIONS` | （空） | `APPLE_LOCATION` の別名。どちらで書いてもよい |
| `APPLE_REGION` | `jp` | URLの地域セグメント。米国は空文字 |
| `STORE_FILTER` | （空） | 店舗名の部分一致で絞る。**カンマ区切りでOR** 例 `川崎,渋谷,新宿` |
| `APPLE_ENDPOINTS` | `/shop/retail/pickup-message,/shop/fulfillment-messages` | 試す順。カンマ区切り |
| `APPLE_BUY_PAGE` | `{BASE}/shop/buy-iphone` | `--find-parts` が読むページ |
| `INCLUDE_DELIVERY` | `0` | `1` でオンライン配送の可否も監視対象に含める |
| `INTERVAL_SEC` | `60` | `--watch` の間隔（秒）。±15%のゆらぎを自動で入れる |
| `MENTION` | （空） | 通知の先頭に付ける 例 `@everyone` / `<@あなたのID>` |
| `REPEAT_MIN` | `30` | 在庫ありが続く間の再通知間隔（分）。`0` で再通知なし |
| `DRY_RUN` | `0` | `1` で送信せず標準出力に表示 |
| `STATE_FILE` | `./apple-state.json` | 前回状態の保存先 |

## 判定ロジック

0. `APPLE_LOCATION` の各地点について、`APPLE_ENDPOINTS` を順に叩く。
   1地点でも成功すれば続行し、失敗した地点は警告を出す（全滅した時だけエラー扱い）
1. 各地点の結果を店舗×品番で重複排除してまとめる
2. レスポンス全体を再帰探索し、`partsAvailability` を持つオブジェクトを全部拾う
   （店舗名は同じ階層の `storeName` / `storeDisplayName` から、なければ親から継承）
3. 各店舗×品番について `pickupDisplay` を見る。`available` なら在庫あり
4. `pickupDisplay` が無い場合は `pickupSearchQuote` 等の文言で判定
   （「受け取れません」「利用できません」等を先に除外してから「本日」「受け取り可能」を探す）
5. **在庫なし→在庫あり に変わった店舗だけ**通知する

在庫情報が1件も抽出できなくなった場合も警告を飛ばすので、無言で壊れることはありません。

## 注意

- **叩きすぎないでください。** `INTERVAL_SEC` は 30秒未満にしないこと。403やIP遮断のリスクがあります。
- Apple側の仕様変更でいつ壊れてもおかしくありません。`--raw` が最初の切り分け手段です。
- GitHub Actions 版（`.github/workflows/stock-watch.yml`）も用意していますが、
  cron は最短5分間隔かつ**混雑時は10〜30分遅れます**。発売直後の争奪には `--watch` を使ってください。

---

## 保険: `check.js`（is-checker.com）版

Apple公式が 541/403 で完全に塞がれた場合のフォールバックとして、
非公式集計サイト `is-checker.com` をスクレイピングする `check.js` も残してあります。

```bash
node check.js --dump    # ページ構造を確認
node check.js --watch
```

設定は `MATCH_KEYWORDS`（既定 `Pro Max,256`）等。詳細は `check.js` 冒頭のコメント参照。
こちらは二次集計なので、**サイト側の更新が遅れれば通知も遅れます。** あくまで保険です。
