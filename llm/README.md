# LLM 应用设计 · AI 聊天助手（24001011017 宋博）

《高级网页设计 I》LLM 应用设计实验：前后端分离架构调用大语言模型 API。
选题：**基础 AI 聊天**——支持多轮对话上下文的智能助手，聊天记录保留并在界面上标注轮次。

## 一、系统结构

```
浏览器（frontend，原生 HTML/CSS/JS）
    │  fetch POST /api/ai/chat  （携带完整多轮上下文）
    ▼
Express 中间层（backend/server.js）
    │  读取 backend/.env 中的 API Key，组装请求体
    ▼
大模型服务（硅基流动，OpenAI 兼容 chat/completions）
    │  返回回复文本
    ▼
中间层按统一格式 { code, msg, data } 返回 → 前端渲染 + 控制台打印
```

## 二、环境要求

- Node.js 18 及以上（本机 v22.22.2 通过验证）
- npm（可用 cnpm/pnpm 替代）
- Chrome / Edge 浏览器（F12 查看实验证据）

## 三、启动步骤

1. **配置密钥**：编辑 `backend/.env`，把 `LLM_API_KEY` 换成你在硅基流动创建的真实 Key（注册地址 https://cloud.siliconflow.cn ，「API 密钥」页面新建）。
2. **安装依赖**（首次运行）：

```bash
cd backend
npm install
```

3. **启动服务**：

```bash
node server.js
```

4. 打开浏览器访问 **http://localhost:3000**，开始对话。

## 四、配置项（backend/.env）

| 变量 | 说明 |
|---|---|
| PORT | 服务端口，默认 3000 |
| LLM_API_KEY | 大模型平台 API Key（**必须**，只保存在服务端） |
| LLM_BASE_URL | 大模型服务地址，硅基流动为 https://api.siliconflow.cn/v1 |
| LLM_MODEL | 模型名称，默认 deepseek-ai/DeepSeek-V4-Flash |

## 五、功能清单

- [x] 聊天界面：消息气泡区分用户（右）与模型（左），每轮对话标注轮次与上下文条数
- [x] 多轮对话上下文：前端维护 messages 数组（system + 全部历史），每轮整体发送
- [x] Enter 发送、Shift+Enter 换行、输入框自适应高度
- [x] 发送中加载动画，防止重复提交
- [x] 清空对话（重置上下文，保留 system 设定）
- [x] 统一响应格式 `{ code, msg, data }`，错误码映射与超时控制
- [x] **实验证据**：前端每次"键盘发送"与"接收到数据"都打印到浏览器控制台；后端把前端请求、转发体与大模型原始返回全文打印到终端
- [x] API Key 只存服务端 .env，前端代码与提交记录不含密钥

## 六、项目文档

| 文件 | 说明 |
|---|---|
| AGENTS.md | 项目规则（命名前缀、注释、记录要求） |
| songbo_prompt.md | AI 开发指令记录（时间、提示词、模型） |
| backend/songbo_interface.md | 接口清单（可复现接口） |
| backend/songbo_database.md | 数据表设计与测试 SQL（MySQL 接入用） |

## 七、实验证据采集指引（作业要求）

1. **聊天界面 ≥3 轮对话**：先说"我叫宋博"，再聊别的，最后问"我叫什么名字"——能看出模型记住了上下文。
2. **控制台证据**：按 F12 打开控制台，每次发送都会出现红色 `[键盘发送]` 与绿色 `[接收到数据]` 日志，截图即可。
3. **终端证据**：后端终端会打印完整的前端请求、转发体与大模型返回，同样可截图。
