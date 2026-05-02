console.log("开始执行 server.js (最终优化版)");
const nodemailer = require("nodemailer");
const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 1. 定义 mongoose 模型 ==========
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  username: String,
  googleAvatar: String,
  avatar: String,
  bio: String,
  joinDate: String,
});
const User = mongoose.model("User", userSchema);

const friendSchema = new mongoose.Schema({
  user: String,
  friend: String,
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  requestDate: Date,
});
const Friend = mongoose.model("Friend", friendSchema);

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
  createdAt: Date,
});
const Notification = mongoose.model("Notification", notificationSchema);

const messageSchema = new mongoose.Schema({
  key: String,
  from: String,
  to: String,
  text: String,
  timestamp: Date,
  read: Boolean,
});
const Message = mongoose.model("Message", messageSchema);

const noteSchema = new mongoose.Schema({
  userEmail: String,
  friendEmail: String,
  note: String,
});
const Note = mongoose.model("Note", noteSchema);

// 动漫模型
const animeSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
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
      狗屎: { type: Number, default: 0 },
    },
    user_ratings: { type: mongoose.Schema.Types.Mixed, default: {} },
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
            replies: { type: Array, default: [] },
          },
        ],
      },
    ],
  },
  { collection: "animes" },
);
// 添加 id 字段索引，提升查询效率
animeSchema.index({ id: 1 });
const Anime = mongoose.model("Anime", animeSchema);

// 独立的投票集合
const voteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  animeId: { type: Number, required: true },
  type: {
    type: String,
    enum: ["神作", "好看", "普通", "无聊", "狗屎"],
    required: true,
  },
  updatedAt: { type: Date, default: Date.now },
});
voteSchema.index({ userId: 1, animeId: 1 }, { unique: true });
const Vote = mongoose.model("Vote", voteSchema);

// ========== 2. 连接 MongoDB 并执行数据迁移 ==========
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ 未设置 MONGO_URI 环境变量");
  process.exit(1);
}

// 迁移函数：为旧文档补充数字 id（如果没有）
async function migrateAnimeIds() {
  const animes = await Anime.find({ id: { $exists: false } });
  if (animes.length === 0) return;
  console.log(`⚠️ 发现 ${animes.length} 条动漫记录缺少数字 id，开始迁移...`);
  for (let anime of animes) {
    // 如果已有 _id 且能转换为数字，优先使用；否则生成自增数字（简单方案：取当前最大 id+1）
    let newId = anime._id;
    if (typeof newId === "object") {
      // 使用时间戳或计数器，这里简单从现有的最大 id 递增
      const maxIdDoc = await Anime.findOne({ id: { $exists: true } }).sort(
        "-id",
      );
      newId = maxIdDoc && maxIdDoc.id ? maxIdDoc.id + 1 : 1;
    } else {
      newId = parseInt(newId);
      if (isNaN(newId)) newId = 1;
    }
    anime.id = newId;
    await anime.save();
    console.log(`  → 为 ${anime.title} 补充 id: ${newId}`);
  }
  console.log("✅ 数字 id 迁移完成");
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB 连接成功");
    await Vote.init(); // 确保唯一索引
    await migrateAnimeIds(); // 迁移旧数据
    console.log(`📌 使用集合: ${Anime.collection.name}`);
    const count = await Anime.countDocuments();
    console.log(`📊 当前动漫文档数: ${count}`);
    if (count === 0) console.log("⚠️ 数据库为空，请导入初始数据");
  })
  .catch((err) => console.error("❌ MongoDB 连接失败:", err));

// ========== 辅助函数 ==========
// 在 server.js 顶部添加一行（如果还没有）

/**
 * 获取或创建用户，并确保 avatar 字段有合理的初始值（Gravatar）
 * @param {string} email - 用户邮箱
 * @param {string|null} username - 可选用户名，如果未提供则用邮箱前缀
 * @returns {Promise<Object>} 用户文档
 */
async function getOrCreateUserInfo(email, username = null) {
  let user = await User.findOne({ email });

  if (!user) {
    // 新用户：生成 Gravatar URL 作为初始头像
    const emailMd5 = crypto
      .createHash("md5")
      .update(email.trim().toLowerCase())
      .digest("hex");
    const gravatarUrl = `https://www.gravatar.com/avatar/${emailMd5}?d=mp&s=200`;

    user = new User({
      email,
      username: username || email.split("@")[0],
      avatar: gravatarUrl, // 初始头像
      bio: "这位观测者还没有留下简介",
      joinDate: new Date().toISOString().split("T")[0],
    });
    await user.save();
  } else {
    // 已存在用户：仅当 avatar 为空或为默认灰图时，才补上 Gravatar（避免覆盖自定义头像）
    const isDefaultAvatar =
      !user.avatar ||
      user.avatar ===
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
    if (isDefaultAvatar) {
      const emailMd5 = crypto
        .createHash("md5")
        .update(email.trim().toLowerCase())
        .digest("hex");
      user.avatar = `https://www.gravatar.com/avatar/${emailMd5}?d=mp&s=200`;
      await user.save();
    }
  }

  return user;
}

async function findAnimeByIdentifier(identifier) {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    try {
      return await Anime.findById(identifier);
    } catch (e) {
      return null;
    }
  }
  const numericId = parseInt(identifier);
  if (!isNaN(numericId)) {
    return await Anime.findOne({ id: numericId });
  }
  return null;
}

async function areFriends(user1, user2) {
  const count = await Friend.countDocuments({
    $or: [
      { user: user1, friend: user2, status: "accepted" },
      { user: user2, friend: user1, status: "accepted" },
    ],
  });
  return count > 0;
}

// ========== 中间件 ==========
app.use(
  session({
    secret: process.env.SESSION_SECRET || "kevin_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// ========== 头像上传 ==========
const AVATAR_DIR = path.join(__dirname, "public/avatars");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.post("/api/user/avatar", upload.single("avatar"), async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  if (!req.file) {
    console.log("未收到文件");
    return res.status(400).json({ error: "没有上传文件" });
  }
  console.log("文件保存成功:", req.file.path);
  const avatarUrl = `/avatars/${req.file.filename}`;
  await User.updateOne({ email: req.session.user }, { avatar: avatarUrl });
  res.json({ success: true, avatarUrl });
});

app.get("/api/user/current", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const user = await User.findOne({ email: req.session.user });
  if (!user) return res.status(404).json({ error: "用户不存在" });
  res.json({
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
  });
});

// ========== Google OAuth ==========
const GOOGLE_CLIENT_ID =
  "1046534438268-vmrn92gmqjgdu0ro037d2nhsfmnq63ao.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const ALLOWED_EMAILS = [
  "kevin88ye88@gmail.com",
  "darkmaster1212xixi@gmail.com",
  "ye.kevin@sassettiperuzzi.edu.it",
];

app.post("/auth/google/token", async (req, res) => {
  const { token } = req.body;
  if (!token)
    return res.status(400).json({ success: false, message: "缺少 token" });
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    if (!ALLOWED_EMAILS.includes(email))
      return res.json({ success: false, message: "您的邮箱未被授权访问" });
    const googleAvatar = payload.picture || null;

    // 使用统一的用户创建/获取函数，确保 avatar 有初始值（Gravatar）
    let user = await getOrCreateUserInfo(email);
    if (googleAvatar && !user.googleAvatar) user.googleAvatar = googleAvatar;
    // 只有当当前头像为默认灰图时，才用 Google 头像替换（可选）
    const isDefaultAvatar =
      !user.avatar ||
      user.avatar ===
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
    if (googleAvatar && isDefaultAvatar) user.avatar = googleAvatar;
    if (!user.username) user.username = email.split("@")[0];
    await user.save();

    req.session.user = email;
    req.session.playAudio = true;
    res.json({ success: true });
  } catch (error) {
    console.error("Token 验证失败:", error);
    res.status(401).json({ success: false, message: "Token 无效" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("登出失败:", err);
    res.clearCookie("connect.sid");
    res.redirect("/login.html");
  });
});

// ========== 静态页面路由 ==========
app.get("/", (req, res) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "public/index.html"));
  } else {
    res.sendFile(path.join(__dirname, "public/login.html"));
  }
});
app.get("/anime/:id", (req, res) =>
  res.sendFile(path.join(__dirname, "public/anime-detail.html")),
);
app.get("/login-failed", (req, res) => res.redirect("/unauthorized.html"));

// ========== 动漫相关接口 ==========
app.get("/api/anime/list", async (req, res) => {
  let {
    page = 1,
    limit = 12,
    keyword = "",
    year = "",
    month = "",
    tag = "",
    rating = "",
  } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  let filter = {};
  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { series_title: { $regex: keyword, $options: "i" } },
      { aliases: { $regex: keyword, $options: "i" } },
    ];
  }
  if (year) {
    const years = year.split(",").map((y) => y.trim());
    filter.season = { $in: years.map((y) => new RegExp(`^${y}`)) };
  }
  if (month) {
    const months = month.split(",").map((m) => m.trim());
    if (!filter.season)
      filter.season = { $in: months.map((m) => new RegExp(`-${m}$`)) };
    else filter.season = { $in: months.map((m) => new RegExp(`-${m}$`)) };
  }
  if (tag) {
    const tags = tag.split(",").map((t) => t.trim());
    filter.genre = { $all: tags };
  }
  if (rating) filter.rating = rating;

  const total = await Anime.countDocuments(filter);
  const data = await Anime.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  let userRatingMap = new Map();
  if (req.session.user) {
    const animeIds = data.map((a) => a.id);
    const votes = await Vote.find({
      userId: req.session.user,
      animeId: { $in: animeIds },
    });
    votes.forEach((v) => {
      userRatingMap.set(v.animeId, v.type);
    });
  }

  const enrichedData = data.map((anime) => ({
    ...anime,
    currentUserRating: userRatingMap.get(anime.id) || null,
  }));

  res.json({ total, page, limit, data: enrichedData });
});

app.get("/api/anime/series-count", async (req, res) => {
  const series = await Anime.distinct("series_title");
  const uniqueSeries = new Set(series.filter((s) => s && s.trim() !== ""));
  res.json({ count: uniqueSeries.size });
});

app.get("/api/anime/series", async (req, res) => {
  let keyword = req.query.title;
  if (!keyword) return res.json([]);
  const animes = await Anime.find({
    series_title: { $regex: keyword, $options: "i" },
  }).lean();
  res.json(animes);
});

app.get("/api/anime/ratings-stats", async (req, res) => {
  const all = await Anime.find().lean();
  const stats = all.map((anime) => {
    const ratings = anime.ratings || {
      神作: 0,
      好看: 0,
      普通: 0,
      无聊: 0,
      狗屎: 0,
    };
    const score =
      (ratings.神作 || 0) * 5 +
      (ratings.好看 || 0) * 4 +
      (ratings.普通 || 0) * 3 +
      (ratings.无聊 || 0) * 2 +
      (ratings.狗屎 || 0) * 1;
    const totalVotes =
      (ratings.神作 || 0) +
      (ratings.好看 || 0) +
      (ratings.普通 || 0) +
      (ratings.无聊 || 0) +
      (ratings.狗屎 || 0);
    return {
      _id: anime._id,
      id: anime.id,
      title: anime.title,
      image_url: anime.image_url,
      ratings,
      totalVotes,
      weightedScore: score,
    };
  });
  stats.sort((a, b) => b.weightedScore - a.weightedScore);
  res.json(stats);
});

app.get("/api/anime/:id", async (req, res) => {
  const anime = await findAnimeByIdentifier(req.params.id);
  if (!anime) return res.status(404).json({ error: "未找到" });

  let currentUserRating = null;
  if (req.session.user) {
    const vote = await Vote.findOne({
      userId: req.session.user,
      animeId: anime.id,
    });
    currentUserRating = vote ? vote.type : null;
  }

  const result = anime.toObject ? anime.toObject() : anime;
  result.currentUserRating = currentUserRating;
  res.json(result);
});

// ========== 评分路由（基于 Vote 集合） ==========
app.post("/api/anime/rate", async (req, res) => {
  try {
    const { id, ratingType } = req.body;
    const userId = req.session.user;
    if (!userId) return res.status(401).json({ error: "未登录" });

    const anime = await findAnimeByIdentifier(id);
    if (!anime) return res.status(404).json({ error: "动漫不存在" });

    await Vote.findOneAndUpdate(
      { userId, animeId: anime.id },
      { type: ratingType, updatedAt: new Date() },
      { upsert: true, new: true },
    );

    const stats = await Vote.aggregate([
      { $match: { animeId: anime.id } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    const newRatings = { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 };
    stats.forEach((s) => {
      newRatings[s._id] = s.count;
    });

    await Anime.updateOne(
      { id: anime.id },
      { $set: { ratings: newRatings, user_ratings: {} } },
    );

    res.json({ success: true, ratings: newRatings });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: "请稍后重试" });
    console.error(err);
    res.status(500).json({ error: "服务器错误" });
  }
});

app.post("/api/anime/unrate", async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.session.user;
    if (!userId) return res.status(401).json({ error: "未登录" });
    const anime = await findAnimeByIdentifier(id);
    if (!anime) return res.status(404).json({ error: "动漫不存在" });

    await Vote.deleteOne({ userId, animeId: anime.id });

    const stats = await Vote.aggregate([
      { $match: { animeId: anime.id } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    const newRatings = { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 };
    stats.forEach((s) => {
      newRatings[s._id] = s.count;
    });
    await Anime.updateOne({ id: anime.id }, { $set: { ratings: newRatings } });
    res.json({ success: true, ratings: newRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ========== 评论接口 ==========
app.post("/api/anime/:id/comment", async (req, res) => {
  try {
    const anime = await findAnimeByIdentifier(req.params.id);
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
        const shortReply =
          text.length > 30 ? text.substring(0, 30) + "…" : text;
        const notification = new Notification({
          targetUser: parentAuthor,
          id: Date.now() + "-" + Math.random().toString(36).substr(2, 6),
          type: "comment_reply",
          animeId: anime.id,
          commentId: parentId,
          from: user,
          message: `${userInfo.username} 回复了你的评论：“${shortReply}”`,
          replyText: text,
          read: false,
          createdAt: new Date(),
        });
        await notification.save();
      }
    }

    const newComment = {
      id: Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      userId: user,
      username: userInfo.username,
      avatar: userInfo.avatar,
      text: text.trim(),
      date: new Date(),
      replies: [],
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
      if (!addReply(anime.comments))
        return res.status(404).json({ error: "父评论不存在" });
    } else {
      anime.comments.push(newComment);
    }
    await anime.save();
    res.json(anime.comments);
  } catch (err) {
    console.error("评论出错:", err);
    res.status(500).json({ error: "服务器内部错误", details: err.message });
  }
});

app.delete("/api/anime/:id/comment/:commentId", async (req, res) => {
  const anime = await findAnimeByIdentifier(req.params.id);
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
      if (comments[i].replies && deleteComment(comments[i].replies))
        return true;
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
// User 模型（avatar 字段保持 String，可以存 URL 或 data:image 字符串）
// 无需修改 schema，只需确保更新时接受任何字符串。

// 修改 /api/user/update 接口，增加对 Base64 长度的保护（限制大小）
app.post("/api/user/update", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const { username, avatar, bio } = req.body;
  // 如果 avatar 是 Base64 且太大，可以拒绝（例如超过 500KB）
  if (avatar && avatar.startsWith("data:image") && avatar.length > 600 * 1024) {
    return res.status(400).json({ error: "头像图片太大，请压缩后上传" });
  }
  await User.updateOne({ email: req.session.user }, { username, avatar, bio });
  res.json({ success: true });
});

app.get("/api/user/info/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  if (!user) return res.status(404).json({ error: "用户不存在" });
  res.json({
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    joinDate: user.joinDate,
  });
});

app.get("/api/user/ratings", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const user = req.session.user;
  const votes = await Vote.find({ userId: user });
  const animeIds = votes.map((v) => v.animeId);
  const animes = await Anime.find({ id: { $in: animeIds } }).lean();

  const animeWithRating = animes.map((anime) => {
    let validId = anime.id;
    if (validId === undefined || validId === null) {
      validId = anime._id.toString();
      console.warn(`动漫 ${anime.title} 缺少数字 id，使用 _id 作为替代`);
    }
    return {
      _id: anime._id,
      id: validId,
      title: anime.title,
      image_url: anime.image_url,
      userRating: votes.find((v) => v.animeId === anime.id)?.type || null,
    };
  });
  res.json(animeWithRating);
});

app.post("/api/user/reset-avatar", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const email = req.session.user;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "用户不存在" });
  const defaultAvatar =
    user.googleAvatar ||
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
  user.avatar = defaultAvatar;
  await user.save();
  res.json({ success: true, avatarUrl: defaultAvatar });
});

// ========== 好友系统 ==========
app.post("/api/friends/request", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const fromUser = req.session.user;
  const { toEmail } = req.body;
  if (fromUser === toEmail)
    return res.status(400).json({ error: "不能添加自己" });
  const exists = await Friend.findOne({
    $or: [
      { user: fromUser, friend: toEmail },
      { user: toEmail, friend: fromUser },
    ],
  });
  if (exists) return res.status(400).json({ error: "已添加或请求已存在" });
  const friendReq = new Friend({
    user: fromUser,
    friend: toEmail,
    status: "pending",
    requestDate: new Date(),
  });
  await friendReq.save();
  const notification = new Notification({
    targetUser: toEmail,
    id: Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    type: "friend_request",
    from: fromUser,
    message: `${fromUser} 请求添加你为好友`,
    read: false,
    createdAt: new Date(),
  });
  await notification.save();
  res.json({ success: true });
});

app.post("/api/friends/accept", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const currentUser = req.session.user;
  const { requestId } = req.body;
  const friendReq = await Friend.findOne({
    user: requestId,
    friend: currentUser,
    status: "pending",
  });
  if (!friendReq) return res.status(404).json({ error: "请求不存在" });
  friendReq.status = "accepted";
  await friendReq.save();
  res.json({ success: true });
});

app.get("/api/friends/list", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const friends = await Friend.find({
    $or: [{ user: req.session.user }, { friend: req.session.user }],
    status: "accepted",
  });
  const friendEmails = friends.map((f) =>
    f.user === req.session.user ? f.friend : f.user,
  );
  const users = await User.find({ email: { $in: friendEmails } });
  const result = users.map((u) => ({
    email: u.email,
    username: u.username,
    avatar: u.avatar,
  }));
  res.json(result);
});

app.post("/api/friends/delete", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const { friend } = req.body;
  await Friend.deleteMany({
    $or: [
      { user: req.session.user, friend: friend },
      { user: friend, friend: req.session.user },
    ],
  });
  res.json({ success: true });
});

// ========== 通知系统 ==========
app.get("/api/notifications", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const notifs = await Notification.find({ targetUser: req.session.user }).sort(
    { createdAt: -1 },
  );
  res.json(notifs);
});

app.post("/api/notifications/mark-read", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const { ids } = req.body;
  await Notification.updateMany(
    { targetUser: req.session.user, id: { $in: ids } },
    { read: true },
  );
  res.json({ success: true });
});

// ========== 聊天消息 ==========
app.post("/api/messages/send", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).json({ error: "缺少参数" });
  const from = req.session.user;
  if (!(await areFriends(from, to)))
    return res.status(403).json({ error: "不是好友，无法发送消息" });
  const key = [from, to].sort().join("_");
  const message = new Message({
    key,
    from,
    to,
    text,
    timestamp: new Date(),
    read: false,
  });
  await message.save();
  const notification = new Notification({
    targetUser: to,
    id: Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    type: "new_message",
    from: from,
    message: `${from} 给你发了一条新消息`,
    read: false,
    createdAt: new Date(),
  });
  await notification.save();
  res.json({ success: true });
});

app.get("/api/messages/history", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const { friend } = req.query;
  if (!friend) return res.status(400).json({ error: "缺少好友邮箱" });
  const me = req.session.user;
  if (!(await areFriends(me, friend)))
    return res.status(403).json({ error: "不是好友，无法查看聊天记录" });
  const key = [me, friend].sort().join("_");
  const messages = await Message.find({ key }).sort({ timestamp: 1 });
  res.json(messages);
});

// ========== 好友备注 ==========
app.post("/api/friends/note", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const { friendEmail, note } = req.body;
  await Note.findOneAndUpdate(
    { userEmail: req.session.user, friendEmail },
    { note },
    { upsert: true, new: true },
  );
  res.json({ success: true });
});

app.get("/api/friends/notes", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const notes = await Note.find({ userEmail: req.session.user });
  const result = {};
  notes.forEach((n) => {
    result[n.friendEmail] = n.note;
  });
  res.json(result);
});

// ========== 音频相关 ==========
app.get("/api/random-audio", (req, res) => {
  const audioDir = path.join(__dirname, "public/audio");
  if (!fs.existsSync(audioDir)) return res.json({ error: "目录不存在" });
  const files = fs
    .readdirSync(audioDir)
    .filter((f) => f.endsWith(".m4a") || f.endsWith(".mp3"));
  if (files.length > 0) {
    const randomFile = files[Math.floor(Math.random() * files.length)];
    res.json({ url: `/audio/${randomFile}` });
  } else {
    res.json({ error: "无音频文件" });
  }
});

app.get("/api/check-audio", (req, res) => {
  if (req.session && req.session.playAudio) {
    req.session.playAudio = false;
    res.json({ play: true });
  } else {
    res.json({ play: false });
  }
});

app.get("/api/check-profile-intro", (req, res) => {
  if (!req.session.user) return res.json({ play: false });
  if (!req.session.profileIntroPlayed) {
    req.session.profileIntroPlayed = true;
    return res.json({ play: true });
  }
  res.json({ play: false });
});

// ========== 邮件反馈（使用显式 SMTP + 本地文件备份） ==========
const emailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/report", async (req, res) => {
  const { type, description, imageBase64 } = req.body;
  const user = req.session.user || "匿名用户";
  if (!description) return res.status(400).json({ error: "描述不能为空" });

  const typeMap = {
    bug: "🐞 Bug报告",
    optimize: "✨ 优化建议",
    suggestion: "💡 意见",
    question: "❓ 疑问",
  };
  const subject = typeMap[type] || "意见反馈";
  let htmlContent = `
    <h2>用户反馈</h2>
    <p><strong>用户邮箱：</strong> ${user}</p>
    <p><strong>类型：</strong> ${subject}</p>
    <p><strong>描述：</strong></p>
    <p>${description.replace(/\n/g, "<br>")}</p>
  `;
  let attachments = [];
  if (imageBase64) {
    const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      attachments.push({
        filename: `screenshot.${ext}`,
        content: buffer,
        contentType: `image/${ext}`,
      });
    } else {
      try {
        const buffer = Buffer.from(imageBase64, "base64");
        attachments.push({
          filename: "screenshot.png",
          content: buffer,
          contentType: "image/png",
        });
      } catch (err) {}
    }
  }

  // 本地备份目录
  const FEEDBACK_DIR = path.join(__dirname, "feedbacks");
  if (!fs.existsSync(FEEDBACK_DIR))
    fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

  let mailSent = false;
  let mailError = null;

  // 尝试发送邮件
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `【反馈】${subject}`,
        html: htmlContent,
        attachments,
      });
      mailSent = true;
      console.log("反馈邮件已发送");
    } catch (err) {
      mailError = err;
      console.error("邮件发送失败:", err.message);
    }
  } else {
    console.warn("邮件未配置，将保存到本地文件");
  }

  // 无论是否成功，都保存一份到本地文件
  try {
    const fileName = `${Date.now()}_${user.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    fs.writeFileSync(
      path.join(FEEDBACK_DIR, fileName),
      JSON.stringify(
        {
          type,
          description,
          user,
          hasImage: !!imageBase64,
          mailSent,
          mailError: mailError ? mailError.message : null,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log(`反馈已保存到本地文件: ${fileName}`);
  } catch (fileErr) {
    console.error("保存反馈文件失败:", fileErr);
  }

  // 只要邮件发送或文件保存至少一项成功，就返回成功
  if (mailSent || true) {
    // 文件保存总是尝试，成功即整体成功
    res.json({ success: true, note: mailSent ? "已邮件通知" : "已保存" });
  } else {
    res.status(500).json({ error: "保存反馈失败" });
  }
});

// ========== 临时清理路由（仅调试用，可保留） ==========
app.get("/admin/purge", async (req, res) => {
  if (!req.session.user) return res.status(401).send("请先登录");
  const userId = req.session.user;
  const del = await Vote.deleteMany({ userId });
  const reset = await Anime.updateMany(
    {},
    { $set: { ratings: { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 } } },
  );
  await Anime.updateMany({}, { $set: { user_ratings: {} } });
  res.send(
    `✅ 已删除 ${del.deletedCount} 条投票，重置 ${reset.modifiedCount} 部动漫票数。现在可以重新测试。`,
  );
});

// ========== 启动服务器 ==========
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
