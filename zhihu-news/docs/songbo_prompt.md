# songbo_prompt.md · 开发指令记录（只追加，不修改不删除）

> 记录规范：每条标明时间、使用的大模型、提示词内容。开发辅助工具：WorkBuddy（GLM 大模型）。
> 作者：宋博（24001011017）

---

## 2026-11-26 · 项目创建（数据库阶段）

### 记录 1
- 时间：2026-11-26 13:20
- 大模型：GLM（WorkBuddy）
- 提示词：用 Supabase 建一个「知乎新闻」的数据库：1. 建 3 张表，字段和类型自定，表名用英文小写；2. 给每张表开启 RLS，并加一条"允许匿名读取"的策略，写入只允许 service_role；3. 每张表插入 8 条中文模拟数据（贴合知乎新闻主题）；4. 整理表结构、字段说明和对应的 REST 接口路径；前端用原生 HTML/CSS/JavaScript，禁止第三方库、框架、CDN；目录 frontend/ 下建 css/、js/、fonts/、images/，fonts/ 存放 iconfont（如有）。

### 记录 2
- 时间：2026-11-26 14:24
- 大模型：GLM（WorkBuddy）
- 提示词：怎么文件名是sjs全部改成songbo

### 记录 3
- 时间：2026-11-26 14:32
- 大模型：GLM（WorkBuddy）
- 提示词：sjs改成songbo，影响的话不改

---

## 2026-11-27 · 三级项目开发阶段

### 记录 4
- 时间：2026-11-27 15:54
- 大模型：GLM（WorkBuddy）
- 提示词：（上传《三级项目报告2026.doc》《三级项目实验指导书.docx》《大作业-初稿参考.doc》）完成大作业三级项目

### 记录 5
- 时间：2026-11-27 16:00
- 大模型：GLM（WorkBuddy）
- 提示词：按实验指导书阶段 1 要求建项目骨架：目录 zhihu-news-songbo17/，写 agents.md（命名约定 songbo_ 前缀、目录约定、代码风格）、README.md（项目概况/技术架构/本地运行步骤），规划前台 8 页 index/list/detail/login/register/profile/search/about + 后台 admin/dashboard，全站唯一公共样式 css/songbo.css。

### 记录 6
- 时间：2026-11-27 16:05
- 大模型：GLM（WorkBuddy）
- 提示词：写全站公共 JS：songbo_config.js（Supabase 地址与 anon key）、songbo_api.js（REST GET 封装 + 通用写封装 POST/PATCH/DELETE + 控制台留证日志）、songbo_auth.js（注册/登录/登出/token 保持/页面守卫）、songbo_common.js（页头页脚动态注入、滚动吸顶+返回顶部、Toast、收藏工具 localStorage+云端同步）。

### 记录 7
- 时间：2026-11-27 16:10
- 大模型：GLM（WorkBuddy）
- 提示词：首页 index.html 要求：canvas 粒子连线背景动画（requestAnimationFrame）、轮播图取阅读量前 3 新闻（自动播放 4 秒+指示点+左右箭头，指示点带 animation 呼吸动画）、话题筛选条（点击跳列表页）、今日热榜新闻卡片列表（点击跳详情页 URL 传参）。详情页 detail.html 要求：URLSearchParams 解析 ?id=N 调详情接口按 id 加载、评论列表（外键过滤）、相关推荐（同分类排除自身）、收藏按钮（本地存储+云端 favorites 表）、AI 摘要按钮。

### 记录 8
- 时间：2026-11-27 16:15
- 大模型：GLM（WorkBuddy）
- 提示词：列表页 list.html：话题 tab 选项卡切换高亮过滤、关键词 input 实时过滤、客户端分页每页 4 条、支持 URL 传参 ?topic=话题名。搜索页 search.html：PostgREST or=ilike 模糊搜索标题/摘要/正文、搜索历史 localStorage 最多 8 条去重、点击历史词重搜、清空历史按钮。

### 记录 9
- 时间：2026-11-27 16:20
- 大模型：GLM（WorkBuddy）
- 提示词：登录页 login.html 和注册页 register.html：邮箱正则、密码强度正则（6 位以上含字母数字）、两次密码一致性校验，提交后调 Supabase Auth（signup / token?grant_type=password），JWT 存 localStorage 保持登录态，登录成功按 ?from= 参数回跳来源页。个人中心 profile.html：显示用户邮箱与注册时间、我的收藏（本地与云端 favorites 合并渲染，可取消收藏）、退出登录。

### 记录 10
- 时间：2026-11-27 16:25
- 大模型：GLM（WorkBuddy）
- 提示词：后台管理 admin.html：配置驱动管理 3 个实体（news/topics/comments），每实体列表+搜索（本地过滤）+分页（每页 5 条）+新增（POST）+编辑（PATCH）+删除（DELETE），动态弹层表单含必填校验，写请求携带登录 JWT，401 时提示并跳登录页；页面加载先 songbo_require_login() 拦截未登录。仪表盘 dashboard.html：ECharts 本地引入（js/lib/echarts.min.js 禁 CDN），统计卡片（新闻数/阅读量/评论数/话题数）+ 分类占比饼图 + 话题关注度条形图 + 阅读量折线图，全部数据来自接口真实数据。

### 记录 11
- 时间：2026-11-27 16:30
- 大模型：GLM（WorkBuddy）
- 提示词：AI 摘要中间层 backend-llm/：Express + cors + dotenv，POST /api/ai/summary 接收 {title, content}，服务端持有 DeepSeek 密钥（.env 严禁提交）转发 chat/completions 生成 120 字内中文摘要，响应统一 {code, msg, data} 格式，控制台打印【发给大模型】/【模型返回】留证；前端 AI 摘要按钮调用，未启动中间层时友好降级提示启动方式。

### 记录 12
- 时间：2026-11-27 16:35
- 大模型：GLM（WorkBuddy）
- 提示词：数据库升级：开启 mailer_autoconfirm 注册免邮箱确认；RLS 增加 authenticated 写策略（news/topics/comments FOR ALL TO authenticated）；新建 favorites 表（user_id UUID + news_id 外键级联 + UNIQUE 去重），行级隔离策略 auth.uid()=user_id；schema SQL 文档同步更新为 4 表完整可重建版；接口文档 docs/songbo_api_docs.md 写 13 个接口的请求方法、路径、参数与请求/响应示例。

### 记录 13
- 时间：2026-11-27 16:40
- 大模型：GLM（WorkBuddy）
- 提示词：（备用记录）DeepSeek 密钥失效返回 401，指导书允许"只做界面设计"，中间层保留降级提示，待申请新密钥后填入 backend-llm/.env 即可恢复 AI 摘要功能；其余功能不依赖该密钥。
