# songbo_interface.md · 接口清单

> 按项目规则维护：接口每次变更都要追加记录，保证仅凭本文档即可复现接口。

## 1. POST /api/ai/chat —— AI 对话（核心接口）

- **方法**：POST
- **说明**：前端把含 system 设定的完整多轮上下文发给中间层，中间层转发大模型服务并返回回复。
- **请求参数**（JSON）：

```json
{
    "messages": [
        { "role": "system", "content": "你是宋博的课堂 AI 助手「小宋」…" },
        { "role": "user", "content": "你好，我叫宋博" },
        { "role": "assistant", "content": "你好宋博！…" },
        { "role": "user", "content": "我叫什么名字？" }
    ]
}
```

- **成功响应**（code = 0）：

```json
{
    "code": 0,
    "msg": "success",
    "data": {
        "reply": "你叫宋博，我们刚才聊过～",
        "model": "deepseek-ai/DeepSeek-V4-Flash",
        "usage": { "prompt_tokens": 128, "completion_tokens": 24, "total_tokens": 152 },
        "elapsed_ms": 1320
    }
}
```

- **失败响应**（code ≠ 0）：

| code | 场景 | msg 示例 |
|---|---|---|
| 1001 | messages 为空 | messages 不能为空 |
| 1002 | .env 未配置 Key | 未配置 LLM_API_KEY… |
| 2xxx | 大模型服务错误 | 大模型服务返回错误：… |
| 2002 | 网络/超时 | 请求大模型服务失败：… |

## 2. GET /api/health —— 健康检查

- **方法**：GET
- **说明**：返回服务状态、当前模型与 Key 是否已配置（只返回布尔值，不泄露 Key）。
- **成功响应**：

```json
{
    "code": 0,
    "msg": "服务正常",
    "data": {
        "status": "running",
        "model": "deepseek-ai/DeepSeek-V4-Flash",
        "key_configured": true
    }
}
```

## 变更记录

| 时间 | 变更 | 操作人 |
|---|---|---|
| 2026-11-23 | 初版：新增 /api/ai/chat 与 /api/health | 宋博 |
