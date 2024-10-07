// URLセーフなBase64デコード
export function urlSafeBase64Decode(base64: string): Uint8Array {
  const safeBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(safeBase64); // Base64デコード
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}

// ビット抽出を行う補助関数
function extractBits(buffer: Uint8Array, bitIndex: number, bitSize: number): { value: number, nextBitIndex: number } {
  let value = 0;
  let remainingBits = bitSize;
  let currentBitIndex = bitIndex;

  while (remainingBits > 0) {
    const byteIndex = Math.floor(currentBitIndex / 8);
    const bitOffset = currentBitIndex % 8;
    const bitsAvailable = Math.min(remainingBits, 8 - bitOffset);  // 取り出せるビット数
    const mask = (1 << bitsAvailable) - 1;

    value |= ((buffer[byteIndex] >> bitOffset) & mask) << (bitSize - remainingBits);

    currentBitIndex += bitsAvailable;
    remainingBits -= bitsAvailable;
  }

  return { value, nextBitIndex: currentBitIndex };
}

// ビット圧縮をデコード
function decompressWithBitSize(buffer: Uint8Array, dictBitSize: number, maxRLEBitSize: number, valuesCount: number): { values: number[], runLengths: number[] } {
  const values: number[] = [];
  const runLengths: number[] = [];
  let bitIndex = 0;

  // values の解凍
  for (let i = 0; i < valuesCount; i++) {
    const { value, nextBitIndex } = extractBits(buffer, bitIndex, dictBitSize);
    values.push(value);
    bitIndex = nextBitIndex;
  }

  // runLengths の解凍
  for (let i = 0; i < valuesCount; i++) {
    const { value: runLength, nextBitIndex } = extractBits(buffer, bitIndex, maxRLEBitSize);
    runLengths.push(runLength);
    bitIndex = nextBitIndex;
  }

  return { values, runLengths };
}

// 辞書型解凍
function dictionaryDecode(dictionary: number[], encodedData: number[]): number[] {
  return encodedData.map(index => dictionary[index]);
}

// RLE解凍
function rleDecode(values: number[], runLengths: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < runLengths[i]; j++) {
      result.push(values[i]);
    }
  }
  return result;
}

// デコードと解凍のメイン関数
export function decodeAndDecompress(encoded: string): number[] {
  // 圧縮方式フラグの解読
  const methodChar = encoded.charAt(0);
  const methodIndicator = methodChar.charCodeAt(0) - 65;  // A -> 0, B -> 1, C -> 2, D -> 3...

  // 残りの文字列は圧縮データ
  const base64Data = encoded.slice(1);
  let decodedData: Uint8Array = urlSafeBase64Decode(base64Data);

  let dictionary: number[] = [];
  let maxRLESize = 0;
  let valuesCount = 0;
  let dictSize = 0;

  // もし辞書型圧縮が使われている場合
  if (methodIndicator & 1) {
    dictSize = decodedData[0];  // 辞書サイズ
    maxRLESize = decodedData[1];  // 最大RLEサイズ
    dictionary = Array.from(decodedData.slice(2, dictSize + 2));  // 辞書
    valuesCount = decodedData[dictSize + 2];  // 値の数

    // 辞書型圧縮のデータを切り取る
    decodedData = decodedData.slice(dictSize + 3);  // 圧縮データ部分を取得
  }

  let values: number[] = [];
  let runLengths: number[] = [];

  // もしビット圧縮が使われている場合
  if (methodIndicator & 4) {
    const dictBitSize = Math.ceil(Math.log2(dictSize));
    const maxRLEBitSize = Math.ceil(Math.log2(maxRLESize));
    ({ values, runLengths } = decompressWithBitSize(decodedData, dictBitSize, maxRLEBitSize, valuesCount));
  }

  // もしRLEが使われている場合
  if (methodIndicator & 2) {
    if (values.length === 0 || runLengths.length === 0) {
      // RLEがあるのにビット圧縮されていなかった場合、RLEデータを直接使う
      const rleData = Array.from(decodedData);
      values = rleData.slice(0, valuesCount);
      runLengths = rleData.slice(valuesCount);
    }
    decodedData = new Uint8Array(rleDecode(values, runLengths));
  }

  // 辞書型圧縮の解凍
  if (methodIndicator & 1) {
    decodedData = new Uint8Array(dictionaryDecode(dictionary, Array.from(decodedData)));
  }

  return Array.from(decodedData);
}
