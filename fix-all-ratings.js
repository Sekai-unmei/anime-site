const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

const animeSchema = new mongoose.Schema({}, { strict: false, collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

async function fix() {
    await mongoose.connect(MONGO_URI);
    const docs = await Anime.find({});
    for (let doc of docs) {
        // 1. 规范化 user_ratings
        let ur = doc.user_ratings;
        let fixed = false;
        let newUR = {};

        if (ur === null || ur === undefined) {
            ur = {};
            fixed = true;
        }
        if (ur instanceof Map) {
            for (let [k, v] of ur.entries()) newUR[k] = v;
            fixed = true;
        } else if (Array.isArray(ur)) {
            // 如果是数组，取最后一个元素（假设格式 {user, rating}）
            if (ur.length > 0) {
                const last = ur[ur.length - 1];
                if (last && last.user && last.rating) newUR[last.user] = last.rating;
                else console.warn(`数组格式异常: ${doc.title}`);
            }
            fixed = true;
        } else if (typeof ur === 'object') {
            // 普通对象，直接使用
            newUR = ur;
            // 但需要删除重复key？不会重复
        } else {
            newUR = {};
            fixed = true;
        }

        // 2. 重新计算 ratings
        const newRatings = { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 };
        for (let rating of Object.values(newUR)) {
            if (newRatings[rating] !== undefined) newRatings[rating]++;
            else console.warn(`未知评分类型: ${rating}`);
        }

        // 3. 更新文档
        if (fixed || JSON.stringify(doc.user_ratings) !== JSON.stringify(newUR) ||
            JSON.stringify(doc.ratings) !== JSON.stringify(newRatings)) {
            doc.user_ratings = newUR;
            doc.ratings = newRatings;
            await doc.save();
            console.log(`修复: ${doc.title} -> user_ratings: ${JSON.stringify(newUR)}, ratings: ${JSON.stringify(newRatings)}`);
        } else {
            console.log(`跳过: ${doc.title} 已正常`);
        }
    }
    console.log('修复完成');
    process.exit(0);
}

fix().catch(console.error);