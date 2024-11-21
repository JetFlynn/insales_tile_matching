import { Board } from './board';
import { CanvasService } from './canvas-service';
import { InputService } from './input-service';
import { Gem, GemInfo } from './types'
import images from './images'

type Options = {
  score?: number
}

const GEMS_INFO: GemInfo[] = [
  { name: "mails",
    src: images.mails,
    image: new Image()
  },
  { name: "reviews",
    src: images.reviews,
    image: new Image()
  },
  { name: "notifications",
    src: images.notifications,
    image: new Image()
  },
  { name: "carts",
    src: images.carts,
    image: new Image()
  },
  { name: "products",
    src: images.products,
    image: new Image()
  }
]

const BOARD_WIDTH = 5;
const BOARD_HEIGHT = 5;
const HELP_THRESHOLD = 5;
const HELP_ANIMATION_LENGTH = 600;
const HAND_ANIMATION_LENGTH = 1200;

interface Callbacks {
  scoreUpdate?: ((score: number) => void);
}

export default class GameManager {
  score: number
  playerInactiveTime: number
  private active: boolean
  private board: Board
  private canvasService: CanvasService
  private inputService: InputService
  private firstPlayerPhase: boolean
  private callbacks: Callbacks
  private lastFrame: ((timeStamp: number) => void) | undefined

  constructor(selector: string, options?: Options, callbacks?: Callbacks) {
    this.board = new Board(BOARD_WIDTH, BOARD_HEIGHT, GEMS_INFO.map(gem => gem.name));
    this.canvasService = new CanvasService(selector, this.board, GEMS_INFO);;
    this.inputService = new InputService(this.canvasService);
    this.active = false;
    this.score = options?.score || 0;
    this.playerInactiveTime = 0;
    this.firstPlayerPhase = true;
    this.callbacks = {
      scoreUpdate: callbacks?.scoreUpdate
    }
    this.lastFrame = undefined
  }
  start(): void {
    if (this.active) { return; }
    this.firstPlayerPhase = true
    this.active = true
    this.board.makeZeroMatches()
    this.inputService.start()
    this.canvasService.loadAssets().then(() => {
      this.dropPhase(true)
    })
  }
  stop(): void {
    this.active = false
    this.inputService.destroy()
    requestAnimationFrame((_timeStamp) => {
      this.lastFrame = undefined;
      this.board = new Board(BOARD_WIDTH, BOARD_HEIGHT, GEMS_INFO.map(gem => gem.name));
      this.score = 0;
      this.playerInactiveTime = 0;
      this.firstPlayerPhase = true;
      this.canvasService.clear();
    });
  }
  pause(): void {
    this.active = false
    this.inputService.destroy()
    requestAnimationFrame((_timeStamp) => {
      this.canvasService.clear();
    });
  }
  resume(): void {
    if (this.active || !this.lastFrame) {
      return;
    }
    this.active = true;
    this.inputService.start()
    requestAnimationFrame(this.lastFrame);
    this.lastFrame = undefined
  }
  private addScore(addition: number): void {
    this.score += addition
    if (this.callbacks.scoreUpdate) {
      this.callbacks.scoreUpdate(this.score);
    }
  }
  private dropPhase(precalculated?: boolean): void {
    if (!precalculated) { this.board.recalculatePositions(); }

    let startTime = 0;
    const animate = (timeStamp: number): void => {
      if (startTime === 0) { startTime = timeStamp; }
      const timeCounter: number = (timeStamp - startTime) / 150;
      let offset = 0.1;
      let animationFinished = true;

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
      if (animationFinished) {
        this.explosionPhase();
      } else {
        this.nextTick(animate);
      }
    }
    this.nextTick(animate);
  }
  private restartPhase(): void {
    const animationLength = 300;
    let startTime = 0;
    const animate = (timeStamp: number): void => {
      if (startTime === 0) { startTime = timeStamp; }
      let timePercent = (animationLength + startTime - timeStamp) / animationLength;
      if (timePercent < 0) { timePercent = 0 }

      this.canvasService.clear();
      for(let x = 0; x < this.board.width; x++) {
        for(let y = 0; y < this.board.height; y++) {
          const gem = this.board.getGem(x, y)
          if (!gem) { continue; }
          this.canvasService.drawGem(x, y, gem, 0.9 * timePercent);
        }
      }

      if (timePercent === 0) {
        this.board.clearBoard();
        this.dropPhase();
      } else {
        this.nextTick(animate);
      }
    }
    this.nextTick(animate);
  }
  private explosionPhase(): void {
    const matches = this.board.getMatches();
    if (matches.length > 0) {
      this.addScore(matches.length * 100)
      const animationLength = 300;
      let startTime = 0;
      const animate = (timeStamp: number): void => {
        if (startTime === 0) { startTime = timeStamp; }
        let timePercent = (animationLength + startTime - timeStamp) / animationLength;
        if (timePercent < 0) { timePercent = 0 }

        this.canvasService.clear();
        this.canvasService.drawBoard(matches);
        matches.forEach((match) => {
          const name = this.board.getGem(match.x, match.y)
          if (!name) { return; }
          this.canvasService.drawGem(match.x, match.y, name, 0.9 * timePercent);
        })

        if (timePercent === 0) {
          this.board.sliceMatches();
          this.dropPhase();
        } else {
          this.nextTick(animate);
        }
      }
      this.nextTick(animate);
    } else {
      this.playerPhase();
    }
  }
  private playerPhase(): void {
    const possibleMatches = this.board.getPossibleMatch()
    if (!possibleMatches) {
      this.restartPhase();
      return;
    }

    let helpTimer = Date.now()
    let playerInactiveTime = 0;
    let showHelp = false;
    let helpStartTime = 0

    this.inputService.clearGems()
    const listen = (timeStamp: number): void => {
      playerInactiveTime += Date.now() - helpTimer
      helpTimer = Date.now()
      if (showHelp === false && (playerInactiveTime > HELP_THRESHOLD * 1000)) {
        showHelp = true
        helpStartTime = timeStamp;
      }

      const hoverGem: Gem | undefined = this.inputService.hoverGem;
      const activeGem: Gem | undefined = this.inputService.activeGem;

      this.canvasService.clear();
      const exceptions = hoverGem !== undefined ? [hoverGem]: [];
      this.canvasService.drawBoard(exceptions);

      if (showHelp) {
        this.drawEmphasisGem(timeStamp - helpStartTime, possibleMatches[0]);
      }
      if (hoverGem !== undefined) {
        this.drawHoveredGem(timeStamp, hoverGem)
      }
      if (this.firstPlayerPhase) {
        this.drawHand(timeStamp, possibleMatches)
      }
      if (this.inputService.isGemExchange && hoverGem !== undefined && activeGem !== undefined) {
        if (Math.abs(hoverGem.x - activeGem.x) != Math.abs(hoverGem.y - activeGem.y)) {
          this.inputService.clearGems()
          this.firstPlayerPhase = false;

          const targetGem = this.getTargetGem(hoverGem, activeGem);
          if (targetGem) {
            this.gemMovePhase(targetGem, activeGem);
            return;
          }
        }
      }
      this.nextTick(listen);
    }
    this.nextTick(listen);
  }
  private drawEmphasisGem(timeStamp: number, gem: Gem): void {
    let timePercent = (timeStamp % HELP_ANIMATION_LENGTH) / HELP_ANIMATION_LENGTH;
    if (timePercent <= 0.5) {
      timePercent *= 2
    } else {
      timePercent = (1 - timePercent) * 2
    }
    this.canvasService.drawGem(gem.x, gem.y, gem.name, 0.9 + 0.1 * timePercent);
  }
  private drawHoveredGem(_timeStamp: number, hoverGem: Gem): void {
    this.canvasService.drawGem(hoverGem.x, hoverGem.y, hoverGem.name, 1);
  }
  private drawHand(timeStamp: number, possibleMatches: Gem[]) : void {
    let timePercent = (timeStamp % HAND_ANIMATION_LENGTH) / HAND_ANIMATION_LENGTH;
    if (timePercent <= 0.5) {
      timePercent *= 2
    } else {
      timePercent = (1 - timePercent) * 2
    }
    const diffx = possibleMatches[1].x - possibleMatches[0].x;
    const diffy = possibleMatches[1].y - possibleMatches[0].y;
    this.canvasService.drawHand(possibleMatches[0].x + diffx * timePercent, possibleMatches[0].y + diffy * timePercent);
  }
  private getTargetGem(hoverGem: Gem, activeGem: Gem): Gem | undefined {
    let targetGemX: number, targetGemY: number

    if (Math.abs(hoverGem.x - activeGem.x) > Math.abs(hoverGem.y - activeGem.y)) {
      targetGemX = activeGem.x - Math.sign(activeGem.x - hoverGem.x);
      targetGemY = activeGem.y;
    } else {
      targetGemX = activeGem.x;
      targetGemY = activeGem.y - Math.sign(activeGem.y - hoverGem.y);
    }

    const targetGemName = this.board.getGem(targetGemX, targetGemY);
    if (!targetGemName) {
      this.inputService.clearGems();
      return;
    }
    return { x: targetGemX, y: targetGemY, name: targetGemName }
  }
  private gemMovePhase(targetGem: Gem, activeGem: Gem): void {
    this.board.setGem(activeGem.x, activeGem.y, targetGem.name);
    this.board.setGem(targetGem.x, targetGem.y, activeGem.name);

    const animation = (
      timeFuction: (timePercent: number) => [number, number],
      callback: () => void,
      animationLength: number
    ): void => {
      let startTime: number = 0;
      const animate = (timeStamp: number): void => {
        if (startTime === 0) { startTime = timeStamp; }
        const timeCounter = timeStamp - startTime;
        const timePercent = timeCounter / animationLength;

        const tArr: number[] = timeFuction(timePercent);
        const tPos: number = tArr[0];
        const tRot: number = tArr[1];

        this.canvasService.clear();
        this.canvasService.drawBoard([activeGem, targetGem]);
        this.canvasService.drawGem(targetGem.x + (activeGem.x - targetGem.x) * tPos, targetGem.y + (activeGem.y - targetGem.y) * tPos, targetGem.name, 0.9 * (1 - tRot / 5));
        this.canvasService.drawGem(activeGem.x + (targetGem.x - activeGem.x) * tPos, activeGem.y + (targetGem.y - activeGem.y) * tPos, activeGem.name, 0.9 * (1 + tRot / 10));

        if (timePercent >= 1) {
          callback();
        } else {
          this.nextTick(animate);
        }
      }
      animate(0);
    }

    if (this.board.getMatches().length > 0) {
      animation((timePercent: number): [number, number] => {
        const arr: [number, number] = [0, 0];
        if (timePercent <= 0.5) {
          arr[0] = timePercent;
          arr[1] = timePercent * 2;
        } else {
          arr[0] = timePercent;
          arr[1] = (0.5 - (timePercent - 0.5)) * 2;
        }
        return arr;
      }, () => {
        this.explosionPhase();
      }, 300);
    } else {
      animation((timePercent: number): [number, number] => {
        const arr: [number, number] = [0, 0];
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
        return arr;
      }, () => {
        this.board.setGem(activeGem.x, activeGem.y, activeGem.name);
        this.board.setGem(targetGem.x, targetGem.y, targetGem.name);
        this.playerPhase();
      }, 600);
    }
  }
  private nextTick(fn: (timeStamp: number) => void): void {
    if (!this.active) {
      this.lastFrame = fn;
      return
    }
    requestAnimationFrame(fn);
  }
}
