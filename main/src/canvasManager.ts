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
    // グリッドサイズを計算
    const availableWidth = window.innerWidth * 0.9; // 画面幅の50%をキャンバスに使用（調整可能）
    this.dotSize = (availableWidth - (this.columns - 1) * this.gridGap) / this.columns;

    // キャンバスのサイズを設定
    this.canvas.width = this.columns * this.dotSize + (this.columns - 1) * this.gridGap;
    this.canvas.height = this.rows * this.dotSize + (this.rows - 1) * this.gridGap;

    // パレットの最大横幅をキャンバスの1.5倍または画面幅の最大に設定
    this.paletteManager.setMaxWidth(this.canvas.width);

    // グリッド描画
    this.drawGrid();

    // イベントリスナーの設定
    this.setupEventListeners();
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

  // キャンバスのサイズを更新するメソッド
  private updateCanvasSize() {
    // 既存の描画データを保存
    const oldCanvasData = [...this.canvasData];

    // グリッドサイズを再計算
    const availableWidth = window.innerWidth * 0.5; // 画面幅の50%をキャンバスに使用（調整可能）
    this.dotSize = (availableWidth - (this.columns - 1) * this.gridGap) / this.columns;

    // キャンバスのサイズを再設定
    this.canvas.width = this.columns * this.dotSize + (this.columns - 1) * this.gridGap;
    this.canvas.height = this.rows * this.dotSize + (this.rows - 1) * this.gridGap;

    // パレットの最大横幅を再設定
    this.paletteManager.setMaxWidth(this.canvas.width);

    // キャンバスデータを再設定（必要に応じて）
    this.canvasData = oldCanvasData;
    this.drawGrid();
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
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gridX = Math.floor(x / (this.dotSize + this.gridGap));
    const gridY = Math.floor(y / (this.dotSize + this.gridGap));

    // グリッド外の場合は無視
    if (gridX < 0 || gridX >= this.columns || gridY < 0 || gridY >= this.rows) {
      return;
    }

    const selectedColorIndex = this.paletteManager.getSelectedColorIndex();
    this.canvasData[gridY * this.columns + gridX] = selectedColorIndex;
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
