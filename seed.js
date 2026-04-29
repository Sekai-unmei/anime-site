// seed.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // 加载本地 .env 文件（如果在本地运行）

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error("请先设置 MONGO_URI 环境变量，例如： export MONGO_URI='你的连接字符串'");
    process.exit(1);
}

// 定义 Anime 模型，强制指向 'animes' 集合
const animeSchema = new mongoose.Schema({}, { strict: false, collection: 'animes' });
const Anime = mongoose.model('Anime', animeSchema);

(async () => {
    try {
        await mongoose.connect(uri);
        console.log("✅ 数据库连接成功");

        // 读取你的完整数据
        const dataPath = path.join(__dirname, 'data', 'anime.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const animeData = JSON.parse(rawData);
        console.log(`📄 从文件读取到 ${animeData.length} 条动漫数据`);

        // 清空旧的 animes 集合
        await Anime.deleteMany({});
        console.log("🗑️  已清空 'animes' 集合");

        // 插入新数据
        await Anime.insertMany(animeData);
        console.log(`✅ 成功导入 ${animeData.length} 条数据到 'animes' 集合`);

        process.exit(0);
    } catch (err) {
        console.error("❌ 种子脚本执行失败:", err);
        process.exit(1);
    }
})();