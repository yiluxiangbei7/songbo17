-- ============================================================
-- 文件名: songbo_supabase_schema.sql
-- 作者: 宋博 (24001011017)
-- 创建时间: 2026-11-26（2026-11-27 更新：新增 favorites 表与登录写策略）
-- 功能说明: 「知乎新闻」数据库完整建表脚本（Supabase / PostgreSQL）
--           4 张表 + RLS 行级安全 + 匿名只读/登录可写策略 + 中文测试数据
-- 执行方式: Supabase 控制台 SQL Editor 整段粘贴执行，或通过
--           Management API 的 database/query 接口执行（可重复执行）
-- 对应评分项: 数据库文档可据此完整重建数据库，且含测试数据
-- ============================================================

-- ============ 0. 清理旧对象（保证脚本可重复执行） ============
DROP TABLE IF EXISTS public.favorites;
DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.news;
DROP TABLE IF EXISTS public.topics;

-- ============ 1. 新闻表 news ============
CREATE TABLE public.news (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 新闻 ID，自增主键
    title         VARCHAR(150)  NOT NULL,                          -- 新闻标题
    summary       VARCHAR(300)  NOT NULL,                          -- 内容摘要（列表页展示）
    content       TEXT          NOT NULL,                          -- 正文（详情页展示，多于列表内容）
    category      VARCHAR(20)   NOT NULL,                          -- 分类：科技/互联网/教育/开发者
    author        VARCHAR(30)   NOT NULL,                          -- 作者（知乎昵称）
    cover_image   VARCHAR(200)  NOT NULL DEFAULT '',               -- 封面图（前端 images/ 下本地 SVG）
    views         INTEGER       NOT NULL DEFAULT 0,                -- 浏览量
    published_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()             -- 发布时间
);

COMMENT ON TABLE public.news IS '知乎新闻 · 新闻表';

-- ============ 2. 评论表 comments ============
CREATE TABLE public.comments (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- 评论 ID，自增主键
    news_id     BIGINT        NOT NULL,                            -- 所属新闻 ID（外键）
    nickname    VARCHAR(30)   NOT NULL,                            -- 评论者昵称
    content     VARCHAR(300)  NOT NULL,                            -- 评论内容
    likes       INTEGER       NOT NULL DEFAULT 0,                  -- 点赞数
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()               -- 评论时间
);

-- 外键：新闻被删除时，其下评论级联删除
ALTER TABLE public.comments
    ADD CONSTRAINT songbo_fk_comments_news
    FOREIGN KEY (news_id) REFERENCES public.news (id) ON DELETE CASCADE;

COMMENT ON TABLE public.comments IS '知乎新闻 · 新闻评论表';

-- ============ 3. 话题表 topics ============
CREATE TABLE public.topics (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- 话题 ID，自增主键
    name        VARCHAR(30)   NOT NULL UNIQUE,                     -- 话题名称（唯一）
    description VARCHAR(200)  NOT NULL DEFAULT '',                 -- 话题简介
    icon        VARCHAR(200)  NOT NULL DEFAULT '',                 -- 话题图标（本地路径）
    followers   INTEGER       NOT NULL DEFAULT 0,                  -- 关注人数（万）
    sort        INTEGER       NOT NULL DEFAULT 0                   -- 排序权重，越小越靠前
);

COMMENT ON TABLE public.topics IS '知乎新闻 · 热门话题表';

-- ============ 4. 收藏表 favorites（登录用户私有，uuid 隔离） ============
CREATE TABLE public.favorites (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,    -- 收藏 ID，自增主键
    user_id    UUID          NOT NULL,                             -- 用户 ID（Supabase Auth users.id）
    news_id    BIGINT        NOT NULL,                             -- 新闻 ID（外键，级联删除）
    title      VARCHAR(150)  NOT NULL DEFAULT '',                  -- 冗余标题（个人中心快速展示）
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),               -- 收藏时间
    UNIQUE (user_id, news_id)                                              -- 同一用户同一新闻只收藏一次
);

ALTER TABLE public.favorites
    ADD CONSTRAINT songbo_fk_favorites_news
    FOREIGN KEY (news_id) REFERENCES public.news (id) ON DELETE CASCADE;

COMMENT ON TABLE public.favorites IS '知乎新闻 · 用户收藏表（auth.uid 隔离）';

-- ============ 5. RLS 行级安全 ============
-- 策略设计：
--   anon（未登录）            → 只允许 SELECT（前端匿名浏览新闻）
--   authenticated（登录用户） → 允许全部写操作（后台管理 / 收藏）
--   service_role（服务端）    → 本身绕过 RLS，用于管理任务
-- 未登录调用写接口时 PostgREST 返回 401/42501，实现"未登录访问管理接口被拦截"。

ALTER TABLE public.news      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 5.1 匿名只读策略（评分项：RLS + 允许匿名读取）
CREATE POLICY allow_anonymous_read_news
    ON public.news     FOR SELECT TO anon USING (true);
CREATE POLICY allow_anonymous_read_comments
    ON public.comments FOR SELECT TO anon USING (true);
CREATE POLICY allow_anonymous_read_topics
    ON public.topics   FOR SELECT TO anon USING (true);

-- 5.2 登录用户写策略（后台管理增删改：前端携带 Auth JWT 生效）
CREATE POLICY allow_authenticated_write_news
    ON public.news     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_authenticated_write_topics
    ON public.topics   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_authenticated_write_comments
    ON public.comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5.3 收藏表：用户只能读写自己的收藏（行级隔离 auth.uid()）
CREATE POLICY allow_user_own_favorites
    ON public.favorites FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ 6. Supabase Auth 配置说明（控制台操作，非 SQL） ============
-- 1) Authentication → Providers → Email：保持开启；
-- 2) Authentication → Sign In / Up：关闭 "Confirm email"（即 mailer_autoconfirm=true），
--    注册后无需邮箱验证即可登录，便于课程演示；
-- 3) 密码由 Supabase Auth 自动以 bcrypt 加密存储（评分项高阶功能：密码加密存储）。
-- 测试账号（演示用）：songbo17@test.com / songbo123

-- ============ 7. 测试数据：新闻 8 条 ============
INSERT INTO public.news (title, summary, content, category, author, cover_image, views, published_at) VALUES
('如何看待 AI 编程助手成为大学生标配？',
 '2026 年秋季学期调查显示，超过七成计算机相关专业学生在作业与项目中使用 AI 编程助手，"会用 AI"正在成为新的基本功。',
 '2026 年秋季学期一项覆盖全国 52 所高校的调查显示，超过七成计算机相关专业的学生在课程作业与课外项目中使用 AI 编程助手。支持者认为 AI 显著降低了入门门槛，让学生可以把精力放在架构设计与需求分析上；反对者则担心跳过手写代码阶段会削弱基本功。多位高校教师在评论区分享了"先手写、再 AI 重构"的折中方案：基础题关闭 AI，综合项目鼓励使用并要求提交过程记录。你支持哪种做法？', '教育', '校园观察员', 'images/songbo_cover_ai.svg', 1284, '2026-11-25T09:30:00+08:00'),
('中国青年开发者大会落幕：开源社区一年增长 40%',
 '大会发布年度开源报告，国内活跃开源项目数同比增长 40%，高校贡献者占比首次超过两成。',
 '为期两天的中国青年开发者大会在杭州落幕。大会发布的中国开源年度报告显示，国内活跃开源项目数量同比增长 40%，其中高校学生贡献者占比首次超过 20%。大会期间还举办了首次"高校开源之夜"，来自 30 所大学的 60 个学生项目进行了现场路演。多位评委建议学生项目从文档与测试做起："开源不是把代码扔上去，而是让别人能用起来。"', '开发者', '开源社消息', 'images/songbo_cover_code.svg', 962, '2026-11-24T14:00:00+08:00'),
('自研浏览器内核新进展：通过全部 W3C 标准测试',
 '国产自研浏览器内核团队宣布其渲染引擎已通过 W3C 全部标准一致性测试，预计明年开源首个预览版。',
 '国产自研浏览器内核团队昨日宣布，其新一代渲染引擎已通过 W3C 全部标准一致性测试，对 CSS Flex、Grid、原生 Web Components 的支持均达到 spec 级别。团队表示引擎将于明年以开源方式发布首个开发者预览版。前端社区对此反响热烈：如果内核生态多点开花，过去"为老内核写兼容"的日子有望成为历史。也有开发者提醒，内核竞争的关键不在跑分而在长尾兼容与安全性。', '科技', '前端早报', 'images/songbo_cover_web.svg', 1533, '2026-11-23T11:20:00+08:00'),
('大一就开始做项目，是内卷还是早鸟？',
 '一篇"大一学生独立完成全栈校园网站"的分享帖引发讨论：早起跑项目到底是弯道超车，还是拔苗助长？',
 '一篇"大一学生独立完成全栈校园网站"的分享帖近日登上热榜。楼主在大一上学期完成了选课查询、失物招领与校园资讯三个功能模块，全部使用原生 HTML/CSS/JavaScript 加云端数据库实现。评论区争论激烈：有人认为早期项目能建立完整认知闭环，比刷题更有成就感；也有人认为基础不牢地动山摇，大一应先把数据结构与算法练扎实。高赞回答建议"以项目带学习，但每周保留固定刷题时间"。', '教育', '大一萌新观察', 'images/songbo_cover_campus.svg', 2088, '2026-11-22T20:45:00+08:00'),
('2026 年原生 Web 开发现状调查：基础三件套过时了吗？',
 '对 1200 名一线开发者的调查显示，HTML/CSS/JavaScript 原生能力仍是招聘考核重点，但使用比例持续下降。',
 '某技术社区对 1200 名一线开发者的年度调查显示：虽然框架使用率持续攀升，但 89% 的招聘面试仍会考察原生 JavaScript 能力，73% 的受访者认为"原生基础决定框架上限"。调查还发现，CSS 新特性（容器查询、原生嵌套语法）的采用率一年内翻倍，越来越多的简单页面开始回归"零依赖"写法。报告作者总结：三件套没有过时，它们只是从"日常工具"变成了"内功心法"。', '开发者', '技术风向标', 'images/songbo_cover_code.svg', 1741, '2026-11-21T08:15:00+08:00'),
('从 GitHub 到 Gitee：国内开发者的双平台协作指南',
 '开源项目同时托管两个平台渐成潮流，本文梳理同步策略、镜像仓库与社区运营的实践经验。',
 '随着国内开源生态发展，越来越多的项目选择 GitHub 与 Gitee 双平台托管。实践者总结了几条经验：以一个平台为主仓库，另一个做单向镜像同步；Issues 与讨论集中在主平台避免割裂；发布时利用 Pages/镜像站点提供就近访问。文中还对比了两边 CI 资源与社区氛围的差异，建议课程作业优先选择访问稳定、提交记录清晰的一方作为主平台。', '开发者', '云上冲浪', 'images/songbo_cover_web.svg', 876, '2026-11-20T16:30:00+08:00'),
('量子计算走进高校课堂：首个教学演示程序跑通',
 '多所高校本学期开设量子计算导论课，学生首次在本校实验室跑通了量子纠缠演示程序。',
 '本学期，多所高校面向高年级本科生开设了量子计算导论课程。在最新一次实验课上，学生们在本校实验室的云端量子计算资源上跑通了量子纠缠演示程序，并在课堂辩论环节讨论了"量子霸权与实际应用的距离"。授课教师表示，课程目标是建立直觉而非培养算法工程师："先看懂现象，再谈原理。"', '科技', '硬核科技圈', 'images/songbo_cover_ai.svg', 1120, '2026-11-19T10:00:00+08:00'),
('知乎校园计划启动：邀请百所高校共建知识社区',
 '知乎宣布启动校园计划，首批将邀请 100 所高校的社团入驻，围绕课程笔记、竞赛经验与就业分享建立专区。',
 '知乎昨日宣布正式启动"校园计划"，首批邀请 100 所高校的学生社团入驻平台，围绕课程笔记、竞赛经验、就业实习三大方向共建内容专区。平台将为入驻社团提供流量扶持与内容认证。首批开放报名的板块中，"计算机课程互助"与"竞赛代码仓库分享"热度最高。有学生代表建议：社区繁荣的关键是建立互助而非代写的氛围。', '互联网', '互联网 Xin 闻', 'images/songbo_cover_campus.svg', 1355, '2026-11-18T12:10:00+08:00');

-- ============ 8. 测试数据：评论 8 条（关联对应新闻） ============
INSERT INTO public.comments (news_id, nickname, content, likes, created_at) VALUES
(1, '码农老张', '我们实验室现在的规矩是：作业思路必须自己写清楚，AI 只允许用来查语法和重构。半年下来大家基本功反而更扎实了。', 156, '2026-11-25T10:12:00+08:00'),
(1, '大一萌新', '刚上大一，感觉不借助 AI 很难独立完成一个完整项目，想问问学长学姐们都是怎么平衡的？', 89, '2026-11-25T11:05:00+08:00'),
(2, '开源爱好者', '高校贡献者超过两成这个数据太提气了，我们社团今年也提了三个 PR，虽然只是文档翻译。', 73, '2026-11-24T15:40:00+08:00'),
(3, '前端老兵', '兼容老内核的岁月终于要过去了？先保持谨慎乐观，等预览版真机测试再说。', 201, '2026-11-23T13:26:00+08:00'),
(4, '学术一枚', '大二才后悔大一没做项目。建议学弟学妹：以项目带学习，但别逃基础课。', 132, '2026-11-22T21:18:00+08:00'),
(5, '产品实习生', '容器查询真的好用，上个月一个活动页纯 CSS 就搞定了响应式，一行 JS 没写。', 95, '2026-11-21T09:47:00+08:00'),
(6, '图书馆常客', '双平台同步最烦的是 release 说明两边改版本，希望能出一个标准的同步规范。', 64, '2026-11-20T17:55:00+08:00'),
(7, '算法爱好者', '在实验室跑通纠缠演示那一刻全班鼓掌，物理直觉的建立比公式推导更让人兴奋。', 118, '2026-11-19T12:31:00+08:00');

-- ============ 9. 测试数据：话题 8 条 ============
INSERT INTO public.topics (name, description, icon, followers, sort) VALUES
('人工智能', '大模型、机器学习与 AI 应用的讨论都在这里。', 'images/songbo_topic_ai.svg', 2860, 1),
('前端开发', 'HTML/CSS/JavaScript 与浏览器新技术话题。', 'images/songbo_topic_code.svg', 1742, 2),
('大学生活', '课程、竞赛、社团与实习，校园里的那些事。', 'images/songbo_topic_campus.svg', 3205, 3),
('科技数码', '手机、电脑与前沿硬件的体验与评测。', 'images/songbo_topic_digital.svg', 2104, 4),
('互联网行业', '行业动态、产品分析与职业发展讨论。', 'images/songbo_topic_web.svg', 1587, 5),
('开源社区', '开源项目、贡献指南与开发者活动资讯。', 'images/songbo_topic_code.svg', 962, 6),
('编程入门', '零基础学编程的路径、资源与避坑指南。', 'images/songbo_topic_ai.svg', 4230, 7),
('校园技术圈', '高校技术社团、讲座与黑客松活动信息。', 'images/songbo_topic_campus.svg', 688, 8);
