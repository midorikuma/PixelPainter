import { CanvasManager } from './canvasManager';
import { compressAndEncode } from './encoder';
import { decodeAndDecompress } from './decoder';

export class URLManager {
  private canvasManager: CanvasManager;
  private shareButton: HTMLButtonElement;
  private shareURLDiv: HTMLSpanElement;

  constructor(canvasManager: CanvasManager, shareButton: HTMLButtonElement, shareURLDiv: HTMLSpanElement) {
    this.canvasManager = canvasManager;
    this.shareButton = shareButton;
    this.shareURLDiv = shareURLDiv;
  }

  // 共有ボタンのクリックでURLを生成しクリップボードにコピーし、ツイート画面へ遷移
  setupShareButton() {
    this.shareButton.addEventListener('click', () => {
      try {
        const canvasData = this.canvasManager.getCanvasData();

        const isCanvasEmpty = canvasData.every(pixel => pixel === 0);
        const baseURL = window.location.origin + window.location.pathname;
        const shareURL = isCanvasEmpty ? baseURL : `${baseURL}?p=${compressAndEncode(canvasData)}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareURL).then(() => {
            this.shareURLDiv.textContent = 'URLをコピーしました: ' + shareURL;
          }).catch(err => {
            console.error('クリップボードへのコピーに失敗しました: ', err);
            this.shareURLDiv.textContent = 'URLのコピーに失敗しました';
          });
        } else {
          this.shareURLDiv.textContent = 'クリップボードが利用できません。URL: ' + shareURL;
        }

        // ツイート画面を開く
        const hashtag = encodeURIComponent("#PixelPainter\n");
        const tweetURL = `https://twitter.com/intent/tweet?text=${hashtag}&url=${encodeURIComponent(shareURL)}`;
        window.open(tweetURL, '_blank');
        window.location.href = shareURL;

      } catch (error) {
        console.error('エンコード処理中にエラーが発生しました: ', error);
        this.shareURLDiv.textContent = 'URLの生成に失敗しました';
      }
    });
  }

  // URLからキャンバスデータを復元する処理
  loadCanvasFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('p');

    if (encodedData) {
      try {
        const decodedData = decodeAndDecompress(encodedData);  // デコードして解凍
        this.canvasManager.setCanvasData(decodedData);  // キャンバスに適用
      } catch (error) {
        console.error('デコード処理中にエラーが発生しました: ', error);
        this.shareURLDiv.textContent = 'URLデータの復元に失敗しました';
      }
    } else {
      // パラメータがない場合、全てインデックス0で白にする
      this.canvasManager.setCanvasData(new Array(this.canvasManager.getGridSize() * this.canvasManager.getGridSize()).fill(0));
    }
  }
}
