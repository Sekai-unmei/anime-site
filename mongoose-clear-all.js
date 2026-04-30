const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

// 定义 Vote 模型（必须与 server.js 中一致）
const voteSchema = new mongoose.Schema({
    userId: String,
    animeId: Number,
    type: String,
    updatedAt: Date
});
const Vote = mongoose.model('Vote', voteSchema);


// 定义 Anime 模型
const animeSchema = new mongoose.Schema({}, { strict: false, collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 数据库连接成功');

        // 1. 彻底删除 votes 集合中的所有文档
        const deleteResult = await Vote.deleteMany({});
        console.log(`🗑️ 已删除 ${deleteResult.deletedCount} 条投票记录`);

        // 2. 重置所有动漫的 ratings 字段为全 0
        const updateResult = await Anime.updateMany(
            {},
            { $set: { ratings: { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 } } }
        );
        console.log(`📊 已重置 ${updateResult.modifiedCount} 部动漫的 ratings`);

        console.log('🎉 清理完成！现在 votes 集合为空，所有动漫票数为 0。');
        process.exit(0);
    } catch (err) {
        console.error('❌ 失败:', err);
        process.exit(1);
    }
})();