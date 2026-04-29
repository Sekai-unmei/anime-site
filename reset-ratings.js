const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI).then(async () => {
    const Anime = mongoose.model('Anime', new mongoose.Schema({}, { strict: false, collection: 'animes' }));

    // 将所有文档的 user_ratings 转为普通对象，并重置 ratings 为 0
    const docs = await Anime.find({});
    for (let doc of docs) {
        let ur = doc.user_ratings;
        if (ur instanceof Map) {
            const obj = {};
            for (let [k, v] of ur.entries()) obj[k] = v;
            ur = obj;
        } else if (!ur || typeof ur !== 'object') {
            ur = {};
        }
        doc.user_ratings = ur;
        doc.ratings = { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 };
        await doc.save();
        console.log(`✅ 重置《${doc.title}》的评分数据`);
    }
    console.log('🎉 完成');
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });