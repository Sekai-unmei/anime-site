# 动漫数据格式说明

每个动漫条目是一个 JSON 对象，字段如下：

- **id** (number) : 唯一标识，自增
- **title** (string) : 完整标题（如 "Fate/stay night [2006]"）
- **series_title** (string) : 系列名称（同一系列不同季/篇共享，如 "Fate/stay night"）
- **season** (string) : **推荐使用 `"YYYY-M"` 格式**（如 `"2006-4"`），用于匹配用户选择的年份和月份；也可使用其他字符串（如 "第一季"），但将无法按年份+月份筛选。
- **aliases** (array) : 别名列表（用于搜索）
- **description** (string) : 简介
- **recommend_text** (string) : 推荐语
- **image_url** (string) : 图片路径（相对 public 目录，如 `"/images/fate_2006.jpg"`）
- **rating** (string) : 推荐等级，可选值：`"神作"`, `"好看"`, `"还行"`, `"普通"`, `"无聊"`, `"狗屎"`, `"H"`
- **genre** (array) : 题材类型数组（可多选），如 `["奇幻", "战斗"]`
- **ratings** (object) : 评分统计，初始全0，格式 `{ "神作":0, "好看":0, "普通":0, "无聊":0, "狗屎":0, "哲救世皇骗":0 }`
- **user_ratings** (object) : 用户投票记录，初始空对象 `{}`

---

### 完整示例

```json
[
  {
    "id": 1,
    "title": "Fate/stay night [2006]",
    "series_title": "Fate",
    "season": "2006-4",
    "aliases": ["命运之夜", "FSN"],
    "description": "圣杯战争，魔术师与英灵的战斗。",
    "recommend_text": "经典入坑作",
    "image_url": "/images/fate_2006.jpg",
    "rating": "好看",
    "genre": ["奇幻", "战斗"],
    "ratings": {
      "神作": 0,
      "好看": 0,
      "普通": 0,
      "无聊": 0,
      "狗屎": 0,
      "哲救世皇骗": 0
    },
    "user_ratings": {}
  },
  {
    "id": 2,
    "title": "进击的巨人 第一季",
    "series_title": "进击的巨人",
    "season": "2013-4",
    "aliases": ["Attack on Titan", "Shingeki no Kyojin", "巨人"],
    "description": "人类面临巨人的威胁，为了自由而战斗。",
    "recommend_text": "热血神作",
    "image_url": "/images/attack_on_titan_s1.jpg",
    "rating": "神作",
    "genre": ["热血", "战斗", "奇幻"],
    "ratings": {
      "神作": 0,
      "好看": 0,
      "普通": 0,
      "无聊": 0,
      "狗屎": 0,
      "哲救世皇骗": 0
    },
    "user_ratings": {}
  }
]

  {
    "id": ,
    "title": "",
    "series_title": "",
    "season": "",
    "aliases": [""],
    "description":"",
    "recommend_text": ,
    "image_url": "",
    "rating": ,
    "genre": [],
    "ratings": {
      "神作": 0,
      "好看": 0,
      "普通": 0,
      "无聊": 0,
      "狗屎": 0,
      "哲救世皇骗": 0
    },
    "user_ratings": {}
  },


{
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },
    {
        "id": ,
        "title": "",
        "series_title": "",
        "season": "",
        "aliases": [
            ""
        ],
        "description": "",
        "recommend_text": ,
        "image_url": "",
        "rating": ,
        "genre": [],
        "ratings": {
            "神作": 0,
            "好看": 0,
            "普通": 0,
            "无聊": 0,
            "狗屎": 0,
            "哲救世皇骗": 0
        },
        "user_ratings": {}
    },