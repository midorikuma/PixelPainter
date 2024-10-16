// 必要な関数をインポート
import { generateColorPalette, transposePalette } from './paletteGenerator';

export class PaletteManager {
  private paletteDiv: HTMLDivElement;
  private currentColorDiv: HTMLSpanElement;
  private selectedColor: string = '#000000';
  private selectedColorIndex: number = 3;
  private colorDivs: HTMLDivElement[] = []; // カラー要素のリスト

  constructor(paletteDiv: HTMLDivElement, currentColorDiv: HTMLSpanElement) {
    this.paletteDiv = paletteDiv;
    this.currentColorDiv = currentColorDiv;
  }

  // パレットを生成して表示
  createPalette() {
    let colors = generateColorPalette(); // paletteGenerator から関数を使用
    colors = transposePalette(colors, 4, 13); // パレットの縦横を入れ替え

    colors.forEach((color, index) => {
      const colorDiv = document.createElement('div');
      colorDiv.classList.add('color');
      colorDiv.style.backgroundColor = color;
      colorDiv.style.border = '1px solid lightgray'; // 初期の枠は灰色
      colorDiv.addEventListener('click', () => this.selectColor(color, index));
      this.paletteDiv.appendChild(colorDiv);
      this.colorDivs.push(colorDiv); // カラー要素を保存
    });

    // 初期状態で0番目の色を強調表示
    this.highlightSelectedColor();
  }

  // 色を選択したときの処理
  private selectColor(color: string, index: number) {
    this.selectedColor = color;
    this.selectedColorIndex = index;
    this.currentColorDiv.textContent = color;
    this.highlightSelectedColor(); // 選択された色を強調
  }

  // 選択された色の外枠を強調
  private highlightSelectedColor() {
    this.colorDivs.forEach((div, idx) => {
      if (idx === this.selectedColorIndex) {
        div.style.border = '3px solid black'; // 選択された色に太い黒枠を付ける
      } else {
        div.style.border = '1px solid lightgray'; // その他の色の枠は灰色
      }
    });
  }

  // 現在選択された色を取得
  getSelectedColor(): string {
    return this.selectedColor;
  }

  // 現在選択された色のインデックスを取得
  getSelectedColorIndex(): number {
    return this.selectedColorIndex;
  }
}
