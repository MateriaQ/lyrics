import Pinyin from "pinyin";
function romanizeChinese(text: string) {
  const res = Pinyin(text, {
    style: Pinyin.STYLE_NORMAL,
    // segment: true,
    // group: true,
  });
  return Array.isArray(res) ? res.flat().join(" ") : res;
}

export { romanizeChinese as romanize };
