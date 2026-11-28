# 御琳书屋交接文档

御琳书屋（Nekyulin's Library）是以 Markdown 维护的个人静态博客。正文和配图保存在仓库里，评论保存在 GitHub Discussions，访问统计由 GoatCounter 管理。

- 公开站点 [nekyulin.github.io](https://nekyulin.github.io/)
- 公开仓库 [Nekyulin/nekyulin.github.io](https://github.com/Nekyulin/nekyulin.github.io) 的默认分支为 `main`，本机工作目录是 `D:\projects\github_blog`。
- 发布记录 [GitHub Actions](https://github.com/Nekyulin/nekyulin.github.io/actions/workflows/pages.yml)

## 目录与修改入口

| 路径 | 用途 |
| --- | --- |
| [README.md](README.md) | 发文格式、全部元数据字段、标签定义、构建与预览说明。 |
| [posts/](posts/) | 文章正文、每篇文章的 `meta.json`、可选译文和 `assets/`。 |
| [tags.json](tags.json) | 标签 ID 与中英文名称。当前有 `math`（数学 / Mathematics）和 `writing`（写作 / Writing）。有文章的分类会生成 `/tags/<id>/`。 |
| [scripts/build.mjs](scripts/build.mjs) | 校验元数据，通过 Markdown-it 和 KaTeX 渲染正文，生成首页、文章页、分类页和分页。页头、首页三枚图标、Star 提示、评论和统计的 HTML 均由此生成。 |
| [site/style.css](site/style.css) | 网站排版、颜色、字体、不同屏幕尺寸的布局和滚动样式。 |
| [site/language.js](site/language.js) | 中英文界面、文章列表文案、按钮的无障碍标签和 giscus 语言。界面语言保存在 `localStorage` 的 `library-language`，默认中文。 |
| [site/home-scroll.js](site/home-scroll.js) | 首页标题、欢迎语和 Star 提示的滚动动画，以及背景和人物向右退场。 |
| [site/post-list.js](site/post-list.js) | 首页与分类页滚动加载下一批文章。每页 12 篇，自动加载不可用时可通过「更多文章」打开下一页。 |
| [site/comments.css](site/comments.css) | giscus 评论区的深色主题与简洁样式。 |
| [site/](site/) | 中英文标题 SVG、人物 SVG、手机 QQ 使用的人物透明 PNG，以及 `icons/` 中的图标和许可文件。 |
| [.github/workflows/pages.yml](.github/workflows/pages.yml) | GitHub Pages 构建和发布。生成目录为 `dist/`，由工作流上传。 |

## 发文与原稿

每篇文章对应 `posts/<目录名>/`，其中 `meta.json` 和 `index.md` 是构建入口。目录名同时决定公开网址 `/posts/<目录名>/` 和评论关联键。标题与发布日期必填，标签、置顶、评论开关及译文的字段写法见 [README.md](README.md)。

- 中文原文在 `index.md`，有英文译文时使用 `index.en.md`，并在元数据中填写 `translation`。英文为原文时，中文译文的文件名是 `index.zh-CN.md`。双语文章的两份摘要同时填写或同时省略。单语文章也可以正常发布。
- 行内公式用 `$` 包围，独立公式用单独成行的 `$$` 包围。图片放在该文章的 `assets/`，正文使用 `![图注](./assets/文件名.png)`。从 Obsidian 发布 Chernoff 文章时，已经把 `![[...]]` 图片嵌入转换为这种相对链接。
- 标签集中定义在 `tags.json`，文章元数据通过一个 `tag` 关联。置顶文章先按 `pinPriority` 由高到低排列，再按发布日期倒序。普通文章按发布日期倒序。
- 本机 Obsidian 的网站原稿位于 `D:\学习\Obsidian\大二上\网站文章`。个人简介文件夹内的中英文原稿分别是 `个人简介.md` 和 `Personal Profile.md`。Chernoff 文件夹内的原稿是 `为什么 Chernoff 界技术能得到优秀的概率估计？.md`，对应的五张 Obsidian 配图已经收录在仓库的文章资源目录。

| 已发文章 | 仓库位置 | 线上状态 |
| --- | --- | --- |
| 个人简介 | [posts/personal-profile/](posts/personal-profile/) | [中文](https://nekyulin.github.io/posts/personal-profile/)和[英文](https://nekyulin.github.io/posts/personal-profile/en.html)，置顶，评论关闭。 |
| 为什么 Chernoff 界技术能得到优秀的概率估计？ | [posts/chernoff-bound/](posts/chernoff-bound/) | [中文版](https://nekyulin.github.io/posts/chernoff-bound/)，归入「数学」，评论开启。 |

## 当前页面表现

- 首页以黑色为底，右侧是紫色几何背景和人物插画。欢迎语和下方的 Star 提示字号一致，随标题移动并一起渐隐。邮箱、语言切换和仓库 Star 链接从上到下排在左侧。标题逐渐收拢到右上角。
- 中文标题为「御琳书屋」，英文标题为「Nekyulin's Library」。双语文章的列表入口随界面语言切换，文章页的标题标识随正文版本切换。文章页左上角提供返回键和译文入口，单语文章的译文按钮为灰色。分类页提供返回键。
- 每篇文章在标题区与正文之间显示 Star 提示。中文版的「这个网站」及英文版的 “this site” 是带下划线的仓库链接。首页欢迎语下方也显示对应的中英文提示。
- 正文二至六级标题为淡紫色，加粗和斜体为淡蓝色。公式块的上下留白用于完整容纳高公式，超宽公式可以横向滚动。代码使用 Cascadia Code，正文使用 Constantia、Georgia 和 Noto Serif SC 等衬线字体。
- 人物插画默认使用 SVG。页面识别到手机 QQ 内置浏览器时使用同一插画的透明 PNG。这解决了 QQ 中 SVG 配色发白的问题。

## 构建与发布

仓库要求 Node.js 24 或更高版本。本地预览命令使用 Python 3。

```sh
npm ci
npm run build
npm run preview
```

本地预览地址为 `http://127.0.0.1:8000/`，服务读取 `dist/`。正文或样式修改后重新构建并刷新预览。

仓库 Pages 的发布来源为 GitHub Actions。推送到 `main` 会触发 `Deploy blog to GitHub Pages` 工作流，工作流也提供手动运行入口。构建使用 Node.js 24，安装锁定依赖后运行 `npm run build`，再上传并发布 `dist/`。工作流读取 Pages 提供的公开站点地址作为 `BLOG_SITE_URL` 传给构建。已发布页面可在公开网址核对，构建和部署结果位于对应提交的 Actions 记录。

## 评论与访问统计

仓库的 Discussions 已开启，并已安装 giscus GitHub App。评论进入 `Announcements` 分类，读者通过 GitHub 账号登录。评论展示以头像、用户名和内容为主。双语文章按同一个目录名关联同一个讨论串。文章的 `discussion` 缺省为 `true`，设为 `false` 时两种语言版本均关闭评论区。[评论管理](https://github.com/Nekyulin/nekyulin.github.io/discussions)

访问统计已接入 GoatCounter。首页、文章页和分类页会加载统计脚本，统计数字在登录后查看。[统计后台](https://technetium043.goatcounter.com/)

现有部署从仓库的 **Settings → Secrets and variables → Actions → Variables** 读取配置。以下是线上生效的值。

| 构建变量 | 当前值或来源 |
| --- | --- |
| `BLOG_SITE_URL` | Pages 提供的 `https://nekyulin.github.io/` |
| `GOATCOUNTER_SITE` | `technetium043` |
| `GISCUS_REPO` | 生效仓库为 `Nekyulin/nekyulin.github.io`，工作流以当前 GitHub 仓库为缺省值。 |
| `GISCUS_REPO_ID` | `R_kgDOV6WPmQ` |
| `GISCUS_CATEGORY` | `Announcements` |
| `GISCUS_CATEGORY_ID` | `DIC_kwDOV6WPmc4DL4kg` |
