import { handleRequest } from './requestHandler';
import { handleImageRequest } from './imageHandler';

addEventListener('fetch', (event: any) => {
  if (event.request.method === 'OPTIONS') {
    event.respondWith(handleOptionsRequest());
    return;
  }

  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(handleImageRequest(event.request));
  } else {
    event.respondWith(handleRequest(event.request));
  }
});

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