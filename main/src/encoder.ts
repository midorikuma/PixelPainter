import * as pako from 'pako';  // pakoライブラリを使用してDeflate圧縮/解凍を行う

// Deflate圧縮
export function deflateCompress(data: Uint8Array): Uint8Array {
  return pako.deflate(data);  // Deflate圧縮
}

// URLセーフなBase64エンコード
export function urlSafeBase64Encode(data: Uint8Array): string {
  const binaryString = Array.from(data).map(byte => String.fromCharCode(byte)).join('');
  let base64 = btoa(binaryString); // Base64エンコード
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // URLセーフに変換
  return base64;
}

// 辞書型圧縮
export function dictionaryEncode(data: number[]): { dictionary: number[], encodedData: number[] } {
  const uniqueColors = Array.from(new Set(data));
  const dictionaryMap = new Map<number, number>();

  uniqueColors.forEach((color, index) => {
    dictionaryMap.set(color, index);
  });

  const encodedData = data.map(pixel => dictionaryMap.get(pixel) as number);
  return { dictionary: uniqueColors, encodedData };
}

// RLE最大値を同色が続く最大の長さから決定
export function calculateMaxRLE(data: number[]): number {
  let maxRunLength = 1;
  let currentRun = 1;

  for (let i = 1; i < data.length; i++) {
    if (data[i] === data[i - 1]) {
      currentRun++;
      if (currentRun > maxRunLength) {
        maxRunLength = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  return maxRunLength;
}

// ランレングス圧縮 (RLE)
export function rleEncodeWithMax(data: number[], maxRLE: number): { values: number[], runLengths: number[] } {
  const values: number[] = [];
  const runLengths: number[] = [];
  let count = 1;

  for (let i = 1; i <= data.length; i++) {
    if (data[i] === data[i - 1] && count < maxRLE) {
      count++;
    } else {
      values.push(data[i - 1]);
      runLengths.push(count);
      count = 1;
    }
  }

  return { values, runLengths };
}

// ビット圧縮
export function compressWithBitSize(values: number[], runLengths: number[], dictSize: number, maxRLESize: number): Uint8Array {
  const dictBitSize = Math.ceil(Math.log2(dictSize));
  const maxRLEBitSize = Math.ceil(Math.log2(maxRLESize));

  // values と runLengths を分けてそれぞれ詰める
  const totalValueBits = values.length * dictBitSize;  // 値の合計ビット数
  const totalRunLengthBits = runLengths.length * maxRLEBitSize;  // 繰り返し回数の合計ビット数

  const totalBits = totalValueBits + totalRunLengthBits;  // 全体のビット数
  const compressedLength = Math.ceil(totalBits / 8);  // 必要なバイト数
  const result = new Uint8Array(compressedLength);

  let bitIndex = 0;

  // 1. values のビット詰め込み
  for (let i = 0; i < values.length; i++) {
    const value = values[i] & ((1 << dictBitSize) - 1);  // 値のビットサイズに制限
    bitIndex = insertBits(result, bitIndex, value, dictBitSize);  // 値のビットを挿入
  }

  // 2. runLengths のビット詰め込み
  for (let i = 0; i < runLengths.length; i++) {
    const runLength = runLengths[i] & ((1 << maxRLEBitSize) - 1);  // 繰り返し回数のビットサイズに制限
    bitIndex = insertBits(result, bitIndex, runLength, maxRLEBitSize);  // 繰り返し回数のビットを挿入
  }

  return result;
}

// ビット挿入を行う補助関数
function insertBits(buffer: Uint8Array, bitIndex: number, value: number, bitSize: number): number {
  let remainingBits = bitSize;

  while (remainingBits > 0) {
    const byteIndex = Math.floor(bitIndex / 8);
    const bitOffset = bitIndex % 8;
    const bitsToWrite = Math.min(remainingBits, 8 - bitOffset);  // 現在のバイトに書けるビット数
    const mask = (1 << bitsToWrite) - 1;

    buffer[byteIndex] |= (value & mask) << bitOffset;

    value >>= bitsToWrite;
    bitIndex += bitsToWrite;
    remainingBits -= bitsToWrite;
  }

  return bitIndex;
}

// 圧縮とエンコードのメイン関数
export function compressAndEncode(data: number[]): string {
  let currentData: number[] | Uint8Array = data;
  let methodIndicator = 0;  // 圧縮方式フラグ

  let dictionary: number[] = [];

  // 1. 辞書型圧縮を試す (色の種類が32以下なら適用)
  if (new Set(data).size <= 32) {
    const { dictionary: dict, encodedData } = dictionaryEncode(data);
    dictionary = dict;
    currentData = encodedData;
    methodIndicator |= 1;  // 辞書型圧縮が適用されたことをビットフラグに記録
  }

  // 2. RLE圧縮を適用して短縮されたか確認
  const maxRLESize = calculateMaxRLE(data);
  const dictSize = dictionary.length;
  const { values, runLengths } = rleEncodeWithMax(currentData as number[], maxRLESize);
  const RLEData = [...values, ...runLengths];
  if (RLEData.length < currentData.length) {
    currentData = RLEData;
    methodIndicator |= 2;  // RLEが適用されたことをビットフラグに記録
  }
  console.log(currentData)

  // 3. ビット圧縮を適用して短縮されたか確認
  const compressedBits = compressWithBitSize(values, runLengths, dictSize, maxRLESize);
  if (compressedBits.length < currentData.length) {
    currentData = compressedBits;
    methodIndicator |= 4;  // ビット圧縮が適用されたことをビットフラグに記録
  }

  // 4. Deflate圧縮を適用して短縮されたか確認
  const deflatedData = deflateCompress(currentData as Uint8Array);
  if (deflatedData.length < currentData.length) {
    currentData = deflatedData;
    methodIndicator |= 8;  // Deflate圧縮が適用されたことをビットフラグに記録
  }

  let encodeData = new Uint8Array(currentData);
  // 辞書サイズ、最大RLEサイズ、辞書、データサイズ、データを連結
  encodeData = new Uint8Array([dictSize, maxRLESize, ...dictionary, values.length, ...encodeData]);
  // console.log(encodeData)

  // 圧縮方式フラグを1文字に変換して付加
  const methodChar = String.fromCharCode(65 + methodIndicator);  // A, B, C, D...
  const base64Encoded = urlSafeBase64Encode(encodeData);

  return `${methodChar}${base64Encoded}`;
}
