"use strict";
// キャンバスとパレット関連の要素取得
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var paletteDiv = document.getElementById('palette');
var currentColorDiv = document.getElementById('current-color');
// グリッドサイズとドットサイズ
var gridSize = 16;
var dotSize = 20; // 1ドットのサイズ（ピクセル数）
var selectedColor = '#000000'; // 初期色は黒
// 無彩色の明度の段階
var brightness = [0.2, 0.4, 0.6, 0.8]; // 明度の段階
var hueBase = 360 / 12; // 色相を12段階に分割
// パレットを生成する関数
function generateColorPalette() {
    var palette = [];
    // 無彩色（白から黒）を最初に配置
    var grayscale = ['#000000', '#888888', '#CCCCCC', '#FFFFFF'];
    grayscale.forEach(function (color) { return palette.push(color); });
    // 色相12段階で青（240度）からスタート
    for (var i = 0; i < 12; i++) { // 色相12段階
        for (var b = 0; b < brightness.length; b++) { // 明度4段階
            var hue = (210 + i * hueBase) % 360; // 色相は青から開始
            var lightness = brightness[b] * 100; // 明度をパーセントに変換
            var color = "hsl(".concat(hue, ", 100%, ").concat(lightness, "%)"); // HSL形式で色を生成
            palette.push(color);
        }
    }
    return palette;
}
// パレットの配列を縦横入れ替える関数
function transposePalette(palette, rows, columns) {
    var transposed = [];
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {
            transposed.push(palette[j * rows + i]);
        }
    }
    return transposed;
}
// カラーパレットを生成する関数（縦横入れ替え後に表示）
function createPalette() {
    var colors = generateColorPalette();
    colors = transposePalette(colors, 4, 13); // 縦4行、横13列のパレットを入れ替える
    colors.forEach(function (color) {
        var colorDiv = document.createElement('div');
        colorDiv.classList.add('color');
        colorDiv.style.backgroundColor = color;
        colorDiv.addEventListener('click', function () {
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
    for (var i = 0; i < gridSize; i++) {
        for (var j = 0; j < gridSize; j++) {
            ctx.strokeStyle = '#cccccc';
            ctx.strokeRect(i * dotSize, j * dotSize, dotSize, dotSize);
        }
    }
}
// ドットを打つ関数
function drawDot(x, y, color) {
    var gridX = Math.floor(x / dotSize);
    var gridY = Math.floor(y / dotSize);
    ctx.fillStyle = color;
    ctx.fillRect(gridX * dotSize, gridY * dotSize, dotSize, dotSize);
}
// キャンバスクリックでドットを打つイベントリスナー
canvas.addEventListener('click', function (event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    drawDot(x, y, selectedColor);
});
// 初期化処理
drawGrid();
createPalette();
currentColorDiv.textContent = selectedColor;
