// paletteManager.ts

import { generateColorPalette, transposePalette } from './paletteGenerator';

export class PaletteManager {
  private paletteDiv: HTMLDivElement;
  private currentColorDiv: HTMLSpanElement;
  private selectedColor: string = '#000000';
  private selectedColorIndex: number = 3;
  public colorDivs: HTMLDivElement[] = []; // カラー要素のリスト

  constructor(paletteDiv: HTMLDivElement, currentColorDiv: HTMLSpanElement) {
    this.paletteDiv = paletteDiv;
    this.currentColorDiv = currentColorDiv;
  }

  // パレットを生成して表示
  createPalette() {
    let colors = generateColorPalette(); // paletteGenerator から関数を使用
    colors = transposePalette(colors, 4, 13); // パレットの縦横を入れ替え（4行13列）

    colors.forEach((color, index) => {
      const colorDiv = document.createElement('div');
      colorDiv.classList.add('color');
      colorDiv.style.backgroundColor = color;
      colorDiv.addEventListener('click', () => this.selectColor(color, index));
      this.paletteDiv.appendChild(colorDiv);
      this.colorDivs.push(colorDiv); // カラー要素を保存
    });

    // 初期状態で選択された色を強調表示
    this.highlightSelectedColor();
  }

  // 色を選択したときの処理
  private selectColor(color: string, index: number) {
    this.selectedColor = color;
    this.selectedColorIndex = index;
    this.currentColorDiv.textContent = color; // カラーコードを表示
    this.highlightSelectedColor(); // 選択された色を強調
  }

  // 選択された色の外枠を強調
  private highlightSelectedColor() {
    this.colorDivs.forEach((div: HTMLDivElement, idx: number) => {
      if (idx === this.selectedColorIndex) {
        div.classList.add('selected'); // 選択された色に 'selected' クラスを追加
      } else {
        div.classList.remove('selected'); // その他の色から 'selected' クラスを削除
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

  // パレットの最大横幅をキャンバスの1.5倍または画面幅の最大に設定し、セルサイズを調整
  setMaxWidth(canvasWidth: number) {
    const screenWidth = window.innerWidth;
    const calculatedMaxWidth = canvasWidth * 1.5;
    const maxWidth = calculatedMaxWidth > screenWidth ? screenWidth : calculatedMaxWidth;
    this.paletteDiv.style.maxWidth = `${maxWidth}px`;

    // 現在のグリッド間の隙間と列数を取得
    const rootStyle = getComputedStyle(document.documentElement);
    const gridGap = parseFloat(rootStyle.getPropertyValue('--grid-gap'));
    const columns = parseInt(rootStyle.getPropertyValue('--columns-palette'));

    // 最大セルサイズを計算
    const maxCellSize = (maxWidth - (columns - 1) * gridGap) / columns;

    // 現在のセルサイズを取得
    const currentCellSizeStr = rootStyle.getPropertyValue('--cell-size-palette');
    let currentCellSize = parseFloat(currentCellSizeStr);

    // セルサイズが最大値を超えている場合、調整
    if (currentCellSize > maxCellSize) {
      currentCellSize = maxCellSize;
      document.documentElement.style.setProperty('--cell-size-palette', `${currentCellSize}px`);
    }
    // 超えていない場合はそのまま
  }
}
