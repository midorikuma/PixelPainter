// canvasManager.ts

import { PaletteManager } from './paletteManager';

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private canvasData: number[] = [];
  private readonly columns = 16; // グリッドの列数を16に設定
  private readonly rows = 16;    // グリッドの行数を16に設定
  private readonly gridSize = this.columns * this.rows;
  private paletteManager: PaletteManager;
  private isDrawing: boolean = false;
  private dotSize!: number;      // 確定代入アサーションを使用
  private gridGap: number;

  constructor(canvasElement: HTMLCanvasElement, paletteManager: PaletteManager) {
    this.canvas = canvasElement;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('CanvasRenderingContext2D を取得できませんでした。');
    }
    this.ctx = context;
    this.canvasData = new Array(this.gridSize).fill(0);
    this.paletteManager = paletteManager;

    // CSS変数からグリッド間の隙間を取得
    const rootStyle = getComputedStyle(document.documentElement);
    const gridGapStr = rootStyle.getPropertyValue('--grid-gap');
    this.gridGap = parseFloat(gridGapStr) || 0;
  }

async initialize() {
    // 画面の短い方を基準にサイズを計算 (60vminを基準)
    const availableSize = Math.min(window.innerWidth, window.innerHeight) * 0.6;
    this.dotSize = (availableSize - (this.columns - 1) * this.gridGap) / this.columns;

    // キャンバスのサイズを設定
    this.canvas.width = this.columns * this.dotSize + (this.columns - 1) * this.gridGap;
    this.canvas.height = this.rows * this.dotSize + (this.rows - 1) * this.gridGap;

    // パレットの最大横幅をキャンバスの幅に合わせる
    this.paletteManager.setMaxWidth(this.canvas.width);

    // グリッド描画
    this.drawGrid();

    // イベントリスナーの設定
    this.setupEventListeners();
}

private updateCanvasSize() {
    // 画面の短い方を基準にサイズを再計算 (60vminを基準)
    const availableSize = Math.min(window.innerWidth, window.innerHeight) * 0.6;
    this.dotSize = (availableSize - (this.columns - 1) * this.gridGap) / this.columns;

    // キャンバスのサイズを再設定
    this.canvas.width = this.columns * this.dotSize + (this.columns - 1) * this.gridGap;
    this.canvas.height = this.rows * this.dotSize + (this.rows - 1) * this.gridGap;

    // パレットの最大横幅を再設定
    this.paletteManager.setMaxWidth(this.canvas.width);

    // キャンバスデータを保持しつつ再描画
    this.drawGrid();
}


  private setupEventListeners() {
    // マウスイベント
    this.canvas.addEventListener('mousedown', () => this.isDrawing = true);
    this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
    this.canvas.addEventListener('mouseleave', () => this.isDrawing = false); // マウスがキャンバス外に出たとき
    this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.isDrawing) {
        this.handleDraw(event.clientX, event.clientY);
      }
    });
    this.canvas.addEventListener('click', (event: MouseEvent) => this.handleDraw(event.clientX, event.clientY));

    // タッチイベント
    this.canvas.addEventListener('touchstart', (event: TouchEvent) => {
      event.preventDefault(); // デフォルトのタッチ動作を防止
      this.isDrawing = true;
      const touch = event.touches[0];
      this.handleDraw(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (event: TouchEvent) => {
      event.preventDefault();
      this.isDrawing = false;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (event: TouchEvent) => {
      event.preventDefault();
      if (this.isDrawing) {
        const touch = event.touches[0];
        this.handleDraw(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    // ウィンドウリサイズ時にキャンバスとパレットのサイズを再設定
    window.addEventListener('resize', () => {
      this.updateCanvasSize();
    });
  }

  // グリッドを描画
  private drawGrid() {
    // キャンバスをクリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // グリッドをループで描画
    for (let i = 0; i < this.columns; i++) {
      for (let j = 0; j < this.rows; j++) {
        const colorIndex = this.canvasData[j * this.columns + i];
        const color = this.getColorByIndex(colorIndex);

        // 塗りつぶし用の色を設定して塗りつぶし
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          i * (this.dotSize + this.gridGap),
          j * (this.dotSize + this.gridGap),
          this.dotSize,
          this.dotSize
        );

        // 枠線の色を設定して枠線を描画
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.strokeRect(
          i * (this.dotSize + this.gridGap),
          j * (this.dotSize + this.gridGap),
          this.dotSize,
          this.dotSize
        );
      }
    }
  }

  // インデックスに基づいて色を取得するメソッド
  private getColorByIndex(index: number): string {
    const colorDivs = this.paletteManager.colorDivs; // colorDivs を直接アクセス
    const colors: string[] = colorDivs.map(div => div.style.backgroundColor);
    return colors[index] || 'white'; // デフォルトは白色
  }

private handleDraw(clientX: number, clientY: number) {
    // キャンバスの正確な表示領域を取得
    const rect = this.canvas.getBoundingClientRect();
    
    // キャンバス内の座標を計算
    const x = (clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (clientY - rect.top) * (this.canvas.height / rect.height);

    const gridX = Math.floor(x / (this.dotSize + this.gridGap));
    const gridY = Math.floor(y / (this.dotSize + this.gridGap));

    // キャンバス外の場合は無視
    if (gridX < 0 || gridX >= this.columns || gridY < 0 || gridY >= this.rows) {
      return;
    }

    // 選択中の色でキャンバスデータを更新
    const selectedColorIndex = this.paletteManager.getSelectedColorIndex();
    this.canvasData[gridY * this.columns + gridX] = selectedColorIndex;

    // 再描画
    this.drawGrid();
}


  getCanvasData(): number[] {
    return this.canvasData;
  }

  setCanvasData(data: number[]) {
    this.canvasData = data;
    this.drawGrid();
  }

  getGridSize(): number {
    return this.gridSize;
  }
}
