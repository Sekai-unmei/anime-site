/**
 * Animer 资料站核心逻辑 (最终优化版)
 * 依赖 common.js 提供的公共函数，不重复定义
 */

// ========== 1. 数据库定义（精简但完整） ==========
const EMOTION_DB = {
  weather_base: {
    晴天: {
      凌晨: [
        "黎明尚未到来 接下来的每一秒都会无比的漫长",
        "世界仍未苏醒 正是进攻的大好时机!",
        "万物皆在沉睡 唯我独醒",
      ],
      早上: [
        "太阳照射在了这片残破的大地之上 给予了最后的温暖",
        "早晨的太阳是如此的温柔 包裹住了这样的我",
        "不错的阳光 只可惜这份阳光有些温暖又有点耀眼 对于活在此处的生物而言 简直就是既渴望 但又不可触碰的存在啊...",
      ],
      中午: ["些许的炽热 但也仅现此时"],
      傍晚: [
        "夕阳在大地边缘垂死挣扎，金色的余晖碎了一地。",
        "黄昏是白昼与黑夜的交界，也是观测最不稳定的时刻。",
      ],
      晚上: [
        "繁星是宇宙的冷笑话，但今晚格外的冷。",
        "今晚视野良好，可以俯瞰一下城市或者世界了。",
      ],
      通用: [
        "阳光刺破云层，此刻万物皆为观测对象。",
        "光子在跃动，似乎在诉说着某个远方的故事。",
      ],
    },
    雨: {
      早上: ["雨声掩盖了城市的喧嚣，这是一个适合沉思的清晨。"],
      中午: [
        "午间的暴雨，洗去了数据中的浮躁。",
        "这种天气，适合躲在观测站里喝一杯热咖啡。",
      ],
      晚上: [
        "雨滴敲击窗棂的声音，是黑夜最温柔的伴奏。",
        "雨夜，总是让观测者的思绪飘得很远。",
      ],
      通用: [
        "雨啊 雨啊 请尽情的淋落在我等的身上吧!",
        "雨天适合在家听着雨声，雨停后可以去找蜗牛🐌了",
      ],
    },
    阴天: {
      白天: [
        "灰色的幕布下，世界在静默中低语。",
        "没有阳光的白昼，世界显得格外真实。",
      ],
      晚上: [
        "阴云遮蔽了星光，观测站陷入了纯粹的暗。",
        "看不见月亮或者是星空的夜晚，总觉得少了点什么。",
      ],
      通用: [
        "看好了 什么叫一剑破天门!",
        "云层压得很低，心事也随之变得厚重。",
        "阴沉的天气,宛如我前方的道路一样,死气沉沉啊...",
      ],
    },
    多云: {
      通用: [
        "云影在大地漫步，观测站捕捉到了漂浮的思绪。",
        "半明半暗之间，真实与幻想的界限开始模糊。",
        "世界的力量似乎开始了分散?",
      ],
    },
    雾: {
      通用: [
        "视界被浓雾吞噬，坐标正在迷失。",
        "在混沌的白芒中，你还能看清自己的路吗？",
        "迷雾之中，必有异象。",
      ],
    },
    雪: {
      通用: [
        "可以玩雪了耶 打雪仗、堆雪人、雪雕... 哈哈",
        "雪? 对于住在南方的我来说 实在是新奇",
      ],
    },
    雷雨: {
      通用: [
        "电荷在空气中狂欢，雷鸣是神明的怒吼。",
        "特大暴雨⛈️触发... 观测站电力系统负载警告。",
      ],
    },
    风: {
      通用: ["不错的风,吹走了身上的负担"],
      晚上: ["我独占高楼,衣发随风飘"],
    },
    小雨: { 通用: ["细雨绵绵，适合发呆。", "雨丝如线，织成一张温柔的网。"] },
    大雨: {
      通用: ["大雨倾盆，世界被洗刷。", "雨声如鼓，敲打着每个人的心事。"],
    },
    阵雨: {
      通用: ["阵雨匆匆，来得快去得也快。", "一阵急雨过后，空气格外清新。"],
    },
    中阵雨: { 通用: ["雨势渐强，快找地方躲避。", "中雨阵阵，天色昏暗。"] },
    小雪: { 通用: ["细雪飘零，寒意渐浓。", "点点雪花，像是天空的碎屑。"] },
    大雪: { 通用: ["大雪封路，万物寂静。", "漫天飞雪，世界被重新塑造。"] },
    雪粒: { 通用: ["冰晶般的雪粒洒落，像细砂糖。"] },
    阵雪: { 通用: ["雪花一阵阵飘落，时急时缓。"] },
    中阵雪: { 通用: ["雪势加大，天地苍茫。"] },
    冰雹: {
      通用: [
        "冰雹如石，快找地方躲避！",
        "天空下起了冰雹，请保护好你的爱车。",
        "冰雹敲击窗棂，像是天空的鼓点。",
      ],
    },
    恶劣天气: {
      通用: [
        "这既是天灾吗...",
        "恶劣天气警告！请勿外出！",
        "沙尘暴/龙卷风逼近，立即寻找掩体！",
      ],
    },
  },
  seasonal_special: {
    春: {
      晴天: {
        凌晨: ["万物仍在沉睡", "在黑暗中积蓄"],
        中午: ["阳光正在旺盛"],
        下午: ["温暖的阳光照射在草地之上,好像就这么睡上一觉啊!"],
        晚上: ["月亮的主场"],
      },
      雨: ["春雨如油"],
      刮风: ["春天的风 是我感受到过最温柔的"],
      通用: ["万物萌发的季节"],
    },
    夏: { 晴天: ["无限月读?"], 通用: ["蝉鸣聒噪"] },
    秋: {
      通用: ["枯叶随风而逝", "秋季已到,丰收将至,甚好、甚好..."],
      风: {
        通用: ["秋天的风,带有一股谷物的味道"],
        晚上: ["枯叶随风飘,带有哗哗声,老夫独坐园椅上,享受着死亡的来临"],
      },
    },
    冬: { 通用: ["万籁俱寂"] },
  },
  默认: ["混蛋的开始 亦是终结的开始"],
};
const poemContent = [
  "今天又想找些什么呢",
  "今天难道也是无聊的一天吗",
  "今天难道也和往常那样吗",
  "今天难道也不曾作出改变吗",
  "今天仍旧是无可救药的一天吗",
  "今天真的就这样吗",
  "今天的今天 亦是过去的今天 亦是 未来的今天",
  "因此 今日 依旧是那今日吗",
];
const countryTimezoneMap = {
  中国: "Asia/Shanghai",
  日本: "Asia/Tokyo",
  韩国: "Asia/Seoul",
  美国: "America/New_York",
  英国: "Europe/London",
  法国: "Europe/Paris",
  德国: "Europe/Berlin",
  俄罗斯: "Europe/Moscow",
  澳大利亚: "Australia/Sydney",
  加拿大: "America/Toronto",
  印度: "Asia/Kolkata",
  巴西: "America/Sao_Paulo",
};

// ========== 2. 状态与全局变量 ==========
const RADIUS = { MAIN: 55, SUB: 40, MONTH: 68, TAG: 38, YEAR_TAG: 25 };
let currentChoice = { years: [], months: [], tags: [] };
let camX = 0,
  camY = 0;
let lastState = "";
let currentFrameBounds = null;
let nodesCache = { years: new Map(), months: new Map(), tags: new Map() };
let svgCache = null;
let particleTimers = {};

// ========== 3. 辅助函数（时区、天气、时钟等） ==========
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
  const profile = JSON.parse(localStorage.getItem("user_profile") || "{}");
  const planet = profile.planet || "地球";
  if (planet !== "地球")
    return {
      timeStr: `${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:??`,
      period: "混乱",
    };
  let timezone = countryTimezoneMap[profile.country] || "Asia/Shanghai";
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(
      parts.find((p) => p.type === "hour")?.value || now.getHours(),
      10,
    );
    const minute = parts.find((p) => p.type === "minute")?.value || "00";
    const second = parts.find((p) => p.type === "second")?.value || "00";
    return {
      timeStr: `${hour}:${minute}:${second}`,
      period: getPeriodByHour(hour),
    };
  } catch (e) {
    const now = new Date();
    return {
      timeStr: now.toLocaleTimeString("zh-CN", { hour12: false }),
      period: getPeriodByHour(now.getHours()),
    };
  }
}

function updateCustomClock() {
  const { timeStr, period } = getCustomTime();
  const timeDiv = document.getElementById("time");
  if (timeDiv) timeDiv.innerText = timeStr;
  const subtitle = document.getElementById("calendar-subtitle");
  if (subtitle) subtitle.innerText = `[ 观测时间节点 · ${period} ]`;
}
window.updateCustomClock = updateCustomClock;

function initSearchBox() {
  const searchBox = document.querySelector(".search-box");
  if (!searchBox) return;
  const newBox = searchBox.cloneNode(true);
  searchBox.parentNode.replaceChild(newBox, searchBox);
  newBox.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const val = newBox.value.trim();
      if (!val) return;

      // 定义 JOJO 系列关键词白名单（不区分大小写）
      const jojoKeywords = [
        "jo",
        "jojo",
        "jojo的奇妙冒险",
        "jojo's bizarre adventure",
        "jojo的奇妙",
        "ジョジョ",
      ];
      const lowerVal = val.toLowerCase();
      const isJojo = jojoKeywords.some((kw) =>
        lowerVal.includes(kw.toLowerCase()),
      );

      if (isJojo) {
        // 跳转到 JOJO 系列页
        window.location.href = `/series.html?title=${encodeURIComponent("jojo的奇妙冒险")}`;
      } else {
        // 否则跳转到普通搜索页
        window.location.href = `/search.html?keyword=${encodeURIComponent(val)}`;
      }
    }
  });
}

// 在 main.js 中找到 fetchWeatherData 函数，替换为以下版本

// 国家英文名 -> 中文映射表
const countryMap = {
  Italy: "意大利",
  "United States": "美国",
  USA: "美国",
  "United Kingdom": "英国",
  UK: "英国",
  France: "法国",
  Germany: "德国",
  Japan: "日本",
  China: "中国",
  "South Korea": "韩国",
  Korea: "韩国",
  Australia: "澳大利亚",
  Canada: "加拿大",
  India: "印度",
  Brazil: "巴西",
  Russia: "俄罗斯",
  Spain: "西班牙",
  Netherlands: "荷兰",
  Switzerland: "瑞士",
  Sweden: "瑞典",
  Norway: "挪威",
  Denmark: "丹麦",
  Finland: "芬兰",
  Poland: "波兰",
  Turkey: "土耳其",
  Greece: "希腊",
  Portugal: "葡萄牙",
  Belgium: "比利时",
  Austria: "奥地利",
  Ireland: "爱尔兰",
  "Czech Republic": "捷克",
  Hungary: "匈牙利",
  Romania: "罗马尼亚",
  Ukraine: "乌克兰",
  Mexico: "墨西哥",
  Argentina: "阿根廷",
  Chile: "智利",
  Peru: "秘鲁",
  Colombia: "哥伦比亚",
  Venezuela: "委内瑞拉",
  Egypt: "埃及",
  "South Africa": "南非",
  Nigeria: "尼日利亚",
  Kenya: "肯尼亚",
  "Saudi Arabia": "沙特阿拉伯",
  UAE: "阿联酋",
  Israel: "以色列",
  Iran: "伊朗",
  Iraq: "伊拉克",
  Pakistan: "巴基斯坦",
  Bangladesh: "孟加拉国",
  Thailand: "泰国",
  Vietnam: "越南",
  Indonesia: "印度尼西亚",
  Malaysia: "马来西亚",
  Philippines: "菲律宾",
  Singapore: "新加坡",
  "New Zealand": "新西兰",
};

async function fetchWeatherData(lat, lon, useGps = false) {
  try {
    const profile = JSON.parse(localStorage.getItem("user_profile") || "{}");
    let country = "观测站";
    let city = "";

    // 1. 优先使用用户手动设置的位置
    if (profile.country) {
      country = profile.country;
      city = profile.region || "";
    }
    // 2. 如果有 GPS 经纬度且使用 GPS 模式
    else if (useGps && lat && lon) {
      try {
        // 使用 Nominatim 逆地理编码（免费，无需密钥）
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=zh&zoom=14&addressdetails=1`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(geoUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const addr = data.address;
          country = addr.country || "未知";
          // 优先取城市，其次镇/村庄，最后县
          city = addr.city || addr.town || addr.village || addr.county || "";
          console.log(`🌍 GPS 逆地理: ${country}, ${city}`);
        } else {
          throw new Error("逆地理失败");
        }
      } catch (err) {
        console.warn("逆地理编码失败，只能显示国家", err);
        // 降级：仅显示国家，不显示城市
        city = "";
        // 尝试根据时区推断国家（可选）
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes("Asia/Shanghai")) country = "中国";
        else if (timezone.includes("Asia/Tokyo")) country = "日本";
        else if (timezone.includes("Asia/Seoul")) country = "韩国";
        else if (timezone.includes("America/New_York")) country = "美国";
        else if (timezone.includes("Europe/London")) country = "英国";
        else if (timezone.includes("Europe/Paris")) country = "法国";
        else if (timezone.includes("Europe/Berlin")) country = "德国";
        else if (timezone.includes("Australia/Sydney")) country = "澳大利亚";
        else if (timezone.includes("Asia/Calcutta")) country = "印度";
        else country = "观测站";
      }
    }
    // 3. 没有 GPS 或不使用 GPS：只显示国家（不显示 IP 城市）
    else {
      // 根据时区粗略推断国家（只用于国家级别，不显示城市）
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes("Asia/Shanghai")) country = "中国";
      else if (timezone.includes("Asia/Tokyo")) country = "日本";
      else if (timezone.includes("Asia/Seoul")) country = "韩国";
      else if (timezone.includes("America/New_York")) country = "美国";
      else if (timezone.includes("Europe/London")) country = "英国";
      else if (timezone.includes("Europe/Paris")) country = "法国";
      else if (timezone.includes("Europe/Berlin")) country = "德国";
      else if (timezone.includes("Australia/Sydney")) country = "澳大利亚";
      else if (timezone.includes("Asia/Calcutta")) country = "印度";
      else country = "观测站";
      city = ""; // 不显示城市，避免错误
      console.log("不使用 IP 定位，仅显示国家:", country);
    }

    // 拼接显示字符串
    const locationParts = [
      profile.planet,
      profile.country,
      profile.region,
    ].filter((p) => p && p.trim());
    let realLocation = `地球 · ${country}`;
    if (city && city.trim()) realLocation += ` · ${city}`;
    const geoDisplay = document.getElementById("geo-display");
    if (geoDisplay) {
      // 始终只显示 realLocation，不再附加自定义部分
      geoDisplay.innerText = realLocation;
    }

    // 获取天气数据（如果有经纬度就用，否则用默认北京）
    let weatherLat = lat,
      weatherLon = lon;
    if (!weatherLat || !weatherLon) {
      weatherLat = 39.9042;
      weatherLon = 116.4074;
    }
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${weatherLat}&longitude=${weatherLon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,cloud_cover&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const wRes = await fetch(weatherUrl);
    const w = await wRes.json();
    renderWeatherUI(w);
  } catch (e) {
    console.error("天气/位置获取失败", e);
    const geoDisplay = document.getElementById("geo-display");
    if (geoDisplay) geoDisplay.innerText = "星际同步中断（使用默认天气）";
    renderWeatherUI({
      current: {
        temperature_2m: 25,
        weather_code: 0,
        relative_humidity_2m: 50,
        wind_speed_10m: 5,
        wind_direction_10m: 180,
        uv_index: 3,
        cloud_cover: 20,
      },
      daily: { temperature_2m_max: [28], temperature_2m_min: [18] },
    });
  }
}
// 在 initEnvironment 中增加超时和错误处理
async function initEnvironment() {
  // 清除可能残留的错误城市显示
  const geoDisplay = document.getElementById("geo-display");

  // 先尝试高精度 GPS
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
    console.log("✅ GPS 定位成功", position.coords);
    await fetchWeatherData(
      position.coords.latitude,
      position.coords.longitude,
      true,
    );
  } catch (e) {
    console.warn("GPS 定位失败:", e.message);
    // 用户拒绝或超时，不再使用 IP 定位（因为不准），只显示国家
    await fetchWeatherData(null, null, false);
    // 显示提示信息，引导用户授权或手动设置
    if (geoDisplay && e.code === 1) {
      geoDisplay.innerHTML = `地球 · 未知 (请<a href="/profile.html" style="color:#ffd700; text-decoration:underline;">手动设置位置</a>)`;
      showToast("请允许位置权限或前往形象设置手动填写位置", 5000);
    }
  }
}

function windDirection(deg) {
  const dirs = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  return dirs[Math.round(deg / 45) % 8];
}
function getWindLevel(speed) {
  if (speed < 5) return "微风";
  if (speed < 20) return "风";
  if (speed < 40) return "大风";
  if (speed < 70) return "狂风";
  return "龙卷风";
}

function renderWeatherUI(data) {
  const cur = data.current;
  const daily = data.daily;
  const period = getPeriodByHour(new Date().getHours());
  const codes = {
    0: "晴天",
    1: "晴天",
    2: "多云",
    3: "阴天",
    45: "雾",
    48: "雾",
    51: "小雨",
    53: "小雨",
    55: "小雨",
    61: "雨",
    63: "雨",
    65: "大雨",
    80: "阵雨",
    81: "中阵雨",
    82: "大阵雨",
    71: "小雪",
    73: "雪",
    75: "大雪",
    77: "雪粒",
    85: "阵雪",
    86: "中阵雪",
    95: "雷雨",
    96: "雷雨",
    99: "雷雨",
    90: "冰雹",
    91: "冰雹",
    92: "冰雹",
    93: "冰雹",
    94: "冰雹",
    30: "恶劣天气",
    31: "恶劣天气",
    32: "恶劣天气",
    33: "恶劣天气",
    34: "恶劣天气",
    35: "恶劣天气",
    36: "恶劣天气",
    37: "恶劣天气",
    38: "恶劣天气",
    39: "恶劣天气",
    40: "恶劣天气",
    41: "恶劣天气",
    42: "恶劣天气",
    43: "恶劣天气",
    44: "恶劣天气",
    49: "恶劣天气",
    56: "恶劣天气",
    57: "恶劣天气",
    66: "恶劣天气",
    67: "恶劣天气",
    83: "恶劣天气",
    84: "恶劣天气",
    97: "恶劣天气",
    98: "恶劣天气",
  };
  let typeKey = codes[cur.weather_code] || "晴天";
  if (getWindLevel(cur.wind_speed_10m) === "龙卷风") typeKey = "恶劣天气";
  document.getElementById("weather-brief").innerText = typeKey;
  const quotes =
    EMOTION_DB.weather_base[typeKey]?.[period] ||
    EMOTION_DB.weather_base[typeKey]?.["通用"] ||
    EMOTION_DB["默认"];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const moreDiv = document.getElementById("weather-more");
  if (moreDiv)
    moreDiv.innerHTML = `<div style="margin-top:12px;font-size:0.85rem;color:#ccc;">「 ${quote} 」<hr><div>🌡️ ${cur.temperature_2m}°C  🌡️ 最高${daily.temperature_2m_max[0]}°C / 最低${daily.temperature_2m_min[0]}°C</div><div>💧 湿度${cur.relative_humidity_2m}%  ☁️ 云量${cur.cloud_cover}%</div><div>🌬️ ${getWindLevel(cur.wind_speed_10m)} ${cur.wind_speed_10m}km/h  🧭 ${windDirection(cur.wind_direction_10m)}</div><div>☀️ 紫外线${cur.uv_index}</div></div>`;
}
window.toggleWeather = function () {
  const m = document.getElementById("weather-more"),
    a = document.getElementById("weather-arrow");
  if (!m) return;
  if (m.style.maxHeight === "0px" || !m.style.maxHeight) {
    m.style.maxHeight = m.scrollHeight + "px";
    if (a) a.style.transform = "rotate(180deg)";
  } else {
    m.style.maxHeight = "0px";
    if (a) a.style.transform = "rotate(0deg)";
  }
};

// ========== 4. 节点与连线核心 ==========
function lightenColor(hex, percent) {
  const map = {
    "#1E90FF": "#66CCFF",
    "#22C55E": "#8BEC9B",
    "#FF4500": "#FFA07A",
    "#FF8C00": "#FFB347",
  };
  if (map[hex]) return map[hex];
  hex = hex.replace("#", "");
  let r = parseInt(hex.substring(0, 2), 16),
    g = parseInt(hex.substring(2, 4), 16),
    b = parseInt(hex.substring(4, 6), 16);
  r = Math.min(255, r + Math.floor((255 * percent) / 100));
  g = Math.min(255, g + Math.floor((255 * percent) / 100));
  b = Math.min(255, b + Math.floor((255 * percent) / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function drawGradientLine(
  x1,
  y1,
  x2,
  y2,
  r1,
  r2,
  baseColor,
  isActive,
  type = "line",
) {
  const svg = document.getElementById("link-svg");
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const sx = x1 + Math.cos(angle) * r1,
    sy = y1 + Math.sin(angle) * r1;
  const ex = x2 - Math.cos(angle) * r2,
    ey = y2 - Math.sin(angle) * r2;
  const gradId = `grad-${Date.now()}-${Math.random()}`;
  const gradient = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "linearGradient",
  );
  gradient.setAttribute("id", gradId);
  gradient.setAttribute("x1", sx);
  gradient.setAttribute("y1", sy);
  gradient.setAttribute("x2", ex);
  gradient.setAttribute("y2", ey);
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");
  const light = lightenColor(baseColor, 40);
  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", light);
  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "50%");
  stop2.setAttribute("stop-color", baseColor);
  const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop3.setAttribute("offset", "100%");
  stop3.setAttribute("stop-color", light);
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
  } else line.style.opacity = "0.3";
  svg.appendChild(line);
  return { start: { x: sx, y: sy }, end: { x: ex, y: ey } };
}

function createNode(txt, x, y, cls, onClick) {
  const camera = document.getElementById("camera");
  const div = document.createElement("div");
  div.className = `node-item ${cls}`;
  div.style.left = x + "px";
  div.style.top = y + "px";
  div.innerHTML = `<span>${txt}</span>`;
  div.onclick = onClick;
  div.addEventListener(
    "touchstart",
    (e) => {
      e.stopPropagation();
      onClick();
    },
    { passive: false },
  );
  camera.appendChild(div);
  return div;
}

function createDoubleYearFrame(x, y, w, h) {
  const camera = document.getElementById("camera");
  const outer = document.createElement("div");
  outer.className = "year-frame-outer";
  outer.style.cssText = `position:absolute; left:${x}px; top:${y}px; width:${w}px; height:${h}px; border:2px solid #0066FF; box-sizing:border-box; pointer-events:none; z-index:5;`;
  const inner = document.createElement("div");
  inner.className = "year-frame-inner";
  inner.style.cssText = `position:absolute; left:15px; top:15px; width:calc(100% - 30px); height:calc(100% - 30px); border:2px solid #66CCFF; box-sizing:border-box; pointer-events:none; box-shadow:0 0 15px rgba(102,204,255,0.3);`;
  outer.appendChild(inner);
  camera.appendChild(outer);
  return {
    outer: { left: x, right: x + w, top: y, bottom: y + h },
    inner: { left: x + 15, right: x + w - 15, top: y + 15, bottom: y + h - 15 },
  };
}

function moveCamera(tx, ty) {
  camX = window.innerWidth / 2 - tx;
  camY = window.innerHeight / 2 - ty;
  document.getElementById("camera").style.transform =
    `translate(${camX}px, ${camY}px)`;
}

function initDragSystem() {
  const stage = document.getElementById("archive-stage"),
    camera = document.getElementById("camera");
  if (!stage || !camera) return;
  let startX = 0,
    startY = 0,
    startCamX = 0,
    startCamY = 0,
    isDragging = false,
    dragThreshold = 8;
  const onPointerDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    startX = p.clientX;
    startY = p.clientY;
    startCamX = camX;
    startCamY = camY;
    isDragging = false;
    camera.style.transition = "none";
  };
  const onPointerMove = (e) => {
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - startX,
      dy = p.clientY - startY;
    if (!isDragging && Math.hypot(dx, dy) > dragThreshold) isDragging = true;
    if (isDragging) {
      e.preventDefault();
      camX = startCamX + dx;
      camY = startCamY + dy;
      camera.style.transform = `translate(${camX}px, ${camY}px)`;
    }
  };
  const onPointerUp = () => {
    isDragging = false;
    camera.style.transition = "transform 0.6s ease-out";
  };
  stage.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  stage.addEventListener("touchstart", onPointerDown, { passive: false });
  window.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("touchend", onPointerUp);
}

// ========== 5. 场景渲染与切换 ==========
function renderArchive(state) {
  const camera = document.getElementById("camera");
  const centerX = 2500,
    centerY = 2500;
  if (!camera) {
    console.error("camera element not found");
    return;
  }

  // 确保 svgCache 存在
  if (!svgCache) {
    camera.innerHTML =
      '<svg id="link-svg" style="position:absolute; width:5000px; height:5000px; pointer-events:none;"></svg>';
    svgCache = document.getElementById("link-svg");
    if (!svgCache) {
      console.error("Failed to create svgCache");
      return;
    }
  }

  // 清除旧连线
  svgCache
    .querySelectorAll("line, linearGradient")
    .forEach((el) => el.remove());

  // 粒子系统
  if (!window.particleSystem) {
    window.particleSystem = new ParticleSystem();
  } else if (!camera.contains(window.particleSystem.canvas)) {
    camera.appendChild(window.particleSystem.canvas);
  }

  // ★ 关键：进入 root 状态时强制相机对准中心
  if (state === "root") {
    resetCameraToCenter();
  }

  // 状态切换时重建场景
  if (lastState !== state) {
    for (let k in particleTimers) clearInterval(particleTimers[k]);
    if (window.particleSystem) {
      if (window.particleSystem.linkInterval)
        clearInterval(window.particleSystem.linkInterval);
      if (window.particleSystem.frameInterval)
        clearInterval(window.particleSystem.frameInterval);
      window.particleSystem.particles = [];
    }
    document
      .querySelectorAll(".node-item, .year-frame-outer, .year-frame-inner")
      .forEach((el) => el.remove());
    currentFrameBounds = null;
    nodesCache = { years: new Map(), months: new Map(), tags: new Map() };
    buildScene(state, centerX, centerY);
  } else {
    updateNodeSelection(state);
  }

  lastState = state;
  updateConfirmBtn();
}
function resetCameraToCenter() {
  const camera = document.getElementById("camera");
  if (!camera) return;
  const centerX = 2500;
  const centerY = 2500;
  camX = window.innerWidth / 2 - centerX;
  camY = window.innerHeight / 2 - centerY;
  camera.style.transform = `translate(${camX}px, ${camY}px)`;
}

function buildScene(state, centerX, centerY) {
  if (state === "root") {
    moveCamera(centerX, centerY); // 可以保留，但 resetCameraToCenter 已经做了更好
    createNode("时间", centerX - 150, centerY, "main circle", () =>
      renderArchive("time"),
    );
    createNode("类型", centerX, centerY, "main circle", () =>
      renderArchive("type_grid"),
    );
    createNode(
      "推荐",
      centerX + 150,
      centerY,
      "main circle",
      () => (window.location.href = "/recommend.html"),
    );
  } else if (state === "time") {
    moveCamera(centerX, centerY);
    createNode("时间", centerX - 400, centerY, "main circle selected", () =>
      renderArchive("root"),
    );
    createNode("年份", centerX, centerY - 150, "sub circle", () =>
      renderArchive("year_grid"),
    );
    createNode("月份", centerX, centerY + 150, "sub circle", () =>
      renderArchive("month_grid"),
    );
    drawGradientLine(
      centerX - 400,
      centerY,
      centerX,
      centerY - 150,
      RADIUS.MAIN,
      RADIUS.SUB,
      "#888",
      true,
    );
    drawGradientLine(
      centerX - 400,
      centerY,
      centerX,
      centerY + 150,
      RADIUS.MAIN,
      RADIUS.SUB,
      "#888",
      true,
    );
  } else if (state === "year_grid") {
    moveCamera(centerX + 300, centerY);
    createNode("年份", centerX - 400, centerY, "sub circle selected", () =>
      renderArchive("time"),
    );
    const years = Array.from({ length: 31 }, (_, i) => 1996 + i);
    const fx = centerX - 50,
      fy = centerY - 250,
      frameW = 1100,
      frameH = 500;
    currentFrameBounds = createDoubleYearFrame(fx, fy, frameW, frameH);
    const ends = drawGradientLine(
      centerX - 400,
      centerY,
      fx,
      centerY,
      RADIUS.SUB,
      0,
      "#0066FF",
      true,
    );
    if (window.particleSystem) {
      window.particleSystem.startLinkParticles(
        ends.start,
        ends.end,
        "#66CCFF",
        currentFrameBounds.outer,
      );
      window.particleSystem.startYearFrameEffects(currentFrameBounds);
    }
    years.forEach((y, i) => {
      const col = i % 10,
        row = Math.floor(i / 10);
      const nx = fx + 80 + col * 100,
        ny = fy + 70 + row * 110;
      const node = createNode(y.toString(), nx, ny, "year-tag", () =>
        toggleYear(y),
      );
      nodesCache.years.set(y, node);
    });
  } else if (state === "month_grid") {
    const anchorX = centerX + 150,
      anchorY = centerY;
    moveCamera(anchorX, anchorY);
    createNode("月份", anchorX, anchorY, "sub circle node-plant selected", () =>
      renderArchive("time"),
    );
    const layouts = [
      {
        m: 1,
        label: "1月新番",
        x: anchorX - 380,
        y: anchorY - 280,
        color: "#1E90FF",
        cls: "node-winter",
      },
      {
        m: 4,
        label: "4月新番",
        x: anchorX + 380,
        y: anchorY - 280,
        color: "#22C55E",
        cls: "node-spring",
      },
      {
        m: 7,
        label: "7月新番",
        x: anchorX - 380,
        y: anchorY + 280,
        color: "#FF4500",
        cls: "node-summer",
      },
      {
        m: 10,
        label: "10月新番",
        x: anchorX + 380,
        y: anchorY + 280,
        color: "#FF8C00",
        cls: "node-autumn",
      },
    ];
    layouts.forEach((s) => {
      drawGradientLine(
        anchorX,
        anchorY,
        s.x,
        s.y,
        RADIUS.SUB,
        RADIUS.MONTH,
        s.color,
        currentChoice.months.includes(s.m),
        "month",
      );
      const node = createNode(s.label, s.x, s.y, `month-node ${s.cls}`, () =>
        toggleMonth(s.m, s.x, s.y, s.color),
      );
      node.style.borderColor = s.color;
      nodesCache.months.set(s.m, node);
    });
  } else if (state === "type_grid") {
    moveCamera(centerX, centerY);
    createNode("类型", centerX, centerY, "main circle selected", () =>
      renderArchive("root"),
    );
    const tags = [
      "异世界",
      "校园",
      "恋爱",
      "搞笑",
      "日常",
      "热血",
      "思考",
      "音乐",
      "运动",
      "战斗",
      "游戏类",
      "乙游",
      "工作",
      "爽",
      "泡面番",
      "狗屎",
      "无聊",
      "猎奇",
      "后宫",
      "H",
      "色色",
      "卖肉",
      "好看",
      "神作",
      "治愈",
      "致郁",
      "剧场版",
      "机架",
      "百合",
      "少女",
      "微甜",
      "中甜",
      "催泪",
      "冒险",
      "灵能",
      "偶像",
      "演员",
      "复仇",
      "侦探",
      "战争",
      "末日",
      "魔法少女",
      "VTuber",
      "美食",
      "系统",
      "穿越",
      "逃生",
      "智斗",
      "悬疑",
      "少年",
      "卡牌",
      "纯爱",
      "发展",
      "宠物",
      "宫斗",
      "特工",
      "黑社会",
      "赛马",
      "登山",
    ];
    const colors = [
      "#FF4500",
      "#9370DB",
      "#FF69B4",
      "#00FFFF",
      "#ADFF2F",
      "#8B0000",
      "#1E90FF",
      "#F0E68C",
    ];
    tags.forEach((tag, i) => {
      const angle = (i / tags.length) * Math.PI * 2;
      const r = 320 + (i % 3) * 70;
      const nx = centerX + Math.cos(angle) * r,
        ny = centerY + Math.sin(angle) * r;
      const myColor = colors[i % colors.length];
      drawGradientLine(
        centerX,
        centerY,
        nx,
        ny,
        RADIUS.MAIN,
        RADIUS.TAG,
        myColor,
        currentChoice.tags.includes(tag),
        "tag",
      );
      const node = createNode(tag, nx, ny, "tag-node", () =>
        toggleTag(tag, nx, ny, myColor),
      );
      node.style.borderColor = myColor;
      node.style.color = myColor;
      nodesCache.tags.set(tag, node);
    });
  }
}

function updateNodeSelection(state) {
  nodesCache.years.forEach((node, y) => {
    if (currentChoice.years.includes(y)) node.classList.add("selected");
    else node.classList.remove("selected");
  });
  nodesCache.months.forEach((node, m) => {
    if (currentChoice.months.includes(m)) node.classList.add("selected");
    else node.classList.remove("selected");
  });
  nodesCache.tags.forEach((node, tag) => {
    if (currentChoice.tags.includes(tag)) node.classList.add("selected");
    else node.classList.remove("selected");
  });
  rebuildMonthLinks();
  rebuildTagLinks();
}

function rebuildMonthLinks() {
  const svg = document.getElementById("link-svg");
  if (!svg) return;
  svg
    .querySelectorAll('line[data-type="month"], line[data-type="line"]')
    .forEach((l) => l.remove());
  const anchorX = 2500 + 150,
    anchorY = 2500;
  nodesCache.months.forEach((node, m) => {
    const x = parseFloat(node.style.left),
      y = parseFloat(node.style.top);
    const color = getMonthColor(m);
    drawGradientLine(
      anchorX,
      anchorY,
      x,
      y,
      RADIUS.SUB,
      RADIUS.MONTH,
      color,
      currentChoice.months.includes(m),
      "month",
    );
  });
}
function rebuildTagLinks() {
  const svg = document.getElementById("link-svg");
  if (!svg) return;
  svg
    .querySelectorAll('line[data-type="tag"], line[data-type="line"]')
    .forEach((l) => l.remove());
  const centerX = 2500,
    centerY = 2500;
  nodesCache.tags.forEach((node, tag) => {
    const x = parseFloat(node.style.left),
      y = parseFloat(node.style.top);
    const color = getTagColor(tag);
    drawGradientLine(
      centerX,
      centerY,
      x,
      y,
      RADIUS.MAIN,
      RADIUS.TAG,
      color,
      currentChoice.tags.includes(tag),
      "tag",
    );
  });
}
function getMonthColor(m) {
  const map = { 1: "#1E90FF", 4: "#22C55E", 7: "#FF4500", 10: "#FF8C00" };
  return map[m] || "#FFF";
}
function getTagColor(tag) {
  const map = {
    异世界: "#FF4500",
    校园: "#9370DB",
    恋爱: "#FF69B4",
    搞笑: "#00FFFF",
    日常: "#ADFF2F",
    热血: "#8B0000",
    思考: "#1E90FF",
    音乐: "#F0E68C",
    运动: "#FFD700",
    泡面番: "#FFA07A",
    狗屎: "#8B4513",
    无聊: "#808080",
    后宫: "#FF99CC",
    H: "#FF3366",
    卖肉: "#FF66CC",
    好看: "#FFD700",
    神作: "#FFD700",
  };
  return map[tag] || "#FFF";
}

// ========== 6. 选择与粒子效果 ==========
function spawnParticles(x, y, color, isYear = false) {
  const camera = document.getElementById("camera");
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("div");
    p.className = isYear ? "white-particle" : "particle";
    const tx = (Math.random() - 0.5) * 30,
      ty = -Math.random() * 80 - 20;
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.setProperty("--tx", `${tx}px`);
    p.style.setProperty("--ty", `${ty}px`);
    if (!isYear) p.style.background = color;
    camera.appendChild(p);
    setTimeout(() => p.remove(), 1500);
  }
}
function toggleYear(y) {
  const idx = currentChoice.years.indexOf(y);
  if (idx !== -1) currentChoice.years.splice(idx, 1);
  else {
    currentChoice.years.push(y);
    const node = nodesCache.years.get(y);
    if (node)
      spawnParticles(
        parseFloat(node.style.left),
        parseFloat(node.style.top),
        "#FFFFFF",
        true,
      );
  }
  updateNodeSelection("year_grid");
  updateConfirmBtn(true);
}
function toggleMonth(m, x, y, color) {
  const idx = currentChoice.months.indexOf(m);
  if (idx !== -1) {
    currentChoice.months.splice(idx, 1);
    if (particleTimers[`month_${m}`])
      clearInterval(particleTimers[`month_${m}`]);
  } else {
    currentChoice.months.push(m);
    if (m === 1) startContinuousSnow(x, y, m);
    else if (m === 4) startContinuousPetal(x, y, m);
    else if (m === 7) startContinuousHeat(x, y, m);
    else if (m === 10) startContinuousLeaf(x, y, m);
    else generateMonthParticle(m, x, y);
  }
  updateNodeSelection("month_grid");
  updateConfirmBtn(true);
}
function startContinuousSnow(x, y, m) {
  if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
  particleTimers[`month_${m}`] = setInterval(() => {
    if (!currentChoice.months.includes(m)) {
      clearInterval(particleTimers[`month_${m}`]);
      return;
    }
    for (let i = 0; i < 3; i++) {
      const snow = document.createElement("div");
      snow.className = "snow-particle";
      snow.style.left = x + (Math.random() - 0.5) * 60 + "px";
      snow.style.top = y + (Math.random() - 0.5) * 40 + "px";
      snow.style.animation = `snowFall ${1 + Math.random() * 1}s linear forwards`;
      document.getElementById("camera").appendChild(snow);
      setTimeout(() => snow.remove(), 2000);
    }
  }, 500);
}
function startContinuousPetal(x, y, m) {
  if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
  particleTimers[`month_${m}`] = setInterval(() => {
    if (!currentChoice.months.includes(m)) {
      clearInterval(particleTimers[`month_${m}`]);
      return;
    }
    for (let i = 0; i < 3; i++) {
      const petal = document.createElement("div");
      petal.className = "petal-particle";
      petal.style.left = x + (Math.random() - 0.5) * 50 + "px";
      petal.style.top = y + (Math.random() - 0.5) * 30 + "px";
      petal.style.animation = `petalUp ${1.5 + Math.random() * 1}s linear forwards`;
      document.getElementById("camera").appendChild(petal);
      setTimeout(() => petal.remove(), 2000);
    }
  }, 600);
}
function startContinuousHeat(x, y, m) {
  if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
  particleTimers[`month_${m}`] = setInterval(() => {
    if (!currentChoice.months.includes(m)) {
      clearInterval(particleTimers[`month_${m}`]);
      return;
    }
    for (let i = 0; i < 4; i++) {
      const heat = document.createElement("div");
      heat.className = "heat-particle";
      heat.style.left = x + (Math.random() - 0.5) * 80 + "px";
      heat.style.top = y + (Math.random() - 0.5) * 40 + "px";
      heat.style.animation = `heatWave ${1.2 + Math.random() * 0.8}s ease-out forwards`;
      document.getElementById("camera").appendChild(heat);
      setTimeout(() => heat.remove(), 1500);
    }
  }, 400);
}
function startContinuousLeaf(x, y, m) {
  if (particleTimers[`month_${m}`]) clearInterval(particleTimers[`month_${m}`]);
  particleTimers[`month_${m}`] = setInterval(() => {
    if (!currentChoice.months.includes(m)) {
      clearInterval(particleTimers[`month_${m}`]);
      return;
    }
    for (let i = 0; i < 2; i++) {
      const leaf = document.createElement("div");
      leaf.className = "leaf-particle";
      leaf.style.left = x + (Math.random() - 0.5) * 70 + "px";
      leaf.style.top = y + (Math.random() - 0.5) * 50 + "px";
      leaf.style.animation = `leafFall ${1.8 + Math.random() * 1}s linear forwards`;
      document.getElementById("camera").appendChild(leaf);
      setTimeout(() => leaf.remove(), 2500);
    }
  }, 800);
}
function generateMonthParticle(month, x, y) {
  const camera = document.getElementById("camera");
  if (month === 1)
    for (let i = 0; i < 20; i++) {
      const snow = document.createElement("div");
      snow.className = "snow-particle";
      snow.style.left = x + (Math.random() - 0.5) * 60 + "px";
      snow.style.top = y + (Math.random() - 0.5) * 40 + "px";
      snow.style.animation = `snowFall ${1 + Math.random() * 1}s linear forwards`;
      camera.appendChild(snow);
      setTimeout(() => snow.remove(), 2000);
    }
  else if (month === 4)
    for (let i = 0; i < 15; i++) {
      const petal = document.createElement("div");
      petal.className = "petal-particle";
      petal.style.left = x + (Math.random() - 0.5) * 50 + "px";
      petal.style.top = y + (Math.random() - 0.5) * 30 + "px";
      petal.style.animation = `petalUp ${1.5 + Math.random() * 1}s linear forwards`;
      camera.appendChild(petal);
      setTimeout(() => petal.remove(), 2000);
    }
  else if (month === 7)
    for (let i = 0; i < 25; i++) {
      const heat = document.createElement("div");
      heat.className = "heat-particle";
      heat.style.left = x + (Math.random() - 0.5) * 80 + "px";
      heat.style.top = y + (Math.random() - 0.5) * 40 + "px";
      heat.style.animation = `heatWave ${1.2 + Math.random() * 0.8}s ease-out forwards`;
      camera.appendChild(heat);
      setTimeout(() => heat.remove(), 1500);
    }
  else if (month === 10)
    for (let i = 0; i < 12; i++) {
      const leaf = document.createElement("div");
      leaf.className = "leaf-particle";
      leaf.style.left = x + (Math.random() - 0.5) * 70 + "px";
      leaf.style.top = y + (Math.random() - 0.5) * 50 + "px";
      leaf.style.animation = `leafFall ${1.8 + Math.random() * 1}s linear forwards`;
      camera.appendChild(leaf);
      setTimeout(() => leaf.remove(), 2500);
    }
}
function toggleTag(tag, x, y, color) {
  const idx = currentChoice.tags.indexOf(tag);
  if (idx !== -1) {
    currentChoice.tags.splice(idx, 1);
    if (particleTimers[`tag_${tag}`])
      clearInterval(particleTimers[`tag_${tag}`]);
  } else {
    currentChoice.tags.push(tag);
    if (tag === "音乐") startContinuousMusic(x, y);
    else if (tag === "恋爱") startContinuousLove(x, y);
    else if (tag === "热血") startContinuousHotBlood(x, y);
    else generateTagParticle(tag, x, y);
  }
  updateNodeSelection("type_grid");
  updateConfirmBtn(true);
}
function startContinuousMusic(x, y) {
  if (particleTimers["tag_音乐"]) clearInterval(particleTimers["tag_音乐"]);
  particleTimers["tag_音乐"] = setInterval(() => {
    if (!currentChoice.tags.includes("音乐")) {
      clearInterval(particleTimers["tag_音乐"]);
      return;
    }
    const notes = ["♪", "♫", "♩", "🎵", "🎶"];
    for (let i = 0; i < 3; i++) {
      const note = document.createElement("div");
      note.className = "note-particle";
      note.innerHTML = notes[Math.floor(Math.random() * notes.length)];
      note.style.left = x + (Math.random() - 0.5) * 80 + "px";
      note.style.top = y + (Math.random() - 0.5) * 60 + "px";
      const angle = Math.random() * Math.PI * 2,
        speed = 1 + Math.random() * 2;
      note.style.setProperty("--tx", Math.cos(angle) * speed + "px");
      note.style.setProperty("--ty", Math.sin(angle) * speed + "px");
      note.style.color = `hsl(${Math.random() * 360},100%,60%)`;
      note.style.animation = "noteFloat 1s ease-out forwards";
      document.getElementById("camera").appendChild(note);
      setTimeout(() => note.remove(), 1000);
    }
  }, 800);
}
function startContinuousLove(x, y) {
  if (particleTimers["tag_恋爱"]) clearInterval(particleTimers["tag_恋爱"]);
  particleTimers["tag_恋爱"] = setInterval(() => {
    if (!currentChoice.tags.includes("恋爱")) {
      clearInterval(particleTimers["tag_恋爱"]);
      return;
    }
    for (let i = 0; i < 4; i++) {
      const heart = document.createElement("div");
      heart.className = "heart-particle";
      heart.innerHTML = "❤️";
      heart.style.left = x + (Math.random() - 0.5) * 70 + "px";
      heart.style.top = y + (Math.random() - 0.5) * 50 + "px";
      const angle = Math.random() * Math.PI * 2,
        speed = 1 + Math.random() * 2;
      heart.style.setProperty("--tx", Math.cos(angle) * speed + "px");
      heart.style.setProperty("--ty", Math.sin(angle) * speed + "px");
      heart.style.color = Math.random() > 0.5 ? "#FF3366" : "#FF99CC";
      heart.style.animation = "heartUp 1s ease-out forwards";
      document.getElementById("camera").appendChild(heart);
      setTimeout(() => heart.remove(), 1000);
    }
  }, 600);
}
function startContinuousHotBlood(x, y) {
  if (particleTimers["tag_热血"]) clearInterval(particleTimers["tag_热血"]);
  particleTimers["tag_热血"] = setInterval(() => {
    if (!currentChoice.tags.includes("热血")) {
      clearInterval(particleTimers["tag_热血"]);
      return;
    }
    for (let i = 0; i < 5; i++) {
      const bubble = document.createElement("div");
      bubble.className = "hot-particle";
      bubble.style.left = x + (Math.random() - 0.5) * 100 + "px";
      bubble.style.top = y + (Math.random() - 0.5) * 60 + "px";
      const angle = Math.random() * Math.PI * 2,
        speed = 0.5 + Math.random() * 2;
      bubble.style.setProperty("--tx", Math.cos(angle) * speed + "px");
      bubble.style.setProperty("--ty", Math.sin(angle) * speed - 1 + "px");
      bubble.style.background = `rgba(255,${Math.floor(30 + Math.random() * 80)},0,0.8)`;
      bubble.style.animation = "boiling 1s ease-out forwards";
      document.getElementById("camera").appendChild(bubble);
      setTimeout(() => bubble.remove(), 1000);
    }
  }, 500);
}
function generateTagParticle(tag, x, y) {
  const camera = document.getElementById("camera");
  if (tag === "H")
    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "tag-particle";
      p.style.left = x + "px";
      p.style.top = y + "px";
      const angle = Math.random() * Math.PI * 2,
        speed = 2 + Math.random() * 4;
      p.style.setProperty("--tx", Math.cos(angle) * speed + "px");
      p.style.setProperty("--ty", Math.sin(angle) * speed + "px");
      p.style.background = "#FFD700";
      camera.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  else if (tag === "狗屎")
    for (let i = 0; i < 15; i++) {
      const poop = document.createElement("div");
      poop.className = "poop-particle";
      poop.innerHTML = "💩";
      poop.style.left = x + (Math.random() - 0.5) * 60 + "px";
      poop.style.top = y + (Math.random() - 0.5) * 40 + "px";
      const angle = Math.random() * Math.PI * 2,
        speed = 1 + Math.random() * 2;
      poop.style.setProperty("--tx", Math.cos(angle) * speed + "px");
      poop.style.setProperty("--ty", Math.sin(angle) * speed + "px");
      poop.style.fontSize = `${16 + Math.random() * 12}px`;
      poop.style.animation = "poopFall 1s linear forwards";
      camera.appendChild(poop);
      setTimeout(() => poop.remove(), 1500);
    }
}

function jumpToResult(keyword = "") {
  const y = currentChoice.years.join(","),
    m = currentChoice.months.join(","),
    t = currentChoice.tags.join(",");
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (y) params.set("year", y);
  if (m) params.set("month", m);
  if (t) params.set("tag", t);
  window.location.href = `/search.html?${params.toString()}`;
}

// ========== 7. 高级粒子系统（canvas） ==========
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.style.cssText =
      "position:absolute; top:0; left:0; pointer-events:none; z-index:30;";
    document.getElementById("camera").appendChild(this.canvas);
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
      color: options.color || "#ffffff",
      size: options.size || 3,
      life: options.life || 1.0,
      decay: options.decay || 0.01,
      targetY: options.targetY,
      onHit: options.onHit || null,
      fromBottom: options.fromBottom || false,
    });
  }
  createDropletFromTop(bounds, color = "#66CCFF") {
    const x =
      bounds.left + 15 + Math.random() * (bounds.right - bounds.left - 30);
    this.createParticle({
      x,
      y: bounds.top + 15,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1 + Math.random() * 2,
      color,
      size: 4,
      life: 1,
      decay: 0,
      targetY: bounds.bottom - 15,
      onHit: (p) => {
        for (let i = 0; i < 6; i++)
          this.createParticle({
            x: p.x,
            y: bounds.bottom - 15,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2 - 1,
            color: p.color,
            size: 2,
            life: 0.8,
            decay: 0.02,
          });
        return true;
      },
    });
  }
  createDropletFromBottom(bounds, color = "#0066FF") {
    const x = bounds.left + Math.random() * (bounds.right - bounds.left);
    this.createParticle({
      x,
      y: bounds.bottom,
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
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const t = Math.random();
        const x = start.x + (end.x - start.x) * t,
          y = start.y + (end.y - start.y) * t;
        const speed = 0.3 + Math.random() * 0.5;
        const dx = end.x - x,
          dy = end.y - y,
          dist = Math.hypot(dx, dy);
        if (dist === 0) continue;
        const vx = (dx / dist) * speed,
          vy = (dy / dist) * speed;
        this.createParticle({
          x,
          y,
          vx,
          vy,
          color,
          size: 2,
          life: 1,
          decay: 0.02,
          targetY: bounds ? bounds.bottom : null,
          onHit: (p) => {
            for (let j = 0; j < 4; j++)
              this.createParticle({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                color: p.color,
                size: 1,
                life: 0.5,
                decay: 0.03,
              });
            return true;
          },
        });
      }
    }, 500);
  }
  startYearFrameEffects(bounds) {
    if (this.frameInterval) clearInterval(this.frameInterval);
    this.frameInterval = setInterval(() => {
      if (Math.random() < 0.3)
        this.createDropletFromTop(bounds.inner, "#66CCFF");
      if (Math.random() < 0.2)
        this.createDropletFromBottom(bounds.outer, "#0066FF");
    }, 200);
  }
  stopYearFrameEffects() {
    if (this.frameInterval) clearInterval(this.frameInterval);
    this.frameInterval = null;
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
        const btn = document.getElementById("confirm-btn");
        if (btn && btn.classList.contains("active"))
          for (let j = 0; j < 8; j++)
            this.createParticle({
              x: p.x,
              y: this.canvas.height,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 2,
              color: p.color,
              size: 3,
              life: 0.6,
              decay: 0.02,
            });
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

// ========== 8. UI 控制与启动 ==========
function updateConfirmBtn(immediate = false) {
  const btn = document.getElementById("confirm-btn");
  const ready =
    currentChoice.years.length > 0 ||
    currentChoice.months.length > 0 ||
    currentChoice.tags.length > 0;
  btn.className = ready ? "active" : "";
  let summary = "";
  if (currentChoice.years.length)
    summary += `年份: ${currentChoice.years.join("、")} `;
  if (currentChoice.months.length) {
    const monthNames = {
      1: "1月新番",
      4: "4月新番",
      7: "7月新番",
      10: "10月新番",
    };
    summary += `月份: ${currentChoice.months.map((m) => monthNames[m]).join("、")} `;
  }
  if (currentChoice.tags.length)
    summary += `类型: ${currentChoice.tags.join("、")}`;
  btn.innerText = ready ? `确认观测 (${summary})` : "数据链未就绪";
  if (immediate && ready) {
    btn.style.transform = "scale(1.05)";
    setTimeout(() => (btn.style.transform = ""), 200);
  }
}

function showSection(id) {
  const isArchive = id === "archive";
  if (!isArchive) {
    // 离开 archive 模式时，重置相机并清除粒子、框架等
    resetCamera();
    if (window.particleSystem) {
      if (window.particleSystem.linkInterval)
        clearInterval(window.particleSystem.linkInterval);
      if (window.particleSystem.frameInterval)
        clearInterval(window.particleSystem.frameInterval);
      window.particleSystem.particles = [];
    }
    document
      .querySelectorAll("#camera .year-frame-outer, #camera .year-frame-inner")
      .forEach((el) => el.remove());
    currentFrameBounds = null;
    // 显示首页元素，隐藏 archive-stage
    document
      .querySelectorAll(".top-left, .search-area, .poem-right")
      .forEach((el) => (el.style.display = "block"));
    document.getElementById("archive-stage").style.display = "none";
    document.getElementById("confirm-btn").style.display = "none";
  } else {
    // 进入 archive 模式
    // 进入 archive 模式
    document
      .querySelectorAll(".top-left, .search-area, .poem-right")
      .forEach((el) => (el.style.display = "none"));
    document.getElementById("archive-stage").style.display = "block";
    document.getElementById("confirm-btn").style.display = "block";
    // 重置相机偏移变量
    camX = 0;
    camY = 0;
    renderArchive("root");
  }
}

async function checkLoginAndRedirect() {
  try {
    const res = await fetch("/api/user/current", { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "/login.html";
      return false;
    }
    const data = await res.json();
    if (!data.email) {
      window.location.href = "/login.html";
      return false;
    }
    return true;
  } catch (err) {
    window.location.href = "/login.html";
    return false;
  }
}

function updateProfileDisplay() {
  const profile = JSON.parse(localStorage.getItem("user_profile") || "{}");
  const title = profile.title || "观测者";
  const name = profile.name || "";
  const identityTag = document.getElementById("identity-tag");
  if (identityTag)
    identityTag.innerHTML = `【 ${title} 】${name ? " · " + name : ""}`;
  const locationParts = [
    profile.planet,
    profile.country,
    profile.region,
  ].filter((p) => p && p.trim());
  const geoDisplay = document.getElementById("geo-display");
  if (geoDisplay && locationParts.length)
    geoDisplay.innerText = locationParts.join(" · ");
}

async function initAll() {
  const logged = await checkLoginAndRedirect();
  if (!logged) return;
  await syncUserAvatar();
  initEnvironment();
  initDragSystem();
  updateCustomClock();
  setInterval(updateCustomClock, 1000);
  initSearchBox();
  const panel = document.getElementById("poem-panel");
  if (panel) {
    panel.innerHTML = "";
    poemContent.forEach((line, i) => {
      const div = document.createElement("div");
      div.className = "poem-line";
      line.split("").forEach((char, j) => {
        const span = document.createElement("span");
        span.className = "char";
        span.innerText = char;
        div.appendChild(span);
        setTimeout(() => span.classList.add("active"), i * 1000 + j * 100);
      });
      panel.appendChild(div);
    });
  }
  const confirmBtn = document.getElementById("confirm-btn");
  if (confirmBtn)
    confirmBtn.addEventListener("click", () => {
      if (
        currentChoice.years.length ||
        currentChoice.months.length ||
        currentChoice.tags.length
      )
        jumpToResult();
    });
  showSection("home");
  updateProfileDisplay();
  window.addEventListener("profileUpdated", updateProfileDisplay);
}

// 导出全局初始化函数（供 HTML 调用）
window.initAll = initAll;
