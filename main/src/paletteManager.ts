export class PaletteManager {
  private paletteDiv: HTMLDivElement;
  private currentColorDiv: HTMLSpanElement;
  private selectedColor: string = '#000000';
  private selectedColorIndex: number = 3;
  private readonly brightness: number[] = [0.8, 0.6, 0.4, 0.2];
  private readonly hueBase: number = 360 / 12;
  private colorDivs: HTMLDivElement[] = []; // カラー要素のリスト

  constructor(paletteDiv: HTMLDivElement, currentColorDiv: HTMLSpanElement) {
    this.paletteDiv = paletteDiv;
    this.currentColorDiv = currentColorDiv;
  }

  // パレットを生成して表示
  createPalette() {
    let colors = this.generateColorPalette();
    colors = this.transposePalette(colors, 4, 13); // パレットの縦横を入れ替え

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

  // カラーパレットの色生成
  private generateColorPalette(): string[] {
    const palette: string[] = [];

    // 無彩色（白から黒）を最初に配置
    const grayscale = ['#FFFFFF', '#CCCCCC', '#888888', '#000000'];
    grayscale.forEach(color => palette.push(color));

    // 色相12段階で青（210度）からスタート
    for (let i = 0; i < 12; i++) {  // 色相12段階
      for (let b = 0; b < this.brightness.length; b++) {  // 明度4段階
        const hue = (210 + i * this.hueBase) % 360;  // 色相を計算
        const lightness = this.brightness[b] * 100;  // 明度をパーセントに変換
        const color = `hsl(${hue}, 100%, ${lightness}%)`;  // HSL形式で色を生成
        palette.push(color);
      }
    }
    return palette;
  }

  // パレットの配列を縦横入れ替える関数
  private transposePalette(palette: string[], rows: number, columns: number): string[] {
    const transposed: string[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        transposed.push(palette[j * rows + i]);
      }
    }
    return transposed;
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
