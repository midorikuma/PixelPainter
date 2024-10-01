import * as pako from 'pako';  // Deflate圧縮に使用するライブラリ (pako)

// ランレングス圧縮 (RLE)
export function rleEncode(data: number[]): number[] {
  const result: number[] = [];
  let count = 1;

  for (let i = 1; i <= data.length; i++) {
    if (data[i] === data[i - 1]) {
      count++;
    } else {
      result.push(data[i - 1], count);
      count = 1;
    }
  }

  return result;
}

// ランレングス解凍 (RLE)
export function rleDecode(data: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const value = data[i];
    const count = data[i + 1];
    for (let j = 0; j < count; j++) {
      result.push(value);
    }
  }
  return result;
}

// Deflate圧縮
export function deflateCompress(data: number[]): Uint8Array {
  const uint8Array = new Uint8Array(data);
  return pako.deflate(uint8Array);  // pakoを使ってDeflate圧縮
}

// Deflate解凍
export function deflateDecompress(data: Uint8Array): Uint8Array {
  return pako.inflate(data);  // pakoを使ってDeflate解凍
}

// URLセーフなBase64エンコード
export function urlSafeBase64Encode(data: Uint8Array): string {
  const binaryString = Array.from(data).map(byte => String.fromCharCode(byte)).join('');
  let base64 = btoa(binaryString); // Base64エンコード
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // URLセーフに変換
  return base64;
}

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

// 圧縮とエンコードのメイン関数
export function compressAndEncode(data: number[]): string {
  const rleData = rleEncode(data); // RLE圧縮
  const deflatedData = deflateCompress(rleData); // Deflate圧縮
  return urlSafeBase64Encode(deflatedData); // URLセーフなBase64エンコード
}

// デコードと解凍のメイン関数
export function decodeAndDecompress(base64: string): number[] {
  const deflatedData = urlSafeBase64Decode(base64);  // Base64デコード
  const inflatedData = deflateDecompress(deflatedData); // Deflate解凍
  const rleData = Array.from(inflatedData);  // Uint8Array -> number[]
  return rleDecode(rleData);  // RLE解凍
}

/**
 * キャンバスデータを元にURLを生成する関数
 * @param canvasData キャンバスデータ (number[])
 * @param baseURL ベースとなるURL (デフォルトは現在のページのURL)
 * @returns 生成された共有URL
 */
export function generateCanvasURL(canvasData: number[], baseURL: string = window.location.origin + window.location.pathname): string {
  // キャンバスが未描画（すべてインデックス0）の場合はパラメータなしのURLを返す
  const isCanvasEmpty = canvasData.every(pixel => pixel === 0);
  
  // 未描画ならベースURLだけを返し、描画されていればエンコードされたデータ付きURLを返す
  return isCanvasEmpty ? baseURL : `${baseURL}?data=${compressAndEncode(canvasData)}`;
}
