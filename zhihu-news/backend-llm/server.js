/**
 * 文件名: server.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: AI 摘要中间层（LLM 调用）——Express 转发 DeepSeek API。
 *           DeepSeek 密钥保存在 .env（严禁提交/进前端），前端只请求本服务。
 *           响应格式与全站统一：{code, msg, data}
 * 启动方式: cd backend-llm && npm install && node server.js （默认 3007 端口）
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());               // 允许前端跨域调用
app.use(express.json());       // 解析 JSON 请求体

const SONGBO_PORT = process.env.PORT || 3007;
const SONGBO_DS_KEY = process.env.DEEPSEEK_API_KEY;      // 密钥只在服务端
const SONGBO_DS_URL = "https://api.deepseek.com/chat/completions";

/**
 * POST /api/ai/summary —— 新闻 AI 摘要
 * 请求体: { title: "新闻标题", content: "新闻正文" }
 * 响应:   { code: 0, msg: "ok", data: "200 字以内中文摘要" }
 */
app.post("/api/ai/summary", async (req, res) => {
    const { title, content } = req.body || {};
    if (!title || !content) {
        return res.json({ code: 1, msg: "参数缺失：需要 title 与 content", data: null });
    }
    if (!SONGBO_DS_KEY) {
        return res.json({ code: 1, msg: "服务端未配置 DEEPSEEK_API_KEY（.env）", data: null });
    }

    console.log("【发给大模型】摘要任务 | 标题:", title, "| 正文长度:", content.length);

    try {
        const songbo_resp = await fetch(SONGBO_DS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SONGBO_DS_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是知乎新闻的编辑助手。请把用户给出的新闻压缩成一段不超过 120 字的中文摘要，"
                            + "客观、通顺、突出重点，直接输出摘要正文，不要任何前缀和解释。"
                    },
                    { role: "user", content: `标题：${title}\n正文：${content}` }
                ],
                temperature: 0.3
            })
        });

        const songbo_data = await songbo_resp.json();
        console.log("【模型返回】", JSON.stringify(songbo_data).slice(0, 300), "…");

        if (!songbo_resp.ok) {
            return res.json({
                code: 1,
                msg: `DeepSeek 接口异常 HTTP ${songbo_resp.status}`,
                data: null
            });
        }
        const songbo_summary = songbo_data.choices?.[0]?.message?.content?.trim() || "";
        return res.json({ code: 0, msg: "ok", data: songbo_summary });
    } catch (songbo_err) {
        console.error("【DeepSeek 调用失败】", songbo_err.message);
        return res.json({ code: 1, msg: "调用 DeepSeek 失败：" + songbo_err.message, data: null });
    }
});

/** 健康检查（演示用）：GET / → 服务状态 */
app.get("/", (req, res) => {
    res.json({
        code: 0,
        msg: "AI 摘要中间层运行中",
        data: { author: "宋博 24001011017", model: "deepseek-chat", endpoints: ["POST /api/ai/summary"] }
    });
});

app.listen(SONGBO_PORT, () => {
    console.log(`【SONGBO-AI】中间层已启动: http://localhost:${SONGBO_PORT}`);
    console.log(`【SONGBO-AI】DeepSeek 密钥已加载: ${SONGBO_DS_KEY ? "是（来自 .env，不进前端）" : "否！请检查 .env"}`);
});
