/**
 * 文件名: server.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: AI 选购助手中间层（LLM 调用评分项）——Express 转发 DeepSeek API。
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

/* 商城在售商品清单（与 Supabase products 表同步，供模型推荐时参考） */
const SONGBO_CATALOG = [
    "小米15 Ultra 6499元(徕卡四摄/旗舰)", "小米15 4499元(小屏旗舰)",
    "Redmi K80 Pro 2999元(性价比旗舰)", "Redmi Turbo 4 Pro 1999元(长续航)",
    "小米电视 Mini LED 55英寸 2799元", "Redmi 智能电视 A32 699元",
    "RedmiBook 16 2025 3699元(轻薄本)", "小米平板7 Pro 2599元",
    "小米Watch S4 999元(智能手表)", "小米手环9 249元",
    "米家空调 1.5匹 2299元", "小米Buds 5 Pro 1299元(降噪耳机)",
    "小米净水器 1200G 2999元", "小米充电宝 10000mAh 129元"
];

/**
 * POST /api/ai/advice —— AI 选购助手
 * 请求体: { budget: "3000元", usage: "玩原神和刷视频" }
 * 响应:   { code: 0, msg: "ok", data: "120 字以内中文推荐语" }
 */
app.post("/api/ai/advice", async (req, res) => {
    const { budget, usage } = req.body || {};
    if (!budget || !usage) {
        return res.json({ code: 1, msg: "参数缺失：需要 budget 与 usage", data: null });
    }
    if (!SONGBO_DS_KEY) {
        return res.json({ code: 1, msg: "服务端未配置 DEEPSEEK_API_KEY（.env）", data: null });
    }

    console.log("【发给大模型】选购咨询 | 预算:", budget, "| 用途:", usage);

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
                        content: "你是小米商城的 AI 选购助手。根据用户的预算和用途，从下列在售商品中推荐最合适的一款并说明理由，"
                            + "不超过 120 字，语气友好，直接输出推荐正文，不要罗列清单和任何前缀。\n在售商品：\n" + SONGBO_CATALOG.join("\n")
                    },
                    { role: "user", content: `预算：${budget}\n用途：${usage}` }
                ],
                temperature: 0.4
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
        const songbo_advice = songbo_data.choices?.[0]?.message?.content?.trim() || "";
        return res.json({ code: 0, msg: "ok", data: songbo_advice });
    } catch (songbo_err) {
        console.error("【DeepSeek 调用失败】", songbo_err.message);
        return res.json({ code: 1, msg: "调用 DeepSeek 失败：" + songbo_err.message, data: null });
    }
});

/** 健康检查（演示用）：GET / → 服务状态 */
app.get("/", (req, res) => {
    res.json({
        code: 0,
        msg: "AI 选购助手中间层运行中",
        data: { author: "宋博 24001011017", model: "deepseek-chat", endpoints: ["POST /api/ai/advice"] }
    });
});

app.listen(SONGBO_PORT, () => {
    console.log(`【SONGBO-AI】中间层已启动: http://localhost:${SONGBO_PORT}`);
    console.log(`【SONGBO-AI】DeepSeek 密钥已加载: ${SONGBO_DS_KEY ? "是（来自 .env，不进前端）" : "否！请检查 .env"}`);
});
