# CLAUDE.md

本檔提供 Claude Code 在此 repo 工作時所需的背景知識。

## 專案概觀

**BCST XYFlow** 是一個 WordPress 外掛，讓使用者在後台以拖拉方式編輯流程圖，並在前台唯讀呈現。

- Plugin Name: `BCST XYFlow`｜Version: `1.0.13`｜Text Domain: `bcst-xyflow`
- 需求：WordPress 5.7+ / PHP 8.0+ / Node 18+ / Composer
- 核心流程：後台 metabox 編輯流程圖 → 存進 post meta → 前台以 shortcode 或自動附加方式唯讀顯示
- 本外掛以 [j7-dev/wp-react-plugin](https://github.com/j7-dev/wp-react-plugin) 樣板為基底，因此 PHP namespace 仍是 `J7\WpReactPlugin`。**不要改 namespace**，`composer.json` 的 PSR-4 與 Strauss 前綴都綁在上面。

## 技術棧

**前端**：Vite 5 + React 18 + TypeScript 5 + SCSS + Tailwind 3 + React Query **v4 (4.36.1)** + `@xyflow/react` v12

> ⚠️ React Query 是 **v4**（devtools 卻裝了 v5）。寫 hook 時以 v4 API 為準：`useQuery` 回傳 `isLoading` 而非 v5 的 `isPending`，`useMutation` 也一樣。

**後端**：`kucrut/vite-for-wp`（Vite 資產整合）、`j7-dev/wp-utils`（`PluginTrait`／`SingletonTrait`）、Strauss（namespace 前綴化）

## 目錄結構

```
plugin.php              外掛進入點。用 PluginTrait + SingletonTrait，
                        提供 Plugin::$dir / $url / $kebab / $snake / $app_name / $version
inc/classes/
  Bootstrap.php         實例化 CPT / Entry / FlowApi；enqueue Vite 資產 + wp_localize_script
  Admin/CPT.php         註冊 CPT `bcst`、後台 metabox 容器
  Api/FlowApi.php       REST：GET/POST /wp-json/bcst-xyflow/v1/flow/{post_id}
  FrontEnd/Entry.php    shortcode [bcst_xyflow] + the_content 自動附加
  Utils/Base.php        常數：BASE_URL / APP1_SELECTOR / APP2_SELECTOR / API_TIMEOUT
  templates/test.php    ⚠️ 樣板遺留
js/src/
  main.tsx              三種掛載點的 ReactDOM.createRoot
  App1.tsx              前台唯讀（<Flow readOnly />）
  App2.tsx              後台可編輯（<Flow readOnly={false} />）
  pages/Flow/           ★ 真正的功能實作，改需求幾乎都在這
  hooks/useFlowData.tsx ★ 唯一實際使用的 hook
  assets/scss/flow.scss ★ 所有 Flow 樣式
  types/flow.ts         FlowData / GetFlowResponse / SaveFlowResponse
  ── 以下為樣板遺留，未被 Flow 使用 ──
  api/                  axios 封裝 + CRUD resources     ⚠️
  hooks/useOne|useMany|useUpdate|useAjax                ⚠️
  pages/index.tsx, pages/GetRestPosts.tsx               ⚠️
  types/wcRestApi, types/wcStoreApi, utils/wcStoreApi   ⚠️
js/dist/                build 產物（**未進版控**，被 .gitignore 的 `**/dist/**` 排除；
                        clone 後必須先 yarn build 才跑得起來）
release/                release-it 設定與打包腳本
vendor-prefixed/        Strauss 產生，勿手改
```

## 資料流（最關鍵）

```
DB: post_meta['bcst_xyflow_data']  ← JSON string { nodes, edges, viewport }
      ↑ update_post_meta( $id, KEY, wp_slash( wp_json_encode( $data, JSON_UNESCAPED_UNICODE ) ) )
inc/classes/Api/FlowApi.php        get_flow_data / save_flow_data（namespace bcst-xyflow/v1）
      ↕ fetch + header X-WP-Nonce: window.wpApiSettings.nonce
js/src/hooks/useFlowData.tsx       useGetFlowData / useSaveFlowData
      ↕
js/src/pages/Flow/index.tsx        useState<Node[]> / useState<Edge[]>
                                   ── 手動按「儲存」才寫回，沒有自動存檔 ──
```

重點：

- Meta key 常數是 `FlowApi::FLOW_META_KEY = 'bcst_xyflow_data'`。**注意不是** `Plugin::$snake . '_meta'` — 那是 `Admin/CPT.php` 裡另一套樣板遺留的 meta，與 Flow 無關。
- `wp_slash()` 是為了保住換行字元（`update_post_meta` 會自動 `wp_unslash`），`JSON_UNESCAPED_UNICODE` 是為了保住中文。**改存檔邏輯時這兩個都不可拿掉。**
- 權限：GET 需 post 為 `publish` 或使用者有 `edit_post`；POST 需 `edit_post`。
- 資料不存在時 API 回傳預設結構 `{ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }`。

## 三種掛載方式

| 掛載點 | 選擇器 | 模式 | 來源 |
|---|---|---|---|
| 後台 metabox | `#bcst_xyflow_metabox` | 可編輯（App2） | `CPT::render_meta_box()`，僅 `bcst` post type |
| 前台 shortcode | `.bcst-xyflow-shortcode`（class，可多個） | 唯讀（App1） | `[bcst_xyflow]` |
| 前台 `bcst` 單篇 | `#bcst_xyflow` | 唯讀（App1） | `the_content` filter 自動前置於內容之上 |

Shortcode 用法：

```
[bcst_xyflow]                                        使用當前文章 ID
[bcst_xyflow id="123"]                               指定文章 ID
[bcst_xyflow id="123" width="100%" height="800px"]   指定尺寸（預設 100% / 600px）
```

- Shortcode 透過 `data-post-id` 屬性把 postId 傳給 React；其他情況 fallback 到 `wp_localize_script` 注入的 `window.bcst_xyflow_data.env.postId`。
- `main.tsx` 會跳過已被 shortcode 渲染過的節點，避免重複掛載。
- 選擇器字串來自 `Utils/Base.php`，經 `wp_localize_script` 傳到前端的 `js/src/utils/env.tsx`。

## Flow 元件職責

| 檔案 | 職責 |
|---|---|
| `pages/Flow/index.tsx` | `FlowEditor` + `ReactFlowProvider` wrapper。`readOnly` 決定 nodeTypes、Toolbar、MiniMap 與各項互動旗標；唯讀時 `fitView`，編輯時還原存檔的 viewport |
| `pages/Flow/EditableNode.tsx` | ★ 最大的檔（~1050 行）。同時 export 給 `ReadOnlyNode` 複用：`NODE_COLORS`、`DEFAULT_NODE_COLOR`、`DEFAULT_TEXT_STYLE`、`FONT_SIZES`、`RichText`、`processLabel` 及型別 `NodeColor` / `TextStyle` / `EditableNodeData` |
| `pages/Flow/ReadOnlyNode.tsx` | 唯讀版節點。Handle 隱藏（opacity 0、`pointerEvents: none`）但**保留**，線條才連得上 |
| `pages/Flow/CustomEdge.tsx` | 邊。垂直／水平（誤差 < 5px）走 `getStraightPath` 避免抖動，否則 `getSmoothStepPath`（borderRadius 8）；四種線型；額外一條 `strokeWidth={20}` 透明 path 擴大點擊區 |
| `pages/Flow/LineEndpoint.tsx` | 「新增線條」＝兩個 endpoint 節點 + 一條 `data.isLine: true` 的邊（不畫箭頭） |
| `pages/Flow/Toolbar.tsx` | 新增節點／新增線條／清空畫布／儲存，以及節點與連結計數 |
| `pages/Flow/initialNodes.tsx` | ⚠️ 樣板／實驗遺留，未被任何檔案 import 的範例資料 |

`EditableNode` 的節點功能：

- 雙擊編輯文字（textarea，支援換行）；Ctrl/Cmd+Enter 儲存、Esc 取消
- 輕量標記語法：`*斜體*`、`_斜體_`、`**粗體**`、`__粗體__`、`***粗斜體***`、`~~刪除線~~`
- 文字樣式：字級（10–32px）、粗體／斜體／底線、左／中／右對齊
- 顏色：10 色預設盤 + 自訂色（`<input type="color">`）+ 透明度滑桿；邊框色與文字色由背景亮度自動推導
- 連結：`link` 站內連結（同頁跳轉）／`infoLink` 外部連結（節點下方 info 圖示，開新分頁）
- `NodeResizer` 調整大小（minWidth 120 / minHeight 60）
- 四個方向各一組 source + target Handle（`top`／`top-source` 等命名）

樣式全寫在 `js/src/assets/scss/flow.scss`（**非** Tailwind），由 `index.scss` 匯入。元件內的 inline style 僅用於動態顏色／字級／對齊。

## 指令

```bash
yarn bootstrap          # yarn install + composer install
yarn dev                # Vite dev server :5173（vite-for-wp 自動切換到 dev 資產）
yarn build              # vite build + release/mv-manifest.cjs → js/dist
yarn lint               # eslint + phpcbf
yarn lint:fix           # eslint --fix + phpcbf
yarn format             # prettier-eslint --write
composer lint           # phpcs（WordPress Coding Standards）
yarn release:build-only # 只在 release/ 產生目錄與 zip，不推 GitHub
yarn release            # patch 版；另有 release:minor / release:major
```

發佈注意事項：

- `.env` 內有 `GITHUB_TOKEN`。**此檔含機密，勿讀取內容、勿提交。**
- `release/.release-it.cjs` 的 `allowedItems` 決定 zip 內容：`inc`、`js/dist`、`vendor-prefixed`、`composer.json`、`composer.lock`、`index.php`、`plugin.php`、`README.md`。新增需要隨外掛出貨的檔案時，記得同步加進去。
- 發佈前必須先 `yarn build` — `js/dist` 沒進版控，但它是 zip 的來源，沒 build 就會打包到舊的或空的資產。
- `yarn release:build-only` 會 bump `package.json` 版號卻**跳過** `yarn sync:version`，導致 `plugin.php` 版號落後。只用它做本機測試，需要時手動補跑 `yarn sync:version`。
- `composer install` / `update` 會自動觸發 Strauss（`post-install-cmd` → `prefix-namespaces`）重建 `vendor-prefixed/`。
- 版本號同步由 `yarn sync:version`（`package.json` → `plugin.php`）處理，release 流程會自動呼叫。

## 開發流程（本機 bcst-blog 站台）

站台的 `wp-content/plugins/` 底下有**兩份**同一個外掛：

| 目錄 | 身分 |
|---|---|
| `bcst-xyflow/` | 原始碼 repo（本目錄），平時 inactive |
| `r2-bcst-xyflow/` | `release-it` 打包產物（`releasedPluginName`），平時 active |

**兩份不可同時啟用。** 兩個 `plugin.php` 都有 `if ( ! class_exists( 'J7\WpReactPlugin\Plugin' ) )` 守衛，同時啟用時先載入的生效、另一份靜默失效且不會報錯。切換務必先 deactivate 再 activate：

```bash
# 進入開發：切到原始碼版
wp plugin deactivate r2-bcst-xyflow
wp plugin activate bcst-xyflow

# 改 js/src 或 inc → yarn build → 重新整理驗證

# 發佈後：切回發佈版再驗一次
wp plugin deactivate bcst-xyflow
wp plugin activate r2-bcst-xyflow
```

發佈產物在 `release/r2-bcst-xyflow/r2-bcst-xyflow/`，zip 是 `release/r2-bcst-xyflow.zip`（根目錄即 `r2-bcst-xyflow/`）。直接改 `r2-bcst-xyflow/` 沒有意義，下次 release 會被 `create-release.cjs` 的 `deleteRelease()` 蓋掉。

**存取一律用 `https://bcst-blog.local`，登入與瀏覽不要混用 scheme。**

後台 metabox 若出現「載入失敗：Failed to fetch flow data」，先懷疑登入 cookie 而不是外掛：REST 請求收不到 path 為 `/` 的 `wordpress_logged_in_*` 時，WP 會把請求當訪客，頁面上以登入身分產生的 `wp_rest` nonce 就驗不過，回 403 `rest_cookie_invalid_nonce`，而 `useFlowData.tsx` 只看 `!response.ok` 就丟出通用錯誤。此時 `/wp-admin` 本身仍進得去，因為它靠的是 path 為 `/wp-admin` 的 `wordpress_sec_*`——「後台開得起來但 metabox 掛掉」就是這個組合。重新登入一次把 cookie 補齊即可。

DB 裡 `home` / `siteurl` 都是 `http://bcst-blog.local`，執行期由核心的 `get_home_url()` / `get_site_url()` 在 `is_ssl()` 為真時自動升級成 https，這是正常行為、不是設定衝突。

副作用：`yarn dev` 的 dev server 跑在 `http://localhost:5173`，https 頁面會因 mixed content 擋掉它。要用 HMR 就得在 `vite.config.ts` 打開 `server.https`（repo 內的 `localhost+1.pem` / `localhost+1-key.pem` 已涵蓋 `localhost` 與 `bcst-blog.local`）；否則改完直接 `yarn build` 再重新整理驗證。

## 程式碼慣例

**TypeScript / TSX**（`.prettierrc.json`）：無分號、單引號、2 空格、printWidth 80、`trailingComma: all`、`arrowParens: always`。ESLint 用 `@wordpress/eslint-plugin` + prettier。路徑別名 `@/*` → `js/src/*`。

**PHP**（`phpcs.xml`，WordPress Coding Standards）：tab 縮排、每檔 `declare(strict_types=1)`、WP 核心函式一律加 `\` 前綴（`\add_action`、`\get_post_meta`、`\esc_attr`）、class 用 `final` + `SingletonTrait`、每個 class 與 method 都要 docblock。

**語言**：註解與 UI 文案用繁體中文。`__()` / `esc_html__()` 的 text domain 一律 `bcst-xyflow`。前端字串目前多為硬編中文，未走 i18n。

## 常見任務指引

- **加節點功能** → 改 `EditableNode.tsx` 的 `EditableNodeData` 型別與 UI，並**同步更新 `ReadOnlyNode.tsx`** 的呈現。資料會自動隨 `node.data` 進 JSON，PHP 端不用改。
- **加邊的功能** → 改 `CustomEdge.tsx` 的 `CustomEdgeData`；`defaultEdgeOptions` 定義在 `pages/Flow/index.tsx`。
- **加 REST 端點** → `Api/FlowApi.php` 的 `register_routes()`，記得寫 `permission_callback`。
- **改 CPT** → `Admin/CPT.php`。
- **改樣式** → `flow.scss`，別在元件裡堆 inline style。

## 已知注意事項

- `CPT::init()` 在每次 `init` hook 都呼叫 `flush_rewrite_rules()` — 效能地雷，若要動 rewrite 規則請一併處理。
- `CPT::save_metabox()` 直接讀 `$_POST[ Plugin::$snake . '_meta' ]` 未檢查 isset，且與 Flow 存檔完全無關（Flow 走 REST）。屬樣板遺留。
- `useFlowData.tsx` 用原生 `fetch`，沒走 `js/src/api/axios` — 樣板的 axios 層形同未用。
- `pages/index.tsx` 有未使用的變數（`count`、`showRestPosts`）。`tsconfig` 雖設 `noUnusedLocals: true`，但因 `noEmit` 且 Vite build 不做型別檢查，不會擋住 build。
- `js/src/App1.tsx` / `App2.tsx` 都 import `@/assets/scss/index.scss`，所以樣板的 `example.scss` / `global.scss` 也會一起打包。
