/**
 * 文件名: songbo_config.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 全站配置——Supabase 项目地址与 anon 公开密钥（BAAS 路径 B）。
 *           anon key 是"公开密钥"，真正的权限由数据库 RLS 行级安全控制；
 *           DeepSeek 密钥在 backend-llm/.env（服务端），绝不出现在前端。
 */

const SONGBO_SUPABASE_URL = "https://dyowwfilqoplryrrotck.supabase.co";
const SONGBO_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3d3ZmlscW9wbHJ5cnJvdGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU4MzIxMDYsImV4cCI6MjExMTQwODEwNn0.DyJj3-43esSB5q2kVMKarMgd-a3UL8KBc8UQyVPeBfE";

/* AI 选购助手中间层地址（Express，默认 3007 端口；未启动时前端会优雅降级提示） */
const SONGBO_AI_BASE = "http://localhost:3007";
