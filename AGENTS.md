# Luma Tape 工作规则

## 仓库与范围

- 用户于 2026-11-08 指定 `https://github.com/Cynthiawongss/luma-tape` 为后续唯一更新仓库。
- 日常源码、素材、测试和文档只在本仓库更新。不要修改其他协作者仓库、推送其分支或合并其 PR，除非用户另行明确要求。
- 2026-11-20 起公开网站改由 GitHub Pages 提供（GitHub Actions 自动发布，地址 https://cynthiawongss.github.io/luma-tape/ ，账号绑定了自定义域名，会跳到 wongwingsaan.com/luma-tape/）。推送 `main` 即自动发布到公网，所以推送前必须先在本地跑通测试、构建并在浏览器里看过。旧的 chatgpt.site 站点不再更新，不要把部署凭据提交进 Git。
- 用户要求改动直接提交并推送到 `main`，不走分支和 PR。
- 本仓库为独立 React/Vite/Three.js 项目，不依赖 SwiftUI 或其他项目的构建系统。

## 产品约束

- 品牌名 Luma Tape；背景保持白色，颜色控制只作用于胶带。
- 初始视角固定，不自动旋转；用户拖动查看。
- 普通纸胶带始终不透明，纸纤维与微小凹凸可调，清晰平面印花；避免塑料清漆感、过度掺白和灰蓝偏色。
- 透明细闪保持独立材质，闪粉随视角变化。像素拼豆已下线，不恢复。
- 保留全部主题、空白绘制、存档和导出。普通款 PNG 保留实色底，胶带外背景透明。
- 素材路径必须跟随 Vite BASE_URL，支持独立域名和子目录部署。

- 2026-11-20 用户确定：审美方向是 Pinterest 上流行的当代平面设计（Blur Dreamy 柔焦颗粒、Pixel Cross Stitch 像素十字绣、New Symbolic 符号字符、高饱和撞色、细线与小标注），不要水彩花卉式的怀旧手账感，也不要圆角胶囊的通用 App 感；主题与界面命名一律用英文，不起中文名。主题 ID 保持不变。
- 封面、预览、卷筒、导出必须共用 `drawPattern`，不另做装饰图。

## 验证

- 依赖或锁文件变更后用 npm ci 验证。
- 提交前运行 npm test 与 npm run build；界面/渲染变更使用浏览器验证。
- 不提交 node_modules、dist、.env、密钥、个人文件、浏览器数据或部署凭据。
