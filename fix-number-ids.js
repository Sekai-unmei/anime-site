const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

const animeSchema = new mongoose.Schema({}, { strict: false, collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

// JOJO 系列的所有数字 ID 及其对应的标题（用于验证）
const JOJO_IDS = [178, 179, 180, 181, 182, 183, 184, 185, 186, 187];

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 数据库连接成功');

        // 1. 检查所有 JOJO 系列文档
        const allJojo = await Anime.find({ series_title: /jojo/i });
        console.log(`找到 ${allJojo.length} 个 JOJO 相关文档`);

        // 2. 为每个文档设置正确的数字 id (基于数组顺序)
        for (let i = 0; i < allJojo.length; i++) {
            const doc = allJojo[i];
            const expectedId = JOJO_IDS[i];
            if (!doc.id || doc.id !== expectedId) {
                doc.id = expectedId;
                await doc.save();
                console.log(`✅ 为《${doc.title}》设置 id = ${expectedId}`);
            } else {
                console.log(`⏭️ 《${doc.title}》已有正确 id = ${doc.id}`);
            }
        }

        // 3. 验证通过 id 查询能否找到
        for (const id of JOJO_IDS) {
            const doc = await Anime.findOne({ id });
            if (doc) {
                console.log(`✓ id ${id} 对应: ${doc.title}`);
            } else {
                console.error(`✗ id ${id} 未找到对应文档`);
            }
        }

        console.log('🎉 修复完成');
        process.exit(0);
    } catch (err) {
        console.error('❌ 出错:', err);
        process.exit(1);
    }
})();