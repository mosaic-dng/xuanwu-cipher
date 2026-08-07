import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeXuanwu,
  isXuanwu,
  visibleXuanwuLength,
  xuanwufy,
} from "../app/cipher.ts";

const samples = [
  "今晚 8 点吃饭。",
  "Meeting 🐂🍖\n第二行",
  "标点 !@#$%^&*() é 🇨🇳",
  "\u200b\u200c\u200d \t \r\n",
];

test("round-trips mixed Unicode text in every tone", () => {
  for (const tone of ["brief", "standard", "verbose"]) {
    for (const sample of samples) {
      const encoded = xuanwufy(sample, { tone });
      assert.equal(decodeXuanwu(encoded), sample);
      assert.equal(isXuanwu(encoded), true);
      assert.ok(visibleXuanwuLength(encoded) < 50);
    }
  }
});

test("detects truncation and unrelated text", () => {
  const encoded = xuanwufy("完整性测试");
  const truncated = Array.from(encoded).slice(0, -1).join("");

  assert.equal(isXuanwu("普通文本"), false);
  assert.equal(isXuanwu(truncated), false);
  assert.throws(() => decodeXuanwu(truncated));
});

test("produces varied carrier phrases without changing the payload", () => {
  const outputs = new Set();
  for (let i = 0; i < 120; i += 1) {
    const encoded = xuanwufy("同一句原文", { tone: "standard" });
    assert.equal(decodeXuanwu(encoded), "同一句原文");
    outputs.add(encoded.replace(/[\u2060\ufe00-\ufe0f\u{e0100}-\u{e01ef}]/gu, ""));
  }
  assert.ok(outputs.size >= 20);
});
