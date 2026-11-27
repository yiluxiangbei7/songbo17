# 知乎新闻 · 接口文档（songbo_api_docs.md）

> 作者：宋博（24001011017）· 《高级网页设计I》三级项目 · 2026-11-27
> 基础地址（BAAS Supabase）：`https://tvrctpnlfuuqyiuhodbr.supabase.co`
> AI 中间层地址（Express）：`http://localhost:3007`
> 所有响应为 JSON；数据接口风格接近 RESTful，写操作需登录（携带 JWT）。

## 〇、通用请求头

```
# 匿名读（未登录）
apikey: <anon key>
Authorization: Bearer <anon key>

# 登录读写（登录后，前端自动携带用户 JWT）
apikey: <anon key>
Authorization: Bearer <用户 access_token>
```

---

## 一、新闻列表接口

- **请求**：`GET /rest/v1/news?select=id,title,summary,category,author,cover_image,views,published_at&order=published_at.desc&limit=8`
- **用途**：首页"今日热榜"、列表页数据源
- **响应示例**（200，截取 1 条）：

```json
[
  {
    "id": 1,
    "title": "如何看待 AI 编程助手成为大学生标配？",
    "summary": "2026 年秋季学期调查显示，超过七成计算机相关专业学生…",
    "category": "教育",
    "author": "校园观察员",
    "cover_image": "images/songbo_cover_ai.svg",
    "views": 1284,
    "published_at": "2026-11-25T01:30:00+00:00"
  }
]
```

## 二、新闻详情接口（URL 传参）

- **请求**：`GET /rest/v1/news?select=*&id=eq.3`
- **用途**：详情页按 `?id=3` 解析后调用，返回单条完整数据（含正文，内容多于列表）
- **响应示例**（200）：

```json
[
  {
    "id": 3,
    "title": "自研浏览器内核新进展：通过全部 W3C 标准测试",
    "summary": "国产自研浏览器内核团队宣布其渲染引擎已通过 W3C 全部标准一致性测试…",
    "content": "国产自研浏览器内核团队昨日宣布，其新一代渲染引擎已通过 W3C 全部标准一致性测试…（完整正文）",
    "category": "科技",
    "author": "前端早报",
    "cover_image": "images/songbo_cover_web.svg",
    "views": 1533,
    "published_at": "2026-11-23T03:20:00+00:00"
  }
]
```

## 三、新闻搜索接口

- **请求**：`GET /rest/v1/news?or=(title.ilike.*开源*,summary.ilike.*开源*,content.ilike.*开源*)&order=views.desc`
- **用途**：搜索页关键词模糊匹配（标题/摘要/正文任一命中）
- **响应示例**（200，返回命中数组，结构同接口一，此处略）：

```json
[ { "id": 2, "title": "中国青年开发者大会落幕：开源社区一年增长 40%", "…": "…" } ]
```

## 四、话题列表接口

- **请求**：`GET /rest/v1/topics?select=id,name,followers&order=sort.asc`
- **用途**：首页/列表页话题筛选条渲染
- **响应示例**（200）：

```json
[
  { "id": 1, "name": "人工智能", "followers": 2860 },
  { "id": 2, "name": "前端开发", "followers": 1742 }
]
```

## 五、评论列表接口（外键过滤）

- **请求**：`GET /rest/v1/comments?select=nickname,content,likes,created_at&news_id=eq.1&order=likes.desc`
- **用途**：详情页展示某新闻下的评论
- **响应示例**（200）：

```json
[
  {
    "nickname": "码农老张",
    "content": "我们实验室现在的规矩是：作业思路必须自己写清楚…",
    "likes": 156,
    "created_at": "2026-11-25T02:12:00+00:00"
  }
]
```

## 六、注册接口（密码加密存储）

- **请求**：`POST /auth/v1/signup`，请求体：

```json
{ "email": "songbo17@test.com", "password": "songbo123" }
```

- **响应示例**（200，节选）：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6…",
  "token_type": "bearer",
  "user": { "id": "9f1c…", "email": "songbo17@test.com", "created_at": "2026-11-27T08:30:00Z" }
}
```

- 说明：密码由 Supabase Auth 自动 bcrypt 加密入库；未登录/注册前访问管理接口被 RLS 拦截。

## 七、登录接口（返回 JWT）

- **请求**：`POST /auth/v1/token?grant_type=password`，请求体：

```json
{ "email": "songbo17@test.com", "password": "songbo123" }
```

- **响应示例**（200，结构同注册接口的 access_token/user）。
- **失败示例**（400）：

```json
{ "error": "invalid_grant", "error_description": "Invalid login credentials" }
```

## 八、收藏新增接口（需登录）

- **请求**：`POST /rest/v1/favorites`，请求头携带用户 JWT，请求体：

```json
{ "user_id": "9f1c…（auth.uid）", "news_id": 3, "title": "自研浏览器内核新进展…" }
```

- **响应示例**（201）：返回插入后的行数组。
- **未登录响应示例**（401，RLS 拦截）：

```json
{
  "code": 42501,
  "message": "new row violates row-level security policy for table \"favorites\"",
  "hint": null
}
```

## 九、收藏取消接口（需登录）

- **请求**：`DELETE /rest/v1/favorites?user_id=eq.{uid}&news_id=eq.3`
- **响应示例**（204，无返回体）。

## 十、后台新增新闻接口（需登录）

- **请求**：`POST /rest/v1/news`，请求头携带用户 JWT，请求体：

```json
{
  "title": "测试新增新闻",
  "summary": "这是一条由后台管理新增的测试新闻摘要",
  "content": "这里是完整正文内容…",
  "category": "科技",
  "author": "songbo17",
  "cover_image": "images/songbo_cover_ai.svg",
  "views": 0
}
```

- **响应示例**（201，返回含自增 id 的完整行）：

```json
[ { "id": 9, "title": "测试新增新闻", "…": "…" } ]
```

- **未登录响应示例**（RLS 拦截，401/42501，同接口八错误结构）。

## 十一、后台修改接口（需登录）

- **请求**：`PATCH /rest/v1/news?id=eq.9`，请求体（仅传要改的字段）：

```json
{ "title": "测试新增新闻（已编辑）", "views": 66 }
```

- **响应示例**（200，返回更新后的行数组）。

## 十二、后台删除接口（需登录）

- **请求**：`DELETE /rest/v1/news?id=eq.9`
- **响应示例**（204，无返回体；其下评论由外键 ON DELETE CASCADE 级联删除）。

## 十三、AI 摘要接口（LLM 中间层，密钥不进前端）

- **请求**：`POST http://localhost:3007/api/ai/summary`，请求体：

```json
{
  "title": "如何看待 AI 编程助手成为大学生标配？",
  "content": "2026 年秋季学期一项覆盖全国 52 所高校的调查显示……"
}
```

- **成功响应示例**（200，全站统一 {code, msg, data} 格式）：

```json
{
  "code": 0,
  "msg": "ok",
  "data": "调查显示超七成高校计算机专业学生已使用 AI 编程助手；支持者认为其降低入门门槛，反对者担忧削弱基本功，教师普遍建议'先手写、再 AI 重构'。"
}
```

- **失败响应示例**（200 + 业务错误码）：

```json
{ "code": 1, "msg": "DeepSeek 接口异常 HTTP 401", "data": null }
```

---

> 接口测试建议：使用 Apifox / Postman 或浏览器 F12 Network 面板逐条验证，
> 未登录执行接口十~十二可截图 401/42501 拦截证据（对应评分项"鉴权拦截"）。
