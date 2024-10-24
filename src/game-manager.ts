import { Board } from './board.ts';
import { CanvasService } from './canvas-service.ts';

const GEMS_INFO = [
  { name: "mails",
    src: "../images/mails.svg",
    image: new Image()
  },
  { name: "reviews",
    src: "../images/reviews.svg",
    image: new Image()
  },
  { name: "notifications",
    src: "../images/notifications.svg",
    image: new Image()
  },
  { name: "carts",
    src: "../images/carts.svg",
    image: new Image()
  },
  { name: "products",
    src: "../images/products.svg",
    image: new Image()
  }
]
const BOARD_WIDTH = 5;
const BOARD_HEIGHT = 5;

export class GameManager {
  board: Board
  canvasService: CanvasService
  score: number
  constructor() {
    this.board = new Board(BOARD_WIDTH, BOARD_HEIGHT, GEMS_INFO.map(gem => gem.name));
    this.canvasService = new CanvasService(BOARD_WIDTH, BOARD_HEIGHT, GEMS_INFO);
    this.score = 0
  }
  start() {
    this.canvasService.loadAssets().then(() => {
      this.dropPhase()
    })
  }
  dropPhase() {
    this.board.recalculatePositions();

    let startTime: number = 0;
    const animate = (timeStamp: number) => {
      if (startTime === 0) { startTime = timeStamp; }
      const timeCounter: number = (timeStamp - startTime) / 150;
      let offset: number = 0.1;
      let animationFinished: boolean = true;

      this.canvasService.clear();
      for(let x = 0; x < this.board.width; x++) {
        for(let y = 0; y < this.board.height; y++) {
          const gem = this.board.getGem(x, y);
          if (!gem) { continue; }

          let timeline = timeCounter - offset;
          if (timeline < 0) { timeline = 0; }
          let height = this.board.getGemFallHeight(x, y) - timeline;
          if (height <= 0) { height = 0; }
          else { animationFinished = false; }
          this.canvasService.drawGem(x, y + height, gem);
          offset += 0.1 * y;
        }
      }
      this.canvasService.drawScore(this.score);
      if (animationFinished) {
        this.explosionPhase();
      } else {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }
  explosionPhase() {
    const matches = this.board.getMatches();
    if (matches.length > 0) {
      this.score += matches.length * 100;
      let animationLength = 300;
      let startTime: number = 0;
      const animate = (timeStamp: number) => {
        if (startTime === 0) { startTime = timeStamp; }
        let timePercent = (animationLength + startTime - timeStamp) / animationLength;
        if (timePercent < 0) { timePercent = 0 }

        this.canvasService.clear();
        this.canvasService.drawBoard(this.board, matches);
        matches.forEach((match) => {
          const gem = this.board.getGem(match[0], match[1])
          if (!gem) { return; }
          this.canvasService.drawGem(match[0], match[1], gem, 0.9 * timePercent);
        })

        this.canvasService.drawScore(this.score);
        if (timePercent === 0) {
          this.board.sliceMatches();
          this.dropPhase();
        } else {
          requestAnimationFrame(animate);
        }
      }
      requestAnimationFrame(animate);
    } else {
      this.playerPhase();
    }
  }
  playerPhase() {
    const listen = () => {
      const hoverGemX: number | undefined = this.canvasService.hoverGemX;
      const hoverGemY: number | undefined = this.canvasService.hoverGemY;
      const activeGemX: number | undefined = this.canvasService.activeGemX;
      const activeGemY: number | undefined = this.canvasService.activeGemY;
      this.canvasService.clear();
      const exceptions = hoverGemX != undefined && hoverGemY != undefined ? [[hoverGemX, hoverGemY]] : undefined;
      this.canvasService.drawBoard(this.board, exceptions);
      if (hoverGemX !== undefined && hoverGemY !== undefined) {
        const gemName = this.board.getGem(hoverGemX, hoverGemY)
        if (gemName !== undefined) {
          this.canvasService.drawGem(hoverGemX, hoverGemY, gemName, 1);
        }
      }
      this.canvasService.drawScore(this.score);
      if (this.canvasService.isGemExchange && hoverGemX !== undefined && hoverGemY !== undefined && activeGemX !== undefined && activeGemY !== undefined) {
        let targetGemX: number, targetGemY: number
        if (Math.abs(hoverGemX - activeGemX) != Math.abs(hoverGemY - activeGemY)) {
          if (Math.abs(hoverGemX - activeGemX) > Math.abs(hoverGemY - activeGemY)) {
            targetGemX = activeGemX - Math.sign(activeGemX - hoverGemX);
            targetGemY = activeGemY;
          } else {
            targetGemX = activeGemX;
            targetGemY = activeGemY - Math.sign(activeGemY - hoverGemY);
          }
          this.canvasService.hoverGemX = undefined;
          this.canvasService.hoverGemY = undefined;
          this.canvasService.activeGemX = undefined;
          this.canvasService.activeGemY = undefined;
          this.canvasService.isGemExchange = false;

          this.gemMovePhase(targetGemX, targetGemY, activeGemX, activeGemY);
        } else {
          requestAnimationFrame(listen);
        }
      } else {
        requestAnimationFrame(listen);
      }
    }
    listen();
  }
  gemMovePhase(targetGemX: number, targetGemY: number, activeGemX: number, activeGemY: number) {
    const firstGem = this.board.getGem(activeGemX, activeGemY);
    const secondGem = this.board.getGem(targetGemX, targetGemY);
    if (firstGem === undefined || secondGem === undefined) {
      this.playerPhase();
      return;
    }
    this.board.setGem(activeGemX, activeGemY, secondGem);
    this.board.setGem(targetGemX, targetGemY, firstGem);

    const animation = (timeFuction: Function, collback: Function, animationLength: number) => {
      let startTime: number = 0;
      const animate = (timeStamp: number) => {
        if (startTime === 0) { startTime = timeStamp; }
        let timeCounter = timeStamp - startTime;
        let timePercent = timeCounter / animationLength;

        const tArr: number[] = timeFuction(timePercent);
        let tPos: number = tArr[0];
        let tRot: number = tArr[1];

        this.canvasService.clear();
        this.canvasService.drawBoard(this.board, [[activeGemX, activeGemY], [targetGemX, targetGemY]]);
        this.canvasService.drawGem(targetGemX + (activeGemX - targetGemX) * tPos, targetGemY + (activeGemY - targetGemY) * tPos, secondGem, 0.9 * (1 - tRot / 5));
        this.canvasService.drawGem(activeGemX + (targetGemX - activeGemX) * tPos, activeGemY + (targetGemY - activeGemY) * tPos, firstGem, 0.9 * (1 + tRot / 10));
        this.canvasService.drawScore(this.score);

        if (timePercent >= 1) {
          collback();
        } else {
          requestAnimationFrame(animate);
        }
      }
      animate(0);
    }

    if (this.board.getMatches().length > 0) {
      animation((timePercent: number) => {
        const arr: number[] = []
        if (timePercent <= 0.5) {
          arr[0] = timePercent;
          arr[1] = timePercent * 2;
        } else {
          arr[0] = timePercent;
          arr[1] = (0.5 - (timePercent - 0.5)) * 2;
        }
        return arr
      }, () => {
        this.explosionPhase();
      }, 300);
    } else {
      animation((timePercent: number) => {
        const arr: number[] = []
        if (timePercent <= 0.25) {
          arr[0] = timePercent * 2;
          arr[1] = timePercent * 4;
        } else if (timePercent <= 0.5) {
          arr[0] = timePercent * 2;
          arr[1] = (0.25 - (timePercent - 0.25)) * 4;
        } else if (timePercent <= 0.75) {
          arr[0] = (0.5 - (timePercent - 0.5)) * 2;
          arr[1] = (timePercent - 0.5) * 4;
        } else {
          arr[0] = (0.5 - (timePercent - 0.5)) * 2;
          arr[1] = (0.25 - (timePercent - 0.75)) * 4;
        }
        return arr
      }, () => {
        this.board.setGem(activeGemX, activeGemY, firstGem);
        this.board.setGem(targetGemX, targetGemY, secondGem);
        this.playerPhase();
      }, 600);
    }
  }
}







