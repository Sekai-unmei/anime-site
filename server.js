console.log("开始执行 server.js (MongoDB 持久化版 - 修正顺序与集合名)");
const nodemailer = require('nodemailer');
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 1. 定义 mongoose 模型 (必须在连接数据库之前！) ==========

// 用户模型
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    username: String,
    avatar: String,
    googleAvatar: String,
    bio: String,
    joinDate: String,
});
const User = mongoose.model('User', userSchema);

// 好友关系模型
const friendSchema = new mongoose.Schema({
    user: String,
    friend: String,
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    requestDate: Date
});
const Friend = mongoose.model('Friend', friendSchema);

// 通知模型
const notificationSchema = new mongoose.Schema({
    targetUser: { type: String, required: true },
    id: String,
    type: String,
    animeId: Number,
    commentId: String,
    from: String,
    message: String,
    replyText: String,
    read: { type: Boolean, default: false },
    createdAt: Date
});
const Notification = mongoose.model('Notification', notificationSchema);

// 聊天消息模型
const messageSchema = new mongoose.Schema({
    key: String,
    from: String,
    to: String,
    text: String,
    timestamp: Date,
    read: Boolean
});
const Message = mongoose.model('Message', messageSchema);

// 好友备注模型
const noteSchema = new mongoose.Schema({
    userEmail: String,
    friendEmail: String,
    note: String
});
const Note = mongoose.model('Note', noteSchema);

// ★★★★★ 动漫模型（核心）★★★★★
// 使用明确集合名 'animes'
const animeSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    title: String,
    image_url: String,
    description: String,
    recommend_text: String,
    genre: [String],
    series_title: String,
    season: String,
    rating: String,
    ratings: {
        神作: { type: Number, default: 0 },
        好看: { type: Number, default: 0 },
        普通: { type: Number, default: 0 },
        无聊: { type: Number, default: 0 },
        狗屎: { type: Number, default: 0 }
    },
    user_ratings: { type: Map, of: String, default: {} },
    comments: [
        {
            id: String,
            userId: String,
            username: String,
            avatar: String,
            text: String,
            date: Date,
            replies: [
                {
                    id: String,
                    userId: String,
                    username: String,
                    avatar: String,
                    text: String,
                    date: Date,
                    replies: { type: Array, default: [] }
                }
            ]
        }
    ]
}, { collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

// ========== 2. 连接 MongoDB ==========
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ 未设置 MONGO_URI 环境变量，请检查 Render 环境变量");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("✅ MongoDB 连接成功");
        console.log(`📌 使用集合: ${Anime.collection.name}`);  // 确认集合名

        // 获取当前文档数
        const count = await Anime.countDocuments();
        console.log(`📊 当前动漫文档数: ${count}`);

        // 预期总数为 191（从本地文件读取）
        const EXPECTED_COUNT = 191;
        if (count !== EXPECTED_COUNT) {
            console.log(`⚠️ 文档数 ${count} 与预期 ${EXPECTED_COUNT} 不符，强制清空并重新导入...`);
            try {
                await Anime.deleteMany({});   // 清空集合
                const animeData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/anime.json'), 'utf8'));
                await Anime.insertMany(animeData, { ordered: false });
                console.log(`✅ 成功导入 ${animeData.length} 条动漫数据（预期 ${EXPECTED_COUNT}）`);
                const newCount = await Anime.countDocuments();
                console.log(`📊 重新导入后文档数: ${newCount}`);
            } catch (importErr) {
                console.error("❌ 导入失败:", importErr);
                // 导入失败不退出，以便继续提供其他服务（但动漫数据为空）
            }
        } else {
            console.log(`✅ 动漫数据完整，共 ${count} 条。`);
        }
    })
    .catch(err => console.error("❌ MongoDB 连接失败:", err));

// ========== 辅助函数 ==========
async function getOrCreateUserInfo(email, username = null) {
    let user = await User.findOne({ email });
    if (!user) {
        user = new User({
            email,
            username: username || email.split('@')[0],
            avatar: '/avatars/default.png',
            bio: '这位观测者还没有留下简介',
            joinDate: new Date().toISOString().split('T')[0]
        });
        await user.save();
    }
    return user;
}

async function areFriends(user1, user2) {
    const count = await Friend.countDocuments({
        $or: [
            { user: user1, friend: user2, status: 'accepted' },
            { user: user2, friend: user1, status: 'accepted' }
        ]
    });
    return count > 0;
}

// ========== 配置 session 和中间件 ==========
app.use(session({
    secret: process.env.SESSION_SECRET || 'kevin_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ========== 文件上传（头像）==========
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
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    }
});

app.post('/api/user/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    if (!req.file) return res.status(400).json({ error: "没有上传文件" });
    const avatarUrl = `/avatars/${req.file.filename}`;
    await User.updateOne({ email: req.session.user }, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
});

app.get('/api/user/current', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const user = await User.findOne({ email: req.session.user });
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json({ email: user.email, username: user.username, avatar: user.avatar, bio: user.bio });
});

// ========== Google OAuth ==========
const GOOGLE_CLIENT_ID = '1046534438268-vmrn92gmqjgdu0ro037d2nhsfmnq63ao.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const ALLOWED_EMAILS = ['kevin88ye88@gmail.com', 'darkmaster1212xixi@gmail.com', 'ye.kevin@sassettiperuzzi.edu.it'];

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
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                username: email.split('@')[0],
                avatar: googleAvatar || '/avatars/default.png',
                googleAvatar: googleAvatar || null,
                bio: '这位观测者还没有留下简介',
                joinDate: new Date().toISOString().split('T')[0]
            });
            await user.save();
        } else {
            if (googleAvatar && !user.googleAvatar) user.googleAvatar = googleAvatar;
            const isDefaultOrEmpty = !user.avatar || user.avatar === '/avatars/default.png';
            if (googleAvatar && isDefaultOrEmpty) user.avatar = googleAvatar;
            if (!user.username) user.username = email.split('@')[0];
            await user.save();
        }
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
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (req.session && req.session.user) {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public/login.html'));
    }
});
app.get('/anime/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/anime-detail.html'));
});
app.get('/login-failed', (req, res) => res.redirect('/unauthorized.html'));

// ========== 动漫相关接口 ==========
app.get('/api/anime/list', async (req, res) => {
    let { page = 1, limit = 12, keyword = '', year = '', month = '', tag = '', rating = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    let filter = {};
    if (keyword) {
        filter.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { series_title: { $regex: keyword, $options: 'i' } },
            { aliases: { $regex: keyword, $options: 'i' } }
        ];
    }
    if (year) {
        const years = year.split(',').map(y => y.trim());
        filter.season = { $in: years.map(y => new RegExp(`^${y}`)) };
    }
    if (month) {
        const months = month.split(',').map(m => m.trim());
        if (!filter.season) filter.season = { $in: months.map(m => new RegExp(`-${m}$`)) };
        else filter.season = { $in: months.map(m => new RegExp(`-${m}$`)) };
    }
    if (tag) {
        const tags = tag.split(',').map(t => t.trim());
        filter.genre = { $in: tags };
    }
    if (rating) filter.rating = rating;
    const total = await Anime.countDocuments(filter);
    const data = await Anime.find(filter).skip((page - 1) * limit).limit(limit).lean();
    res.json({ total, page, limit, data });
});

app.get('/api/anime/series-count', async (req, res) => {
    const series = await Anime.distinct('series_title');
    const uniqueSeries = new Set(series.filter(s => s && s.trim() !== ''));
    res.json({ count: uniqueSeries.size });
});

app.get('/api/anime/series', async (req, res) => {
    let keyword = req.query.title;
    if (!keyword) return res.json([]);
    const animes = await Anime.find({ series_title: { $regex: keyword, $options: 'i' } }).lean();
    res.json(animes);
});

app.get('/api/anime/ratings-stats', async (req, res) => {
    const all = await Anime.find().lean();
    const stats = all.map(anime => {
        const ratings = anime.ratings || { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 };
        const score = (ratings.神作 || 0) * 5 + (ratings.好看 || 0) * 4 + (ratings.普通 || 0) * 3 + (ratings.无聊 || 0) * 2 + (ratings.狗屎 || 0) * 1;
        const totalVotes = (ratings.神作 || 0) + (ratings.好看 || 0) + (ratings.普通 || 0) + (ratings.无聊 || 0) + (ratings.狗屎 || 0);
        return { id: anime.id, title: anime.title, image_url: anime.image_url, ratings, totalVotes, weightedScore: score };
    });
    stats.sort((a, b) => b.weightedScore - a.weightedScore);
    res.json(stats);
});

app.get('/api/anime/:id', async (req, res) => {
    const anime = await Anime.findOne({ id: req.params.id }).lean();
    if (!anime) return res.status(404).json({ error: "未找到" });
    res.json(anime);
});

app.post('/api/anime/rate', async (req, res) => {
    const { id, ratingType } = req.body;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });
    const anime = await Anime.findOne({ id });
    if (!anime) return res.status(404).json({ error: "未找到动漫" });
    if (!anime.ratings) anime.ratings = { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 };
    if (!anime.user_ratings) anime.user_ratings = new Map();
    const oldType = anime.user_ratings.get(user);
    if (oldType) {
        anime.ratings[oldType] = (anime.ratings[oldType] || 0) - 1;
    }
    anime.ratings[ratingType] = (anime.ratings[ratingType] || 0) + 1;
    anime.user_ratings.set(user, ratingType);
    await anime.save();
    res.json({ success: true, ratings: anime.ratings });
});

app.post('/api/anime/unrate', async (req, res) => {
    const { id } = req.body;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });
    const anime = await Anime.findOne({ id });
    if (!anime) return res.status(404).json({ error: "未找到动漫" });
    const oldRating = anime.user_ratings.get(user);
    if (oldRating && anime.ratings[oldRating] > 0) {
        anime.ratings[oldRating]--;
        anime.user_ratings.delete(user);
        await anime.save();
        res.json({ success: true });
    } else {
        res.json({ success: false, error: "未评分或评分不存在" });
    }
});

app.post('/api/anime/:id/comment', async (req, res) => {
    const anime = await Anime.findOne({ id: req.params.id });
    if (!anime) return res.status(404).send("Not found");
    const { parentId, text } = req.body;
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "未登录" });
    const userInfo = await getOrCreateUserInfo(user);
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
            const shortReply = text.length > 30 ? text.substring(0, 30) + '…' : text;
            const notification = new Notification({
                targetUser: parentAuthor,
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                type: 'comment_reply',
                animeId: anime.id,
                commentId: parentId,
                from: user,
                message: `${userInfo.username} 回复了你的评论：“${shortReply}”`,
                replyText: text,
                read: false,
                createdAt: new Date()
            });
            await notification.save();
        }
    }
    const newComment = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        userId: user,
        username: userInfo.username,
        avatar: userInfo.avatar,
        text: text.trim(),
        date: new Date(),
        replies: []
    };
    function addReply(comments) {
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === parentId) {
                comments[i].replies.push(newComment);
                return true;
            }
            if (comments[i].replies && addReply(comments[i].replies)) return true;
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
    await anime.save();
    res.json(anime.comments);
});

app.delete('/api/anime/:id/comment/:commentId', async (req, res) => {
    const anime = await Anime.findOne({ id: req.params.id });
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
        await anime.save();
        res.json({ success: true });
    } else {
        res.status(403).json({ error: "无权删除或评论不存在" });
    }
});

// ========== 用户资料相关 ==========
app.post('/api/user/update', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { username, avatar, bio } = req.body;
    await User.updateOne({ email: req.session.user }, { username, avatar, bio });
    res.json({ success: true });
});

app.get('/api/user/info/:email', async (req, res) => {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json({
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        joinDate: user.joinDate
    });
});

app.get('/api/user/ratings', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const user = req.session.user;
    const animes = await Anime.find({ [`user_ratings.${user}`]: { $exists: true } }).lean();
    res.json(animes);
});

app.post('/api/user/reset-avatar', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const email = req.session.user;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "用户不存在" });
    const defaultAvatar = user.googleAvatar || '/avatars/default.png';
    user.avatar = defaultAvatar;
    await user.save();
    res.json({ success: true, avatarUrl: defaultAvatar });
});

// ========== 好友系统 ==========
app.post('/api/friends/request', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const fromUser = req.session.user;
    const { toEmail } = req.body;
    if (fromUser === toEmail) return res.status(400).json({ error: "不能添加自己" });
    const exists = await Friend.findOne({
        $or: [
            { user: fromUser, friend: toEmail },
            { user: toEmail, friend: fromUser }
        ]
    });
    if (exists) return res.status(400).json({ error: "已添加或请求已存在" });
    const friendReq = new Friend({
        user: fromUser,
        friend: toEmail,
        status: 'pending',
        requestDate: new Date()
    });
    await friendReq.save();
    const notification = new Notification({
        targetUser: toEmail,
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        type: 'friend_request',
        from: fromUser,
        message: `${fromUser} 请求添加你为好友`,
        read: false,
        createdAt: new Date()
    });
    await notification.save();
    res.json({ success: true });
});

app.post('/api/friends/accept', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const currentUser = req.session.user;
    const { requestId } = req.body;
    const friendReq = await Friend.findOne({ user: requestId, friend: currentUser, status: 'pending' });
    if (!friendReq) return res.status(404).json({ error: "请求不存在" });
    friendReq.status = 'accepted';
    await friendReq.save();
    res.json({ success: true });
});

app.get('/api/friends/list', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const friends = await Friend.find({
        $or: [{ user: req.session.user }, { friend: req.session.user }],
        status: 'accepted'
    });
    const friendEmails = friends.map(f => f.user === req.session.user ? f.friend : f.user);
    const users = await User.find({ email: { $in: friendEmails } });
    const result = users.map(u => ({
        email: u.email,
        username: u.username,
        avatar: u.avatar
    }));
    res.json(result);
});

app.post('/api/friends/delete', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { friend } = req.body;
    await Friend.deleteMany({
        $or: [
            { user: req.session.user, friend: friend },
            { user: friend, friend: req.session.user }
        ]
    });
    res.json({ success: true });
});

// ========== 通知系统 ==========
app.get('/api/notifications', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const notifs = await Notification.find({ targetUser: req.session.user }).sort({ createdAt: -1 });
    res.json(notifs);
});

app.post('/api/notifications/mark-read', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { ids } = req.body;
    await Notification.updateMany({ targetUser: req.session.user, id: { $in: ids } }, { read: true });
    res.json({ success: true });
});

// ========== 聊天消息 ==========
app.post('/api/messages/send', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ error: "缺少参数" });
    const from = req.session.user;
    if (!await areFriends(from, to)) {
        return res.status(403).json({ error: "不是好友，无法发送消息" });
    }
    const key = [from, to].sort().join('_');
    const message = new Message({
        key,
        from,
        to,
        text,
        timestamp: new Date(),
        read: false
    });
    await message.save();
    const notification = new Notification({
        targetUser: to,
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        type: 'new_message',
        from: from,
        message: `${from} 给你发了一条新消息`,
        read: false,
        createdAt: new Date()
    });
    await notification.save();
    res.json({ success: true });
});

app.get('/api/messages/history', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { friend } = req.query;
    if (!friend) return res.status(400).json({ error: "缺少好友邮箱" });
    const me = req.session.user;
    if (!await areFriends(me, friend)) {
        return res.status(403).json({ error: "不是好友，无法查看聊天记录" });
    }
    const key = [me, friend].sort().join('_');
    const messages = await Message.find({ key }).sort({ timestamp: 1 });
    res.json(messages);
});

// ========== 好友备注 ==========
app.post('/api/friends/note', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const { friendEmail, note } = req.body;
    await Note.findOneAndUpdate(
        { userEmail: req.session.user, friendEmail },
        { note },
        { upsert: true, new: true }
    );
    res.json({ success: true });
});

app.get('/api/friends/notes', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "未登录" });
    const notes = await Note.find({ userEmail: req.session.user });
    const result = {};
    notes.forEach(n => { result[n.friendEmail] = n.note; });
    res.json(result);
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
    if (!description) return res.status(400).json({ error: '描述不能为空' });
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
});

// ========== 启动服务器 ==========
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});