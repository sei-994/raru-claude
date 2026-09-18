# iPhone 在庫監視 → Discord 通知

Apple 公式のエンドポイントを直接叩いて、**指定した店舗に在庫が出た瞬間**に Discord へ通知します。
依存パッケージなし（Node 18+ の標準 `fetch` のみ）。

```bash
cp .env.example .env
vi .env                        # Webhook URL を入れる。他は初期値のままで可
node apple-stock.js --doctor   # 設定から通知まで全部チェックして、直す場所を教えてくれる
node apple-stock.js --watch    # OK が出たら監視開始
```

| スクリプト | 取得元 | 位置づけ |
|---|---|---|
| **`apple-stock.js`** | **Apple公式エンドポイント** | **本命** |
| `check.js` | `is-checker.com` | 保険。Apple側が塞がれた時用（ページ下部参照） |

---

## ⚠️ 未検証の前提

**これを書いた環境から apple.com にネットワーク到達できませんでした**（egressブロック）。
実レスポンスは一度も見ていません。次は**未確認**です。

1. どのエンドポイントが今も生きているか（`/shop/retail/pickup-message` か `/shop/fulfillment-messages` か）
2. レスポンスのJSON構造
3. UA/Referer だけで通るか（Cookie が要る可能性）

そのため**JSONの階層を決め打ちせず**、`partsAvailability` を持つオブジェクトを再帰探索する実装にしています。
エンドポイントも複数を順に試してフォールバックします。
**`--doctor` がこの3点をすべて実測して判定します。** まずそれを実行してください。

---

## `--doctor` が見るもの

```
[1/4] 各地点に問い合わせ     → どの地点がどの店舗を返したか
[2/4] 品番の確認             → 指定した品番が実在するか（✗なら品番ミス）
[3/4] 監視対象の店舗         → STORE_FILTER が効いているか、今の在庫は何件か
[4/4] Discord                → テスト通知を実際に送る
判定: OK / NG                → NGなら直す場所を具体的に指示、終了コード1
```

さらに「地点を減らせる」場合は警告で教えます。例：

```
! 地点は 150-0041,212-0013 の2つで同じ店舗を全部カバーできます。
    APPLE_LOCATION を減らすとリクエスト数が 3→2 になり、403やIP遮断のリスクが下がります。
```

---

## 設定（`.env`）

`.env.example` をコピーして使います。`.env` は `.gitignore` 済みなので Webhook URL を書いても安全です。
実際の環境変数のほうが `.env` より優先されます。

| 変数 | 既定値 | 説明 |
|---|---|---|
| `DISCORD_WEBHOOK_URL` | （必須） | チャンネルの歯車 → 連携サービス → ウェブフック |
| `APPLE_PARTS` | （必須） | 品番。カンマ区切りで複数可 |
| `APPLE_LOCATION` | （必須） | 郵便番号や都市名。**カンマ区切りで複数指定可** |
| `APPLE_LOCATIONS` | （空） | `APPLE_LOCATION` の別名 |
| `STORE_FILTER` | （空） | 店舗名の部分一致。**カンマ区切りでOR** 例 `川崎,渋谷,新宿` |
| `MENTION` | （空） | 通知の先頭に付ける 例 `@everyone` / `<@あなたのID>` |
| `INTERVAL_SEC` | `60` | `--watch` の間隔（秒）。±15%のゆらぎ付き |
| `REPEAT_MIN` | `30` | 在庫ありが続く間の再通知間隔（分）。`0` で再通知なし |
| `INCLUDE_DELIVERY` | `0` | `1` でオンライン配送の可否も監視 |
| `APPLE_REGION` | `jp` | URLの地域セグメント。米国は空文字 |
| `APPLE_ENDPOINTS` | `/shop/retail/pickup-message,/shop/fulfillment-messages` | 試す順 |
| `APPLE_BUY_PAGE` | `{BASE}/shop/buy-iphone` | `--find-parts` が読むページ |
| `DRY_RUN` | `0` | `1` で送信せず標準出力に表示 |
| `STATE_FILE` | `./apple-state.json` | 前回状態の保存先 |
| `ENV_FILE` | `./.env` | 設定ファイルの場所 |

### 品番について

Apple の在庫APIは商品名ではなく **`MJX54J/A` 形式の品番**で引きます。容量・色・キャリアごとに別番号です。

`.env.example` に入れてある iPhone 18 Pro Max 256GB SIMフリーの品番（**2026-09-18時点の調査・要検証**）:

| 品番 | 色 | 確度 | 根拠 |
|---|---|---|---|
| `MJX74J/A` | バーガンディ | 高 | ヨドバシ商品ページのタイトルに明記 |
| `MJX84J/A` | グレイシャー | 高 | エディオン商品ページのタイトルに明記 |
| `MJX54J/A` | ブラック | 中 | 検索結果の要約のみ。商品ページで未確認 |
| `MJX64J/A` | シルバー | 中 | 同上 |

**この表を信じる必要はありません。** 誤っていれば `--doctor` の `[2/4] 品番の確認` が `✗` を出します。
その場合は Apple 自身のページから引き直してください:

```bash
APPLE_BUY_PAGE="https://www.apple.com/jp/shop/buy-iphone/iphone-18-pro" \
  node apple-stock.js --find-parts 256
```

> **キャリア版は別品番です。** 上記はSIMフリー版。ドコモ/au/ソフトバンク版を狙うなら調べ直してください。

### 地点について

Apple は `location` を**中心とした近隣店舗**しか返しません。
離れた店舗（渋谷と川崎など）を両方見たい場合は、地点をカンマ区切りで複数指定します。
各地点を順に問い合わせ、店舗×品番で重複排除してまとめます。

`.env.example` の初期値は 渋谷 / 新宿 / 川崎 の**目安**の郵便番号です。
正確な所在地は確認できていないので、`--doctor` の `[1/4]` で実際に返った店舗を見て調整してください。

---

## コマンド

| コマンド | 用途 |
|---|---|
| `--doctor` | **最初にこれ。** 設定から通知まで一気通貫で自己診断 |
| `--watch` | 常駐監視 |
| `--check` | 1回だけチェック（cron / GitHub Actions 向け。既定） |
| `--find-parts [絞込]` | 購入ページから品番・容量・色を抽出 |
| `--raw` | 生JSONを `apple-raw.json` に保存し、抽出結果を表示 |
| `--test` | Discord 疎通テストのみ |

バックグラウンドで動かす:
```bash
nohup node apple-stock.js --watch >> watch.log 2>&1 &
tail -f watch.log
```

---

## 判定ロジック

0. `APPLE_LOCATION` の各地点について `APPLE_ENDPOINTS` を順に叩く。
   **1地点でも成功すれば続行**し、失敗した地点は警告のみ（全滅時だけエラー扱い）
1. 各地点の結果を店舗×品番で重複排除してまとめる
2. レスポンス全体を再帰探索し、`partsAvailability` を持つオブジェクトを全部拾う
   （店舗名は同階層の `storeName` / `storeDisplayName` から、なければ親から継承）
3. 各店舗×品番の `pickupDisplay` が `available` なら在庫あり。
   無い場合は `pickupSearchQuote` 等の文言で判定（否定表現を先に除外してから肯定表現を探す）
4. **在庫なし→在庫あり に変わった店舗だけ**通知する

壊れたときに黙らない設計にしています:

- 在庫情報を1件も抽出できなくなったら警告通知（1時間に1回まで）
- 5回連続で取得に失敗したら警告通知
- `--watch` は想定外の例外でも停止しない
- 連続失敗中は間隔を自動で延ばす（最大8倍）。403やIP遮断を避けるため

---

## 注意

- **叩きすぎないこと。** `INTERVAL_SEC` は30秒未満にしない。
  地点を3つ指定していれば1サイクルで3リクエスト飛ぶ点にも注意（`--doctor` が減らせる場合は教えます）。
- Apple側の仕様変更でいつ壊れてもおかしくありません。`--doctor` → `--raw` が切り分け手段です。
- GitHub Actions 版（`.github/workflows/stock-watch.yml`）もありますが、
  cron は最短5分間隔かつ**混雑時は10〜30分遅れます**。発売直後の争奪には `--watch` を使ってください。

---

## 保険: `check.js`（is-checker.com）版

Apple公式が 541/403 で完全に塞がれた場合のフォールバック。非公式集計サイトをスクレイピングします。

```bash
node check.js --dump     # ページ構造を確認
node check.js --watch
```

設定は `MATCH_KEYWORDS`（既定 `Pro Max,256`）等。詳細は `check.js` 冒頭のコメント参照。
**二次集計なのでサイト側の更新が遅れれば通知も遅れます。** あくまで保険です。
