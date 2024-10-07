import { PaletteManager } from './paletteManager';

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private canvasData: number[] = [];
  private readonly gridSize = 16;  // グリッドのサイズ
  private readonly dotSize = 20;
  private paletteManager: PaletteManager;
  private isDrawing: boolean = false;

  constructor(canvasElement: HTMLCanvasElement, paletteManager: PaletteManager) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.canvasData = new Array(this.gridSize * this.gridSize).fill(0); // 初期状態: インデックス0（白色）
    this.paletteManager = paletteManager; // PaletteManagerを受け取る
  }

  // キャンバスを初期化し描画
  initialize() {
    this.drawGrid();

    // キャンバスにマウスイベントを追加
    this.canvas.addEventListener('mousedown', () => this.isDrawing = true);
    this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
    this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.isDrawing) {
        this.handleDraw(event);
      }
    });
    this.canvas.addEventListener('click', (event: MouseEvent) => this.handleDraw(event));
  }

  // グリッドを描画
  drawGrid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const colorIndex = this.canvasData[j * this.gridSize + i];
        const color = this.getColorByIndex(colorIndex);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(i * this.dotSize, j * this.dotSize, this.dotSize, this.dotSize);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.strokeRect(i * this.dotSize, j * this.dotSize, this.dotSize, this.dotSize);
      }
    }
  }

  // 描画処理
  handleDraw(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / this.dotSize);
    const gridY = Math.floor(y / this.dotSize);

    const selectedColorIndex = this.paletteManager.getSelectedColorIndex();
    this.canvasData[gridY * this.gridSize + gridX] = selectedColorIndex;
    this.drawGrid();
  }

  // インデックスから色を取得
  private getColorByIndex(index: number): string {
    const colors = this.paletteManager['colorDivs'].map(div => div.style.backgroundColor);
    return colors[index];
  }

  // キャンバスデータを取得
  getCanvasData(): number[] {
    return this.canvasData;
  }

  // キャンバスデータをセット
  setCanvasData(data: number[]) {
    this.canvasData = data;
    this.drawGrid();
  }

  // グリッドサイズを取得
  getGridSize(): number {
    return this.gridSize;
  }
}
