// Cache APIを使ってキャッシュを確認、保存し、URLを返す
export async function processResponse(env: { MY_R2_BUCKET: R2Bucket }, objectKey: string, decodedData: Uint8Array): Promise<Response> {
  const cache = await caches.open('my-cache');

  // パブリックURLを生成
  const bucketName = 'ogp-storage'; // 実際のバケット名をここに置き換え
  const publicUrl = `https://dbe671b68b32efaa8b31a91d2d3d670b.r2.cloudflarestorage.com/${bucketName}/${objectKey}`;

  // キャッシュを確認
  const cacheUrl = new URL(publicUrl);
  const cacheRequest = new Request(cacheUrl.toString(), { method: 'GET' });
  let cacheResponse = await cache.match(cacheRequest);

  // キャッシュがあれば返す
  if (cacheResponse) {
    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // キャッシュに追加
  cacheResponse = new Response(decodedData, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600', // 1時間のキャッシュ有効期限
    },
  });
  await cache.put(cacheRequest, cacheResponse.clone());

  // 画像URLをレスポンスとして返す
  return new Response(JSON.stringify({ url: publicUrl }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
