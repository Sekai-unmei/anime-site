const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

const animeSchema = new mongoose.Schema({}, { strict: false, collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 数据库连接成功');

        const animes = await Anime.find().sort({ _id: 1 });
        let updatedCount = 0;

        for (let i = 0; i < animes.length; i++) {
            const doc = animes[i];
            // 如果已有 id 字段且为数字，则跳过；否则添加
            if (doc.id === undefined || typeof doc.id !== 'number') {
                const newId = i + 1; // 从1开始递增
                await Anime.updateOne({ _id: doc._id }, { $set: { id: newId } });
                console.log(`✅ 为动漫 ${doc.title} 添加 id: ${newId}`);
                updatedCount++;
            } else {
                console.log(`⏭️ 动漫 ${doc.title} 已有 id: ${doc.id}`);
            }
        }
        console.log(`🎉 完成，共更新 ${updatedCount} 个文档`);
        process.exit(0);
    } catch (err) {
        console.error('❌ 出错:', err);
        process.exit(1);
    }
})();