const TOKENS = ["啊", "这个", "我们", "是吧"] as const;
const LEGACY_MAGIC = [0x58, 0x57, 0x43, 0x31]; // XWC1
const MAGIC = [0x58, 0x57, 0x56, 0x32]; // XWV2
const MAX_INPUT_BYTES = 250_000;
const WORD_JOINER = "\u2060";

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

function byteToVariationSelector(byte: number) {
  return String.fromCodePoint(byte < 16 ? 0xfe00 + byte : 0xe0100 + byte - 16);
}

function variationSelectorsToBytes(input: string) {
  const bytes: number[] = [];
  for (const character of input) {
    const codePoint = character.codePointAt(0)!;
    if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) {
      bytes.push(codePoint - 0xfe00);
    } else if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) {
      bytes.push(codePoint - 0xe0100 + 16);
    }
  }
  return bytes;
}

export function visibleXuanwuLength(input: string) {
  return Array.from(input).filter((character) => {
    const codePoint = character.codePointAt(0)!;
    return codePoint !== 0x2060 &&
      !(codePoint >= 0xfe00 && codePoint <= 0xfe0f) &&
      !(codePoint >= 0xe0100 && codePoint <= 0xe01ef);
  }).length;
}

export function xuanwufy(input: string) {
  const payload = new TextEncoder().encode(input);
  if (payload.length > MAX_INPUT_BYTES) {
    throw new Error("文本太长了，请分段转换。");
  }

  const packet = new Uint8Array([
    ...MAGIC,
    ...payload,
    ...numberToBytes(crc32(payload)),
  ]);
  const openings = [
    "啊啊这个这个，我们这个啊……",
    "啊这个这个这个，我们这个啊，",
    "这个这个，啊这个我们……",
    "啊这个这个，是吧啊，",
    "啊啊这个，这个我们这个……",
    "这个这个这个，啊，我们这个……",
    "啊这个啊，这个这个，我们……",
  ] as const;
  const endings = [
    "遥遥领先同行，是吧？",
    "领先很多。",
    "我们继续领先。",
    "远远遥遥领先于同行。",
    "遥遥领先的啊。",
    "领先同行超过 50%。",
    "绝对是遥遥领先的。",
    "遥遥领航领先于同行。",
    "超越啊全球所有的同行。",
    "我们是遥遥领先同行的。",
  ] as const;

  return pick(openings) + pick(endings) + WORD_JOINER + Array.from(packet, byteToVariationSelector).join("");
}

function decodeCompact(bytes: number[]) {
  if (bytes.length < 8 || !MAGIC.every((byte, i) => bytes[i] === byte)) {
    throw new Error("啊这个……这个好像不太对，是吧。");
  }

  const payload = new Uint8Array(bytes.slice(4, -4));
  if (payload.length > MAX_INPUT_BYTES || crc32(payload) !== bytesToNumber(bytes, bytes.length - 4)) {
    throw new Error("这段玄武语不完整，可能在复制时丢失了内容。");
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(payload);
  } catch {
    throw new Error("这段玄武语不完整，可能在复制时丢失了内容。");
  }
}

function decodeLegacy(input: string) {
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

  if (!LEGACY_MAGIC.every((byte, i) => bytes[i] === byte)) {
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

export function decodeXuanwu(input: string) {
  const compactBytes = variationSelectorsToBytes(input);
  return compactBytes.length > 0 ? decodeCompact(compactBytes) : decodeLegacy(input);
}
