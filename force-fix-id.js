const mongoose = require('mongoose');
const uri = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
    const Anime = mongoose.model('Anime', new mongoose.Schema({}, { strict: false, collection: 'animes' }));
    const docs = await Anime.find({}).sort({ _id: 1 });
    for (let i = 0; i < docs.length; i++) {
        docs[i].id = i + 1;
        await docs[i].save();
        console.log(`✅ 为《${docs[i].title}》设置 id = ${i + 1}`);
    }
    console.log('🎉 所有文档的 id 已更新为数字 1～191');
    process.exit(0);
}).catch(err => console.error(err));