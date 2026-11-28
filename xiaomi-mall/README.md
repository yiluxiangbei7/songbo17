# 小米商城（songbo17 版）

《高级网页设计I》三级项目 ｜ 模仿 **小米商城**（题库 34 号）从零制作 ｜ 作者：宋博 24001011017 计算机24010

## 技术方案

| 项 | 说明 |
|---|---|
| 选题 | 题库 34 号 · 小米商城 |
| 前端 | 原生 HTML/CSS/JS（无框架、无 CDN），10 个页面 |
| 后端 | 路径 B · Supabase（BAAS）+ PostgREST RESTful 接口 |
| 数据库 | categories / products / orders 三表，RLS 行级安全 |
| 鉴权 | Supabase Auth（bcrypt 密码加密 + JWT 保持登录态） |
| LLM | DeepSeek AI 选购助手（Express 中间层，密钥不出服务端） |
| 图表 | ECharts（本地 js/lib/echarts.min.js） |
| 托管 | GitHub + Gitee 双平台 |

## 页面清单（10 个）

| 页面 | 文件 | 核心点 |
|---|---|---|
| 首页 | index.html | 轮播 banner、分类导航、爆款/新品、canvas 粒子动画 |
| 商品列表 | list.html | URL 传参分类、价格区间、排序、关键词过滤、分页 |
| 商品详情 | detail.html | **URL 传参 ?id=**、规格参数、加购/立即购买、AI 选购助手 |
| 购物车 | cart.html | localStorage 购物车、数量增减、勾选结算 |
| 登录 / 注册 | login.html / register.html | 正则校验、Auth、token 保持、?from 回跳 |
| 个人中心 | profile.html | 我的订单（RLS 按 user_id 隔离）、取消订单 |
| 关于 | about.html | 品牌介绍、FAQ 手风琴 |
| 后台管理 | admin.html | 三实体增删改查+搜索+分页，未登录拦截 |
| 数据仪表盘 | dashboard.html | ECharts：分类占比/销量 TOP/价格分布，真实数据 |

## 目录结构

```
xiaomi-mall-songbo17/
├── index/list/detail/cart/login/register/profile/about/admin/dashboard .html
├── css/songbo.css            # 全站唯一公共样式（姓名全拼命名）
├── js/
│   ├── songbo_config.js      # Supabase 地址与 anon key
│   ├── songbo_api.js         # REST 封装（请求留证）
│   ├── songbo_auth.js        # 注册/登录/JWT/页面守卫
│   ├── songbo_common.js      # 页头页脚注入/购物车/滚动监听/Toast
│   ├── songbo_页面名.js      # 每页一个脚本
│   └── lib/echarts.min.js    # 本地 ECharts
├── images/                   # 全部本地 SVG（banner/商品图/分类图标）
├── backend-llm/              # AI 选购助手 Express 中间层（密钥在 .env，不入库）
├── supabase/songbo_supabase_schema.sql   # 数据库可重建脚本
├── docs/                     # 接口文档 / 提示词记录
└── agents.md                 # 项目规则
```

## 本地运行

1. 前端：直接双击 `index.html`，或 `python -m http.server 8090` 后访问 `http://localhost:8090`。
2. AI 助手（可选）：`cd backend-llm && npm install && node server.js`，默认 3007 端口；在 `.env` 配置 `DEEPSEEK_API_KEY`。
3. 测试账号：`songbo17@test.com / songbo123`。

> 开发规则见 agents.md；接口与提示词记录见 docs/。
