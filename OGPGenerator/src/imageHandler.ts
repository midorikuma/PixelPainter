declare const MY_R2_BUCKET: R2Bucket;

export async function handleImageRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const objectKey = decodeURIComponent(url.pathname.replace('/images/', ''));

  // R2 バケットからオブジェクトを取得
  const object = await MY_R2_BUCKET.get(objectKey);

  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=3600'); // キャッシュ有効期限を設定
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, { headers });
}
