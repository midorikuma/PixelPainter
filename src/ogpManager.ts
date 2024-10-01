import { CanvasManager } from './canvasManager';
import { compressAndEncode } from './encoder';  // encoder.ts の共通関数を使用

export class OGPManager {
  private canvasManager: CanvasManager;

  constructor(canvasManager: CanvasManager) {
    this.canvasManager = canvasManager;
  }

  // OGP画像を設定する
  setupOGP() {
    const canvasData = this.canvasManager.getCanvasData();

    // エンコードされたキャンバスデータを取得
    const encodedData = compressAndEncode(canvasData);  // ここでも共通のエンコード処理を利用

    // Cloudflare WorkersなどのOGP生成エンドポイントを指定
    const ogpURL = `https://your-worker.your-namespace.workers.dev/generate-ogp?data=${encodedData}`;

    // OGPメタタグの設定
    this.setOGPImage(ogpURL);
  }

  // OGPメタタグを設定
  private setOGPImage(ogpURL: string) {
    const ogImageTag = document.querySelector('meta[property="og:image"]');
    const twitterImageTag = document.querySelector('meta[name="twitter:image"]');

    if (ogImageTag) {
      ogImageTag.setAttribute('content', ogpURL);
    }

    if (twitterImageTag) {
      twitterImageTag.setAttribute('content', ogpURL);
    }

    console.log(`OGP画像が設定されました: ${ogpURL}`);
  }
}
