import { decodeAndDecompress } from '../../main/src/decoder';
import { generateImage } from './imageGenerator';
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

  // dataパラメータを含む場合、OGPメタタグを挿入
  if (url.searchParams.has('data')) {
    return handleOGPAndPageRequest(request);
  } else {
    // dataパラメータがない場合はそのままCloudflare Pagesのコンテンツを返す
    return fetch(request);
  }
}

// CORS対応のOPTIONSリクエストの処理
function handleOptionsRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers',
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

// OGPメタタグを挿入してページを返す
async function handleOGPAndPageRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const data = url.searchParams.get('data');
  if (!data) {
    return new Response('Missing data parameter', { status: 400 });
  }

  const imageUrl = await getOrCreateImageUrl(data, url);

  // 元のページを取得
  const originalResponse = await fetch(request);

  // OGPメタタグを挿入するためにHTMLRewriterを使用
  return new HTMLRewriter()
    .on('head', new MetaTagInserter(imageUrl))
    .transform(originalResponse);
}

// HTMLRewriterで使用するクラス
class MetaTagInserter {
  private imageUrl: string;

  constructor(imageUrl: string) {
    this.imageUrl = imageUrl;
  }

  element(element: Element) {
    element.append(
      `
      <meta property="og:title" content="Pixel Art">
      <meta property="og:description" content="Check out my pixel art!">
      <meta property="og:image" content="${this.imageUrl}">
      <meta name="twitter:card" content="summary_large_image">
    `,
      { html: true }
    );
  }
}

// 画像URLを取得または生成
async function getOrCreateImageUrl(data: string, url: URL): Promise<string> {
  const cacheURL = await getCacheURL(data, url);
  if (cacheURL) {
    return cacheURL;
  } else {
    const decodedData = decodeAndDecompress(data);
    const imageBuffer = await generateImage(decodedData);
    const uploadURL = await uploadToR2(data, imageBuffer, url);
    return uploadURL;
  }
}

// R2に画像をアップロード
async function uploadToR2(
  data: string,
  imageBuffer: ArrayBuffer,
  requestUrl: URL
): Promise<string> {
  const objectKey = `${data}.png`;
  await MY_R2_BUCKET.put(objectKey, imageBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  return `${requestUrl.origin}/images/${encodeURIComponent(objectKey)}`;
}

// R2キャッシュが存在する場合のURLを取得
async function getCacheURL(
  data: string,
  requestUrl: URL
): Promise<string | null> {
  const objectKey = `${data}.png`;
  const object = await MY_R2_BUCKET.head(objectKey);

  if (object) {
    return `${requestUrl.origin}/images/${encodeURIComponent(objectKey)}`;
  }
  return null;
}
