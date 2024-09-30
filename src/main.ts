// キャンバスとパレット関連の要素取得
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const paletteDiv = document.getElementById('palette') as HTMLDivElement;
const currentColorDiv = document.getElementById('current-color') as HTMLSpanElement;

// グリッドサイズとドットサイズ
const gridSize = 16;
const dotSize = 20;  // 1ドットのサイズ（ピクセル数）
let selectedColor = '#000000';  // 初期色は黒

// 無彩色の明度の段階
const brightness = [0.2, 0.4, 0.6, 0.8]; // 明度の段階
const hueBase = 360 / 12; // 色相を12段階に分割

// パレットを生成する関数
function generateColorPalette(): string[] {
  const palette: string[] = [];

  // 無彩色（白から黒）を最初に配置
  const grayscale = ['#000000', '#888888', '#CCCCCC', '#FFFFFF'];
  grayscale.forEach(color => palette.push(color));

  // 色相12段階で青（240度）からスタート
  for (let i = 0; i < 12; i++) {  // 色相12段階
    for (let b = 0; b < brightness.length; b++) {  // 明度4段階
      const hue = (210 + i * hueBase) % 360;  // 色相は青から開始
      const lightness = brightness[b] * 100;  // 明度をパーセントに変換
      const color = `hsl(${hue}, 100%, ${lightness}%)`;  // HSL形式で色を生成
      palette.push(color);
    }
  }

  return palette;
}

// パレットの配列を縦横入れ替える関数
function transposePalette(palette: string[], rows: number, columns: number): string[] {
  const transposed: string[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      transposed.push(palette[j * rows + i]);
    }
  }
  return transposed;
}

// カラーパレットを生成する関数（縦横入れ替え後に表示）
function createPalette() {
  let colors = generateColorPalette();
  colors = transposePalette(colors, 4, 13);  // 縦4行、横13列のパレットを入れ替える

  colors.forEach((color) => {
    const colorDiv = document.createElement('div');
    colorDiv.classList.add('color');
    colorDiv.style.backgroundColor = color;
    colorDiv.addEventListener('click', () => {
      selectedColor = color;
      currentColorDiv.textContent = color;
    });
    
    // パレットDivに追加
    paletteDiv.appendChild(colorDiv);
  });
}

// グリッドを描画する関数
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      ctx.strokeStyle = '#cccccc';
      ctx.strokeRect(i * dotSize, j * dotSize, dotSize, dotSize);
    }
  }
}

// ドットを打つ関数
function drawDot(x: number, y: number, color: string) {
  const gridX = Math.floor(x / dotSize);
  const gridY = Math.floor(y / dotSize);
  ctx.fillStyle = color;
  ctx.fillRect(gridX * dotSize, gridY * dotSize, dotSize, dotSize);
}

// キャンバスクリックでドットを打つイベントリスナー
canvas.addEventListener('click', (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  drawDot(x, y, selectedColor);
});

// 初期化処理
drawGrid();
createPalette();
currentColorDiv.textContent = selectedColor;
