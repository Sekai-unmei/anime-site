
/**
 * Animer 资料站核心逻辑控制 (最终稳定版)
 * 功能：增量更新、持续粒子、连线精准、触底四溅
 */

// --- 1. 数据库定义 (完整版，包含细分天气语录) ---
const EMOTION_DB = {
    "weather_base": {
        "晴天": {
            "凌晨": ["黎明尚未到来 接下来的每一秒都会无比的漫长", "世界仍未苏醒 正是进攻的大好时机!", "万物皆在沉睡 唯我独醒"],
            "早上": ["太阳照射在了这片残破的大地之上 给予了最后的温暖", "早晨的太阳是如此的温柔 包裹住了这样的我", "不错的阳光 只可惜这份阳光有些温暖又有点耀眼 对于活在此处的生物而言 简直就是既渴望 但又不可触碰的存在啊..."],
            "中午": ["些许的炽热 但也仅现此时"],
            "傍晚": ["夕阳在大地边缘垂死挣扎，金色的余晖碎了一地。", "黄昏是白昼与黑夜的交界，也是观测最不稳定的时刻。"],
            "晚上": ["繁星是宇宙的冷笑话，但今晚格外的冷。", "今晚视野良好，可以俯瞰一下城市或者世界了。"],
            "通用": ["阳光刺破云层，此刻万物皆为观测对象。", "光子在跃动，似乎在诉说着某个远方的故事。"]
        },
        "雨": {
            "早上": ["雨声掩盖了城市的喧嚣，这是一个适合沉思的清晨。"],
            "中午": ["午间的暴雨，洗去了数据中的浮躁。", "这种天气，适合躲在观测站里喝一杯热咖啡。"],
            "晚上": ["雨滴敲击窗棂的声音，是黑夜最温柔的伴奏。", "雨夜，总是让观测者的思绪飘得很远。"],
            "通用": ["雨啊 雨啊 请尽情的淋落在我等的身上吧!", "雨天适合在家听着雨声，雨停后可以去找蜗牛🐌了"]
        },
        "阴天": {
            "白天": ["灰色的幕布下，世界在静默中低语。", "没有阳光的白昼，世界显得格外真实。"],
            "晚上": ["阴云遮蔽了星光，观测站陷入了纯粹的暗。", "看不见月亮或者是星空的夜晚，总觉得少了点什么。"],
            "通用": ["看好了 什么叫一剑破天门!", "云层压得很低，心事也随之变得厚重。", "阴沉的天气,宛如我前方的道路一样,死气沉沉啊..."]
        },
        "多云": { "通用": ["云影在大地漫步，观测站捕捉到了漂浮的思绪。", "半明半暗之间，真实与幻想的界限开始模糊。", "世界的力量似乎开始了分散?"] },
        "雾": { "通用": ["视界被浓雾吞噬，坐标正在迷失。", "在混沌的白芒中，你还能看清自己的路吗？", "迷雾之中，必有异象。"] },
        "雪": { "通用": ["可以玩雪了耶 打雪仗、堆雪人、雪雕... 哈哈", "雪? 对于住在南方的我来说 实在是新奇"] },
        "雷雨": { "通用": ["电荷在空气中狂欢，雷鸣是神明的怒吼。", "特大暴雨⛈️触发... 观测站电力系统负载警告。"] },
        "风": {
            "通用": ["不错的风,吹走了身上的负担"],
            "晚上": ["我独占高楼,衣发随风飘"]
        },
        // ========== 新增细分天气语录 ==========
        "小雨": { "通用": ["细雨绵绵，适合发呆。", "雨丝如线，织成一张温柔的网。"] },
        "大雨": { "通用": ["大雨倾盆，世界被洗刷。", "雨声如鼓，敲打着每个人的心事。"] },
        "阵雨": { "通用": ["阵雨匆匆，来得快去得也快。", "一阵急雨过后，空气格外清新。"] },
        "中阵雨": { "通用": ["雨势渐强，快找地方躲避。", "中雨阵阵，天色昏暗。"] },
        "小雪": { "通用": ["细雪飘零，寒意渐浓。", "点点雪花，像是天空的碎屑。"] },
        "大雪": { "通用": ["大雪封路，万物寂静。", "漫天飞雪，世界被重新塑造。"] },
        "雪粒": { "通用": ["冰晶般的雪粒洒落，像细砂糖。"] },
        "阵雪": { "通用": ["雪花一阵阵飘落，时急时缓。"] },
        "中阵雪": { "通用": ["雪势加大，天地苍茫。"] },
        "冰雹": {
            "通用": ["冰雹如石，快找地方躲避！", "天空下起了冰雹，请保护好你的爱车。", "冰雹敲击窗棂，像是天空的鼓点。"]
        },
        "恶劣天气": {
            "通用": ["这既是天灾吗...", "恶劣天气警告！请勿外出！", "沙尘暴/龙卷风逼近，立即寻找掩体！"]
        }
    },
    "seasonal_special": {
        "春": {
            "晴天": {
                "凌晨": ["万物仍在沉睡", "在黑暗中积蓄"],
                "中午": ["阳光正在旺盛"],
                "下午": ["温暖的阳光照射在草地之上,好像就这么睡上一觉啊!"],
                "晚上": ["月亮的主场"]
            },
            "雨": ["春雨如油"], "刮风": ["春天的风 是我感受到过最温柔的"], "通用": ["万物萌发的季节"]
        },
        "夏": { "晴天": ["无限月读?"], "通用": ["蝉鸣聒噪"] },
        "秋": {
            "通用": ["枯叶随风而逝", "秋季已到,丰收将至,甚好、甚好..."],
            "风": {
                "通用": ["秋天的风,带有一股谷物的味道"],
                "晚上": ["枯叶随风飘,带有哗哗声,老夫独坐园椅上,享受着死亡的来临"],
            },
        },
        "冬": { "通用": ["万籁俱寂"] }
    },
    "默认": ["混蛋的开始 亦是终结的开始"]
};

const poemContent = ["今天又想找些什么呢", "今天难道也是无聊的一天吗", "今天难道也和往常那样吗", "今天难道也不曾作出改变吗", "今天仍旧是无可救药的一天吗", "今天真的就这样吗", "今天的今天 亦是过去的今天 亦是 未来的今天", "因此 今日 依旧是那今日吗"];

// ========== 时区映射（仅国家首都） ==========
const countryTimezoneMap = {
    "中国": "Asia/Shanghai",
    "日本": "Asia/Tokyo",
    "韩国": "Asia/Seoul",
    "美国": "America/New_York",
    "英国": "Europe/London",
    "法国": "Europe/Paris",
    "德国": "Europe/Berlin",
    "俄罗斯": "Europe/Moscow",
    "澳大利亚": "Australia/Sydney",
    "加拿大": "America/Toronto",
    "印度": "Asia/Kolkata",
    "巴西": "America/Sao_Paulo"
    // 可根据需要继续补充主流国家
};

// --- 2. 状态控制 ---
const RADIUS = {
    MAIN: 55,
    SUB: 40,
    MONTH: 68,
    TAG: 38,
    YEAR_TAG: 25
};

let currentChoice = { years: [], months: [], tags: [] };
let camX = 0, camY = 0;
let isDragging = false;
let lastMouseX, lastMouseY;

// --- 3. 环境与生存系统 (天气/定位/时钟/音频) ---

function getPeriodByHour(hour) {
    if (hour >= 6 && hour < 9) return "早上";
    if (hour >= 9 && hour < 12) return "上午";
    if (hour >= 12 && hour < 14) return "中午";
    if (hour >= 14 && hour < 18) return "下午";
    if (hour >= 18 && hour < 20) return "傍晚";
    if (hour >= 20 || hour < 6) return "晚上";
    return "凌晨";
}

function getCustomTime() {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const planet = profile.planet || '地球';
    if (planet !== '地球') {
        const randomHour = Math.floor(Math.random() * 100);
        const randomMin = Math.floor(Math.random() * 100);
        return { timeStr: `${randomHour}:${randomMin}:??`, period: '混乱' };
    }

    let timezone = null;
    const country = profile.country || '';
    if (country && countryTimezoneMap[country]) {
        timezone = countryTimezoneMap[country];
    }
    if (!timezone && country === '中国') timezone = 'Asia/Shanghai';
    if (!timezone) {
        // 回退到本地时间
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
        const hour = now.getHours();
        return { timeStr, period: getPeriodByHour(hour) };
    }

    try {
        // 使用 formatToParts 获取小时，更可靠
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('zh-CN', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const parts = formatter.formatToParts(now);
        const hourPart = parts.find(p => p.type === 'hour');
        const minutePart = parts.find(p => p.type === 'minute');
        const secondPart = parts.find(p => p.type === 'second');
        let hour = hourPart ? parseInt(hourPart.value, 10) : now.getHours();
        let minute = minutePart ? minutePart.value : '00';
        let second = secondPart ? secondPart.value : '00';
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute}:${second}`;
        // 重新通过构造该时区的时间对象获取小时（备用）
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const tzHour = isNaN(tzDate.getTime()) ? hour : tzDate.getHours();
        const period = getPeriodByHour(tzHour);
        return { timeStr, period };
    } catch (e) {
        console.error("时区格式化失败", e);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
        const hour = now.getHours();
        return { timeStr, period: getPeriodByHour(hour) };
    }
}

function updateCustomClock() {
    const { timeStr, period } = getCustomTime();
    // 修改：更新 index.html 中的 #time 元素，而不是 #custom-clock
    const timeDiv = document.getElementById('time');
    if (timeDiv) {
        timeDiv.innerText = timeStr;
    } else {
        console.warn("未找到 #time 元素，请确保 index.html 中包含 <div id='time'></div>");
    }
    const subtitle = document.getElementById('calendar-subtitle');
    if (subtitle) subtitle.innerText = `[ 观测时间节点 · ${period} ]`;
}

function initSearchBox() {
    const searchBox = document.querySelector('.search-box');
    if (!searchBox) return;
    // 避免重复绑定：克隆替换，移除旧监听器
    const newBox = searchBox.cloneNode(true);
    searchBox.parentNode.replaceChild(newBox, searchBox);
    newBox.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const val = newBox.value.trim();
            if (!val) return;
            try {
                const res = await fetch(`/api/anime/series?title=${encodeURIComponent(val)}`);
                const seriesData = await res.json();
                if (seriesData.length > 0) {
                    const seriesTitle = seriesData[0].series_title || seriesData[0].title;
                    window.location.href = `/series.html?title=${encodeURIComponent(seriesTitle)}`;
                } else {
                    window.location.href = `/search.html?keyword=${encodeURIComponent(val)}`;
                }
            } catch (err) {
                console.error('系列检测失败', err);
                window.location.href = `/search.html?keyword=${encodeURIComponent(val)}`;
            }
        }
    });
}
function updateCalendarSubtitle() {
    updateCustomClock();            // 更新时间显示和 subtitle
    return getPeriodByHour(new Date().getHours());  // 仅返回时段供天气使用
}
async function initEnvironment() {
    const success = (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude);
    const error = () => fetchWeatherData(43.8, 11.1);
    navigator.geolocation.getCurrentPosition(success, error, { timeout: 5000 });
}

async function fetchWeatherData(lat, lon) {
    try {
        const gRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
        const g = await gRes.json();
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        const locationParts = [profile.planet, profile.country, profile.region].filter(p => p && p.trim());
        if (locationParts.length === 0) {
            // 只有未自定义位置时，才显示真实地理位置
            document.getElementById('geo-display').innerText = `地球 · ${g.countryName} · ${g.city || g.locality}`;
        }
        // 天气数据获取不受影响
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,cloud_cover&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const wRes = await fetch(url);
        const w = await wRes.json();
        renderWeatherUI(w);
    } catch (e) {
        document.getElementById('geo-display').innerText = "星际同步中断";
        renderWeatherUI({ current: { temperature_2m: 25, weather_code: 0, relative_humidity_2m: 50, wind_speed_10m: 5, wind_direction_10m: 180, uv_index: 3, cloud_cover: 20 }, daily: { temperature_2m_max: [28], temperature_2m_min: [18] } });
    }
}

function windDirection(deg) {
    const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    return dirs[Math.round(deg / 45) % 8];
}

function getWindLevel(speedKmh) {
    if (speedKmh < 5) return "微风";
    if (speedKmh < 20) return "风";
    if (speedKmh < 40) return "大风";
    if (speedKmh < 70) return "狂风";
    return "龙卷风";
}

function renderWeatherUI(data) {
    const cur = data.current;
    const daily = data.daily;
    const period = updateCalendarSubtitle();

    // 天气代码映射表（冰雹代码 90-94 改为 "冰雹"）
    const codes = {
        0: "晴天", 1: "晴天", 2: "多云", 3: "阴天",
        45: "雾", 48: "雾",
        51: "小雨", 53: "小雨", 55: "小雨",
        61: "雨", 63: "雨", 65: "大雨",
        80: "阵雨", 81: "中阵雨", 82: "大阵雨",
        71: "小雪", 73: "雪", 75: "大雪",
        77: "雪粒", 85: "阵雪", 86: "中阵雪",
        95: "雷雨", 96: "雷雨", 99: "雷雨",
        // 冰雹全部改为 "冰雹"
        90: "冰雹", 91: "冰雹", 92: "冰雹", 93: "冰雹", 94: "冰雹",
        // 恶劣天气
        30: "恶劣天气", 31: "恶劣天气", 32: "恶劣天气", 33: "恶劣天气",
        34: "恶劣天气", 35: "恶劣天气", 36: "恶劣天气", 37: "恶劣天气",
        38: "恶劣天气", 39: "恶劣天气", 40: "恶劣天气", 41: "恶劣天气",
        42: "恶劣天气", 43: "恶劣天气", 44: "恶劣天气", 49: "恶劣天气",
        56: "恶劣天气", 57: "恶劣天气", 66: "恶劣天气", 67: "恶劣天气",
        83: "恶劣天气", 84: "恶劣天气",
        97: "恶劣天气", 98: "恶劣天气"
    };

    let typeKey = codes[cur.weather_code];
    if (!typeKey) typeKey = "晴天";

    const windSpeed = cur.wind_speed_10m;
    const windLevel = getWindLevel(windSpeed);
    if (windLevel === "龙卷风") {
        typeKey = "恶劣天气";
    }

    document.getElementById('weather-brief').innerText = typeKey;

    const quotes = EMOTION_DB.weather_base[typeKey]?.[period] ||
        EMOTION_DB.weather_base[typeKey]?.["通用"] ||
        EMOTION_DB["默认"];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    let dryness = "适中";
    if (cur.relative_humidity_2m < 30) dryness = "干燥";
    else if (cur.relative_humidity_2m > 60) dryness = "湿润";

    let windIcon = "";
    if (windLevel === "微风") windIcon = "🍃";
    else if (windLevel === "风") windIcon = "🌬️";
    else if (windLevel === "大风") windIcon = "💨";
    else if (windLevel === "狂风") windIcon = "🌪️";
    else if (windLevel === "龙卷风") windIcon = "🌀";

    let extraWarning = "";
    if (windLevel === "龙卷风") {
        extraWarning = '<div style="color: #ff4444;">⚠️ 龙卷风警报！立即寻找避难所！⚠️</div>';
    } else if (windLevel === "狂风") {
        extraWarning = '<div style="color: #ffaa66;">⚠️ 狂风预警，注意高空坠物</div>';
    }

    const moreHtml = `
        <div style="margin-top: 12px; font-size: 0.85rem; color: #ccc; line-height: 1.6;">
            <div>「 ${quote} 」</div>
            <hr style="border-color:#333; margin:8px 0;">
            <div>🌡️ 当前温度：${cur.temperature_2m}°C</div>
            <div>📈 最高温：${daily.temperature_2m_max[0]}°C / 📉 最低温：${daily.temperature_2m_min[0]}°C</div>
            <div>💧 湿度：${cur.relative_humidity_2m}%  ·  ${dryness}</div>
            <div>☁️ 云量：${cur.cloud_cover}%</div>
            <div>${windIcon} 风速：${windSpeed} km/h (${windLevel})  ·  🧭 风向：${windDirection(cur.wind_direction_10m)}</div>
            <div>☀️ 紫外线指数：${cur.uv_index} ${cur.uv_index >= 8 ? '(极强)' : (cur.uv_index >= 6 ? '(强)' : (cur.uv_index >= 3 ? '(中等)' : '(弱)'))}</div>
            ${extraWarning}
        </div>
    `;

    const moreDiv = document.getElementById('weather-more');
    if (moreDiv) {
        moreDiv.innerHTML = moreHtml;
        moreDiv.style.maxHeight = "0px";
        moreDiv.style.overflow = "hidden";
        moreDiv.style.transition = "max-height 0.4s ease-out";
    }
    const arrow = document.getElementById('weather-arrow');
    if (arrow) arrow.style.transform = "rotate(0deg)";
}

// 天气详情折叠/展开函数（供 HTML 调用）
function toggleWeather() {
    const m = document.getElementById('weather-more');
    const a = document.getElementById('weather-arrow');
    if (!m) return;
    if (m.style.maxHeight === "0px" || !m.style.maxHeight) {
        m.style.maxHeight = m.scrollHeight + "px";
        if (a) a.style.transform = "rotate(180deg)";
    } else {
        m.style.maxHeight = "0px";
        if (a) a.style.transform = "rotate(0deg)";
    }
}
function playWelcomeAudio() {
    const welcomeAudios = [
        '/audio/world1.m4a',
        '/audio/world2.m4a',
        '/audio/world3.m4a',
        '/audio/world4.m4a',
        '/audio/world5.m4a'
    ];
    const randomIndex = Math.floor(Math.random() * welcomeAudios.length);
    const audio = new Audio(welcomeAudios[randomIndex]);
    audio.volume = 0.5;
    audio.play().catch(e => console.log("播放被拦截:", e));
}

// --- 4. 简单粒子系统 (CSS动画) ---
function spawnParticles(x, y, color, isYear = false) {
    const camera = document.getElementById('camera');
    const count = 8;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = isYear ? 'white-particle' : 'particle';
        const tx = (Math.random() - 0.5) * 30;
        const ty = -Math.random() * 80 - 20;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        if (!isYear) p.style.background = color;
        camera.appendChild(p);
        setTimeout(() => p.remove(), 1500);
    }
}

// --- 5. 连线与节点渲染 ---
function drawGradientLine(x1, y1, x2, y2, r1, r2, baseColor, isActive, type = 'line') {
    const svg = document.getElementById('link-svg');
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const sx = x1 + Math.cos(angle) * r1;
    const sy = y1 + Math.sin(angle) * r1;
    const ex = x2 - Math.cos(angle) * r2;
    const ey = y2 - Math.sin(angle) * r2;
    const gradId = `grad-${Date.now()}-${Math.random()}`;
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", gradId);
    gradient.setAttribute("x1", sx);
    gradient.setAttribute("y1", sy);
    gradient.setAttribute("x2", ex);
    gradient.setAttribute("y2", ey);
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    const lightColor = lightenColor(baseColor, 40);
    const darkColor = baseColor;
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", lightColor);
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", darkColor);
    const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", lightColor);
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    svg.appendChild(gradient);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("data-type", type);
    line.setAttribute("x1", sx);
    line.setAttribute("y1", sy);
    line.setAttribute("x2", ex);
    line.setAttribute("y2", ey);
    line.setAttribute("stroke", `url(#${gradId})`);
    line.setAttribute("stroke-width", isActive ? "3" : "1.5");
    if (isActive) {
        line.style.filter = `drop-shadow(0 0 8px ${baseColor})`;
        line.style.opacity = "1";
    } else {
        line.style.opacity = "0.3";
    }
    svg.appendChild(line);
    return { start: { x: sx, y: sy }, end: { x: ex, y: ey } };
}

function lightenColor(hex, percent) {
    if (hex === '#1E90FF') return '#66CCFF';
    if (hex === '#22C55E') return '#8BEC9B';
    if (hex === '#FF4500') return '#FFA07A';
    if (hex === '#FF8C00') return '#FFB347';
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    r = Math.min(255, r + Math.floor(255 * percent / 100));
    g = Math.min(255, g + Math.floor(255 * percent / 100));
    b = Math.min(255, b + Math.floor(255 * percent / 100));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function createNode(txt, x, y, cls, onClick) {
    const camera = document.getElementById('camera');
    const div = document.createElement('div');
    div.className = `node-item ${cls}`;
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.innerHTML = `<span>${txt}</span>`;
    div.onclick = onClick;
    camera.appendChild(div);
    return div;
}

function createDoubleYearFrame(x, y, w, h) {
    const camera = document.getElementById('camera');
    const outer = document.createElement('div');
    outer.className = 'year-frame-outer';
    outer.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${w}px;
        height: ${h}px;
        border: 2px solid #0066FF;
        box-sizing: border-box;
        pointer-events: none;
        z-index: 5;
    `;
    const inner = document.createElement('div');
    inner.className = 'year-frame-inner';
    inner.style.cssText = `
        position: absolute;
        left: 15px;
        top: 15px;
        width: calc(100% - 30px);
        height: calc(100% - 30px);
        border: 2px solid #66CCFF;
        box-sizing: border-box;
        pointer-events: none;
        box-shadow: 0 0 15px rgba(102, 204, 255, 0.3);
    `;
    outer.appendChild(inner);
    camera.appendChild(outer);
    return {
        outer: { left: x, right: x + w, top: y, bottom: y + h },
        inner: { left: x + 15, right: x + w - 15, top: y + 15, bottom: y + h - 15 }
    };
}

// --- 6. 相机控制 ---
function moveCamera(tx, ty) {
    const cam = document.getElementById('camera');
    camX = window.innerWidth / 2 - tx;
    camY = window.innerHeight / 2 - ty;
    cam.style.transform = `translate(${camX}px, ${camY}px)`;
}

function initDragSystem() {
    const stage = document.getElementById('archive-stage');
    const camera = document.getElementById('camera');
    if (!stage || !camera) return;

    let startX = 0, startY = 0;        // 记录按下的屏幕坐标
    let startCamX = 0, startCamY = 0;   // 记录按下时的相机坐标
    let isDragging = false;
    let dragStartPoint = null;          // 用于判断移动距离是否超过阈值
    const dragThreshold = 8;            // 移动超过 8px 才认为是拖拽

    function onPointerDown(e) {
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        startX = point.clientX;
        startY = point.clientY;
        startCamX = camX;
        startCamY = camY;
        dragStartPoint = { x: startX, y: startY };
        isDragging = false;
        camera.style.transition = 'none';
    }

    function onPointerMove(e) {
        const point = e.touches ? e.touches[0] : e;
        const dx = point.clientX - startX;
        const dy = point.clientY - startY;

        // 判断是否超过拖拽阈值
        if (dragStartPoint && !isDragging) {
            const dist = Math.hypot(point.clientX - dragStartPoint.x, point.clientY - dragStartPoint.y);
            if (dist > dragThreshold) {
                isDragging = true;
            }
        }

        if (isDragging) {
            e.preventDefault();
            camX = startCamX + dx;
            camY = startCamY + dy;
            camera.style.transform = `translate(${camX}px, ${camY}px)`;
        }
    }

    function onPointerUp(e) {
        // 拖拽结束后重置标志
        isDragging = false;
        camera.style.transition = 'transform 0.6s ease-out';
        dragStartPoint = null;
    }

    // 鼠标事件
    stage.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // 触摸事件（移动端）
    stage.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
}
// --- 7. 节点缓存与增量更新 ---
let lastState = '';
let currentFrameBounds = null;
let nodesCache = { years: new Map(), months: new Map(), tags: new Map() };
let svgCache = null;
let particleTimers = {};

function renderArchive(state) {
    const camera = document.getElementById('camera');
    const centerX = 2500, centerY = 2500;
    if (!svgCache) {
        camera.innerHTML = '<svg id="link-svg" style="position:absolute; width:5000px; height:5000px; pointer-events:none;"></svg>';
        svgCache = document.getElementById('link-svg');
    } else if (!camera.contains(svgCache)) {
        camera.appendChild(svgCache);
    }
    const allLines = svgCache.querySelectorAll('line');
    allLines.forEach(line => line.remove());
    const gradients = svgCache.querySelectorAll('linearGradient');
    gradients.forEach(g => g.remove());
    if (!window.particleSystem) {
        window.particleSystem = new ParticleSystem();
    } else if (!camera.contains(window.particleSystem.canvas)) {
        camera.appendChild(window.particleSystem.canvas);
    }
    if (lastState !== state) {
        for (let key in particleTimers) {
            clearInterval(particleTimers[key]);
            delete particleTimers[key];
        }
        if (window.particleSystem && window.particleSystem.linkInterval) {
            clearInterval(window.particleSystem.linkInterval);
            window.particleSystem.linkInterval = null;
        }
        if (window.particleSystem && window.particleSystem.frameInterval) {
            clearInterval(window.particleSystem.frameInterval);
            window.particleSystem.frameInterval = null;
        }
        if (window.particleSystem) {
            window.particleSystem.particles = [];
        }
        const effectParticles = camera.querySelectorAll('.snow-particle, .petal-particle, .heat-particle, .leaf-particle, .tag-particle, .note-particle, .heart-particle, .poop-particle, .hot-particle, .white-particle, .particle');
        effectParticles.forEach(p => p.remove());
        const existingNodes = camera.querySelectorAll('.node-item');
        existingNodes.forEach(node => node.remove());
        const frames = camera.querySelectorAll('.year-frame-outer, .year-frame-inner');
        frames.forEach(frame => frame.remove());
        currentFrameBounds = null;
        nodesCache = { years: new Map(), months: new Map(), tags: new Map() };
        buildScene(state, centerX, centerY);
    } else {
        updateNodeSelection(state);
    }
    lastState = state;
    updateConfirmBtn();
}

function buildScene(state, centerX, centerY) {
    if (state === 'root') {
        moveCamera(centerX, centerY);
        createNode('时间', centerX - 350, centerY, 'main circle', () => renderArchive('time'));
        createNode('类型', centerX, centerY, 'main circle', () => renderArchive('type_grid'));
        createNode('推荐', centerX + 350, centerY, 'main circle', () => {
            window.location.href = '/recommend.html';
        });
    } else if (state === 'time') {
        moveCamera(centerX, centerY);
        createNode('时间', centerX - 400, centerY, 'main circle selected', () => renderArchive('root'));
        createNode('年份', centerX, centerY - 150, 'sub circle', () => renderArchive('year_grid'));
        createNode('月份', centerX, centerY + 150, 'sub circle', () => renderArchive('month_grid'));
        drawGradientLine(centerX - 400, centerY, centerX, centerY - 150, RADIUS.MAIN, RADIUS.SUB, "#888", true);
        drawGradientLine(centerX - 400, centerY, centerX, centerY + 150, RADIUS.MAIN, RADIUS.SUB, "#888", true);
    } else if (state === 'year_grid') {
        moveCamera(centerX + 300, centerY);
        createNode('年份', centerX - 400, centerY, 'sub circle selected', () => renderArchive('time'));
        const years = Array.from({ length: 31 }, (_, i) => 1996 + i);
        const fx = centerX - 50, fy = centerY - 250;
        const frameW = 1100, frameH = 500;
        currentFrameBounds = createDoubleYearFrame(fx, fy, frameW, frameH);
        const lineEnds = drawGradientLine(centerX - 400, centerY, fx, centerY, RADIUS.SUB, 0, "#0066FF", true);
        if (window.particleSystem) {
            window.particleSystem.startLinkParticles(lineEnds.start, lineEnds.end, "#66CCFF", currentFrameBounds.outer);
            window.particleSystem.startYearFrameEffects(currentFrameBounds);
        }
        years.forEach((y, i) => {
            const col = i % 10;
            const row = Math.floor(i / 10);
            const nx = fx + 80 + col * 100;
            const ny = fy + 70 + row * 110;
            const node = createNode(y.toString(), nx, ny, 'year-tag', () => toggleYear(y));
            nodesCache.years.set(y, node);
        });
    } else if (state === 'month_grid') {
        const anchorX = centerX + 150, anchorY = centerY;
        moveCamera(anchorX, anchorY);
        createNode('月份', anchorX, anchorY, 'sub circle node-plant selected', () => renderArchive('time'));
        const layouts = [
            { m: 1, label: "1月新番", x: anchorX - 380, y: anchorY - 280, color: "#1E90FF", cls: "node-winter" },
            { m: 4, label: "4月新番", x: anchorX + 380, y: anchorY - 280, color: "#22C55E", cls: "node-spring" },
            { m: 7, label: "7月新番", x: anchorX - 380, y: anchorY + 280, color: "#FF4500", cls: "node-summer" },
            { m: 10, label: "10月新番", x: anchorX + 380, y: anchorY + 280, color: "#FF8C00", cls: "node-autumn" }
        ];
        layouts.forEach(s => {
            drawGradientLine(anchorX, anchorY, s.x, s.y, RADIUS.SUB, RADIUS.MONTH, s.color, currentChoice.months.includes(s.m), 'month');
            const node = createNode(s.label, s.x, s.y, `month-node ${s.cls}`, () => toggleMonth(s.m, s.x, s.y, s.color));
            node.style.borderColor = s.color;
            nodesCache.months.set(s.m, node);
        });
    } else if (state === 'type_grid') {
        moveCamera(centerX, centerY);
        createNode('类型', centerX, centerY, 'main circle selected', () => renderArchive('root'));
        const tags = [
            "异世界", "校园", "恋爱", "搞笑", "日常", "热血", "思考", "音乐",
            "运动", "战斗", "游戏类", "乙游", "工作", "爽", "泡面番", "狗屎",
            "无聊", "猎奇", "后宫", "H", "色色", "卖肉", "好看", "神作",
            "治愈", "致郁", "剧场版", "机架", "百合", "少女", "微甜", "中甜",
            "催泪", "冒险", "灵能", "偶像", "演员", "复仇", "侦探", "战争",
            "末日", "魔法少女", "VTuber", "美食", "系统", "穿越", "逃生",
            "智斗", "悬疑", "少年", "卡牌", "纯爱", "发展", "宠物", "宫斗",
            "特工", "黑社会", "赛马", "登山"
        ];
        const colors = ["#FF4500", "#9370DB", "#FF69B4", "#00FFFF", "#ADFF2F", "#8B0000", "#1E90FF", "#F0E68C"];
        tags.forEach((tag, i) => {
            const angle = (i / tags.length) * Math.PI * 2;
            const r = 320 + (i % 3) * 70;
            const nx = centerX + Math.cos(angle) * r;
            const ny = centerY + Math.sin(angle) * r;
            const myColor = colors[i % colors.length];
            drawGradientLine(centerX, centerY, nx, ny, RADIUS.MAIN, RADIUS.TAG, myColor, currentChoice.tags.includes(tag), 'tag');
            const node = createNode(tag, nx, ny, 'tag-node', () => toggleTag(tag, nx, ny, myColor));
            node.style.borderColor = myColor;
            node.style.color = myColor;
            nodesCache.tags.set(tag, node);
        });
    }
}

function updateNodeSelection(state) {
    nodesCache.years.forEach((node, y) => {
        if (currentChoice.years.includes(y)) node.classList.add('selected');
        else node.classList.remove('selected');
    });
    nodesCache.months.forEach((node, m) => {
        if (currentChoice.months.includes(m)) node.classList.add('selected');
        else node.classList.remove('selected');
    });
    nodesCache.tags.forEach((node, tag) => {
        if (currentChoice.tags.includes(tag)) node.classList.add('selected');
        else node.classList.remove('selected');
    });
    rebuildMonthLinks();
    rebuildTagLinks();
}

function rebuildMonthLinks() {
    const svg = document.getElementById('link-svg');
    if (!svg) return;
    const oldLines = svg.querySelectorAll('line[data-type="month"], line[data-type="line"]');
    oldLines.forEach(line => line.remove());
    const anchorX = 2500 + 150, anchorY = 2500;
    nodesCache.months.forEach((node, m) => {
        const x = parseFloat(node.style.left);
        const y = parseFloat(node.style.top);
        const color = getMonthColor(m);
        const isActive = currentChoice.months.includes(m);
        drawGradientLine(anchorX, anchorY, x, y, RADIUS.SUB, RADIUS.MONTH, color, isActive, 'month');
    });
}

function rebuildTagLinks() {
    const svg = document.getElementById('link-svg');
    if (!svg) return;
    const oldLines = svg.querySelectorAll('line[data-type="tag"], line[data-type="line"]');
    oldLines.forEach(line => line.remove());
    const centerX = 2500, centerY = 2500;
    nodesCache.tags.forEach((node, tag) => {
        const x = parseFloat(node.style.left);
        const y = parseFloat(node.style.top);
        const color = getTagColor(tag);
        const isActive = currentChoice.tags.includes(tag);
        drawGradientLine(centerX, centerY, x, y, RADIUS.MAIN, RADIUS.TAG, color, isActive, 'tag');
    });
}

function getMonthColor(month) {
    const colors = { 1: "#1E90FF", 4: "#22C55E", 7: "#FF4500", 10: "#FF8C00" };
    return colors[month] || "#FFFFFF";
}

function getTagColor(tag) {
    const colors = {
        "异世界": "#FF4500", "校园": "#9370DB", "恋爱": "#FF69B4", "搞笑": "#00FFFF",
        "日常": "#ADFF2F", "热血": "#8B0000", "思考": "#1E90FF", "音乐": "#F0E68C",
        "运动": "#FFD700", "泡面番": "#FFA07A", "狗屎": "#8B4513", "无聊": "#808080",
        "后宫": "#FF99CC", "H": "#FF3366", "卖肉": "#FF66CC", "好看": "#FFD700",
        "神作": "#FFD700", "治愈": "#98FB98", "致郁": "#4B0082", "剧场版": "#C0C0C0"
    };
    return colors[tag] || "#FFFFFF";
}

function toggleYear(y) {
    const isSel = currentChoice.years.includes(y);
    if (isSel) {
        currentChoice.years = currentChoice.years.filter(v => v !== y);
    } else {
        currentChoice.years.push(y);
        const node = nodesCache.years.get(y);
        if (node) {
            const x = parseFloat(node.style.left);
            const yCoord = parseFloat(node.style.top);
            spawnParticles(x, yCoord, '#FFFFFF', true);
        }
    }
    const node = nodesCache.years.get(y);
    if (node) {
        if (isSel) node.classList.remove('selected');
        else node.classList.add('selected');
    }
    updateConfirmBtn(true);
}

function toggleMonth(m, x, y, color) {
    const isSel = currentChoice.months.includes(m);
    if (isSel) {
        currentChoice.months = currentChoice.months.filter(v => v !== m);
        if (particleTimers[`month_${m}`]) {
            clearInterval(particleTimers[`month_${m}`]);
            delete particleTimers[`month_${m}`];
        }
    } else {
        currentChoice.months.push(m);
        if (m === 1) startContinuousSnow(x, y, m);
        else if (m === 4) startContinuousPetal(x, y, m);
        else if (m === 7) startContinuousHeat(x, y, m);
        else if (m === 10) startContinuousLeaf(x, y, m);
        else generateMonthParticle(m, x, y);
    }
    updateNodeSelection('month_grid');
    updateConfirmBtn(true);
}

function startContinuousSnow(x, y, m) {
    if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
    particleTimers[`month_${m}`] = setInterval(() => {
        if (!currentChoice.months.includes(m)) {
            clearInterval(particleTimers[`month_${m}`]);
            delete particleTimers[`month_${m}`];
            return;
        }
        for (let i = 0; i < 3; i++) {
            const snow = document.createElement('div');
            snow.className = 'snow-particle';
            snow.style.left = x + (Math.random() - 0.5) * 60 + 'px';
            snow.style.top = y + (Math.random() - 0.5) * 40 + 'px';
            snow.style.animation = `snowFall ${1 + Math.random() * 1}s linear forwards`;
            document.getElementById('camera').appendChild(snow);
            setTimeout(() => snow.remove(), 2000);
        }
    }, 500);
}

function startContinuousPetal(x, y, m) {
    if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
    particleTimers[`month_${m}`] = setInterval(() => {
        if (!currentChoice.months.includes(m)) {
            clearInterval(particleTimers[`month_${m}`]);
            delete particleTimers[`month_${m}`];
            return;
        }
        for (let i = 0; i < 3; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal-particle';
            petal.style.left = x + (Math.random() - 0.5) * 50 + 'px';
            petal.style.top = y + (Math.random() - 0.5) * 30 + 'px';
            petal.style.animation = `petalUp ${1.5 + Math.random() * 1}s linear forwards`;
            document.getElementById('camera').appendChild(petal);
            setTimeout(() => petal.remove(), 2000);
        }
    }, 600);
}

function startContinuousHeat(x, y, m) {
    if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
    particleTimers[`month_${m}`] = setInterval(() => {
        if (!currentChoice.months.includes(m)) {
            clearInterval(particleTimers[`month_${m}`]);
            delete particleTimers[`month_${m}`];
            return;
        }
        for (let i = 0; i < 4; i++) {
            const heat = document.createElement('div');
            heat.className = 'heat-particle';
            heat.style.left = x + (Math.random() - 0.5) * 80 + 'px';
            heat.style.top = y + (Math.random() - 0.5) * 40 + 'px';
            heat.style.animation = `heatWave ${1.2 + Math.random() * 0.8}s ease-out forwards`;
            document.getElementById('camera').appendChild(heat);
            setTimeout(() => heat.remove(), 1500);
        }
    }, 400);
}

function startContinuousLeaf(x, y, m) {
    if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
    particleTimers[`month_${m}`] = setInterval(() => {
        if (!currentChoice.months.includes(m)) {
            clearInterval(particleTimers[`month_${m}`]);
            delete particleTimers[`month_${m}`];
            return;
        }
        for (let i = 0; i < 2; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf-particle';
            leaf.style.left = x + (Math.random() - 0.5) * 70 + 'px';
            leaf.style.top = y + (Math.random() - 0.5) * 50 + 'px';
            leaf.style.animation = `leafFall ${1.8 + Math.random() * 1}s linear forwards`;
            document.getElementById('camera').appendChild(leaf);
            setTimeout(() => leaf.remove(), 2500);
        }
    }, 800);
}

function generateMonthParticle(month, x, y) {
    const camera = document.getElementById('camera');
    if (month === 1) {
        for (let i = 0; i < 20; i++) {
            const snow = document.createElement('div');
            snow.className = 'snow-particle';
            snow.style.left = x + (Math.random() - 0.5) * 60 + 'px';
            snow.style.top = y + (Math.random() - 0.5) * 40 + 'px';
            snow.style.animation = `snowFall ${1 + Math.random() * 1}s linear forwards`;
            camera.appendChild(snow);
            setTimeout(() => snow.remove(), 2000);
        }
    } else if (month === 4) {
        for (let i = 0; i < 15; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal-particle';
            petal.style.left = x + (Math.random() - 0.5) * 50 + 'px';
            petal.style.top = y + (Math.random() - 0.5) * 30 + 'px';
            petal.style.animation = `petalUp ${1.5 + Math.random() * 1}s linear forwards`;
            camera.appendChild(petal);
            setTimeout(() => petal.remove(), 2000);
        }
    } else if (month === 7) {
        for (let i = 0; i < 25; i++) {
            const heat = document.createElement('div');
            heat.className = 'heat-particle';
            heat.style.left = x + (Math.random() - 0.5) * 80 + 'px';
            heat.style.top = y + (Math.random() - 0.5) * 40 + 'px';
            heat.style.animation = `heatWave ${1.2 + Math.random() * 0.8}s ease-out forwards`;
            camera.appendChild(heat);
            setTimeout(() => heat.remove(), 1500);
        }
    } else if (month === 10) {
        for (let i = 0; i < 12; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf-particle';
            leaf.style.left = x + (Math.random() - 0.5) * 70 + 'px';
            leaf.style.top = y + (Math.random() - 0.5) * 50 + 'px';
            leaf.style.animation = `leafFall ${1.8 + Math.random() * 1}s linear forwards`;
            camera.appendChild(leaf);
            setTimeout(() => leaf.remove(), 2500);
        }
    }
}

function toggleTag(tag, x, y, color) {
    const isSel = currentChoice.tags.includes(tag);
    if (isSel) {
        currentChoice.tags = currentChoice.tags.filter(v => v !== tag);
        if (particleTimers[`tag_${tag}`]) {
            clearInterval(particleTimers[`tag_${tag}`]);
            delete particleTimers[`tag_${tag}`];
        }
    } else {
        currentChoice.tags.push(tag);
        if (tag === '音乐') startContinuousMusic(x, y);
        else if (tag === '恋爱') startContinuousLove(x, y);
        else if (tag === '热血') startContinuousHotBlood(x, y);
        else generateTagParticle(tag, x, y);
    }
    const node = nodesCache.tags.get(tag);
    if (node) {
        if (isSel) node.classList.remove('selected');
        else node.classList.add('selected');
    }
    updateNodeSelection('type_grid');
    updateConfirmBtn(true);
}

function startContinuousMusic(x, y) {
    if (particleTimers['tag_音乐']) clearInterval(particleTimers['tag_音乐']);
    particleTimers['tag_音乐'] = setInterval(() => {
        if (!currentChoice.tags.includes('音乐')) {
            clearInterval(particleTimers['tag_音乐']);
            delete particleTimers['tag_音乐'];
            return;
        }
        const notes = ['♪', '♫', '♩', '🎵', '🎶'];
        for (let i = 0; i < 3; i++) {
            const note = document.createElement('div');
            note.className = 'note-particle';
            note.innerHTML = notes[Math.floor(Math.random() * notes.length)];
            note.style.left = x + (Math.random() - 0.5) * 80 + 'px';
            note.style.top = y + (Math.random() - 0.5) * 60 + 'px';
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            note.style.setProperty('--tx', vx + 'px');
            note.style.setProperty('--ty', vy + 'px');
            note.style.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
            note.style.animation = `noteFloat 1s ease-out forwards`;
            document.getElementById('camera').appendChild(note);
            setTimeout(() => note.remove(), 1000);
        }
    }, 800);
}

function startContinuousLove(x, y) {
    if (particleTimers['tag_恋爱']) clearInterval(particleTimers['tag_恋爱']);
    particleTimers['tag_恋爱'] = setInterval(() => {
        if (!currentChoice.tags.includes('恋爱')) {
            clearInterval(particleTimers['tag_恋爱']);
            delete particleTimers['tag_恋爱'];
            return;
        }
        for (let i = 0; i < 4; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.innerHTML = '❤️';
            heart.style.left = x + (Math.random() - 0.5) * 70 + 'px';
            heart.style.top = y + (Math.random() - 0.5) * 50 + 'px';
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            heart.style.setProperty('--tx', vx + 'px');
            heart.style.setProperty('--ty', vy + 'px');
            heart.style.color = Math.random() > 0.5 ? '#FF3366' : '#FF99CC';
            heart.style.animation = `heartUp 1s ease-out forwards`;
            document.getElementById('camera').appendChild(heart);
            setTimeout(() => heart.remove(), 1000);
        }
    }, 600);
}

function startContinuousHotBlood(x, y) {
    if (particleTimers['tag_热血']) clearInterval(particleTimers['tag_热血']);
    particleTimers['tag_热血'] = setInterval(() => {
        if (!currentChoice.tags.includes('热血')) {
            clearInterval(particleTimers['tag_热血']);
            delete particleTimers['tag_热血'];
            return;
        }
        for (let i = 0; i < 5; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'hot-particle';
            bubble.style.left = x + (Math.random() - 0.5) * 100 + 'px';
            bubble.style.top = y + (Math.random() - 0.5) * 60 + 'px';
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 1;
            bubble.style.setProperty('--tx', vx + 'px');
            bubble.style.setProperty('--ty', vy + 'px');
            bubble.style.background = `rgba(255, ${Math.floor(30 + Math.random() * 80)}, 0, 0.8)`;
            bubble.style.animation = `boiling 1s ease-out forwards`;
            document.getElementById('camera').appendChild(bubble);
            setTimeout(() => bubble.remove(), 1000);
        }
    }, 500);
}

function generateTagParticle(tag, x, y) {
    const camera = document.getElementById('camera');
    if (tag === 'H') {
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'tag-particle';
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            p.style.setProperty('--tx', vx + 'px');
            p.style.setProperty('--ty', vy + 'px');
            p.style.background = '#FFD700';
            camera.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
    } else if (tag === '狗屎') {
        for (let i = 0; i < 15; i++) {
            const poop = document.createElement('div');
            poop.className = 'poop-particle';
            poop.innerHTML = '💩';
            poop.style.left = x + (Math.random() - 0.5) * 60 + 'px';
            poop.style.top = y + (Math.random() - 0.5) * 40 + 'px';
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            poop.style.setProperty('--tx', vx + 'px');
            poop.style.setProperty('--ty', vy + 'px');
            poop.style.fontSize = `${16 + Math.random() * 12}px`;
            poop.style.animation = `poopFall 1s linear forwards`;
            camera.appendChild(poop);
            setTimeout(() => poop.remove(), 1500);
        }
    }
}

function jumpToResult(keyword = '') {
    const y = currentChoice.years.join(',');
    const m = currentChoice.months.join(',');
    const t = currentChoice.tags.join(',');
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (y) params.set('year', y);
    if (m) params.set('month', m);
    if (t) params.set('tag', t);
    window.location.href = `/search.html?${params.toString()}`;
}

// --- 8. 高级粒子系统 ---
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '30';
        document.getElementById('camera').appendChild(this.canvas);
        this.resize();
        this.animate();
        this.linkInterval = null;
        this.frameInterval = null;
    }
    resize() {
        this.canvas.width = 5000;
        this.canvas.height = 5000;
    }
    createParticle(options) {
        this.particles.push({
            x: options.x,
            y: options.y,
            vx: options.vx || 0,
            vy: options.vy || 0,
            color: options.color || '#ffffff',
            size: options.size || 3,
            life: options.life || 1.0,
            decay: options.decay || 0.01,
            targetY: options.targetY,
            onHit: options.onHit || null,
            fromBottom: options.fromBottom || false,
        });
    }
    createDropletFromTop(bounds, color = '#66CCFF') {
        const x = bounds.left + 15 + Math.random() * (bounds.right - bounds.left - 30);
        this.createParticle({
            x, y: bounds.top + 15,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1 + Math.random() * 2,
            color,
            size: 4,
            life: 1,
            decay: 0,
            targetY: bounds.bottom - 15,
            onHit: (p) => {
                for (let i = 0; i < 6; i++) {
                    this.createParticle({
                        x: p.x, y: bounds.bottom - 15,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -Math.random() * 2 - 1,
                        color: p.color,
                        size: 2,
                        life: 0.8,
                        decay: 0.02
                    });
                }
                return true;
            }
        });
    }
    createDropletFromBottom(bounds, color = '#0066FF') {
        const x = bounds.left + Math.random() * (bounds.right - bounds.left);
        this.createParticle({
            x, y: bounds.bottom,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 1.5 + Math.random() * 2,
            color,
            size: 5,
            life: 1,
            decay: 0,
            fromBottom: true,
        });
    }
    startLinkParticles(start, end, color, bounds) {
        if (this.linkInterval) clearInterval(this.linkInterval);
        this.linkInterval = setInterval(() => {
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const t = Math.random();
                const x = start.x + (end.x - start.x) * t;
                const y = start.y + (end.y - start.y) * t;
                const speed = 0.3 + Math.random() * 0.5;
                const dx = end.x - x;
                const dy = end.y - y;
                const dist = Math.hypot(dx, dy);
                const vx = (dx / dist) * speed;
                const vy = (dy / dist) * speed;
                this.createParticle({
                    x, y, vx, vy,
                    color,
                    size: 2,
                    life: 1,
                    decay: 0.02,
                    targetY: bounds ? bounds.bottom : null,
                    onHit: (p) => {
                        if (Math.random() < 0.3) return true;
                        for (let j = 0; j < 4; j++) {
                            this.createParticle({
                                x: p.x, y: p.y,
                                vx: (Math.random() - 0.5) * 2,
                                vy: -Math.random() * 2 - 1,
                                color: p.color,
                                size: 1,
                                life: 0.5,
                                decay: 0.03,
                            });
                        }
                        return true;
                    }
                });
            }
        }, 500);
    }
    startYearFrameEffects(bounds) {
        if (this.frameInterval) clearInterval(this.frameInterval);
        this.frameInterval = setInterval(() => {
            if (Math.random() < 0.3) this.createDropletFromTop(bounds.inner, '#66CCFF');
            if (Math.random() < 0.2) this.createDropletFromBottom(bounds.outer, '#0066FF');
        }, 200);
    }
    stopYearFrameEffects() {
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
        }
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.targetY !== undefined && p.y >= p.targetY) {
                if (p.onHit && p.onHit(p)) {
                    this.particles.splice(i, 1);
                    continue;
                }
            }
            if (p.fromBottom && p.y > this.canvas.height + 100) {
                const btn = document.getElementById('confirm-btn');
                if (btn && btn.classList.contains('active')) {
                    for (let j = 0; j < 8; j++) {
                        this.createParticle({
                            x: p.x, y: this.canvas.height,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 3 - 2,
                            color: p.color,
                            size: 3,
                            life: 0.6,
                            decay: 0.02,
                        });
                    }
                }
                this.particles.splice(i, 1);
                continue;
            }
            if (p.y > this.canvas.height + 100 || p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        requestAnimationFrame(() => this.animate());
    }
}

// --- 9. 确认按钮与摘要 ---
function updateConfirmBtn(immediate = false) {
    const btn = document.getElementById('confirm-btn');
    const ready = currentChoice.years.length > 0 || currentChoice.months.length > 0 || currentChoice.tags.length > 0;
    btn.className = ready ? 'active' : '';
    let summary = '';
    if (currentChoice.years.length) summary += `年份: ${currentChoice.years.join('、')} `;
    if (currentChoice.months.length) {
        const monthNames = { 1: '1月新番', 4: '4月新番', 7: '7月新番', 10: '10月新番' };
        const monthStrs = currentChoice.months.map(m => monthNames[m] || m + '月新番');
        summary += `月份: ${monthStrs.join('、')} `;
    }
    if (currentChoice.tags.length) summary += `类型: ${currentChoice.tags.join('、')}`;
    btn.innerText = ready ? `确认观测 (${summary})` : "数据链未就绪";
    if (immediate && ready) {
        btn.style.transform = 'scale(1.05)';
        setTimeout(() => btn.style.transform = '', 200);
    }
}

function showSection(id) {
    const isArchive = id === 'archive';
    if (!isArchive && window.particleSystem) {
        if (window.particleSystem.linkInterval) clearInterval(window.particleSystem.linkInterval);
        if (window.particleSystem.frameInterval) clearInterval(window.particleSystem.frameInterval);
        window.particleSystem.particles = [];
        for (let key in particleTimers) {
            clearInterval(particleTimers[key]);
            delete particleTimers[key];
        }
        const frames = document.querySelectorAll('#camera .year-frame-outer, #camera .year-frame-inner');
        frames.forEach(frame => frame.remove());
        currentFrameBounds = null;
    }
    document.querySelectorAll('.top-left, .search-area, .poem-right').forEach(el => el.style.display = isArchive ? 'none' : 'block');
    document.getElementById('archive-stage').style.display = isArchive ? 'block' : 'none';
    document.getElementById('confirm-btn').style.display = isArchive ? 'block' : 'none';
    if (isArchive) renderArchive('root');
}



// --- 10. 统一启动 ---
function initAll() {
    if (typeof initEnvironment === 'function') initEnvironment();
    if (typeof initDragSystem === 'function') initDragSystem();

    // 新增：自定义时钟和搜索框
    updateCustomClock();
    setInterval(updateCustomClock, 1000);
    initSearchBox();

    const panel = document.getElementById('poem-panel');
    if (panel && typeof poemContent !== 'undefined') {
        panel.innerHTML = '';
        poemContent.forEach((line, i) => {
            const div = document.createElement('div');
            div.className = 'poem-line';
            line.split('').forEach((char, j) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.innerText = char;
                div.appendChild(span);
                setTimeout(() => span.classList.add('active'), (i * 1000) + (j * 100));
            });
            panel.appendChild(div);
        });
    }
    // 注意：原来的 searchBox 监听器已经删除，不要在这里再出现

    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const hasChoice = currentChoice.years.length || currentChoice.months.length || currentChoice.tags.length;
            if (hasChoice && typeof jumpToResult === 'function') {
                jumpToResult();
            } else {
                console.log("未选择任何观测条件");
            }
        });
    }

    if (typeof showSection === 'function') {
        showSection('home');
    }
    updateProfileDisplay();
}

// ========== 形象设置联动：更新首页左上角 ==========
function updateProfileDisplay() {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const title = profile.title || '观测者';
    const name = profile.name || '';
    const identityTag = document.getElementById('identity-tag');
    if (identityTag) {
        identityTag.innerHTML = `【 ${title} 】${name ? ' · ' + name : ''}`;
    }
    // 位置显示：优先使用用户自定义位置（仅用于显示，不影响天气获取）
    const locationParts = [profile.planet, profile.country, profile.region].filter(p => p && p.trim());
    const geoDisplay = document.getElementById('geo-display');
    if (geoDisplay && locationParts.length) {
        geoDisplay.innerText = locationParts.join(' · ');
    }
    // 如果没有自定义位置，geo-display 会在 fetchWeatherData 中设置为真实地址
}

// 监听形象设置保存事件
window.addEventListener('profileUpdated', updateProfileDisplay);

// 监听配置变更事件
window.addEventListener('profileUpdated', updateProfileDisplay);