console.log("开始执行 server.js");
const nodemailer = require('nodemailer');
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = 3000;

// ========== 配置 session ==========
app.use(session({
    secret: 'kevin_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.json({ limit: '10mb' }));  // 增加到 10MB
app.use(express.static('public'));

// ========== Google OAuth 客户端 ==========
const GOOGLE_CLIENT_ID = '1046534438268-vmrn92gmqjgdu0ro037d2nhsfmnq63ao.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const ALLOWED_EMAILS = ['kevin88ye88@gmail.com'];

// ========== 数据加载与保存（动漫数据） ==========
let animeData = [];
let userProfiles = {};          // 原有的内存用户配置，保留兼容
const DATA_FILE = path.join(__dirname, 'data/anime.json');

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            animeData = JSON.parse(raw);
            // 确保每个动漫都有 ratings 和 user_ratings
            animeData.forEach(anime => {
                if (!anime.ratings) {
                    anime.ratings = { "神作": 0, "好看": 0, "普通": 0, "无聊": 0, "狗屎": 0 };
                }
                if (!anime.user_ratings) anime.user_ratings = {};
            });
            console.log(`✅ 成功加载 ${animeData.length} 条动漫数据`);
        } else {
            console.warn("⚠️ anime.json 不存在");
        }
    } catch (e) {
        console.error("❌ 数据加载失败:", e.message);
        animeData = [];
    }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(animeData, null, 2));
    } catch (e) {
        console.error("数据保存失败:", e);
    }
}

function getRatings(anime) {
    if (!anime.ratings) {
        anime.ratings = { "神作": 0, "好看": 0, "普通": 0, "无聊": 0, "狗屎": 0, "哲救世皇骗": 0 };
    }
    if (!anime.user_ratings) {
        anime.user_ratings = {};
    }
    return anime.ratings;
}

console.time("加载动漫数据");
loadData();
console.timeEnd("加载动漫数据");


const multer = require('multer');

// 确保 avatars 目录存在
const AVATAR_DIR = path.join(__dirname, 'public/avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    }
});

// 上传头像接口
app.post('/api/user/avatar', upload.single('avatar'), (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    if (!req.file) return res.status(400).json({ error: "没有上传文件" });
    const avatarUrl = `/avatars/${req.file.filename}`;
    let users = loadUsers();
    const email = req.session.user;
    if (!users[email]) users[email] = {};
    users[email].avatar = avatarUrl;
    saveUsers(users);
    // 同时更新前端 localStorage 中的 avatar（可选，前端会重新获取）
    res.json({ success: true, avatarUrl });
});

// 获取当前登录用户信息（包含头像）
app.get('/api/user/current', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const email = req.session.user;
    const users = loadUsers();
    const userInfo = users[email] || {};
    // 如果有 Google 头像可优先返回，但我们简单处理
    res.json({ email, ...userInfo });
});

// ========== 新建：用户信息 + 好友数据持久化 ==========
const USERS_FILE = path.join(__dirname, 'data/users.json');
const FRIENDS_FILE = path.join(__dirname, 'data/friends.json');

function initDataFiles() {
    if (!fs.existsSync(path.dirname(USERS_FILE))) fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
    if (!fs.existsSync(FRIENDS_FILE)) fs.writeFileSync(FRIENDS_FILE, JSON.stringify([], null, 2));
}
initDataFiles();

function loadUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function loadFriends() {
    try {
        return JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}
function saveFriends(friends) {
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(friends, null, 2));
}

// 获取或创建用户公开信息（首次评论或登录时自动调用）
function getOrCreateUserInfo(email, username = null) {
    let users = loadUsers();
    if (!users[email]) {
        users[email] = {
            username: username || email.split('@')[0],
            avatar: '/avatars/default.png',
            bio: '这位观测者还没有留下简介',
            joinDate: new Date().toISOString().split('T')[0]
        };
        saveUsers(users);
    }
    return users[email];
}

// 迁移旧评论格式（为每个评论生成 id、userId、username、avatar、replies 字段）
function migrateCommentFormat() {
    let changed = false;
    animeData.forEach(anime => {
        if (!anime.comments) anime.comments = [];
        anime.comments = anime.comments.map(comment => {
            // 如果是旧格式（没有 id 字段）
            if (!comment.id) {
                changed = true;
                const userEmail = comment.user || 'unknown';
                const userInfo = getOrCreateUserInfo(userEmail);
                return {
                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                    userId: userEmail,
                    username: userInfo.username,
                    avatar: userInfo.avatar,
                    text: comment.text,
                    date: comment.date,
                    replies: (comment.replies || []).map(reply => migrateCommentFormatOne(reply))
                };
            }
            // 如果已有 id 但 replies 还是旧格式，递归处理
            if (comment.replies) {
                comment.replies = comment.replies.map(r => migrateCommentFormatOne(r));
            }
            return comment;
        });
    });
    if (changed) saveData();
}
function migrateCommentFormatOne(comment) {
    if (!comment.id) {
        const userEmail = comment.user || 'unknown';
        const userInfo = getOrCreateUserInfo(userEmail);
        return {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            userId: userEmail,
            username: userInfo.username,
            avatar: userInfo.avatar,
            text: comment.text,
            date: comment.date,
            replies: (comment.replies || []).map(r => migrateCommentFormatOne(r))
        };
    }
    if (comment.replies) {
        comment.replies = comment.replies.map(r => migrateCommentFormatOne(r));
    }
    return comment;
}
// 执行迁移（只需一次）
migrateCommentFormat();

// ========== 新增：系列/类型/评价索引（用于系列查询） ==========
let seriesMap = new Map();
let genreIndex = new Map();
let ratingIndex = new Map();

function buildIndex() {
    seriesMap.clear();
    genreIndex.clear();
    ratingIndex.clear();
    animeData.forEach(anime => {
        const series = anime.series_title || anime.title;
        if (!seriesMap.has(series)) seriesMap.set(series, []);
        seriesMap.get(series).push(anime.id);
        if (anime.genre && Array.isArray(anime.genre)) {
            anime.genre.forEach(g => {
                if (!genreIndex.has(g)) genreIndex.set(g, []);
                genreIndex.get(g).push(anime.id);
            });
        }
        const rating = anime.rating;
        if (rating && !ratingIndex.has(rating)) ratingIndex.set(rating, []);
        if (rating) ratingIndex.get(rating).push(anime.id);
    });
    console.log(`🔍 系列去重数量: ${seriesMap.size}`);
}
buildIndex();

function getAnimeById(id) {
    return animeData.find(a => a.id == id);
}

// ========== 首页路由（登录检查） ==========
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (req.session && req.session.user) {
        const users = loadUsers();
        if (users[req.session.user]) {
            // 有效登录用户
            res.sendFile(path.join(__dirname, 'public/index.html'));
        } else {
            // session 中的用户无效，销毁 session
            req.session.destroy();
            res.sendFile(path.join(__dirname, 'public/login.html'));
        }
    } else {
        res.sendFile(path.join(__dirname, 'public/login.html'));
    }
});

// ========== Google OAuth ==========
app.post('/auth/google/token', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: '缺少 token' });
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        if (!ALLOWED_EMAILS.includes(email)) {
            return res.json({ success: false, message: '您的邮箱未被授权访问' });
        }

        const googleAvatar = payload.picture || null;
        console.log('获取到 Google 头像:', googleAvatar);

        let users = loadUsers();
        const existing = users[email];
        const isNewUser = !existing;

        if (isNewUser) {
            users[email] = {
                username: email.split('@')[0],
                avatar: googleAvatar || '/avatars/default.png',
                googleAvatar: googleAvatar || null,
                bio: '这位观测者还没有留下简介',
                joinDate: new Date().toISOString().split('T')[0]
            };
        } else {
            // 老用户：补充可能缺失的 googleAvatar 字段
            if (googleAvatar && !existing.googleAvatar) {
                existing.googleAvatar = googleAvatar;
            }
            // 如果当前头像为空或为默认图片，则更新为 Google 头像
            const currentAvatar = existing.avatar || '';
            const isDefaultOrEmpty = !currentAvatar || currentAvatar === '/avatars/default.png' || currentAvatar === '';
            if (googleAvatar && isDefaultOrEmpty) {
                existing.avatar = googleAvatar;
                console.log(`更新用户 ${email} 头像为 Google 头像: ${googleAvatar}`);
            }
            // 确保有 username
            if (!existing.username) existing.username = email.split('@')[0];
        }
        saveUsers(users);

        req.session.user = email;
        req.session.playAudio = true;
        res.json({ success: true });
    } catch (error) {
        console.error('Token 验证失败:', error);
        res.status(401).json({ success: false, message: 'Token 无效' });
    }
});
// ========== 登出 ==========
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("登出失败:", err);
        res.clearCookie('connect.sid');
        res.redirect('/login.html');
    });
});

// ========== 静态页面路由 ==========
app.get('/anime/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/anime-detail.html'));
});

// ========== 原有 API：动漫列表（完全保留，已支持多选） ==========
app.get('/api/anime/list', (req, res) => {
    let { page = 1, limit = 12, keyword = '', year = '', month = '', tag = '', rating = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    let filtered = [...animeData];
    if (keyword) {
        const kw = keyword.trim();
        const hasNonAscii = /[^\x00-\x7F]/.test(kw);
        if (hasNonAscii) {
            const lowerKw = kw.toLowerCase();
            filtered = filtered.filter(anime => {
                const matchTitle = anime.title && anime.title.toLowerCase().includes(lowerKw);
                const matchSeries = anime.series_title && anime.series_title.toLowerCase().includes(lowerKw);
                const matchAliases = anime.aliases && anime.aliases.some(alias => alias.toLowerCase().includes(lowerKw));
                return matchTitle || matchSeries || matchAliases;
            });
        } else {
            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            filtered = filtered.filter(anime => {
                const matchTitle = anime.title && regex.test(anime.title);
                const matchSeries = anime.series_title && regex.test(anime.series_title);
                const matchAliases = anime.aliases && anime.aliases.some(alias => regex.test(alias));
                return matchTitle || matchSeries || matchAliases;
            });
        }
    }
    if (year) {
        const years = year.split(',').map(y => y.trim());
        filtered = filtered.filter(a => a.season && years.includes(a.season.split('-')[0]));
    }
    if (month) {
        const months = month.split(',').map(m => m.trim());
        filtered = filtered.filter(a => a.season && months.includes(a.season.split('-')[1]));
    }
    if (tag) {
        const tags = tag.split(',').map(t => t.trim());
        filtered = filtered.filter(a => {
            const animeTags = a.genre || [];
            return tags.some(tg => animeTags.includes(tg) || a.rating === tg);
        });
    }
    if (rating) filtered = filtered.filter(a => a.rating === rating);
    const total = filtered.length;
    res.json({
        total: total,
        page: page,
        limit: limit,
        data: filtered.slice((page - 1) * limit, page * limit)
    });
});

// ========== 原有 API：系列数量 ==========
app.get('/api/anime/series-count', (req, res) => {
    const uniqueSeries = new Set();
    animeData.forEach(anime => {
        let key = (anime.series_title && anime.series_title.trim() !== '')
            ? anime.series_title.trim()
            : anime.title.trim();
        key = key.toLowerCase();
        uniqueSeries.add(key);
    });
    const count = uniqueSeries.size;
    console.log(`系列去重前条数: ${animeData.length}, 去重后: ${count}`);
    res.json({ count });
});

// ========== 新增 API：系列搜索（模糊匹配） ==========
app.get('/api/anime/series', (req, res) => {
    let keyword = req.query.title;
    if (!keyword) return res.json([]);
    keyword = keyword.toLowerCase();
    const matched = [];
    for (let [seriesTitle, ids] of seriesMap.entries()) {
        if (seriesTitle.toLowerCase().includes(keyword)) {
            ids.forEach(id => {
                const anime = getAnimeById(id);
                if (anime) matched.push(anime);
            });
        }
    }
    res.json(matched);
});

// ========== 【修正】评分排行榜（必须放在 /api/anime/:id 之前） ==========
app.get('/api/anime/ratings-stats', (req, res) => {
    try {
        const stats = animeData.map(anime => {
            const ratings = anime.ratings || { "神作": 0, "好看": 0, "普通": 0, "无聊": 0, "狗屎": 0 };
            const score = (ratings["神作"] || 0) * 5 +
                (ratings["好看"] || 0) * 4 +
                (ratings["普通"] || 0) * 3 +
                (ratings["无聊"] || 0) * 2 +
                (ratings["狗屎"] || 0) * 1;
            const totalVotes = (ratings["神作"] || 0) + (ratings["好看"] || 0) + (ratings["普通"] || 0) + (ratings["无聊"] || 0) + (ratings["狗屎"] || 0);
            return {
                id: anime.id,
                title: anime.title,
                image_url: anime.image_url,
                ratings: ratings,
                totalVotes: totalVotes,
                weightedScore: score
            };
        });
        stats.sort((a, b) => b.weightedScore - a.weightedScore);
        res.json(stats);
    } catch (err) {
        console.error('评分统计接口错误:', err);
        res.status(500).json({ error: '内部错误' });
    }
});

// ========== 原有 API：获取单个动漫详情 ==========
app.get('/api/anime/:id', (req, res) => {
    const anime = animeData.find(a => a.id == req.params.id);
    if (!anime) return res.status(404).json({ error: "未找到" });
    res.json(anime);
});

// ========== 原有 API：评分（完全保留） ==========
app.post('/api/anime/rate', (req, res) => {
    const { id, ratingType } = req.body;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });
    const anime = animeData.find(a => a.id == id);
    if (!anime) return res.status(404).json({ error: "未找到动漫" });
    const ratings = getRatings(anime);
    if (anime.user_ratings[user]) {
        const oldType = anime.user_ratings[user];
        if (ratings[oldType] > 0) ratings[oldType]--;
    }
    ratings[ratingType] = (ratings[ratingType] || 0) + 1;
    anime.user_ratings[user] = ratingType;
    saveData();
    res.json({ success: true, ratings: anime.ratings });
});
// 取消评分
app.post('/api/anime/unrate', (req, res) => {
    const { id } = req.body;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });
    const anime = animeData.find(a => a.id == id);
    if (!anime) return res.status(404).json({ error: "未找到动漫" });
    const ratings = getRatings(anime);
    const oldRating = anime.user_ratings[user];
    if (oldRating && ratings[oldRating] > 0) {
        ratings[oldRating]--;
        delete anime.user_ratings[user];
        saveData();
        res.json({ success: true });
    } else {
        res.json({ success: false, error: "未评分或评分不存在" });
    }
});

// 重置头像为邮箱默认头像（Google 头像或默认）
app.post('/api/user/reset-avatar', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const email = req.session.user;
    let users = loadUsers();
    if (!users[email]) return res.status(404).json({ error: "用户不存在" });
    // 尝试从 users.json 中获取之前保存的 Google 头像，如果没有则用默认
    const defaultAvatar = users[email].googleAvatar || '/avatars/default.png';
    users[email].avatar = defaultAvatar;
    saveUsers(users);
    res.json({ success: true, avatarUrl: defaultAvatar });
});

// ========== 修改评论 API：支持嵌套回复（兼容旧数据） ==========
app.post('/api/anime/:id/comment', (req, res) => {
    const anime = animeData.find(a => a.id == req.params.id);
    if (!anime) return res.status(404).send("Not found");
    if (!anime.comments) anime.comments = [];
    const { parentId, text } = req.body;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });

    const userInfo = getOrCreateUserInfo(user);
    const newComment = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        userId: user,
        username: userInfo.username,
        avatar: userInfo.avatar,
        text: text.trim(),
        date: new Date().toISOString(),
        replies: []
    };

    function addReply(comments) {
        for (let c of comments) {
            if (c.id === parentId) {
                c.replies.push(newComment);
                return true;
            }
            if (c.replies && addReply(c.replies)) return true;
        }
        return false;
    }

    if (parentId) {
        if (!addReply(anime.comments)) {
            return res.status(404).json({ error: "父评论不存在" });
        }
    } else {
        anime.comments.push(newComment);
    }
    saveData();
    // 同步更新内存 animeData
    const index = animeData.findIndex(a => a.id == anime.id);
    if (index !== -1) animeData[index] = anime;
    res.json(anime.comments);
});

// ========== 删除评论（支持递归删除回复） ==========
app.delete('/api/anime/:id/comment/:commentId', (req, res) => {
    const anime = animeData.find(a => a.id == req.params.id);
    if (!anime) return res.status(404).send("Not found");
    const commentId = req.params.commentId;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });

    function deleteComment(comments) {
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === commentId && comments[i].userId === user) {
                comments.splice(i, 1);
                return true;
            }
            if (comments[i].replies && deleteComment(comments[i].replies)) return true;
        }
        return false;
    }
    const deleted = deleteComment(anime.comments);
    if (deleted) {
        saveData();
        res.json({ success: true });
    } else {
        res.status(403).json({ error: "无权删除或评论不存在" });
    }
});

// ========== 原有 API：用户资料（兼容原有的 userProfiles 内存存储） ==========
app.get('/api/user/profile', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const userProfile = userProfiles[req.session.user] || {};
    res.json(userProfile);
});

app.post('/api/user/profile', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    userProfiles[req.session.user] = req.body;
    res.json({ success: true });
});

// ========== 新增 API：更新用户公开信息 ==========
app.post('/api/user/update', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { username, avatar, bio } = req.body;
    let users = loadUsers();
    const email = req.session.user;
    if (!users[email]) users[email] = {};
    if (username) users[email].username = username;
    if (avatar) users[email].avatar = avatar;
    if (bio) users[email].bio = bio;
    saveUsers(users);
    res.json({ success: true });
});

// ========== 新增 API：获取用户公开信息 ==========
app.get('/api/user/info/:email', (req, res) => {
    const email = req.params.email;
    const userInfo = loadUsers()[email];
    if (!userInfo) return res.status(404).json({ error: "用户不存在" });
    res.json({
        email,
        username: userInfo.username,
        avatar: userInfo.avatar,
        bio: userInfo.bio,
        joinDate: userInfo.joinDate
    });
});

// ========== 新增 API：获取当前用户评分过的动漫 ==========
app.get('/api/user/ratings', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const user = req.session.user;
    const rated = animeData.filter(anime => anime.user_ratings && anime.user_ratings[user]);
    res.json(rated);
});

// ========== 新增 API：好友请求 ==========
app.post('/api/friends/request', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const fromUser = req.session.user;
    const { toEmail } = req.body;
    if (fromUser === toEmail) return res.status(400).json({ error: "不能添加自己" });
    let friends = loadFriends();
    if (friends.some(f => (f.user === fromUser && f.friend === toEmail) || (f.user === toEmail && f.friend === fromUser))) {
        return res.status(400).json({ error: "已添加或请求已存在" });
    }
    friends.push({
        user: fromUser,
        friend: toEmail,
        status: "pending",
        requestDate: new Date().toISOString()
    });
    saveFriends(friends);
    res.json({ success: true });
});

// ========== 新增 API：同意好友请求 ==========
app.post('/api/friends/accept', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const currentUser = req.session.user;
    const { requestId } = req.body; // requestId 即对方的 email
    let friends = loadFriends();
    const request = friends.find(f => f.friend === currentUser && f.status === "pending" && f.user === requestId);
    if (!request) return res.status(404).json({ error: "请求不存在" });
    request.status = "accepted";
    saveFriends(friends);
    res.json({ success: true });
});

// ========== 原有 API：音频相关（完全保留） ==========
app.get('/api/random-audio', (req, res) => {
    const audioDir = path.join(__dirname, 'public/audio');
    if (!fs.existsSync(audioDir)) return res.json({ error: "目录不存在" });
    const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.m4a') || f.endsWith('.mp3'));
    if (files.length > 0) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        res.json({ url: `/audio/${randomFile}` });
    } else {
        res.json({ error: "无音频文件" });
    }
});

app.get('/api/check-audio', (req, res) => {
    if (req.session && req.session.playAudio) {
        req.session.playAudio = false;
        res.json({ play: true });
    } else {
        res.json({ play: false });
    }
});

app.get('/api/check-profile-intro', (req, res) => {
    if (!req.session.user) return res.json({ play: false });
    if (!req.session.profileIntroPlayed) {
        req.session.profileIntroPlayed = true;
        return res.json({ play: true });
    }
    res.json({ play: false });
});

app.get('/login-failed', (req, res) => {
    res.redirect('/unauthorized.html');
});

// 邮件配置（使用环境变量）
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/report', async (req, res) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('邮件服务未配置：缺少 EMAIL_USER 或 EMAIL_PASS');
        return res.status(500).json({ error: '反馈功能暂不可用，请联系管理员' });
    }
    const { type, description, imageBase64 } = req.body;
    const user = req.session.user || '匿名用户';
    if (!description) {
        return res.status(400).json({ error: '描述不能为空' });
    }
    const typeMap = {
        bug: '🐞 Bug报告',
        optimize: '✨ 优化建议',
        suggestion: '💡 意见',
        question: '❓ 疑问'
    };
    const subject = typeMap[type] || '意见反馈';
    let htmlContent = `
        <h2>用户反馈</h2>
        <p><strong>用户邮箱：</strong> ${user}</p>
        <p><strong>类型：</strong> ${subject}</p>
        <p><strong>描述：</strong></p>
        <p>${description.replace(/\n/g, '<br>')}</p>
    `;

    // 邮件附件列表
    let attachments = [];
    if (imageBase64) {
        // 将 base64 转换为 Buffer
        const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
            const ext = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            attachments.push({
                filename: `screenshot.${ext}`,
                content: buffer,
                contentType: `image/${ext}`
            });
        } else {
            // 可能是纯 base64 字符串（没有 data:image 头），尝试直接解析
            try {
                const buffer = Buffer.from(imageBase64, 'base64');
                attachments.push({
                    filename: 'screenshot.png',
                    content: buffer,
                    contentType: 'image/png'
                });
            } catch (err) {
                console.error('解析图片数据失败:', err);
            }
        }
    }

    try {
        await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `【反馈】${subject}`,
            html: htmlContent,
            attachments: attachments   // 以附件形式发送图片
        });
        res.json({ success: true });
    } catch (err) {
        console.error('邮件发送失败:', err);
        res.status(500).json({ error: '邮件发送失败，请稍后重试' });
    }
});


// ========== 启动服务器 ==========
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});