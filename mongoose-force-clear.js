const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI).then(async () => {
    const Anime = mongoose.model('Anime', new mongoose.Schema({}, { strict: false, collection: 'animes' }));

    const result = await Anime.updateMany(
        {}, // 匹配所有文档
        {
            $set: {
                user_ratings: {},
                ratings: { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 }
            }
        }
    );

    console.log(`✅ 已更新 ${result.modifiedCount} 个文档`);
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });