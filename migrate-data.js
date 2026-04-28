const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ⚠️ 请将下面的字符串替换为您从 MongoDB Atlas 获取的实际连接字符串
// 格式：mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/anime_db?retryWrites=true&w=majority
const MONGO_URI = 'mongodb+srv://render_user:Render2024@animer-sj.vjdntz9.mongodb.net/anime_db?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
    .then(() => console.log('数据库连接成功，开始迁移...'))
    .catch(err => { console.error('连接失败:', err); process.exit(1); });

// 定义模型（宽松模式，自动适应字段）
const animeSchema = new mongoose.Schema({}, { strict: false });
const userSchema = new mongoose.Schema({}, { strict: false });
const friendSchema = new mongoose.Schema({}, { strict: false });
const notificationSchema = new mongoose.Schema({}, { strict: false });
const messageSchema = new mongoose.Schema({}, { strict: false });
const noteSchema = new mongoose.Schema({}, { strict: false });

const Anime = mongoose.model('Anime', animeSchema);
const User = mongoose.model('User', userSchema);
const Friend = mongoose.model('Friend', friendSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Message = mongoose.model('Message', messageSchema);
const Note = mongoose.model('Note', noteSchema);

async function migrate() {
    try {
        // 1. 动漫
        const animeData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/anime.json'), 'utf8'));
        await Anime.deleteMany({});
        for (let a of animeData) await Anime.create(a);
        console.log('✅ 动漫数据迁移完成');

        // 2. 用户
        const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json'), 'utf8'));
        await User.deleteMany({});
        for (let [email, data] of Object.entries(usersData)) {
            await User.create({ email, ...data });
        }
        console.log('✅ 用户数据迁移完成');

        // 3. 好友
        const friendsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/friends.json'), 'utf8'));
        await Friend.deleteMany({});
        for (let f of friendsData) await Friend.create(f);
        console.log('✅ 好友数据迁移完成');

        // 4. 通知
        const notifData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/notifications.json'), 'utf8'));
        await Notification.deleteMany({});
        for (let [target, arr] of Object.entries(notifData)) {
            for (let n of arr) {
                await Notification.create({ targetUser: target, ...n });
            }
        }
        console.log('✅ 通知数据迁移完成');

        // 5. 消息
        const msgData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/messages.json'), 'utf8'));
        await Message.deleteMany({});
        for (let [key, msgs] of Object.entries(msgData)) {
            for (let m of msgs) {
                await Message.create({ key, ...m });
            }
        }
        console.log('✅ 消息数据迁移完成');

        // 6. 备注
        const notesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/friend_notes.json'), 'utf8'));
        await Note.deleteMany({});
        for (let [user, friends] of Object.entries(notesData)) {
            for (let [friend, note] of Object.entries(friends)) {
                await Note.create({ userEmail: user, friendEmail: friend, note });
            }
        }
        console.log('✅ 备注数据迁移完成');

        console.log('🎉 所有数据迁移成功！');
        process.exit(0);
    } catch (err) {
        console.error('❌ 迁移失败:', err);
        process.exit(1);
    }
}

migrate();