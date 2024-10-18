// functions/games/pixelpainter/index.ts

import { PagesFunction, Response as CloudflareResponse } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async ({ request }) => {
  // Cloudflare Pages のデプロイ URL を設定
  const pagesURL = 'https://pixelpainter.pages.dev'

  // リクエストパスから /games/pixelpainter を除去
  const url = new URL(request.url)
  const newPath = url.pathname.replace('/games/pixelpainter', '')

  // Cloudflare Pages の URL にリクエストを転送
  const pagesRequestURL = `${pagesURL}${newPath}${url.search}`

  // Cloudflare Pages からコンテンツを取得
  const response = await fetch(pagesRequestURL, {
    method: request.method,
    headers: new Headers(request.headers as any),
    body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body as any,
    redirect: 'manual'
  })

  // 必要に応じてレスポンスヘッダーを調整
  const newHeaders = new Headers(response.headers as any)
  newHeaders.set('Access-Control-Allow-Origin', '*')

  // 新しいレスポンスを返す
  const responseBody = response.body ? await response.body.getReader().read() : null;
  return new CloudflareResponse(responseBody ? responseBody.value : null, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders as any,
  })
}
