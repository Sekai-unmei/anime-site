const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "data", "anime.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

let invalid = [];
for (let i = 0; i < data.length; i++) {
  const item = data[i];
  if (
    item.id === undefined ||
    item.id === null ||
    typeof item.id !== "number"
  ) {
    invalid.push({ index: i, id: item.id, title: item.title });
  }
}

if (invalid.length) {
  console.error("❌ 发现无效 id 条目:");
  invalid.forEach((v) =>
    console.log(`  索引 ${v.index}，id = ${v.id}，标题：${v.title}`),
  );
} else {
  console.log("✅ 所有 id 字段有效");
}
