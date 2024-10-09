declare const MY_R2_BUCKET: R2Bucket;

export async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // リクエストの JSON データを解析
    const jsonData = await request.json<{ data: string; width: number; height: number }>();
    const { data, width, height } = jsonData;

    // 入力チェック
    if (!data || !width || !height) {
      return new Response('Invalid request format. Data, width, and height are required.', { status: 400 });
    }

    // Base64 形式の画像データチェック
    const base64Header = 'data:image/png;base64,';
    if (!data.startsWith(base64Header)) {
      return new Response('Invalid image data format', { status: 400 });
    }

    // Base64 データのデコード
    const pngData = data.slice(base64Header.length);
    const decodedData = Uint8Array.from(atob(pngData), (c) => c.charCodeAt(0));

    // R2 に保存するファイル名（オブジェクトキー）を生成
    const objectKey = `ogp-image-${Date.now()}-${width}x${height}.png`;

    // R2 バケットに画像をアップロード
    await MY_R2_BUCKET.put(objectKey, decodedData, {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: {
        uploaded: new Date().toISOString(),
        width: width.toString(),
        height: height.toString(),
      },
    });

    // 公開 URL を生成（ワーカー経由でアクセス）
    const publicUrl = `${new URL(request.url).origin}/images/${encodeURIComponent(objectKey)}`;

    // 画像 URL をレスポンスとして返す
    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error processing request:', error);
    return new Response('Error processing request: ' + (error.message || error), { status: 500 });
  }
}
