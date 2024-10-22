import { generateImage, generateIcon } from './imageGenerator';
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

  // Faviconリクエストの処理
  if (url.pathname === '/favicon.ico') {
    return handleFaviconRequest(url.searchParams.get('p'));
  }

  // R2から画像を取得して返す処理
  if (url.pathname.startsWith('/images/')) {
    return handleImageRequest(url.pathname);
  }

  // dataパラメータがある場合、OGPメタタグを挿入
  return handleOGPAndPageRequest(request);
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

// faviconリクエストの処理
async function handleFaviconRequest(data: string | null): Promise<Response> {
  try {
    // デフォルトのファビコンデータを使用
    if (!data) {
      data = 'JeJx9jjEOgDAMA9M4MHdg4AnsvJbfIjulVEXCmS6O7Kx1P6yc22VWfJSVcYEgIxqQZSOeIcpw4OUc3Xd2-cuk_34xMj8_4D3DlAblZ3ErIcfE3fdv_w13MQPx';
    }

    const imageBuffer = await generateIcon(data);

    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(imageBuffer, { headers });

  } catch (error) {
    return new Response('Error generating favicon', { status: 500 });
  }
}

// OGPメタタグとファビコンを挿入してページを返す
async function handleOGPAndPageRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const data = url.searchParams.get('p') || 'HCA4AHAgYJQcnGlEIomiKRkXjFI1TNI6KxlFROSrqqMgdFd2lIpeKoiAIj3A5KTERkpKJEZIZkZEZCRGZmRARmRGRmRmRmBgSiRgpkZEwcfEIDw';

  // OGP画像URLとファビコンデータURIを生成
  const imageUrl = url.searchParams.has('p') ? await getOrCreateImageUrl(data, url) : null;
  const faviconDataUri = await getOrCreateFaviconDataUri(data);

  // 元のページを取得
  const originalResponse = await fetch(request);

  // OGPメタタグとファビコンリンクを挿入または既存のタグを上書き
  const rewriter = new HTMLRewriter()
    .on('link[rel="icon"]', new FaviconTagUpdater(faviconDataUri));  // ファビコンの上書き

  // OGPメタタグを更新する場合のみ
  if (imageUrl) {
    rewriter
      .on('meta', new MetaTagUpdater(imageUrl))         // OGPメタタグの更新
      .on('head', new MetaTagInserter(imageUrl, faviconDataUri)); // OGPメタタグとファビコンの挿入
  }

  return rewriter.transform(originalResponse);
}

// Favicon用のクラス（既存のファビコンリンクがある場合は上書き）
class FaviconTagUpdater {
  private faviconDataUri: string;

  constructor(faviconDataUri: string) {
    this.faviconDataUri = faviconDataUri;
  }

  element(element: Element) {
    element.setAttribute('href', this.faviconDataUri);  // ファビコンのデータURIを上書き
  }
}

// HTMLRewriterで使用するクラス（メタタグやファビコンリンクの挿入）
class MetaTagInserter {
  private imageUrl: string;
  private faviconDataUri: string;

  constructor(imageUrl: string, faviconDataUri: string) {
    this.imageUrl = imageUrl;
    this.faviconDataUri = faviconDataUri;
  }

  element(element: Element) {
    element.append(
      `
      <meta property="og:title" content="PixelPainter">
      <meta property="og:description" content="Check out my pixel art!">
      <meta property="og:image" content="${this.imageUrl}">
      <meta name="twitter:card" content="summary_large_image">
      <link rel="icon" href="${this.faviconDataUri}" type="image/png">
    `,
      { html: true }
    );
  }
}

// MetaTagUpdaterクラスの定義
class MetaTagUpdater {
  private imageUrl: string;

  constructor(imageUrl: string) {
    this.imageUrl = imageUrl;
  }

  element(element: Element) {
    const property = element.getAttribute('property');
    if (property === 'og:image') {
      element.setAttribute('content', this.imageUrl);
    } else if (property === 'og:title') {
      element.setAttribute('content', 'Pixel Art');
    } else if (property === 'og:description') {
      element.setAttribute('content', 'Check out my pixel art!');
    }
  }
}

// 画像URLを取得または生成
async function getOrCreateImageUrl(data: string, url: URL): Promise<string> {
  const cacheURL = await getCacheURL(data, url);
  if (cacheURL) {
    return cacheURL;
  } else {
    const imageBuffer = await generateImage(data);
    const uploadURL = await uploadToR2(data, imageBuffer, url);
    return uploadURL;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ファビコンデータURIを生成
async function getOrCreateFaviconDataUri(data: string): Promise<string> {
  try {
    const faviconBuffer = await generateIcon(data); // ファビコンを生成
    return `data:image/png;base64,${arrayBufferToBase64(faviconBuffer)}`;
  } catch (error) {
    throw new Error('Failed to generate favicon');
  }
}

// R2に画像をアップロード
async function uploadToR2(data: string, imageBuffer: ArrayBuffer, requestUrl: URL): Promise<string> {
  const objectKey = `${data}.png`;
  await MY_R2_BUCKET.put(objectKey, imageBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  return `https://pixelpainter.huedpaw.com/images/${encodeURIComponent(objectKey)}`;
}

// R2キャッシュが存在する場合のURLを取得
async function getCacheURL(data: string, requestUrl: URL): Promise<string | null> {
  const objectKey = `${data}.png`;
  const object = await MY_R2_BUCKET.head(objectKey);

  if (object) {
    return `https://pixelpainter.huedpaw.com/images/${encodeURIComponent(objectKey)}`;
  }
  return null;
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
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Content-Type', 'image/png');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(object.body, { headers });
}