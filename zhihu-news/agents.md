# agents.md · 知乎新闻（songbo17）项目开发规则

> 作者：宋博（24001011017）· 《高级网页设计I》三级项目
> 本文件是项目规则（AI 编程工具与开发者都必须遵守），对应评分项「项目规范与命名」。

## 一、命名约定

1. 所有自定义 id、class、CSS 变量、JS 变量/函数，统一以本人姓名全拼 `songbo` 开头，
   如 `songbo_nav`、`songbo_main`、`songbo_rest_get`、`SONGBO_SUPABASE_URL`，避免与全局冲突。
2. 数据库表名、字段名一律英文小写下划线：`news`、`comments`、`topics`、`users`、`favorites`。
3. JS 函数动词开头、见名知义：`songbo_load_news()`、`songbo_open_detail()`、`songbo_check_login()`。
4. 文件名一律小写 + 下划线，禁止中文文件名与中文目录名；首页固定为 `index.html`。

## 二、目录约定

```
zhihu-news-songbo17/
├── index.html / list.html / detail.html / login.html / register.html
├── profile.html / search.html / about.html      # 前台 8 页
├── admin.html / dashboard.html                  # 后台管理 + 仪表盘（单独规划）
├── css/songbo.css          # 全站唯一公共样式表（姓名全拼命名）
├── js/songbo_*.js          # 各页面脚本；js/lib/ 仅存放本地化的第三方库
├── images/                 # 本地 SVG 图片素材
├── fonts/                  # iconfont 字体文件（预留）
├── supabase/               # 数据库建表 SQL（可重建）
├── docs/                   # 接口文档、提示词记录
└── backend-llm/            # LLM 调用中间层（Express，密钥不进前端）
```

## 三、代码风格

1. 原生 HTML5 / CSS3 / JavaScript（ES6+），禁止 Vue、React、jQuery、Bootstrap、UI 组件库；
   仅允许本地化引入的 ECharts（图表）与 iconfont 字体，禁止任何 CDN 在线链接。
2. 每个文件头部注释必须包含：文件名、作者（宋博 24001011017）、创建时间、功能说明。
3. 每个页面统一结构：页头（songbo_nav）+ 主体（songbo_main）+ 页脚（songbo_footer），head 中设置 viewport。
4. 所有请求走 `js/songbo_api.js` 封装，统一处理鉴权头、控制台留证与错误提示。
5. 数据操作基于 Supabase（PostgreSQL + RESTful），主数据由数据库驱动，响应 JSON 格式统一。
6. 提交 Git 使用 `feat:` `fix:` `docs:` `style:` 前缀，禁止一次性 push。

## 四、鉴权约定

1. 登录态使用 Supabase Auth 返回的 JWT，存于 `localStorage.songbo_token`。
2. 后台管理页与仪表盘加载时先校验登录态，未登录跳转 `login.html`。
3. 写操作由数据库 RLS 拦截：anon 只读，authenticated 可写，service_role 仅服务端使用。
