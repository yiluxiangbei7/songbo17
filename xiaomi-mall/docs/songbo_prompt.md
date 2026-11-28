# AI 提示词记录（songbo_prompt.md）

> 项目：小米商城（三级项目） ｜ 作者：宋博 24001011017
> 记录规范（评分项）：≥10 条，每条含 时间 / 模型 / 提示词内容。
> 使用工具：WorkBuddy（GLM 大模型编程助手）；AI 产品调用：DeepSeek（deepseek-chat）。

---

## 1. 2026-11-28 10:30 · GLM（WorkBuddy）
**提示词**：我的《高级网页设计I》三级项目要模仿小米商城（题库34号）做一个电商网站，请帮我设计项目结构：10个页面（首页/列表/详情/购物车/登录/注册/我的/关于/后台/仪表盘）、Supabase 三张表（categories/products/orders）和 RLS 策略，并说明每页对应哪些评分点。
**产出**：项目结构与数据库设计方案（agents.md / README.md 雏形）。

## 2. 2026-11-28 10:45 · GLM（WorkBuddy）
**提示词**：写一份 agents.md 项目规则文件，要求包含：songbo_ 前缀命名规范、原生代码禁止 CDN、Supabase BAAS 说明、LLM 密钥不进前端、Git 分批提交规范、JS效果与动画清单。
**产出**：agents.md。

## 3. 2026-11-28 10:52 · GLM（WorkBuddy）
**提示词**：为小米商城写全站公共样式 songbo.css，小米橙 #ff6700 主题，包含导航/轮播/商品卡片/表单/后台表格/仪表盘/购物车/Toast/返回顶部，动画要覆盖 transition 和 animation 两种方式，命名全部用 songbo_ 前缀。
**产出**：css/songbo.css。

## 4. 2026-11-28 11:05 · GLM（WorkBuddy）
**提示词**：用 Python 批量生成 SVG：1个商城logo、3张1600×480轮播banner（新品/家电节/以旧换新，带插画和文案）、8个分类线性图标（手机/电视/笔记本/平板/穿戴/家电/影音/配件）、14张商品图（手机/电视/笔记本/平板/手表/手环/空调/耳机/净水器/充电宝），全部保存到 images/ 目录。
**产出**：images/ 下 26 张本地 SVG（评分项：图标方案 SVG ≥3 处、本地资源）。

## 5. 2026-11-28 11:20 · GLM（WorkBuddy）
**提示词**：写首页 index.html + songbo_index.js：3图自动轮播（圆点+箭头+悬停暂停）、从 Supabase categories 渲染分类导航、products 渲染爆款和新品、卡片快捷加购、canvas 粒子连线背景动画。
**产出**：index.html / js/songbo_index.js（轮播图、canvas 动画两个评分点）。

## 6. 2026-11-28 11:32 · GLM（WorkBuddy）
**提示词**：写商品列表页：URL 传参 ?cat= 接收首页分类跳转、分类 tab、价格区间下拉筛选、价格/销量排序、关键词模糊过滤、客户端分页每页8条。
**产出**：list.html / js/songbo_list.js（tab/过滤/排序/分页四个 JS 效果）。

## 7. 2026-11-28 11:45 · GLM（WorkBuddy）
**提示词**：写商品详情页：URLSearchParams 解析 ?id= 加载商品（评分项：URL传参），规格参数表、加入购物车、立即购买（未登录拦截到 login.html?from=，弹窗表单校验后 POST orders 并 PATCH 扣库存），再加一个 AI 选购助手卡片调 localhost:3007/api/ai/advice。
**产出**：detail.html / js/songbo_detail.js。

## 8. 2026-11-28 11:55 · GLM（WorkBuddy）
**提示词**：写购物车页 cart.html：localStorage 渲染、数量加减与删除、合计、去结算（未登录拦截、收货信息校验、逐商品下单扣库存、清空购物车跳转我的订单）。
**产出**：cart.html / js/songbo_cart.js（本地存储 JS 效果 + 完整下单闭环）。

## 9. 2026-11-28 12:05 · GLM（WorkBuddy）
**提示词**：写登录/注册/个人中心三页：正则表单校验（邮箱格式/密码强度/两次一致）、Supabase Auth 注册登录（bcrypt 加密、JWT 存 localStorage）、?from= 回跳来源页；个人中心按 user_id 查询我的订单（RLS 隔离）并可取消订单。
**产出**：login/register/profile.html 与对应 js（鉴权与状态保持评分点）。

## 10. 2026-11-28 12:18 · GLM（WorkBuddy）
**提示词**：写后台 admin.html：商品/分类/订单三实体增删改查+关键词搜索+分页，动态表单弹窗复用，页面守卫拦截未登录。
**产出**：admin.html / js/songbo_admin.js（后台管理评分点）。

## 11. 2026-11-28 12:26 · GLM（WorkBuddy）
**提示词**：写仪表盘 dashboard.html + songbo_dashboard.js：统计卡片（商品数/库存/订单数/销售额）+ ECharts 三图（分类占比饼图/销量TOP8条形图/价格分布折线图），ECharts 从 js/lib 本地引入，数据来自 Supabase 真实接口。
**产出**：dashboard.html / js/songbo_dashboard.js（图表评分点）。

## 12. 2026-11-28 12:33 · GLM（WorkBuddy）
**提示词**：把 Express 中间层改造成 AI 选购助手：POST /api/ai/advice 接收预算和用途，system prompt 内置商城在售清单，调用 DeepSeek 返回 ≤120 字推荐，密钥读 .env，响应统一 {code,msg,data}。
**产出**：backend-llm/server.js（LLM 调用评分点）。

## 13. 2026-11-28 12:40 · DeepSeek（deepseek-chat）
**提示词**（用户侧实际请求，经中间层转发）：预算：3000元，用途：玩原神和刷视频。你是小米商城的 AI 选购助手，从在售商品中推荐最合适的一款并说明理由。
**产出**：AI 推荐语（验证 /api/ai/advice 全链路）。

## 14. 2026-11-28 12:48 · GLM（WorkBuddy）
**提示词**：生成数据库可重建 SQL（三表+RLS+种子数据）与接口文档（13个接口含请求响应示例），格式规范可直接提交。
**产出**：supabase/songbo_supabase_schema.sql / docs/songbo_api_docs.md（文档评分点）。
