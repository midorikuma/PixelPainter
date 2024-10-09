import { handleRequest } from './requestHandler';
import { handleImageRequest } from './imageHandler';

addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(handleImageRequest(event.request));
  } else {
    event.respondWith(handleRequest(event.request));
  }
});
