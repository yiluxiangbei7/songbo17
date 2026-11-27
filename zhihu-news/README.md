# 知乎新闻 · songbo17

《高级网页设计I》三级项目 —— 知乎（题库 15 号）的模仿与制作。

> 学生：宋博（24001011017）· 计算机科学与技术专业 · 2026 年 11 月

## 一、项目概况

以「知乎」为模仿对象的新闻资讯网站（PC 端），数据驱动、前后端分离。
后端采用 BAAS 平台 Supabase（PostgreSQL + RESTful + Auth + RLS 行级安全），
前端为原生 HTML5 / CSS3 / JavaScript（ES6+），仅本地化引入 ECharts 图表库。

| 项 | 值 |
|---|---|
| 模仿对象 | 知乎（课程题库 15 号） |
| 所选端 | PC 端 |
| 后端路径 | 路径 B（BAAS：Supabase） |
| 前台页面 | 8 页（首页/列表/详情/登录/注册/我的/搜索/关于） |
| 后台页面 | 2 页（后台管理 admin + 仪表盘 dashboard） |
| 数据库 | Supabase：news / topics / comments / favorites 四张表 |
| LLM 功能 | 新闻 AI 摘要（DeepSeek，Express 中间层转发，密钥不进前端） |

## 二、技术架构

```
浏览器（原生 HTML/CSS/JS）
   │  fetch + RESTful JSON
   ├──► Supabase REST（/rest/v1/*）        新闻/话题/评论/收藏 读写
   ├──► Supabase Auth（/auth/v1/*）        注册/登录/token 保持（bcrypt 加密存储）
   └──► Express 中间层（backend-llm/） ──► DeepSeek API（AI 摘要，密钥服务端保管）
```

- 登录态：Supabase Auth JWT 存 localStorage，请求头 `Authorization: Bearer <token>`。
- 鉴权：数据库 RLS 行级安全，anon 匿名只读、authenticated 登录可写，未登录调用管理接口返回 401。

## 三、本地运行步骤

1. 前台页面：直接双击打开 `index.html` 即可（Supabase 允许跨域匿名读）。
   或启动本地静态服务：`python -m http.server 8080` 后访问 http://localhost:8080 。
2. 数据库：登录 Supabase 控制台，或使用 Management API 执行 `supabase/songbo_supabase_schema.sql`（可重复执行）。
3. AI 摘要功能（可选演示）：进入 `backend-llm/` 目录，`npm install` 后把 DeepSeek Key 写入 `.env`，
   执行 `node server.js` 启动中间层（默认 3007 端口），前端 AI 摘要按钮即可调用。

## 四、目录结构

```
zhihu-news-songbo17/
├── index.html          首页：轮播图、话题导航、新闻推荐列表
├── list.html           栏目/列表页：话题 tab 筛选、关键词过滤、分页
├── detail.html         内容/详情页：URL 传参 ?id=N、评论、收藏、AI 摘要
├── login.html          登录页：正则校验、token 保持
├── register.html       注册页：正则校验、注册接口
├── profile.html        个人中心（我的）：用户信息、我的收藏、退出登录
├── search.html         搜索结果页：关键词搜索、搜索历史（localStorage）
├── about.html          关于页：项目与技术说明
├── admin.html          后台管理：3 实体增删改查 + 搜索 + 分页（需登录）
├── dashboard.html      仪表盘：ECharts 图表（接口真实数据驱动，需登录）
├── agents.md           项目规则（命名/目录/代码风格约定）
├── css/songbo.css      全站公共样式
├── js/                 songbo_config / songbo_api / songbo_auth / 各页面脚本
├── images/             本地 SVG 素材（新闻封面 + 话题图标）
├── fonts/              iconfont 字体文件
├── supabase/           数据库建表 SQL（可重建）
├── docs/               接口文档、提示词记录
└── backend-llm/        LLM 调用中间层（Express + DeepSeek）
```

## 五、REST 接口一览（详细示例见 docs/songbo_api_docs.md）

| 接口 | 方法 | 路径 | 说明 |
|---|---|---|---|
| 新闻列表 | GET | /rest/v1/news?select=*&order=published_at.desc | 首页/列表页 |
| 新闻详情 | GET | /rest/v1/news?id=eq.{id} | 详情页 URL 传参 |
| 新闻搜索 | GET | /rest/v1/news?or=(title.ilike.*kw*,content.ilike.*kw*) | 搜索页 |
| 话题列表 | GET | /rest/v1/topics?order=sort.asc | 导航/筛选 |
| 评论列表 | GET | /rest/v1/comments?news_id=eq.{id}&order=likes.desc | 详情页 |
| 注册 | POST | /auth/v1/signup | bcrypt 加密存储 |
| 登录 | POST | /auth/v1/token?grant_type=password | 返回 JWT |
| 收藏增删 | POST/DELETE | /rest/v1/favorites | 需登录（RLS 隔离） |
| 后台增删改 | POST/PATCH/DELETE | /rest/v1/news|topics|comments | 需登录（401 拦截） |
| AI 摘要 | POST | http://localhost:3007/api/ai/summary | Express 转发 DeepSeek |
