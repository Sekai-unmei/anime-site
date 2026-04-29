const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI).then(async () => {
    const Anime = mongoose.model('Anime', new mongoose.Schema({}, { strict: false, collection: 'animes' }));
    const docs = await Anime.find({});
    let fixedCount = 0;

    for (let doc of docs) {
        let original = doc.user_ratings;
        let newUR = {};
        let changed = false;

        // 处理数组：将 [{email: rating}, ...] 转换成 {email: rating}
        if (Array.isArray(original)) {
            console.log(`⚠️ ${doc.title}: user_ratings 是数组，长度 ${original.length}`);
            for (let item of original) {
                if (typeof item === 'object') {
                    for (let [email, rating] of Object.entries(item)) {
                        if (rating) newUR[email] = rating;
                    }
                } else if (typeof item === 'string') {
                    let parts = item.split(':');
                    if (parts.length === 2) newUR[parts[0]] = parts[1];
                }
            }
            changed = true;
        }
        // 处理 Map
        else if (original instanceof Map) {
            for (let [k, v] of original.entries()) newUR[k] = v;
            changed = true;
        }
        // 处理普通对象
        else if (typeof original === 'object' && original !== null) {
            newUR = original;
        }
        // 其他情况重置为空对象
        else {
            newUR = {};
            changed = true;
        }

        // 重新计算评分统计
        const newRatings = { 神作: 0, 好看: 0, 普通: 0, 无聊: 0, 狗屎: 0 };
        for (let rating of Object.values(newUR)) {
            if (newRatings[rating] !== undefined) newRatings[rating]++;
        }

        // 更新文档
        if (changed || JSON.stringify(doc.ratings) !== JSON.stringify(newRatings)) {
            doc.user_ratings = newUR;
            doc.ratings = newRatings;
            await doc.save();
            console.log(`✅ ${doc.title}: 修复后用户评分: ${JSON.stringify(newUR)}`);
            fixedCount++;
        } else {
            console.log(`✔️ ${doc.title}: 已正常`);
        }
    }
    console.log(`🎉 修复完成，共处理 ${fixedCount} 个文档`);
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });