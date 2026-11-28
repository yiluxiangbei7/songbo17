# 接口文档（songbo_api_docs.md）

> 项目：小米商城（三级项目） ｜ 作者：宋博 24001011017
> 后端：Supabase（BAAS · PostgREST）+ Express LLM 中间层
> Base URL：`https://dyowwfilqoplryrrotck.supabase.co/rest/v1`
> 公共请求头：`apikey: <anon key>`；登录后 `Authorization: Bearer <用户JWT>` 可获得写权限（RLS 控制）

## 接口一览（13 个）

| # | 接口 | 方法 | 说明 |
|---|------|------|------|
| 1 | /categories | GET | 分类列表（匿名可读） |
| 2 | /products | GET | 商品列表（支持分页/筛选/排序） |
| 3 | /products?id=eq.N | GET | 商品详情（URL 传参配合） |
| 4 | /auth/v1/signup | POST | 注册（密码 bcrypt 加密） |
| 5 | /auth/v1/token?grant_type=password | POST | 登录（返回 JWT） |
| 6 | /orders | POST | 创建订单（需登录） |
| 7 | /orders?user_id=eq.{uid} | GET | 我的订单（RLS 隔离） |
| 8 | /orders?id=eq.N | PATCH | 取消订单/改状态（需登录） |
| 9 | /products?id=eq.N | PATCH | 后台改商品/扣库存（需登录） |
| 10 | /products | POST | 后台新增商品（需登录） |
| 11 | /products?id=eq.N | DELETE | 后台删除商品（需登录） |
| 12 | localhost:3007/api/ai/advice | POST | AI 选购助手（Express→DeepSeek） |
| 13 | localhost:3007/ | GET | AI 中间层健康检查 |

---

## 1. GET /rest/v1/categories —— 分类列表

**请求示例：**
```
GET /rest/v1/categories?select=*&order=sort.asc
apikey: <anon key>
Authorization: Bearer <anon key>
```

**响应示例（200）：**
```json
[
  { "id": 1, "name": "手机", "icon": "images/songbo_cat_1.svg", "sort": 1, "created_at": "2026-11-28T02:20:11.123+00:00" },
  { "id": 2, "name": "电视", "icon": "images/songbo_cat_2.svg", "sort": 2, "created_at": "2026-11-28T02:20:11.123+00:00" }
]
```

## 2. GET /rest/v1/products —— 商品列表（筛选/排序/分页）

**请求示例（价格区间 + 关键词 + 排序）：**
```
GET /rest/v1/products?select=*&price=gte.1000&price=lte.2999&name=ilike.*K80*&order=price.asc
```

**响应示例（200）：**
```json
[
  {
    "id": 3, "name": "Redmi K80 Pro", "category_id": 1,
    "price": 2999.0, "old_price": 3299.0, "stock": 154, "sales": 8930,
    "cover": "images/songbo_p3.svg", "brief": "骁龙8 Gen3 · 2K直屏 · 120W秒充",
    "hot": true, "created_at": "2026-11-28T02:20:11.4+00:00"
  }
]
```

## 3. GET /rest/v1/products?id=eq.1 —— 商品详情

**请求示例：** `GET /rest/v1/products?select=*&id=eq.1`

**响应示例（200）：** 同上结构，返回 id=1 的「小米15 Ultra」完整字段。

## 4. POST /auth/v1/signup —— 注册

**请求示例：**
```json
POST /auth/v1/signup
{ "email": "newuser@test.com", "password": "abc123" }
```

**响应示例（200）：**
```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIs...", "token_type": "bearer",
  "user": { "id": "6f2a…", "email": "newuser@test.com", "role": "authenticated" }
}
```
> 密码由 Supabase Auth 自动 bcrypt 加密存储（评分项：密码加密）。

## 5. POST /auth/v1/token?grant_type=password —— 登录

**请求示例：**
```json
{ "email": "songbo17@test.com", "password": "songbo123" }
```

**响应示例（200）：** 同注册结构，`access_token` 为 JWT，前端存入 localStorage 保持登录态。
**失败响应（400）：** `{ "error": "invalid_grant", "error_description": "Invalid login credentials" }`

## 6. POST /rest/v1/orders —— 创建订单（需登录）

**请求示例：**
```json
POST /rest/v1/orders
Authorization: Bearer <用户JWT>
{
  "product_name": "小米15 Ultra", "qty": 1, "total": 6499.0,
  "status": "已支付", "receiver": "宋博", "phone": "13800000001",
  "address": "北京市海淀区学院路1号",
  "user_id": "6f2a…", "user_email": "songbo17@test.com"
}
```

**响应示例（201）：** 返回新建订单行（含 id）。
**未登录响应（401）：** `{ "code": "42501", "message": "new row violates row-level security policy for table \"orders\"" }`

## 7. GET /rest/v1/orders?user_id=eq.{uid} —— 我的订单

**请求示例：** `GET /rest/v1/orders?select=*&user_id=eq.6f2a…&order=id.desc`（携带用户 JWT）

**响应示例（200）：** 仅返回该用户自己的订单数组（RLS 行级隔离）。
**匿名调用（200）：** 返回空数组 `[]`（RLS 拦截，读不到任何行）。

## 8. PATCH /rest/v1/orders?id=eq.3 —— 取消订单

**请求示例：**
```json
PATCH /rest/v1/orders?id=eq.3
Authorization: Bearer <用户JWT>
{ "status": "已取消" }
```

**响应示例（204）：** 无响应体。个人中心「取消订单」按钮即调用此接口。

## 9-11. 后台管理 CRUD（需登录，JWT 由登录获得）

**新增（POST /rest/v1/products）：**
```json
{ "name": "测试商品", "category_id": 1, "price": 999, "stock": 10, "sales": 0, "cover": "images/songbo_p1.svg", "brief": "测试", "hot": false }
```
**响应：201** 返回新行；**未登录：401（42501 RLS 拦截）**

**修改（PATCH /rest/v1/products?id=eq.3）：**
```json
{ "price": 2899, "stock": 150 }
```
**响应：204** 无响应体。前端下单成功后同接口扣库存（stock-1 / sales+1）。

**删除（DELETE /rest/v1/products?id=eq.3）：** 响应 204；admin.html 的删除按钮调用，弹窗二次确认。

## 12. POST localhost:3007/api/ai/advice —— AI 选购助手

**请求示例：**
```json
{ "budget": "3000元", "usage": "玩原神和刷视频" }
```

**响应示例（200）：**
```json
{ "code": 0, "msg": "ok", "data": "推荐 Redmi K80 Pro：骁龙8 Gen3 性能足够流畅运行原神，2K 直屏观感出色，2999 元正好在你的预算内，剩余空间还可搭配一款手环…（≤120字）" }
```
> 链路：前端 → Express 中间层（密钥在 .env）→ DeepSeek API → 回传推荐语。中间层未启动时前端优雅提示。

## 13. GET localhost:3007/ —— 中间层健康检查

**响应示例（200）：**
```json
{ "code": 0, "msg": "AI 选购助手中间层运行中", "data": { "author": "宋博 24001011017", "model": "deepseek-chat", "endpoints": ["POST /api/ai/advice"] } }
```
