addEventListener('fetch', async (event: any) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const jsonData = await request.json() as { data: string };
    const { data } = jsonData;

    if (!data) {
      return new Response('No data provided', { status: 400 });
    }

    // Base64データからPNGをデコード
    const pngData = data.replace(/^data:image\/png;base64,/, '');
    const decodedData = Uint8Array.from(atob(pngData), (c) => c.charCodeAt(0));

    // 画像の一時URLを作成（キャッシュを使わないため、即座にPNG画像として返す）
    const headers = new Headers({
      'Content-Type': 'image/png',
      'Access-Control-Allow-Origin': '*',
    });

    // PNG画像を返す
    return new Response(decodedData, { headers });
    
  } catch (error: any) {
    return new Response('Error processing request: ' + (error.message || error), { status: 500 });
  }
}
