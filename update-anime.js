const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGO_URI =
  "mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000";

const animeSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "animes" },
);
const Anime = mongoose.model("Anime", animeSchema);

(async () => {
  try {
    console.log("🔌 正在连接 MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ 数据库连接成功");

    const dataPath = path.join(__dirname, "data", "anime.json");
    console.log(`📂 读取文件: ${dataPath}`);
    const rawData = fs.readFileSync(dataPath, "utf8");
    const animeData = JSON.parse(rawData);
    console.log(`📄 从文件读取到 ${animeData.length} 条动漫数据`);

    let added = 0,
      updated = 0;
    for (const newAnime of animeData) {
      let existing = await Anime.findOne({ id: newAnime.id }).lean();
      if (!existing) {
        await Anime.create(newAnime);
        console.log(`✅ 新增 《${newAnime.title}》 (id: ${newAnime.id})`);
        added++;
        continue;
      }

      // 保留原有评论和用户评分
      const oldComments = existing.comments || [];
      const oldUserRatings = existing.user_ratings || {};

      await Anime.updateOne(
        { id: newAnime.id },
        {
          $set: {
            title: newAnime.title,
            image_url: newAnime.image_url,
            description: newAnime.description,
            recommend_text: newAnime.recommend_text,
            genre: newAnime.genre,
            series_title: newAnime.series_title,
            season: newAnime.season,
            rating: newAnime.rating,
            ratings: newAnime.ratings,
          },
          $setOnInsert: { comments: oldComments, user_ratings: oldUserRatings },
        },
      );
      console.log(`♻️ 更新 《${newAnime.title}》 (id: ${newAnime.id})`);
      updated++;
    }

    console.log(`🎉 完成！新增 ${added} 条，更新 ${updated} 条`);
    process.exit(0);
  } catch (err) {
    console.error("❌ 出错:", err);
    process.exit(1);
  }
})();
