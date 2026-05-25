console.log("开始执行 server.js (黑名单版)");
const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");
const sgMail = require("@sendgrid/mail");

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

// 黑名单模型
const blacklistSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  reason: { type: String, default: "违规访问" },
  addedAt: { type: Date, default: Date.now },
  addedBy: String,
});
const Blacklist = mongoose.model("Blacklist", blacklistSchema);

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

const feedbackSchema = new mongoose.Schema({
  type: String,
  description: String,
  user: String,
  hasImage: Boolean,
  createdAt: { type: Date, default: Date.now },
});
const Feedback = mongoose.model("Feedback", feedbackSchema);

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
animeSchema.index({ id: 1 });
const Anime = mongoose.model("Anime", animeSchema);

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

// ========== 2. 连接 MongoDB ==========
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ 未设置 MONGO_URI 环境变量");
  process.exit(1);
}

async function migrateAnimeIds() {
  const animes = await Anime.find({ id: { $exists: false } });
  if (animes.length === 0) return;
  console.log(`⚠️ 发现 ${animes.length} 条动漫记录缺少数字 id，开始迁移...`);
  for (let anime of animes) {
    let newId = anime._id;
    if (typeof newId === "object") {
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
    await Vote.init();
    await migrateAnimeIds();
    console.log(`📌 使用集合: ${Anime.collection.name}`);
    const count = await Anime.countDocuments();
    console.log(`📊 当前动漫文档数: ${count}`);
    if (count === 0) console.log("⚠️ 数据库为空，请导入初始数据");
  })
  .catch((err) => console.error("❌ MongoDB 连接失败:", err));

// ========== 辅助函数 ==========
async function getOrCreateUserInfo(email, username = null) {
  let user = await User.findOne({ email });
  if (!user) {
    const emailMd5 = crypto
      .createHash("md5")
      .update(email.trim().toLowerCase())
      .digest("hex");
    const gravatarUrl = `https://www.gravatar.com/avatar/${emailMd5}?d=mp&s=200`;
    user = new User({
      email,
      username: username || email.split("@")[0],
      avatar: gravatarUrl,
      bio: "这位观测者还没有留下简介",
      joinDate: new Date().toISOString().split("T")[0],
    });
    await user.save();
  } else {
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

// 检查邮箱是否在黑名单中
async function isBlacklisted(email) {
  const entry = await Blacklist.findOne({ email });
  return !!entry;
}

// 防XSS辅助函数
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
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

// 全局黑名单拦截中间件（针对已登录用户，若被拉黑则强制登出并跳转）
app.use(async (req, res, next) => {
  if (req.session && req.session.user) {
    const black = await isBlacklisted(req.session.user);
    if (black) {
      req.session.destroy((err) => {
        if (err) console.error("销毁会话失败", err);
        if (req.path.startsWith("/api/")) {
          return res.status(403).json({ error: "您的账号已被禁止访问" });
        }
        return res.redirect("/unauthorized.html");
      });
      return;
    }
  }
  next();
});

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

// ========== Google OAuth (黑名单模式) ==========
const GOOGLE_CLIENT_ID =
  "1046534438268-vmrn92gmqjgdu0ro037d2nhsfmnq63ao.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

    // 检查黑名单（禁止列表中的邮箱登录）
    if (await isBlacklisted(email)) {
      return res.json({
        success: false,
        message: "您的账号已被禁止访问",
        redirect: "/unauthorized.html",
      });
    }

    // 未在黑名单内，允许登录（所有其他邮箱均可登录）
    const googleAvatar = payload.picture || null;
    let user = await getOrCreateUserInfo(email);
    if (googleAvatar && !user.googleAvatar) user.googleAvatar = googleAvatar;
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
app.use(express.static("public"));

app.get("/fate.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/系列/fate.html"));
});

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

// ========== 评分路由 ==========
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
app.post("/api/user/update", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "未登录" });
  const { username, avatar, bio } = req.body;
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

// ========== 反馈接口 ==========
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("✓ SendGrid 已配置");
} else {
  console.warn("⚠️ 未设置 SENDGRID_API_KEY，邮件功能将不可用");
}

app.post("/api/report", async (req, res) => {
  const { type, description, imageBase64 } = req.body;
  const user = req.session.user || "匿名用户";
  if (!description) {
    return res.status(400).json({ error: "描述不能为空" });
  }

  try {
    const feedback = new Feedback({
      type,
      description,
      user,
      hasImage: !!imageBase64,
    });
    await feedback.save();
    console.log(`✓ 反馈已保存，ID: ${feedback._id}`);
  } catch (dbErr) {
    console.error("✗ 保存反馈到数据库失败:", dbErr);
    return res
      .status(500)
      .json({ success: false, error: "数据库保存失败，请稍后重试" });
  }

  res.json({
    success: true,
    saved: true,
    message: "反馈已保存，管理员将尽快处理。",
  });

  setImmediate(async () => {
    if (!process.env.SENDGRID_API_KEY) return;
    try {
      const typeMap = {
        bug: "🐞 Bug报告",
        optimize: "✨ 优化建议",
        suggestion: "💡 意见",
        question: "❓ 疑问",
      };
      const subject = typeMap[type] || "意见反馈";
      let htmlContent = `<h2>用户反馈</h2>
        <p><strong>用户邮箱：</strong> ${user}</p>
        <p><strong>类型：</strong> ${subject}</p>
        <p><strong>描述：</strong></p>
        <p>${description.replace(/\n/g, "<br>")}</p>`;

      let attachments = [];
      if (imageBase64) {
        const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          attachments.push({
            content: matches[2],
            filename: `screenshot.${matches[1]}`,
            type: `image/${matches[1]}`,
            disposition: "attachment",
          });
        } else {
          attachments.push({
            content: imageBase64,
            filename: "screenshot.png",
            type: "image/png",
            disposition: "attachment",
          });
        }
      }

      const msg = {
        to: "kevin88ye88@gmail.com",
        from: "kevin88ye88@gmail.com",
        subject: `【反馈】${subject}`,
        html: htmlContent,
        attachments: attachments,
      };

      await sgMail.send(msg);
      console.log("✓ 反馈邮件已通过 SendGrid API 发送");
    } catch (mailErr) {
      console.error("✗ 邮件发送失败（不影响反馈保存）:", mailErr.message);
    }
  });
});

// ========== 黑名单管理 API（仅管理员） ==========
const ADMIN_EMAIL = "kevin88ye88@gmail.com";

function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "无权限，仅管理员可操作" });
  }
  next();
}

app.get("/api/admin/blacklist", isAdmin, async (req, res) => {
  const list = await Blacklist.find().sort({ addedAt: -1 });
  res.json(list);
});

app.post("/api/admin/blacklist", isAdmin, async (req, res) => {
  const { email, reason } = req.body;
  if (!email) return res.status(400).json({ error: "缺少邮箱" });
  const existing = await Blacklist.findOne({ email });
  if (existing) return res.status(409).json({ error: "邮箱已在黑名单中" });
  await Blacklist.create({
    email,
    reason: reason || "管理员手动添加",
    addedBy: req.session.user,
  });
  res.json({ success: true });
});

app.delete("/api/admin/blacklist", isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "缺少邮箱" });
  const result = await Blacklist.deleteOne({ email });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "未找到该邮箱" });
  res.json({ success: true });
});

app.get("/admin/blacklist", (req, res) => {
  if (!req.session.user || req.session.user !== ADMIN_EMAIL) {
    return res.status(403).send("无权访问");
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>黑名单管理</title>
      <style>
        body { background: #0a0a0a; color: #eee; font-family: monospace; padding: 2rem; }
        h1 { color: #ffd700; }
        table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
        th, td { border: 1px solid #444; padding: 8px 12px; text-align: left; }
        th { background: #1a1a1a; }
        input, button { padding: 8px; margin: 4px; background: #222; color: #fff; border: 1px solid #666; }
        button { cursor: pointer; background: #333; }
        button:hover { background: #ffd700; color: #000; }
        .add-form { margin: 20px 0; background: #111; padding: 15px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>⚔️ 黑名单管理</h1>
      <div class="add-form">
        <input type="text" id="blockEmail" placeholder="要拉黑的邮箱" style="width: 300px;">
        <input type="text" id="blockReason" placeholder="原因（可选）" style="width: 300px;">
        <button id="addBtn">➕ 加入黑名单</button>
      </div>
      <div id="list"></div>
      <script>
        async function loadList() {
          const res = await fetch('/api/admin/blacklist');
          const data = await res.json();
          const container = document.getElementById('list');
          if (!data.length) {
            container.innerHTML = '<p>暂无黑名单记录</p>';
            return;
          }
          let html = '<table><tr><th>邮箱</th><th>原因</th><th>添加时间</th><th>操作</th></tr>';
          data.forEach(item => {
            html += \`
              <tr>
                <td>\${item.email}</td>
                <td>\${item.reason || '-'}</td>
                <td>\${new Date(item.addedAt).toLocaleString()}</td>
                <td><button onclick="removeBlacklist('\${item.email}')">移除</button></td>
              </tr>
            \`;
          });
          html += '</table>';
          container.innerHTML = html;
        }
        async function removeBlacklist(email) {
          if (!confirm(\`确定将 \${email} 移出黑名单吗？\`)) return;
          const res = await fetch('/api/admin/blacklist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          if (res.ok) {
            alert('已移出黑名单');
            loadList();
          } else {
            alert('操作失败');
          }
        }
        document.getElementById('addBtn').onclick = async () => {
          const email = document.getElementById('blockEmail').value.trim();
          const reason = document.getElementById('blockReason').value.trim();
          if (!email) return alert('请输入邮箱');
          const res = await fetch('/api/admin/blacklist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, reason })
          });
          if (res.ok) {
            alert('已加入黑名单，该用户下次登录将被拒绝');
            document.getElementById('blockEmail').value = '';
            document.getElementById('blockReason').value = '';
            loadList();
          } else {
            alert('添加失败，可能已存在');
          }
        };
        loadList();
      </script>
    </body>
    </html>
  `);
});

// ========== 管理后台：查看所有已访问用户 ==========
app.get("/admin/users", async (req, res) => {
  if (!req.session.user || req.session.user !== ADMIN_EMAIL) {
    return res.status(403).send("无权限访问");
  }
  try {
    const users = await User.find().sort({ joinDate: -1 });
    if (!users.length) {
      return res.send("<p>暂无用户数据</p>");
    }
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>已访问用户列表</title>
        <style>
          body { background: #0a0a0a; color: #eee; font-family: system-ui, sans-serif; padding: 2rem; }
          h1 { color: #ffd700; }
          table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
          th, td { border: 1px solid #444; padding: 8px 12px; text-align: left; }
          th { background: #1a1a1a; color: #ffd700; }
          img { border-radius: 50%; width: 40px; height: 40px; object-fit: cover; }
          .back-link { display: inline-block; margin-bottom: 20px; color: #ffd700; text-decoration: none; border: 1px solid #ffd700; padding: 6px 12px; border-radius: 30px; }
        </style>
      </head>
      <body>
        <a href="/admin/blacklist" class="back-link">← 黑名单管理</a>
        <a href="/" class="back-link" style="margin-left: 10px;">← 返回首页</a>
        <h1>📋 已登录用户列表 (共${users.length}人)</h1>
        <table>
          <thead>
            <tr><th>头像</th><th>邮箱</th><th>用户名</th><th>注册/首次登录时间</th><th>个人简介</th></tr>
          </thead>
          <tbody>
    `;
    for (const u of users) {
      html += `
        <tr>
          <td><img src="${u.avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"}" onerror="this.src='https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'"></td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.username || "-")}</td>
          <td>${u.joinDate ? new Date(u.joinDate).toLocaleString() : "-"}</td>
          <td>${escapeHtml(u.bio || "-")}</td>
        </tr>
      `;
    }
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("读取用户数据失败");
  }
});

// ========== 管理后台：查看反馈列表 ==========
app.get("/admin/feedbacks", async (req, res) => {
  if (!req.session.user || req.session.user !== ADMIN_EMAIL) {
    return res.status(403).send("无权限访问");
  }
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(100);
    if (!feedbacks.length) {
      return res.send("<p>暂无反馈数据</p>");
    }
    let html = `<h1>用户反馈列表 (共${feedbacks.length}条)</h1><ul>`;
    for (const fb of feedbacks) {
      html += `<li><strong>${fb.createdAt.toLocaleString()}</strong> - ${fb.user} - ${fb.type}<br>${fb.description.substring(0, 200)}${fb.description.length > 200 ? "..." : ""}</li>`;
    }
    html += "</ul>";
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("读取反馈失败");
  }
});

// ========== 临时清理路由（仅调试用） ==========
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
