# 项目规则（agents.md）—— 小米商城 · 三级项目

> 本文件是全项目的开发规则，所有页面/脚本/文档都必须遵守。
> 作者：宋博 24001011017 计算机24010 ｜ 选题：题库 34 号 · 小米商城

## 1. 命名规范（评分项）
- 所有自定义 CSS 类名、JS 变量/函数名、ID 一律以 **`songbo_`** 开头（姓名"宋博"全拼）。
- 页面文件名语义化小写：index / list / detail / cart / login / register / profile / about / admin / dashboard。
- 数据库表名英文小写复数：**categories / products / orders**。

## 2. 原生代码（评分项）
- 前端只用原生 HTML / CSS / JavaScript，**禁止 jQuery / Vue / React / Bootstrap / CDN**。
- 允许的第三方库（经教师审核的指导书清单）：**ECharts、Swiper、animate.css**，且必须**下载到本地 `js/lib/` 引入**，本项目使用 ECharts（仅仪表盘）。
- 所有图片（images/*.svg）、CSS、JS、字体均为本地资源，不请求外网。

## 3. 后端（BAAS 路径 B）
- 数据库与鉴权使用 **Supabase**（BAAS），REST 接口为 PostgREST 风格。
- RLS 行级安全：categories / products 匿名只读、登录可写；orders 仅登录读写（匿名被 42501/401 拦截）。
- 注册/登录走 Supabase Auth：密码 bcrypt 加密存储（评分项），JWT 存 localStorage 保持登录态。

## 4. LLM 调用（评分项）
- "AI 选购助手"通过 **Express 中间层**（backend-llm/）转发 DeepSeek API。
- **密钥只存在服务端 .env，严禁写进前端代码、严禁提交到 Git**（.env 已加入 .gitignore）。
- 响应统一格式 `{code, msg, data}`。

## 5. Git 规范（评分项）
- 托管平台：GitHub + Gitee 双远程。
- **分批提交，禁止一次性 push**：feat(功能) / docs(文档) / chore(杂务) 前缀。
- 提交信息格式：`feat: 模块-功能简述`。

## 6. 文档规范
- docs/songbo_api_docs.md：接口文档（每个接口含请求方法/参数/请求示例/响应示例）。
- docs/songbo_prompt.md：AI 提示词记录，**≥10 条**，每条含时间/模型/提示词（评分项）。
- supabase/songbo_supabase_schema.sql：数据库完整可重建脚本。

## 7. 交互与动画清单（评分项）
- JS 效果 ≥6：轮播图 / tab 分类筛选 / 价格区间与排序 / 关键词过滤 / 客户端分页 / 购物车(localStorage) / 表单正则校验 / 滚动监听(吸顶+返回顶部) / 手风琴 FAQ。
- 动画 ≥3 处且覆盖 ≥2 种方式：transition(卡片悬停) / animation(轮播指示点呼吸+Toast) / canvas(首页粒子连线)。

## 8. 测试账号
- songbo17@test.com / songbo123（Supabase Auth，注册免邮箱确认已开启）。
