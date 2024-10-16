import { decodeAndDecompress } from '../../main/src/decoder';
import { getPaletteColors } from '../../main/src/paletteGenerator'; // 追加
declare const CANVAS_MANAGER_WASM: WebAssembly.Module;
declare const MY_R2_BUCKET: R2Bucket;

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request));
});

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // OPTIONSリクエストの処理
  if (request.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  // GETリクエストが/images/{objectKey}に一致する場合はR2から画像を返す
  if (url.pathname.startsWith('/images/')) {
    return handleImageRequest(url.pathname);
  }

  // dataパラメータを含むGETリクエストを処理
  return handleDataRequest(url);
}

// CORS対応のOPTIONSリクエストの処理
function handleOptionsRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers',
    },
  });
}

// R2から画像を取得して返す処理
async function handleImageRequest(pathname: string): Promise<Response> {
  const objectKey = decodeURIComponent(pathname.replace('/images/', ''));
  const object = await MY_R2_BUCKET.get(objectKey);

  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=3600');
  headers.set('Content-Type', 'image/png');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(object.body, { headers });
}

// dataパラメータを処理し、キャッシュを確認して画像を生成・アップロードする
async function handleDataRequest(url: URL): Promise<Response> {
  const data = url.searchParams.get('data');
  if (!data) {
    return new Response('Missing data parameter', { status: 400 });
  }

  const cacheURL = await getCacheURL(data, url);
  if (cacheURL) {
    return new Response(null, { status: 302, headers: { 'Location': cacheURL } });
  }

  const decodedData = decodeAndDecompress(data);
  const imageBuffer = await generateImage(decodedData);
  const uploadURL = await uploadToR2(data, imageBuffer, url);
  
  return new Response(null, { status: 302, headers: { 'Location': uploadURL } });
}

// canvas_manager_wasmを利用して画像生成
async function generateImage(decodedData: number[]): Promise<ArrayBuffer> {
  // WASMモジュールのバインディングを取得
  const wasmModule = CANVAS_MANAGER_WASM;

  // WASMモジュールのインスタンス化
  const wasmInstance = await WebAssembly.instantiate(wasmModule, {});
  const {
    memory,
    alloc,
    dealloc,
    generate_image,
    get_image_data,
    get_image_size,
  } = wasmInstance.exports as any;

  const colors = getPaletteColors();
  const gridSize = 16;
  const dotSize = 20;

  // メモリの確保とデータのコピー
  const dataPtr = alloc(decodedData.length);
  const dataView = new Uint8Array(memory.buffer, dataPtr, decodedData.length);
  dataView.set(decodedData);

  const colorsPtr = alloc(colors.length);
  const colorsView = new Uint8Array(memory.buffer, colorsPtr, colors.length);
  colorsView.set(colors);

  // 画像生成関数を呼び出し
  generate_image(
    dataPtr,
    decodedData.length,
    gridSize,
    dotSize,
    colorsPtr,
    colors.length
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

// R2に画像をアップロード
async function uploadToR2(data: string, imageBuffer: ArrayBuffer, requestUrl: URL): Promise<string> {
  const objectKey = `${data}.png`;
  await MY_R2_BUCKET.put(objectKey, imageBuffer, {
    httpMetadata: { contentType: 'image/png' }
  });

  return `${requestUrl.origin}/images/${encodeURIComponent(objectKey)}`;
}

// R2キャッシュが存在する場合のURLを取得
async function getCacheURL(data: string, requestUrl: URL): Promise<string | null> {
  const objectKey = `${data}.png`;
  const object = await MY_R2_BUCKET.head(objectKey);

  if (object) {
    return `${requestUrl.origin}/images/${encodeURIComponent(objectKey)}`;
  }
  return null;
}
