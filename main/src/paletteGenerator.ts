// カラーパレットの生成
export function generateColorPalette(): string[] {
  const palette: string[] = [];
  const brightness = [0.8, 0.6, 0.4, 0.2];
  const hueBase = 360 / 12;

  // 無彩色（白から黒）を最初に配置
  const grayscale = ['#FFFFFF', '#CCCCCC', '#888888', '#000000'];
  grayscale.forEach(color => palette.push(color));

  // 色相12段階で青（210度）からスタート
  for (let i = 0; i < 12; i++) {  // 色相12段階
    for (let b = 0; b < brightness.length; b++) {  // 明度4段階
      const hue = (210 + i * hueBase) % 360;  // 色相を計算
      const lightness = brightness[b] * 100;  // 明度をパーセントに変換
      const color = `hsl(${hue}, 100%, ${lightness}%)`;  // HSL形式で色を生成
      palette.push(color);
    }
  }

  return palette;
}

// パレットの配列を縦横入れ替える関数
export function transposePalette(palette: string[], rows: number, columns: number): string[] {
  const transposed: string[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      transposed.push(palette[j * rows + i]);
    }
  }
  return transposed;
}

// カラーパレットをUint8Array形式でRGBに変換して取得
export function getPaletteColors(): Uint8Array {
  let colors = generateColorPalette();
  colors = transposePalette(colors, 4, 13); // パレットの縦横を入れ替え

  const rgbColors: number[] = [];

  colors.forEach(color => {
    let rgb: [number, number, number];

    if (color.startsWith('#')) {
      // 16進数カラーコードをRGBに変換
      rgb = hexToRgb(color);
    } else if (color.startsWith('hsl')) {
      // HSLをRGBに変換
      const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%\)/);
      if (hslMatch) {
        const h = parseInt(hslMatch[1]);
        const s = parseInt(hslMatch[2]) / 100;
        const l = parseInt(hslMatch[3]) / 100;
        rgb = hslToRgb(h, s, l);
      } else {
        throw new Error(`Invalid color format: ${color}`);
      }
    } else {
      throw new Error(`Unknown color format: ${color}`);
    }

    rgbColors.push(rgb[0], rgb[1], rgb[2]);
  });

  return new Uint8Array(rgbColors);
}

// 16進数カラーコードをRGBに変換
export function hexToRgb(hex: string): [number, number, number] {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// HSLからRGBへの変換
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;

  if (0 <= hh && hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (1 <= hh && hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (2 <= hh && hh < 3) [r1, g1, b1] = [0, c, x];
  else if (3 <= hh && hh < 4) [r1, g1, b1] = [0, x, c];
  else if (4 <= hh && hh < 5) [r1, g1, b1] = [x, 0, c];
  else if (5 <= hh && hh < 6) [r1, g1, b1] = [c, 0, x];

  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  return [r, g, b];
}
