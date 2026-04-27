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
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ========== Google OAuth 客户端 ==========
const GOOGLE_CLIENT_ID = '1046534438268-vmrn92gmqjgdu0ro037d2nhsfmnq63ao.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const ALLOWED_EMAILS = ['kevin88ye88@gmail.com', 'darkmaster1212xixi@gmail.com', 'ye.kevin@sassettiperuzzi.edu.it'];

// ========== 数据加载与保存（动漫数据） ==========
let animeData = [];
let userProfiles = {};
const DATA_FILE = path.join(__dirname, 'data/anime.json');

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            animeData = JSON.parse(raw);
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
    if (!anime.user_ratings) anime.user_ratings = {};
    return anime.ratings;
}

console.time("加载动漫数据");
loadData();
console.timeEnd("加载动漫数据");

// ========== 文件上传（头像） ==========
const multer = require('multer');
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

app.post('/api/user/avatar', upload.single('avatar'), (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    if (!req.file) return res.status(400).json({ error: "没有上传文件" });
    const avatarUrl = `/avatars/${req.file.filename}`;
    let users = loadUsers();
    const email = req.session.user;
    if (!users[email]) users[email] = {};
    users[email].avatar = avatarUrl;
    saveUsers(users);
    res.json({ success: true, avatarUrl });
});

app.get('/api/user/current', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const email = req.session.user;
    const users = loadUsers();
    const userInfo = users[email] || {};
    res.json({ email, ...userInfo });
});

// ========== 用户信息 + 好友 + 通知持久化 ==========
const USERS_FILE = path.join(__dirname, 'data/users.json');
const FRIENDS_FILE = path.join(__dirname, 'data/friends.json');
const NOTIFICATIONS_FILE = path.join(__dirname, 'data/notifications.json');

function initDataFiles() {
    if (!fs.existsSync(path.dirname(USERS_FILE))) fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
    if (!fs.existsSync(FRIENDS_FILE)) fs.writeFileSync(FRIENDS_FILE, JSON.stringify([], null, 2));
    if (!fs.existsSync(NOTIFICATIONS_FILE)) fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify({}, null, 2));
}
initDataFiles();

function loadUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return {}; }
}
function saveUsers(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }
function loadFriends() {
    try { return JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8')); } catch (e) { return []; }
}
function saveFriends(friends) { fs.writeFileSync(FRIENDS_FILE, JSON.stringify(friends, null, 2)); }
function loadNotifications() {
    try { return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8')); } catch (e) { return {}; }
}
function saveNotifications(notifications) { fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2)); }

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
const NOTES_FILE = path.join(__dirname, 'data/friend_notes.json');
if (!fs.existsSync(NOTES_FILE)) fs.writeFileSync(NOTES_FILE, JSON.stringify({}, null, 2));

function loadNotes() {
    try { return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')); } catch (e) { return {}; }
}
function saveNotes(notes) { fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2)); }

// ========== 迁移旧评论格式 ==========
function migrateCommentFormat() {
    let changed = false;
    animeData.forEach(anime => {
        if (!anime.comments) anime.comments = [];
        anime.comments = anime.comments.map(comment => {
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
migrateCommentFormat();

// ========== 系列/类型/评价索引 ==========
let seriesMap = new Map();
let genreIndex = new Map();
let ratingIndex = new Map();

function buildIndex() {
    seriesMap.clear(); genreIndex.clear(); ratingIndex.clear();
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

function getAnimeById(id) { return animeData.find(a => a.id == id); }

// ========== 首页路由（登录检查） ==========
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (req.session && req.session.user) {
        const users = loadUsers();
        if (users[req.session.user]) {
            res.sendFile(path.join(__dirname, 'public/index.html'));
        } else {
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
        const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email = payload.email;
        if (!ALLOWED_EMAILS.includes(email)) {
            return res.json({ success: false, message: '您的邮箱未被授权访问' });
        }
        const googleAvatar = payload.picture || null;
        console.log('获取到 Google 头像:', googleAvatar);
        let users = loadUsers();
        const existing = users[email];
        if (!existing) {
            users[email] = {
                username: email.split('@')[0],
                avatar: googleAvatar || '/avatars/default.png',
                googleAvatar: googleAvatar || null,
                bio: '这位观测者还没有留下简介',
                joinDate: new Date().toISOString().split('T')[0]
            };
        } else {
            if (googleAvatar && !existing.googleAvatar) existing.googleAvatar = googleAvatar;
            const currentAvatar = existing.avatar || '';
            const isDefaultOrEmpty = !currentAvatar || currentAvatar === '/avatars/default.png' || currentAvatar === '';
            if (googleAvatar && isDefaultOrEmpty) {
                existing.avatar = googleAvatar;
                console.log(`更新用户 ${email} 头像为 Google 头像: ${googleAvatar}`);
            }
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

// ========== 动漫列表（原有多选） ==========
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

app.get('/api/anime/series-count', (req, res) => {
    const uniqueSeries = new Set();
    animeData.forEach(anime => {
        let key = (anime.series_title && anime.series_title.trim() !== '') ? anime.series_title.trim() : anime.title.trim();
        key = key.toLowerCase();
        uniqueSeries.add(key);
    });
    res.json({ count: uniqueSeries.size });
});

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

app.get('/api/anime/ratings-stats', (req, res) => {
    try {
        const stats = animeData.map(anime => {
            const ratings = anime.ratings || { "神作": 0, "好看": 0, "普通": 0, "无聊": 0, "狗屎": 0 };
            const score = (ratings["神作"] || 0) * 5 + (ratings["好看"] || 0) * 4 + (ratings["普通"] || 0) * 3 + (ratings["无聊"] || 0) * 2 + (ratings["狗屎"] || 0) * 1;
            const totalVotes = (ratings["神作"] || 0) + (ratings["好看"] || 0) + (ratings["普通"] || 0) + (ratings["无聊"] || 0) + (ratings["狗屎"] || 0);
            return { id: anime.id, title: anime.title, image_url: anime.image_url, ratings, totalVotes, weightedScore: score };
        });
        stats.sort((a, b) => b.weightedScore - a.weightedScore);
        res.json(stats);
    } catch (err) {
        console.error('评分统计接口错误:', err);
        res.status(500).json({ error: '内部错误' });
    }
});

app.get('/api/anime/:id', (req, res) => {
    const anime = animeData.find(a => a.id == req.params.id);
    if (!anime) return res.status(404).json({ error: "未找到" });
    res.json(anime);
});

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

app.post('/api/user/reset-avatar', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const email = req.session.user;
    let users = loadUsers();
    if (!users[email]) return res.status(404).json({ error: "用户不存在" });
    const defaultAvatar = users[email].googleAvatar || '/avatars/default.png';
    users[email].avatar = defaultAvatar;
    saveUsers(users);
    res.json({ success: true, avatarUrl: defaultAvatar });
});

// ========== 评论（支持嵌套回复 + 通知） ==========
app.post('/api/anime/:id/comment', (req, res) => {
    const anime = animeData.find(a => a.id == req.params.id);
    if (!anime) return res.status(404).send("Not found");
    if (!anime.comments) anime.comments = [];
    const { parentId, text } = req.body;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });

    // 提前获取用户信息，用于通知和评论对象
    const userInfo = getOrCreateUserInfo(user);

    // 处理回复通知 (放在 userInfo 获取之后，newComment 之前)
    if (parentId) {
        let parentAuthor = null;
        function findAuthor(comments) {
            for (let c of comments) {
                if (c.id === parentId) {
                    parentAuthor = c.userId;
                    return true;
                }
                if (c.replies && findAuthor(c.replies)) return true;
            }
            return false;
        }
        findAuthor(anime.comments);
        if (parentAuthor && parentAuthor !== user) {
            // 截取回复内容的前30个字符（用于消息预览）
            const shortReply = text.length > 30 ? text.substring(0, 30) + '…' : text;
            const notification = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                type: 'comment_reply',
                animeId: anime.id,
                commentId: parentId,
                from: user,
                message: `${userInfo.username} 回复了你的评论：“${shortReply}”`,
                replyText: text,          // ✅ 保存完整的回复内容，供前端显示
                read: false,
                createdAt: new Date().toISOString()
            };
            let notifications = loadNotifications();
            if (!notifications[parentAuthor]) notifications[parentAuthor] = [];
            notifications[parentAuthor].push(notification);
            saveNotifications(notifications);
        }
    }
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
    const index = animeData.findIndex(a => a.id == anime.id);
    if (index !== -1) animeData[index] = anime;
    res.json(anime.comments);
});

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

// ========== 用户资料与好友 ==========
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

app.get('/api/user/info/:email', (req, res) => {
    const email = req.params.email;
    const userInfo = loadUsers()[email];
    if (!userInfo) return res.status(404).json({ error: "用户不存在" });
    res.json({ email, username: userInfo.username, avatar: userInfo.avatar, bio: userInfo.bio, joinDate: userInfo.joinDate });
});

app.get('/api/user/ratings', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const user = req.session.user;
    const rated = animeData.filter(anime => anime.user_ratings && anime.user_ratings[user]);
    res.json(rated);
});

app.post('/api/friends/request', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const fromUser = req.session.user;
    const { toEmail } = req.body;
    if (fromUser === toEmail) return res.status(400).json({ error: "不能添加自己" });
    let friends = loadFriends();
    if (friends.some(f => (f.user === fromUser && f.friend === toEmail) || (f.user === toEmail && f.friend === fromUser))) {
        return res.status(400).json({ error: "已添加或请求已存在" });
    }
    friends.push({ user: fromUser, friend: toEmail, status: "pending", requestDate: new Date().toISOString() });
    saveFriends(friends);
    // 为对方生成通知
    const notification = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        type: 'friend_request',
        from: fromUser,
        message: `${fromUser} 请求添加你为好友`,
        read: false,
        createdAt: new Date().toISOString()
    };
    let notifications = loadNotifications();
    if (!notifications[toEmail]) notifications[toEmail] = [];
    notifications[toEmail].push(notification);
    saveNotifications(notifications);
    res.json({ success: true });
});

app.post('/api/friends/accept', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const currentUser = req.session.user;
    const { requestId } = req.body;
    let friends = loadFriends();
    const request = friends.find(f => f.friend === currentUser && f.status === "pending" && f.user === requestId);
    if (!request) return res.status(404).json({ error: "请求不存在" });
    request.status = "accepted";
    saveFriends(friends);
    res.json({ success: true });
});

// 好友列表（供前端使用）
app.get('/api/friends/list', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const friends = loadFriends();
    const accepted = friends.filter(f =>
        (f.user === req.session.user && f.status === 'accepted') ||
        (f.friend === req.session.user && f.status === 'accepted')
    );
    const friendEmails = accepted.map(f => f.user === req.session.user ? f.friend : f.user);
    const users = loadUsers();
    const result = friendEmails.map(email => ({
        email,
        username: users[email]?.username || email.split('@')[0],
        avatar: users[email]?.avatar || '/avatars/default.png'
    }));
    res.json(result);
});

// ========== 通知相关 ==========
app.get('/api/notifications', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const notifications = loadNotifications();
    res.json(notifications[req.session.user] || []);
});

app.post('/api/notifications/mark-read', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { ids } = req.body;
    let notifications = loadNotifications();
    const userNotifs = notifications[req.session.user] || [];
    userNotifs.forEach(n => {
        if (ids.includes(n.id)) n.read = true;
    });
    saveNotifications(notifications);
    res.json({ success: true });
});

// ========== 音频相关 ==========
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

// ========== 邮件反馈 ==========
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
    let attachments = [];
    if (imageBase64) {
        const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
            const ext = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            attachments.push({ filename: `screenshot.${ext}`, content: buffer, contentType: `image/${ext}` });
        } else {
            try {
                const buffer = Buffer.from(imageBase64, 'base64');
                attachments.push({ filename: 'screenshot.png', content: buffer, contentType: 'image/png' });
            } catch (err) { console.error('解析图片数据失败:', err); }
        }
    }
    try {
        await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `【反馈】${subject}`,
            html: htmlContent,
            attachments
        });
        res.json({ success: true });
    } catch (err) {
        console.error('邮件发送失败:', err);
        res.status(500).json({ error: '邮件发送失败，请稍后重试' });
    }
});// ========== 聊天消息存储 ==========
const MESSAGES_FILE = path.join(__dirname, 'data/messages.json');
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, JSON.stringify({}, null, 2));

function loadMessages() {
    try { return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); } catch (e) { return {}; }
}
function saveMessages(messages) { fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2)); }

// 发送消息
app.post('/api/messages/send', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ error: "缺少参数" });
    const from = req.session.user;
    const key = [from, to].sort().join('_');
    let messages = loadMessages();
    if (!messages[key]) messages[key] = [];
    messages[key].push({
        from, to, text, timestamp: new Date().toISOString(), read: false
    });
    saveMessages(messages);
    // 可选：为对方生成通知
    const notification = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        type: 'new_message',
        from: from,
        message: `${from} 给你发了一条新消息`,
        read: false,
        createdAt: new Date().toISOString()
    };
    let notifications = loadNotifications();
    if (!notifications[to]) notifications[to] = [];
    notifications[to].push(notification);
    saveNotifications(notifications);
    res.json({ success: true });
});

// 获取聊天记录
app.get('/api/messages/history', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { friend } = req.query;
    if (!friend) return res.status(400).json({ error: "缺少好友邮箱" });
    const me = req.session.user;
    const key = [me, friend].sort().join('_');
    const messages = loadMessages();
    const history = messages[key] || [];
    // 标记已读（可选）
    res.json(history);
});

// 删除好友
app.post('/api/friends/delete', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { friend } = req.body;
    let friends = loadFriends();
    friends = friends.filter(f => !((f.user === req.session.user && f.friend === friend) || (f.user === friend && f.friend === req.session.user)));
    saveFriends(friends);
    res.json({ success: true });
});

// 获取备注（或设置备注）
app.post('/api/friends/note', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { friendEmail, note } = req.body;
    let notes = loadNotes();
    const userNotes = notes[req.session.user] || {};
    userNotes[friendEmail] = note;
    notes[req.session.user] = userNotes;
    saveNotes(notes);
    res.json({ success: true });
});

app.get('/api/friends/notes', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const notes = loadNotes();
    res.json(notes[req.session.user] || {});
});

// ========== 启动服务器 ==========
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});