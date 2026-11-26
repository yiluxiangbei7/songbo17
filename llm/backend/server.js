/**
 * 作者：宋博
 * 建立时间：2026-11-23
 * 使用模型：GLM-5.3-Flash
 * 功能名称：Express 中间层服务（backend/server.js）
 * 简介：前后端分离架构下的 LLM 代理层——前端请求 /api/ai/chat，本服务从 .env 读取
 *       API Key、组装请求体并转发至大模型服务（OpenAI 兼容 chat/completions 接口），
 *       再按统一格式 { code, msg, data } 返回；请求与响应全文打印到终端作为实验证据。
 */

const sjs_express = require("express");
const sjs_cors = require("cors");
const sjs_path = require("path");

// dotenv：把 backend/.env 中的 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL 读进 process.env
require("dotenv").config();

const sjs_app = sjs_express();
const sjs_port = process.env.PORT || 3000;

// ===== 中间件 =====
// 允许所有来源跨域（实验要求）
sjs_app.use(sjs_cors());
// 解析 JSON 请求体，上限 1MB（足够容纳多轮对话上下文）
sjs_app.use(sjs_express.json({ limit: "1mb" }));
// 托管 frontend 目录：启动后直接访问 http://localhost:3000 即可打开聊天页
sjs_app.use(sjs_express.static(sjs_path.join(__dirname, "..", "frontend")));

/**
 * 统一成功响应
 * @param {object} sjs_res Express 响应对象
 * @param {object} sjs_data data 字段内容
 * @param {string} sjs_msg 提示信息
 * @returns {void}
 */
function sjs_ok(sjs_res, sjs_data, sjs_msg) {
    sjs_res.json({ code: 0, msg: sjs_msg || "success", data: sjs_data || {} });
}

/**
 * 统一失败响应
 * @param {object} sjs_res Express 响应对象
 * @param {number} sjs_code 业务错误码（非 0）
 * @param {string} sjs_msg 错误提示
 * @param {number} sjs_http HTTP 状态码
 * @returns {void}
 */
function sjs_fail(sjs_res, sjs_code, sjs_msg, sjs_http) {
    sjs_res.status(sjs_http || 500).json({ code: sjs_code, msg: sjs_msg, data: {} });
}

// ===== 健康检查 =====
sjs_app.get("/api/health", function (sjs_req, sjs_res) {
    sjs_ok(sjs_res, {
        status: "running",
        model: process.env.LLM_MODEL || "(未配置 LLM_MODEL)",
        key_configured: Boolean(process.env.LLM_API_KEY && /^[\x21-\x7E]+$/.test(process.env.LLM_API_KEY))
    }, "服务正常");
});

// ===== 核心：AI 对话接口 =====
// 流程：前端 fetch → 本路由校验/组装 → fetch 转发大模型 → 统一格式返回
sjs_app.post("/api/ai/chat", async function (sjs_req, sjs_res) {
    const sjs_start = Date.now();

    // 1.【实验证据】把前端发来的请求体完整打印到终端
    console.log("\n========== [前端请求] " + new Date().toLocaleTimeString("zh-CN") + " ==========");
    console.log(JSON.stringify(sjs_req.body, null, 2));

    // 2. 校验 messages 数组（前端会把含 system 的完整上下文发来）
    const sjs_messages = sjs_req.body && Array.isArray(sjs_req.body.messages) ? sjs_req.body.messages : null;
    if (!sjs_messages || sjs_messages.length === 0) {
        return sjs_fail(sjs_res, 1001, "messages 不能为空", 400);
    }

    // 3. 校验 .env 配置：Key 必须是可见 ASCII 字符（防止把中文占位符当真 Key 用）
    const sjs_key = process.env.LLM_API_KEY || "";
    if (!sjs_key || !/^[\x21-\x7E]+$/.test(sjs_key)) {
        return sjs_fail(sjs_res, 1002, "LLM_API_KEY 未正确配置，请在 backend/.env 中填入真实 Key 后重启服务", 500);
    }

    // 4. 组装转发请求体（OpenAI 兼容 chat/completions 协议）
    const sjs_url = (process.env.LLM_BASE_URL || "https://api.siliconflow.cn/v1") + "/chat/completions";
    const sjs_model = process.env.LLM_MODEL || "deepseek-ai/DeepSeek-V4-Flash";
    const sjs_payload = {
        model: sjs_model,
        messages: sjs_messages, // 多轮上下文原样透传
        temperature: 0.7,
        stream: false
    };

    // 【实验证据】按实验要求打印"发给大模型"的完整请求载荷（模型名 + messages 上下文）
    console.log("\n>>>>>> 【发给大模型】POST " + sjs_url);
    console.log(">>>>>> 【发给大模型】请求载荷：");
    console.log(JSON.stringify(sjs_payload, null, 2));

    try {
        // 5. 转发请求（60 秒超时控制）
        const sjs_resp = await fetch(sjs_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.LLM_API_KEY // Key 只出现在服务端
            },
            body: JSON.stringify(sjs_payload),
            signal: AbortSignal.timeout(60000)
        });

        const sjs_raw = await sjs_resp.json();

        // 6.【实验证据】把大模型返回的原始数据完整打印到终端
        console.log("\n<<<<<< 【模型返回】HTTP " + sjs_resp.status + " · 耗时 " + (Date.now() - sjs_start) + "ms");
        console.log("<<<<<< 【模型返回】原始数据：");
        console.log(JSON.stringify(sjs_raw, null, 2));
        console.log("========== [大模型返回] 处理结束 ==========");

        // 7. 错误码映射：把大模型服务的错误翻译成统一格式
        if (!sjs_resp.ok) {
            const sjsErrMsg = (sjs_raw.error && sjs_raw.error.message) || ("HTTP " + sjs_resp.status);
            return sjs_fail(sjs_res, 2000 + sjs_resp.status, "大模型服务返回错误：" + sjsErrMsg, 502);
        }

        // 8. 提取回复文本（choices[0].message.content），连同用量信息一起返回
        const sjs_reply = sjs_raw.choices && sjs_raw.choices[0] && sjs_raw.choices[0].message
            ? sjs_raw.choices[0].message.content
            : "";
        if (!sjs_reply) {
            return sjs_fail(sjs_res, 2001, "大模型返回了空回复", 502);
        }

        sjs_ok(sjs_res, {
            reply: sjs_reply,
            model: sjs_model,
            usage: sjs_raw.usage || null,       // token 用量（上下文管理用）
            elapsed_ms: Date.now() - sjs_start  // 本轮耗时
        });
    } catch (sjs_err) {
        // 网络/超时等异常兜底
        console.error("========== [异常] ==========");
        console.error(sjs_err);
        sjs_fail(sjs_res, 2002, "请求大模型服务失败：" + sjs_err.message, 504);
    }
});

// ===== 启动服务 =====
sjs_app.listen(sjs_port, function () {
    console.log("==============================================");
    console.log("  宋博 songbo17 · LLM 应用设计实验 · 中间层已启动");
    console.log("  聊天页面: http://localhost:" + sjs_port);
    console.log("  健康检查: http://localhost:" + sjs_port + "/api/health");
    console.log("  当前模型: " + (process.env.LLM_MODEL || "(未配置)"));
    console.log("  API Key:  " + (process.env.LLM_API_KEY ? "已配置 ✓" : "未配置 ✗（请填写 backend/.env）"));
    console.log("==============================================");
});
