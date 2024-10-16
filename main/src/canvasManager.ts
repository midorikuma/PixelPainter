import { PaletteManager } from './paletteManager';

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private canvasData: number[] = [];
  private readonly gridSize = 16;
  private readonly dotSize = 20;
  private paletteManager: PaletteManager;
  private isDrawing: boolean = false;

  constructor(canvasElement: HTMLCanvasElement, paletteManager: PaletteManager) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.canvasData = new Array(this.gridSize * this.gridSize).fill(0);
    this.paletteManager = paletteManager;
  }

async initialize() {
  this.canvas.addEventListener('mousedown', () => this.isDrawing = true);
  this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
  this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
    if (this.isDrawing) {
      this.handleDraw(event);
    }
  });
  this.canvas.addEventListener('click', (event: MouseEvent) => this.handleDraw(event));
  this.drawGrid();
}

  // グリッドを描画
  drawGrid() {
    // キャンバスをクリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // グリッドをループで描画
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const colorIndex = this.canvasData[j * this.gridSize + i];
        const color = this.getColorByIndex(colorIndex);

        // 塗りつぶし用の色を設定して塗りつぶし
        this.ctx.fillStyle = color;
        this.ctx.fillRect(i * this.dotSize, j * this.dotSize, this.dotSize, this.dotSize);

        // 枠線の色を設定して枠線を描画
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.strokeRect(i * this.dotSize, j * this.dotSize, this.dotSize, this.dotSize);
      }
    }
  }

  // インデックスに基づいて色を取得するメソッド
  private getColorByIndex(index: number): string {
    const colors = this.paletteManager['colorDivs'].map(div => div.style.backgroundColor);
    return colors[index] || 'white'; // デフォルトは白色
  }

  private handleDraw(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / this.dotSize);
    const gridY = Math.floor(y / this.dotSize);

    const selectedColorIndex = this.paletteManager.getSelectedColorIndex();
    this.canvasData[gridY * this.gridSize + gridX] = selectedColorIndex;
    this.drawGrid();
  }

  private getPaletteColors(): Uint8Array {
    const colorDivs = this.paletteManager['colorDivs'];
    const colors: number[] = [];
    
    colorDivs.forEach(div => {
      const color = window.getComputedStyle(div).backgroundColor;
      const rgb = color.match(/\d+/g)!.map(Number);
      colors.push(...rgb.slice(0, 3)); // RGBの3値を追加
    });

    return new Uint8Array(colors);
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
