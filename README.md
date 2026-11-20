# Luma Tape

一卷可以自由创作的电子手账胶带。支持带纸纤维的普通胶带与透明细闪两种质感，57 个主题、空白绘制、调色、手动旋转和 PNG 导出。

[在线体验](https://washi-light-studio.tealanole.chatgpt.site/) · [源码仓库](https://github.com/Cynthiawongss/luma-tape)

## 运行

需要 Node.js 20.19+（推荐 Node.js 22 LTS）和 npm。在仓库根目录执行：

```sh
npm ci
npm run dev
```

按终端显示的本地地址打开。检查与构建：

```sh
npm test
npm run build
npm run preview
```

静态构建产物位于 `dist/`。默认以域名根路径运行；如需部署在子路径，可用 `npm run build -- --base=/luma-tape/`，或设置 `LUMA_TAPE_BASE`。素材 URL 跟随 Vite base。

## 功能与数据（V7）

- 界面为当代平面设计风：细线网格、直角、衬线大标题配等宽小标注、电光蓝强调色，瀑布流封面，顶栏搜索。主题、分类、配色与界面文字均为英文（中文关键词仍可搜索）。
- 6 个分类共 57 个预设，另有空白创作。主题 ID 不变，旧存档可直接打开。
- 封面、平面预览、3D 卷筒和导出都由 `src/patterns.js` 的同一个 `drawPattern` 生成，不会互相对不上。图案分三层：底纹、均匀散布的小图、交错的大图；可调大小与疏密。
- 四种印花风格（Print → Blur / Stitch / Symbol / Classic）：柔焦颗粒、像素十字绣、字符符号、原水彩。同一主题可随时切换；每个预设默认用一种新风格和一组高饱和配色，原水彩配色保留在 `classicColors`。旧存档没有 `look` 字段，按 Classic 打开。
- 两种材质：Washi paper（不透明纸面，纤维与绒光）和 Glitter film（透明薄膜，图案与闪片嵌在膜内，锦鲤可游动）。
- 三个颜色都作用在胶带上（底色、印花深色、点缀），可用 “Match to base color” 按 OKLCH 自动配色。
- 整体撤销 / 重做（⌘Z / ⇧⌘Z）；方向键旋转卷筒，Home 复位；不自动旋转。
- My rolls：多卷作品保存在浏览器 `luma-tape:works:v1`，可改名、删除（可撤销）。当前编辑状态自动写入 `luma-tape:studio:v1`，并兼容读取更早的存档键。没有账号、云同步或后端。
- 画布：画笔、橡皮、39 张贴纸、文字、上传图片、撤销 / 重做。
- Shuffle：一键换一组配色和印花风格。
- 导出：平铺胶带 PNG（3072 × 512，最适合 GoodNotes 等电子手账）、透明底贴纸 PNG（2400 × 1400）与白底展示图（2400 × 1600）。纸胶带本体不透明。
- 主题可用链接直达：`#/t/<主题 ID>`。

## 代码结构

```text
src/
  main.jsx / App.jsx       网页入口
  Studio.jsx               主界面、状态、撤销重做、存档、导出
  Library.jsx              主题库（分类、搜索、瀑布流封面）
  WorksDrawer.jsx          My rolls 作品抽屉
  works.js / color.js      存档规范化与 OKLCH 配色（有测试）
  sprites.js               图集加载
  DrawingEditor.jsx        自定义图案画布
  waterScene.js            Three.js 材质、预览、手动旋转与导出
  waterGeometry.js         连续卷筒和展开曲面
  tapeStyle.js             两种材质约束与旧存档迁移
  catalog.js / patterns.js 主题和印花
  assets.js                跟随部署路径的素材地址
  *.css                    网页样式
public/assets/             当前使用的图片素材
tests/                     材质不透明度与几何连续性回归
```

## 维护与发布

**本仓库是 Luma Tape 后续开发的唯一源码仓库。** 最新导入包含已发布的 V6 纸面与色彩优化，以及独立运行、子路径素材支持和模块存档键。

源码提交与网站发布是两件事。当前公开站点继续运行原部署；本仓库尚未配置自动部署。仅推送 GitHub 不会自动改变线上版本，网站发布需另走部署流程。

不提交 `node_modules/`、`dist/`、密钥、浏览器存档、个人截图或部署凭据。未来若被其他项目采用，通过单独的集成任务同步；本仓库日常更新不自动修改其他仓库。
