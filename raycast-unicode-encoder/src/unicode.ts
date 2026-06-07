export function encodeText(text: string) {
  const encoded = Array.from(text).map((char) => {
    const codePoint = char.codePointAt(0) ?? 0;
    const upperHex = codePoint.toString(16).toUpperCase();

    return {
      char,
      codePoint: `U+${upperHex.padStart(4, "0")}`,
      escape:
        codePoint <= 0xffff
          ? `\\u${upperHex.padStart(4, "0")}`
          : `\\u{${upperHex}}`,
    };
  });

  return {
    codePoints: encoded.map((item) => item.codePoint).join(" "),
    jsEscapes: encoded.map((item) => item.escape).join(""),
    charMap: encoded
      .map((item) => `${item.char} -> ${item.codePoint} | ${item.escape}`)
      .join("\n"),
    count: encoded.length,
  };
}

export function buildMarkdown(text: string) {
  if (!text) {
    return [
      "# Unicode Encoder",
      "",
      "在搜索栏输入任意字符串，右侧会实时显示：",
      "",
      "- Unicode code points",
      "- JavaScript Unicode escapes",
      "- 按字符映射",
    ].join("\n");
  }

  const { codePoints, jsEscapes, charMap } = encodeText(text);

  return [
    "# Unicode Encoder",
    "",
    "## Unicode Code Points",
    "```text",
    codePoints,
    "```",
    "",
    "## JavaScript Unicode Escapes",
    "```text",
    jsEscapes,
    "```",
    "",
    "## Character Mapping",
    "```text",
    charMap,
    "```",
  ].join("\n");
}
