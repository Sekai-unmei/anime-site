console.log("1. 脚本开始");
const mongoose = require("mongoose");
console.log("2. mongoose 模块加载完成");

const MONGO_URI =
  "mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000";

console.log("3. 准备连接 MongoDB");
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ 连接成功");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ 连接失败:", err.message);
    process.exit(1);
  });
console.log("4. connect 调用已发出，等待回掉");
