export class OGPManager {

  // OGP画像を設定する
  async setupOGP() {
    try {
      // キャンバス要素からBase64エンコードされた画像データを取得
      const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
      // Base64 PNG形式でエンコード
      const base64Data = canvasElement.toDataURL('image/png');

      //width, heightをcanvasElementから取得
      const width = canvasElement.width;
      const height = canvasElement.height;

      // JSONデータとして送信
      const jsonData = JSON.stringify({
        data: base64Data,
        width: width,
        height: height
      });
      console.log('OGP画像生成リクエスト:', jsonData);

      // Cloudflare WorkersなどのOGP生成エンドポイントにPOSTリクエスト
      const response = await fetch('https://ogp-generator.huedpaw.workers.dev/', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonData,
      });

      if (!response.ok) {
        throw new Error(`OGP画像の生成に失敗しました: ${await response.text()}`);
      }

      // Blobとして画像データを取得
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);  // BlobからローカルURLを生成

      // OGPメタタグの設定
      this.setOGPImage(imageUrl);
    } catch (error) {
      console.error('OGP画像の設定に失敗しました:', error);
    }
  }

  // OGPメタタグを設定
  private setOGPImage(imageUrl: string) {
    const tagsToUpdate = [
      { selector: 'meta[property="og:image"]', property: 'property', name: 'og:image' },
      { selector: 'meta[name="twitter:image"]', property: 'name', name: 'twitter:image' }
    ];

    tagsToUpdate.forEach(tagInfo => {
      let tag = document.querySelector(tagInfo.selector);

      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(tagInfo.property, tagInfo.name);
        document.head.appendChild(tag);
      }

      tag.setAttribute('content', imageUrl);
    });

    console.log(`OGP画像が設定されました: ${imageUrl}`);
  }
}
