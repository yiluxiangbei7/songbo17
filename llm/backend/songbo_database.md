# songbo_database.md · 数据表设计

> 当前版本：聊天上下文由前端 messages 数组维护（满足课堂演示与多轮对话要求）。
> 本文档为**数据库设计稿**：按实验指导书要求预先设计会话表与消息表，后续接入 MySQL 8.0 时直接执行下方 SQL 即可，保证仅凭文档即可重建数据库。

## 1. 会话表 sjs_sessions

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT PK | 会话 ID |
| title | VARCHAR(100) | 会话标题（默认取首轮提问前 20 字） |
| summary | TEXT | 早期消息压缩后的摘要（上下文压缩写入处） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 最近活跃时间 |

## 2. 消息表 sjs_messages

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT PK | 消息 ID |
| session_id | BIGINT UNSIGNED | 所属会话（逻辑外键 → sjs_sessions.id） |
| role | ENUM('system','user','assistant') | 消息角色 |
| content | TEXT | 消息内容 |
| tokens | INT UNSIGNED | 该消息消耗的 token 数（大模型 usage 回传） |
| created_at | DATETIME | 落库时间 |

## 3. 建表 SQL

```sql
CREATE DATABASE IF NOT EXISTS sjs_llm DEFAULT CHARSET utf8mb4;

USE sjs_llm;

CREATE TABLE sjs_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL DEFAULT '新会话',
    summary TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sjs_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    role ENUM('system','user','assistant') NOT NULL,
    content TEXT NOT NULL,
    tokens INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 4. 测试数据（8 条）

```sql
INSERT INTO sjs_sessions (id, title) VALUES (1, '第一次对话：上下文测试');

INSERT INTO sjs_messages (session_id, role, content, tokens) VALUES
(1, 'system',    '你是宋博的课堂 AI 助手「小宋」。请使用简体中文回答，语气友好简洁。', 42),
(1, 'user',      '你好，我叫宋博，学号 24001011017', 18),
(1, 'assistant', '你好宋博！很高兴认识你，有什么我可以帮你的吗？', 21),
(1, 'user',      '我今天想做一个 AI 聊天页面', 14),
(1, 'assistant', '好主意！建议用消息气泡区分用户和模型，用 Enter 发送消息。', 26),
(1, 'user',      '我叫什么名字？', 7),
(1, 'assistant', '你叫宋博，学号 24001011017，我们开场时你介绍过～', 22),
(1, 'user',      '那帮我把这个页面起个名字', 12);
```

## 变更记录

| 时间 | 变更 | 操作人 |
|---|---|---|
| 2026-11-23 | 初版：会话表 + 消息表设计与测试数据 | 宋博 |
