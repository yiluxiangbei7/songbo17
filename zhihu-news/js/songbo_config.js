/**
 * 文件名: songbo_config.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: Supabase 连接配置（anon key 为公开密钥允许放前端；
 *           写操作由数据库 RLS 拦截，只有登录用户与服务端密钥可写）
 */

// Supabase 项目地址（BAAS 平台，路径 B）
const SONGBO_SUPABASE_URL = "https://tvrctpnlfuuqyiuhodbr.supabase.co";

// anon 公开密钥（匿名只读，受 RLS 约束；登录后携带用户 JWT 获得写权限）
const SONGBO_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cmN0cG5sZnV1cXlpdWhvZGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NzEzMzMsImV4cCI6MjExMTI0NzMzM30.6sVISrougzHDL0THBEtHlqiO9sme0gU-LP0-Jas8UCY";

// AI 摘要中间层地址（DeepSeek 密钥保存在 backend-llm/.env，不进前端）
const SONGBO_AI_BASE = "http://localhost:3007";
