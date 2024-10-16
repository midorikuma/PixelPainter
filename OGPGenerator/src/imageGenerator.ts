import { getPaletteColors } from '../../main/src/paletteGenerator';

declare const CANVAS_MANAGER_WASM: WebAssembly.Module;

export async function generateImage(decodedData: number[]): Promise<ArrayBuffer> {
  // WASMモジュールのインスタンス化
  const wasmInstance = await WebAssembly.instantiate(CANVAS_MANAGER_WASM, {});
  const {
    memory,
    alloc,
    dealloc,
    generate_image_with_offset,
    get_image_data,
    get_image_size,
  } = wasmInstance.exports as any;

  const colors = getPaletteColors();

  // 画像全体のサイズ
  const canvasWidth = 300;
  const canvasHeight = 157;

  // 描画領域のサイズ
  const gridSize = 16;
  const dotSize = 8; // 128px / 16 = 8px
  const drawingWidth = gridSize * dotSize; // 128px
  const drawingHeight = gridSize * dotSize; // 128px

  // 中央に配置するためのオフセット計算
  const offsetX = Math.floor((canvasWidth - drawingWidth) / 2);
  const offsetY = Math.floor((canvasHeight - drawingHeight) / 2);

  // メモリの確保とデータのコピー
  const dataPtr = alloc(decodedData.length);
  const dataView = new Uint8Array(memory.buffer, dataPtr, decodedData.length);
  dataView.set(decodedData);

  const colorsPtr = alloc(colors.length);
  const colorsView = new Uint8Array(memory.buffer, colorsPtr, colors.length);
  colorsView.set(colors);

  // 画像生成関数を呼び出し
  generate_image_with_offset(
    dataPtr,
    decodedData.length,
    gridSize,
    dotSize,
    colorsPtr,
    colors.length,
    canvasWidth,
    canvasHeight,
    offsetX,
    offsetY
  );

  // 画像サイズを取得
  const imageSize = get_image_size();

  // 画像データを受け取るためのバッファを確保
  const imagePtr = alloc(imageSize);

  // 画像データを取得
  const copiedSize = get_image_data(imagePtr, imageSize);

  // WASMメモリから画像データを取得
  const imageData = new Uint8Array(memory.buffer, imagePtr, copiedSize);

  // 画像データをコピーしてArrayBufferに変換
  const resultBuffer = new Uint8Array(copiedSize);
  resultBuffer.set(imageData);

  // メモリの解放
  dealloc(dataPtr, decodedData.length);
  dealloc(colorsPtr, colors.length);
  dealloc(imagePtr, imageSize);

  return resultBuffer.buffer;
}
