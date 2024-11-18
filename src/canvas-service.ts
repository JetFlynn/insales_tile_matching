import { Board } from './board';
import { Gem, GemInfo } from './types'
import images from './images'

const CELL_SIZE = 200;

export class CanvasService {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  gems_info: GemInfo[]
  board: Board
  gems_images: Record<string, HTMLImageElement>
  handImage: HTMLImageElement

  constructor(selector: string, board: Board, gems_info: GemInfo[]) {
    this.canvas = document.querySelector<HTMLCanvasElement>(selector)!;
    if (!this.canvas) { throw 'Wrong selector'; }
    this.ctx = this.canvas.getContext("2d")!;
    this.board = board;
    this.canvas.width = CELL_SIZE * this.board.width;
    this.canvas.height = CELL_SIZE * this.board.height;
    this.canvas.style.width = '100%';
    this.gems_info = gems_info;
    this.gems_images = {};
    this.handImage = new Image();
  }

  drawHand(x: number, y: number): void {
    const scale = 0.8;
    const margin = (1 - scale) / 2;
    const xpixels = (margin + x) * CELL_SIZE;
    const reverseY = this.board.height - 1 - y;
    const offsetY = scale / 4;
    const ypixels = (margin + offsetY + reverseY) * CELL_SIZE;
    this.ctx.drawImage(this.handImage, xpixels, ypixels, CELL_SIZE * scale, CELL_SIZE * scale);
  }
  drawGem(x: number, y: number, gem_name: string, scale: number = 0.9): void {
    const margin = (1 - scale) / 2;
    const xpixels = (margin + x) * CELL_SIZE;
    const ypixels = (this.board.height - 1 - y + margin) * CELL_SIZE;
    this.ctx.drawImage(this.gems_images[gem_name], xpixels, ypixels, CELL_SIZE * scale, CELL_SIZE * scale);
  }
  drawBoard(exceptions?: Gem[]): void {
    for(let x = 0; x < this.board.width; x++) {
      for(let y = 0; y < this.board.height; y++) {
        const gem = this.board.getGem(x, y);
        if (!gem) { continue; }
        if (exceptions && exceptions.some((gem) => gem.x == x && gem.y == y)) { continue; }

        this.drawGem(x, y, gem);
      }
    }
  }
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  async loadAssets(): Promise<void> {
    const promiseList: Promise<void>[] = [];
    this.gems_info.forEach((gem: GemInfo) => {
      promiseList.push(new Promise((resolve) => {
        gem.image.src = gem.src;
        gem.image.onload = (): void => {
          this.gems_images[gem.name] = gem.image;
          resolve();
        };
      }));
    })
    promiseList.push(new Promise((resolve) => {
      this.handImage.src = images.hand;
      this.handImage.onload = (): void => { resolve(); };
    }));
    await Promise.all(promiseList);
  }
  getCanvasGem(eventX: number, eventY: number) : Gem | undefined {
    const rect = this.canvas.getBoundingClientRect();
    const cellX = this.canvas.offsetWidth / this.board.width;
    const cellY = this.canvas.offsetHeight / this.board.height;
    const x = Math.floor((eventX - rect.left) / cellX);
    const y = this.board.height - 1 - Math.floor((eventY - rect.top) / cellY);
    const name = this.board.getGem(x, y)
    if (!name) { return undefined }
    return {x, y, name}
  }
}
