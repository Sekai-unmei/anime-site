// reset-animes.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGO_URI =
  "mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority";

const animeSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "animes" },
);
const Anime = mongoose.model("Anime", animeSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ 数据库连接成功");

    // 删除整个集合（也可以只用 deleteMany）
    await Anime.collection.drop();
    console.log("🗑️ 已删除 animes 集合");

    // 读取完整 JSON
    const dataPath = path.join(__dirname, "data", "anime.json");
    const rawData = fs.readFileSync(dataPath, "utf8");
    const animeData = JSON.parse(rawData);
    console.log(`📄 从文件读取到 ${animeData.length} 条动漫数据`);

    // 重新插入
    await Anime.insertMany(animeData);
    console.log(`✅ 成功导入 ${animeData.length} 条动漫数据`);

    const count = await Anime.countDocuments();
    console.log(`📊 当前文档数: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ 出错:", err);
    process.exit(1);
  }
})();
