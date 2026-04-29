const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI).then(async () => {
    const Anime = mongoose.model('Anime', new mongoose.Schema({}, { strict: false, collection: 'animes' }));
    await Anime.updateMany({}, {
        $set: {
            ratings: { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 },
            user_ratings: {}
        }
    });
    console.log('✅ 已成功重置所有动漫的评分数据');
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });