import { getPaletteColors } from '../../main/src/paletteGenerator';
import { decodeAndDecompress } from '../../main/src/decoder';

declare const CANVAS_MANAGER_WASM: WebAssembly.Module;

export async function generateImage(data: string): Promise<ArrayBuffer> {
  const wasmInstance = await WebAssembly.instantiate(CANVAS_MANAGER_WASM, {});
  const { memory, alloc, dealloc, init_canvas, generate_image_with_offset, get_image_data, get_image_size } = wasmInstance.exports as any;

  const colors = getPaletteColors();
  const canvasWidth = 300;
  const canvasHeight = 157;

  // キャンバスの初期化
  init_canvas(canvasWidth, canvasHeight);
  const colorsPtr = alloc(colors.length);
  const colorsView = new Uint8Array(memory.buffer, colorsPtr, colors.length);
  colorsView.set(colors);
  // generate_image_with_offset(
  //   dataPtr, decodedData.length,
  //   gridSize, dotSize,
  //   colorsPtr, colors.length,
  //   offsetX, offsetY
  // );

  // 最初のデータを描画
  const decodedData = decodeAndDecompress(data);
  const dataPtr = alloc(decodedData.length);
  const dataView = new Uint8Array(memory.buffer, dataPtr, decodedData.length);
  dataView.set(decodedData);
  generate_image_with_offset(
    dataPtr, decodedData.length,
    16, 8,
    colorsPtr, colors.length,
    Math.floor((canvasWidth - 16 * 8) / 2), Math.floor((canvasHeight - 16 * 8) / 2)
  );
  dealloc(dataPtr, decodedData.length);

  // 追加
  const additionalData1 = decodeAndDecompress('NeJxjFeDUZBA3ntkh4KLc1CNlqiR1vFBGsFfKtK_jWKEMiBv4WMOFQ4llsVuv05HAxx0ZMscLRRYVQkn33kkvOjh6Ozo6VnR0TJjRAQIcnR0dQNYECBNETehg6OzreACkObqAQhwTgdKdHSgAzGUAAP_vPCc');
  const additionalDataPtr1 = alloc(additionalData1.length);
  const additionalDataView1 = new Uint8Array(memory.buffer, additionalDataPtr1, additionalData1.length);
  additionalDataView1.set(additionalData1);
  generate_image_with_offset(
    additionalDataPtr1, additionalData1.length,
    16, 1,
    colorsPtr, colors.length,
    0, 0
  );
  dealloc(additionalDataPtr1, additionalData1.length);

  // 追加
  const additionalData2 = decodeAndDecompress('PeJxjXsggbqygMjNFbaaKp9pCRgjgABFMjJzMQIoLxGLkBmJGKQCg7wSC');
  const additionalDataPtr2 = alloc(additionalData2.length);
  const additionalDataView2 = new Uint8Array(memory.buffer, additionalDataPtr2, additionalData2.length);
  additionalDataView2.set(additionalData2);
  generate_image_with_offset(
    additionalDataPtr2, additionalData2.length,
    16, 1,
    colorsPtr, colors.length,
    16, 0
  );
  dealloc(additionalDataPtr2, additionalData2.length);
  
  const imageSize = get_image_size();
  const imagePtr = alloc(imageSize);
  const copiedSize = get_image_data(imagePtr, imageSize);
  const imageData = new Uint8Array(memory.buffer, imagePtr, copiedSize);
  const resultBuffer = new Uint8Array(copiedSize);
  resultBuffer.set(imageData);
  dealloc(colorsPtr, colors.length);
  dealloc(imagePtr, imageSize);

  return resultBuffer.buffer;
}
