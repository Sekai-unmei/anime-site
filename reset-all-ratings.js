const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

const animeSchema = new mongoose.Schema({}, { strict: false, collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

const voteSchema = new mongoose.Schema({
    userId: String,
    animeId: Number,
    type: String,
    updatedAt: Date
});
const Vote = mongoose.model('Vote', voteSchema);

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ 连接成功，开始清空所有评分...");

        // 1. 清空 Vote 集合
        const voteDel = await Vote.deleteMany({});
        console.log(`🗑️ 已删除 ${voteDel.deletedCount} 条投票记录`);

        // 2. 重置所有动漫的 ratings 字段
        const animeUpd = await Anime.updateMany(
            {},
            { $set: { ratings: { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 } } }
        );
        console.log(`📊 已重置 ${animeUpd.modifiedCount} 部动漫的 ratings`);

        console.log("🎉 清空完成！现在所有评分均为 0。");
        process.exit(0);
    } catch (err) {
        console.error("❌ 清空失败:", err);
        process.exit(1);
    }
})();