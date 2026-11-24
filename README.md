# Nekyulin's Library

## 发文章

把一篇文章放在 `posts/` 下的一个文件夹中。

```text
posts/
  my-post/
    meta.json
    index.md
    assets/
      diagram.png
```

正文写在 `index.md`。行内公式用 `$...$`，独立公式用各自单独成行的 `$$` 包围。配图用 `![图注](./assets/diagram.png)`，其他附件也可以放进 `assets/`，通过普通 Markdown 链接引用。文件夹名决定文章网址，如 `/posts/my-post/`。

### `meta.json` 属性

| 属性 | 类型 | 填写方式 |
| --- | --- | --- |
| `title` | 字符串 | 必填。`index.md` 的标题。 |
| `date` | 字符串 | 必填。发布日期，例如 `"2026-11-23"`。两种语言共用同一个日期。列表按界面语言显示，文章页按正文版本显示。 |
| `summary` | 字符串 | 可省略。显示在文章列表中。如果是双语文章，两种语言的摘要同时填写或同时省略。 |
| `lang` | 字符串 | `index.md` 的语言。中文为 `"zh-CN"`，英文为 `"en"`，省略时按中文处理。 |
| `tag` | 字符串 | 可省略。每篇最多一个，填写根目录 [`tags.json`](tags.json) 里的标签 ID，例如 `"writing"`。 |
| `pinned` | 布尔值 | `true` 表示置顶，省略时为 `false`。置顶文章右侧显示图钉。 |
| `pinPriority` | 整数 | 置顶时使用，数值越大越靠前，省略时为 `0`。同优先级按发布日期倒序。普通文章也按发布日期倒序。 |
| `discussion` | 布尔值 | 省略时为 `true`，显示文章评论区。设为 `false` 时关闭该文章的评论区，适用于所有语言版本。全站评论须先完成配置。 |
| `translation` | 对象 | 可省略。包含另一语言的 `title`，以及对应的 `summary`。 |

**最简写法**

```json
{
  "title": "一篇文章",
  "date": "2026-11-23"
}
```

**双语置顶文章**

```json
{
  "title": "写作笔记",
  "date": "2026-11-23",
  "summary": "记录写作中的一些经验。",
  "lang": "zh-CN",
  "tag": "writing",
  "pinned": true,
  "pinPriority": 10,
  "discussion": true,
  "translation": {
    "title": "Writing Notes",
    "summary": "A few things I learned while writing."
  }
}
```

这个例子的中文正文放在 `index.md`，英文正文放在同目录的 `index.en.md`。如果 `index.md` 是英文，填写 `"lang": "en"`，把 `translation` 写成中文，并把中文正文放在 `index.zh-CN.md`。两个版本共用 `assets/`、日期、标签和置顶设置。文章左上角的翻译按钮用来切换正文版本，文章列表随网站语言切换标题、摘要和正文入口。

### 统一标签

每个分类只在 `tags.json` 里定义一次。比如「写作 / Writing」定义成下面这样，相关文章都填 `"tag": "writing"`。

```json
{
  "writing": {
    "zh-CN": "写作",
    "en": "Writing"
  }
}
```

同一个分类出现不同拼写或译名时，选定一对中英文名称，让文章复用同一个 ID。以后改显示名称，只需改 `tags.json`。新建标签时使用小写英文字母、数字和连字符作为 ID，并填写两种名称。中英文任一名称复用都会在构建时提示。点击标签可查看该分类下的全部文章，首页和标签列表都随滚动分批加载。

将文件夹提交并推送到 GitHub 的 `main` 分支。GitHub Actions 会重新生成网站并发布。

## 首次部署

将项目推送到 `main`。如果希望主页使用 `https://用户名.github.io/`，GitHub 仓库命名为 `用户名.github.io`。在仓库的 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。如果首次推送时 Pages 还没启用，在 **Actions → Deploy blog to GitHub Pages** 点击 **Run workflow** 即可启动第一次构建及发布。

## 浏览统计和评论

在 GitHub 仓库的 **Settings → Secrets and variables → Actions → Variables** 添加下面的变量，然后重新运行发布工作流。

- **浏览统计**。在 [GoatCounter](https://www.goatcounter.com/) 注册一个站点，将 `站点名.goatcounter.com` 的 `站点名` 填入 `GOATCOUNTER_SITE`。登录 GoatCounter 查看首页和各文章页的统计。保持公开仪表板和 **Allow adding visitor counts on your website** 关闭。
- **文章评论**。为公开仓库启用 Discussions，给该仓库安装 [giscus GitHub App](https://github.com/apps/giscus)。在 [giscus 配置页](https://giscus.app/zh-CN) 选择仓库和讨论分类，将生成配置里的 `data-repo-id`、`data-category` 和 `data-category-id` 分别填入 `GISCUS_REPO_ID`、`GISCUS_CATEGORY` 和 `GISCUS_CATEGORY_ID`。如果讨论放在另一个仓库，再把 `data-repo` 填入 `GISCUS_REPO`。文章目录名是评论的关联键，改目录名会关联到新的讨论。

## 本地预览

构建使用 Node.js 24，预览命令另外使用 Python 3。

```sh
npm ci
npm run build
npm run preview
```

在浏览器打开 `http://127.0.0.1:8000/`。文章修改后重新运行 `npm run build`，再刷新网页。
