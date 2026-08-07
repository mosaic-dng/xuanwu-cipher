const TOKENS = ["啊", "这个", "我们", "是吧"] as const;
const MAGIC = [0x58, 0x57, 0x43, 0x31]; // XWC1
const MAX_INPUT_BYTES = 250_000;

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function numberToBytes(value: number) {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ];
}

function bytesToNumber(bytes: number[], offset: number) {
  return (
    (bytes[offset] * 0x1000000 +
      (bytes[offset + 1] << 16) +
      (bytes[offset + 2] << 8) +
      bytes[offset + 3]) >>>
    0
  );
}

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function xuanwufy(input: string) {
  const payload = new TextEncoder().encode(input);
  if (payload.length > MAX_INPUT_BYTES) {
    throw new Error("文本太长了，请分段转换。");
  }

  const packet = new Uint8Array([
    ...MAGIC,
    ...numberToBytes(payload.length),
    ...payload,
    ...numberToBytes(crc32(payload)),
  ]);
  const encoded: string[] = [];

  for (const byte of packet) {
    encoded.push(
      TOKENS[(byte >>> 6) & 3],
      TOKENS[(byte >>> 4) & 3],
      TOKENS[(byte >>> 2) & 3],
      TOKENS[byte & 3],
    );
  }

  const joins = ["", "、", "，", " ", "……"] as const;
  const pauses = ["。", "，", "……", "，……", "、……"] as const;
  const out: string[] = [];
  const phraseSize = () => 5 + Math.floor(Math.random() * 7);
  let nextPause = phraseSize();

  encoded.forEach((token, index) => {
    out.push(token);
    if (index === encoded.length - 1) return;

    if (index + 1 === nextPause) {
      if (Math.random() < 0.36) out.push("，遥遥领先");
      out.push(pick(pauses));
      nextPause += phraseSize();
    } else {
      out.push(pick(joins));
      if (Math.random() < 0.025) out.push("遥遥领先，");
    }
  });

  return out.join("") + pick(["。", "……。", "，遥遥领先。"]);
}

export function decodeXuanwu(input: string) {
  const matches = input.match(/这个|我们|是吧|啊/g) ?? [];
  if (matches.length < 48 || matches.length % 4 !== 0) {
    throw new Error("啊这个……这个好像不太对，是吧。");
  }

  const values = new Map<string, number>(TOKENS.map((token, i) => [token, i]));
  const bytes: number[] = [];
  for (let i = 0; i < matches.length; i += 4) {
    bytes.push(
      ((values.get(matches[i]) ?? 0) << 6) |
        ((values.get(matches[i + 1]) ?? 0) << 4) |
        ((values.get(matches[i + 2]) ?? 0) << 2) |
        (values.get(matches[i + 3]) ?? 0),
    );
  }

  if (!MAGIC.every((byte, i) => bytes[i] === byte)) {
    throw new Error("啊这个……这个好像不太对，是吧。");
  }

  const length = bytesToNumber(bytes, 4);
  if (length > MAX_INPUT_BYTES || bytes.length !== 12 + length) {
    throw new Error("这段玄武语不完整，可能在复制时丢失了内容。");
  }

  const payload = new Uint8Array(bytes.slice(8, 8 + length));
  const expectedChecksum = bytesToNumber(bytes, 8 + length);
  if (crc32(payload) !== expectedChecksum) {
    throw new Error("这段玄武语不完整，可能在复制时丢失了内容。");
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(payload);
}
