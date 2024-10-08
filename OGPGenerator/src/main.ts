import { handleRequest } from './requestHandler';

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request, event.env));
});
