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

## 功能与数据

- 地理场景、五行、16 型人格灵感、星座、行星、花卉，共 57 个预设，另有空白创作。
- 普通款是实色纸胶带：底色深浅不会改变不透明度；透明细闪是另一种材质。像素拼豆已下线，旧拼豆存档会迁移为普通款。
- 白色背景，固定初始视角，只由用户拖动旋转；普通款为静态印花，透明款可控制图案动态。
- 空白画布支持画笔、素材和图片上传；导出单段 PNG 或白底预览。
- 数据保存在当前浏览器的 `luma-tape:studio:v1`，兼容读取旧版存档。没有账号、云同步或后端，换设备不会自动带走作品。

## 代码结构

```text
src/
  main.jsx / App.jsx       网页入口
  Studio.jsx               编辑界面、存档、导出操作
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
