addEventListener('fetch', (event: any) => {
  const request = event.request;
  if (request.method === 'OPTIONS') {
    event.respondWith(handleOptionsRequest());
  } else {
    event.respondWith(handleRequest(request));
  }
});

async function handleRequest(request: Request) {
    const response = await fetch(request)
    return new HTMLRewriter()
      .on('head', {
        element(head) {
          head.append(`
            <meta property="og:title" content="特別なブログ記事のタイトル">
            <meta property="og:description" content="特別な記事の説明">
            <meta property="og:image" content="https://gb.huedpaw.com/wp-content/uploads/2023/05/%E7%8F%BE%E5%A0%B4%E3%82%AF%E3%83%9E-225x300.png">
          `, { html: true })
        }
      })
      .transform(response)
}

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