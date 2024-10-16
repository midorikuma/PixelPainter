import { CanvasManager } from './canvasManager';
import { PaletteManager } from './paletteManager';
import { URLManager } from './urlManager';

const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const paletteDiv = document.getElementById('palette') as HTMLDivElement;
const currentColorDiv = document.getElementById('current-color') as HTMLSpanElement;
const shareButton = document.getElementById('shareButton') as HTMLButtonElement;
const shareURLDiv = document.getElementById('shareURL') as HTMLSpanElement;

// PaletteManagerのインスタンスを作成
const paletteManager = new PaletteManager(paletteDiv, currentColorDiv);

// CanvasManagerにPaletteManagerを渡してインスタンスを作成
const canvasManager = new CanvasManager(canvasElement, paletteManager);

// URLManagerのインスタンスを作成（共有ボタンと連携）
const urlManager = new URLManager(canvasManager, shareButton, shareURLDiv);

// ページロード時の処理
window.onload = async () => {
  paletteManager.createPalette();   // カラーパレットの生成
  await canvasManager.initialize(); // 非同期でキャンバスを初期化
  urlManager.loadCanvasFromURL();   // URLからキャンバスデータを復元
  urlManager.setupShareButton();    // 共有ボタンの設定
};
