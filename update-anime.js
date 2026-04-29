// update-anime.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

const animeSchema = new mongoose.Schema({}, { strict: false, collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 数据库连接成功');

        const newData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'anime.json'), 'utf8'));
        console.log(`📄 从文件读取到 ${newData.length} 条动漫数据`);

        for (const newAnime of newData) {
            let existing = await Anime.findOne({ id: newAnime.id });
            if (!existing) {
                await Anime.create(newAnime);
                console.log(`✅ 新增动漫《${newAnime.title}》`);
                continue;
            }

            // 保留原有评论和用户评分
            const oldComments = existing.comments || [];
            const oldUserRatings = existing.user_ratings || {};

            // 更新基础字段
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
                    $setOnInsert: { comments: oldComments, user_ratings: oldUserRatings }
                }
            );
            console.log(`♻️ 更新动漫《${newAnime.title}》基础信息，评论和评分已保留`);
        }

        console.log('🎉 增量更新完成');
        process.exit(0);
    } catch (err) {
        console.error('❌ 出错:', err);
        process.exit(1);
    }
})();