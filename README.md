# 友链宇宙 · Friend Universe

> 一个「星空宇宙」风格的友链展示网站：每一位朋友是一颗**恒星**，TA 的子项目/链接是围绕恒星公转的**行星**，所有友链恒星组成一座**银河系**；银河中心住着三个「关键用户」；缩放到宇宙尽头，还有一位 **Live2D 佩丽卡**从空间站舷窗里登场。

---

## 功能特性

### 🌌 银河系
- 两种布局：**旋臂银河** / **随机散点**（顶部控制面板一键切换）
- **种子化布局**：恒星位置固定（`seed` 可改，刷新/切布局不漂移）
- **银心留白**（`centerClear`）：普通恒星不会进入中心三体区域
- **远景变暗**（`galaxyDim`）：拉远时银河整体淡出，不会缩成刺眼亮坨

### ⭐ 恒星与行星（友链数据驱动）
- 每颗恒星 = 一位朋友：**名字 / 头像 / 简介 / 链接 / 自定义颜色 / 标签 / 行星(子项目)**
- **恒星头像化**：
  - 有头像 → 恒星本体显示为**圆形头像**（本地 `images/avatars/` 或外链 URL）
  - 无头像 → 中性**白色星点**（不再显示彩色光环）
  - **GIF 动图头像**：通过屏幕空间 DOM 叠加实现，浏览器原生渲染，动画稳定播放且跟随公转
- 行星绕恒星公转，轨道环显示；点击行星标签可跳转/查看
- **搜索**：按站名/简介/行星名匹配，命中自动飞向
- **标签页签**：按分类筛选，非当前标签恒星淡出
- **随机一颗星**：一键随机跳转
- **详情面板**（屏幕右侧）：头像左 + 简介右，含主站链接与行星列表

### 💫 银河中心：银河之心
- 固定在银心原点的一颗友链恒星（`"center": true`），不带圆环光圈
- 三个**关键用户** + 银河之心构成 **4 体引力模拟**：三用户在银河之心引力下沿各自轨道公转
- 三体天体直接显示**圆形头像**（无球体），点击可查看完整友链档案
- 三体头像统一由**屏幕层**显示（GIF 动图 / 静态图用同一套尺寸逻辑，缩放一致、无底图露出），sprite 仅作点击层
- 三体**不绘制轨道环**

### 🛰 空间站彩蛋
滚轮一路拉远（`maxZoom` 最大可达 800 万）的完整动画：
1. 银河连续缩小、变暗成一点
2. 3D 场景整体淡出
3. **空间站图片**（`space-window.jpg`）从"窗户特写放大"平滑缩小到整张图
4. 到达最大缩放并停留 **3 秒** → **佩丽卡从底部滑入屏幕中间**

### 🧸 佩丽卡 Live2D（Cubism3）
- 眼睛/头部**跟随鼠标**移动
- **11 个表情按钮**（底部）：呆 · 武器 · 平板 · 唱歌 · 游戏 · 哭 · 泪 · 汗 · 生气 · 阴暗 · 脸红
- 快捷键 `Ctrl+Num1~9`（`/` 阴暗、`*` 平板），**点击佩丽卡**随机表情
- 自动待机动作 + 眨眼
- 佩丽卡登场时表情按钮淡入，滚轮回退则隐藏

### ⚙️ Python 数据管理台（`manage.py`）
纯标准库本地 Web 工具，**直接读写 `data/links.json`**，无需任何构建/第三方依赖：
- 友链（恒星）增/删/改/查、搜索、克隆、上移下移
- 行星（子项目）增删改、标签、颜色、设为银心
- **头像拖拽上传 + 实时预览**：图片自动保存到 `images/avatars/`，头像字段用本地相对路径
- 全局设置：银河参数、三体系统（引力体按名称选择）、标签管理
- 导出 `links.json` / 导入 JSON / 一键同步生成 `data.js`（回退数据）

---

## 快速开始

**⚠️ Live2D 必须通过 HTTP 访问**（`file://` 双击会被浏览器阻止 ES 模块与模型请求）。

### 本地预览（Windows）
双击项目根目录的 **`启动友链宇宙.bat`**：
- 自动启动本地服务器（`server.py`，端口 8123，**已禁用浏览器缓存**）
- 自动打开浏览器访问 `http://localhost:8123/`

### 数据管理台（Windows）
双击项目根目录的 **`start_admin.bat`**：
- 后台启动管理台（`manage.py`，端口 8127）
- 自动打开浏览器访问 `http://127.0.0.1:8127/`
- 在管理台保存的修改**直接写入 `data/links.json`**，刷新主站即生效

### 部署到 GitHub Pages（纯前端）
1. 把 `friend-universe` 目录内容推送到 GitHub 仓库
2. 仓库 `Settings → Pages` → Source 选 `main` 分支 / `/(root)`
3. 访问 `https://你的用户名.github.io/仓库名/`
4. 项目使用**相对路径**，子路径部署也能正常工作
5. 头像图片（`images/avatars/`）随仓库一起推送

---

## 操作说明

| 操作 | 效果 |
|---|---|
| 拖拽 | 旋转视角 |
| 滚轮 | 缩放（拉到最远触发空间站彩蛋） |
| 点击恒星/行星/三体 | 查看友链详情 / 项目 |
| 顶部搜索框 | 搜索恒星/行星并飞行定位 |
| 顶部标签页签 | 按分类筛选 |
| 「✦ 随机一颗星」 | 随机跳转 |
| `H` | 回到银河全景 |
| `T` | 巡游（自动飞过代表恒星，最后拉远触发彩蛋） |
| `G` | 控制面板（布局切换/自动旋转/标签/星尘/速度） |
| 控制面板「三体配置」 | 已并入 4 体模拟（银河之心 + 三用户） |
| `Ctrl+Num1~9` 等 | 佩丽卡表情快捷键 |
| 点击佩丽卡 | 随机表情 |

---

## 数据配置（`data/links.json`）

```jsonc
{
  "title": "我的友链宇宙",
  "defaultLayout": "spiral",
  "galaxy": {
    "radius": 115,       // 恒星分布半径
    "arms": 4,           // 旋臂数
    "diskRadius": 430,   // 星尘范围
    "dust": 16000,       // 星尘粒子数
    "startZoom": 420,    // 初始缩放
    "maxZoom": 8000000,  // 最大缩放（彩蛋阈值）
    "centerClear": 24,   // 银心留白（三体区域，恒星不进入）
    "seed": 20260830     // 布局随机种子（固定则位置可复现）
  },
  "threeBody": {         // 银河中心三关键用户（4 体模拟）
    "enabled": true,
    "radii": [6, 8.5, 11],
    "G": 1,
    "centerMass": 300,
    "cageRadius": 15,
    "minDist": 0.5,
    "bodies": [ { "starIndex": 0, "mass": 1 }, ... ]
  },
  "tags": ["博客", "设计", ...],     // 标签页签
  "stars": [                          // 友链表（恒星）
    {
      "name": "站名", "url": "https://...",
      "avatar": "images/avatars/xxx.png",  // 本地路径或外链 URL；留空则显示白色星点
      "desc": "一句话简介", "color": "#ffcc55", "tags": ["博客"],
      "center": true,                  // 设为银河中心（可加）
      "planets": [ { "name": "项目", "url": "...", "desc": "说明" } ]
    }
  ]
}
```

- **头像**：推荐用管理台上传，图片自动保存到 `images/avatars/`，`avatar` 字段用本地相对路径 `images/avatars/文件名`；支持 GIF 动图（会动）
- 编辑后刷新主站即可生效（`server.py` 已禁用缓存，无需手动清浏览器缓存）
- `data.js` 内嵌一份相同数据作为回退（`links.json` 加载失败时使用），用管理台「同步生成 data.js」更新

---

## Live2D 说明

- 模型：**Q扁佩丽卡**（Cubism 3 / `.moc3`），资源位于 `js/live2d/peilika/`
- 表情：11 个 `.exp3.json`，通过直接设置模型参数实现（`setParameterValueById`）
- 引擎：`pixi-live2d-display` 0.4 + pixi.js v6 + Cubism Core，全部本地化于 `js/live2d/`
- 加载方式：ES Module + `importmap`（现代浏览器原生支持，无需构建工具）

---

## 技术栈

| 用途 | 技术 |
|---|---|
| 3D 渲染 | three.js（WebGL 场景 + 银河粒子） |
| 动画 | TWEEN（相机/巡游补间） |
| CSS3D/2D 标签 | 屏幕空间投影（billboard，始终正对镜头） |
| Live2D | Cubism Core + pixi-live2d-display + pixi.js v6 |
| **数据管理台** | **Python 标准库**（`http.server`，零依赖，直接读写 JSON） |
| **本地服务器** | **Python 标准库**（`server.py`，禁用缓存） |
| 模块加载 | 原生 ESM + importmap（零构建、零 CDN 依赖） |
| 语言 | 原生 HTML / CSS / JavaScript（无框架）+ Python |

---

## 目录结构

```
friend-universe/
├── index.html               # 入口（含 importmap + Live2D 模块）
├── css/style.css
├── data/links.json          # 友链数据（唯一数据源）
├── images/avatars/          # 本地头像图片（管理台上传）
├── space-window.jpg         # 空间站彩蛋背景图
├── 启动友链宇宙.bat          # 一键本地预览（主站，端口 8123）
├── start_admin.bat          # 一键启动数据管理台（端口 8127）
├── server.py                # 本地静态服务器（禁用浏览器缓存）
├── manage.py                # Python 数据管理台（直接读写 links.json）
├── live2d-test.html         # 独立的 Live2D 模型预览页
├── preview/                 # 功能截图
├── live2d/                  # Live2D 模型资源
│   └── peilika/             # 佩丽卡模型（moc3 / 表情 / 贴图）
└── js/
    ├── three.min.js / tween.js
    ├── main.js              # 主程序（场景/彩蛋/交互）
    ├── galaxy.js            # 银河布局与粒子
    ├── starsystem.js        # 恒星与行星（含头像化、GIF 动图叠加）
    ├── threebody.js         # 银心 4 体模拟
    ├── marker.js / minimap.js / tour.js / gui.js ...
    └── live2d/              # Live2D 引擎与库
        ├── live2d.js        # 佩丽卡初始化/表情/鼠标跟踪
        ├── live2dcubismcore.min.js
        ├── index.es.js / cubism4.es.js
        └── vendor/          # pixi v6 全系 + 第三方库（本地化）
```

---

## 已知说明

- **`file://` 直接双击无法加载 Live2D**（浏览器安全限制），请用 `.bat` 本地服务器或 GitHub Pages
- **缓存**：`server.py` 对所有响应发送 `Cache-Control: no-store`，改代码后刷新即可生效；如遇旧缓存，用无痕窗口或 `Ctrl+F5`
- **GIF 动图头像**：浏览器 canvas 无法逐帧抓取动画 GIF，因此动图头像用屏幕空间 DOM 层叠加渲染（跟随 3D 位置、近大远小）；静态图片头像仍走 WebGL 纹理
- 拉远缩放阈值与 `galaxyDim` 变暗区间可在 `main.js` 顶部常量调整（`EASTER_FADE_START/END` 等）
