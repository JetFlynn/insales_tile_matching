const CANVAS_SCALE = 0.5;
const CELL_SIZE = 200;

type GemInfo = {
  name: string
  src: string
  image: HTMLImageElement
}

export class CanvasService {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  gems_info: GemInfo[]
  boardWidth: number
  boardHeight: number
  gems_images: Record<string, HTMLImageElement>
  constructor(width: number, height: number, gems_info: GemInfo[]) {
    this.canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.boardWidth = width;
    this.boardHeight = height;
    this.canvas.width = CELL_SIZE * this.boardWidth;
    this.canvas.height = CELL_SIZE * this.boardHeight;
    this.canvas.style.width = this.canvas.width * CANVAS_SCALE +'px';
    this.canvas.style.height = this.canvas.height * CANVAS_SCALE +'px';
    this.gems_info = gems_info;
    this.gems_images = {};
  }
  drawGem(x: number, y: number, gem_name: string) {
    const xpixels = (0.05 + x) * CELL_SIZE;
    const ypixels = (this.boardHeight - 1 - y + 0.05) * CELL_SIZE;
    this.ctx.drawImage(this.gems_images[gem_name], xpixels, ypixels, CELL_SIZE * 0.9, CELL_SIZE * 0.9);
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  loadAssets() {
    const promiseList: Promise<void>[] = [];
    this.gems_info.forEach((gem) => {
      promiseList.push(new Promise<void>((resolve) => {
        gem.image.src = gem.src;
        gem.image.onload = () => {
          this.gems_images[gem.name] = gem.image;
          resolve();
        };
      }));
    })
    return Promise.all(promiseList);
  }
}
