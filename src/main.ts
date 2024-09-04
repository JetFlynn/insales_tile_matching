import { Board } from './board.ts';
import { CanvasService } from './canvas-service.ts';

const GEMS_INFO = [
  {
    name: "CDEK",
    src: "../images/logo-cdek.svg",
    image: new Image()
  },
  {
    name: "Boxberry",
    src: "../images/logo-boxberry.svg",
    image: new Image()
  },
  {
    name: "Halva",
    src: "../images/logo-halva.svg",
    image: new Image()
  },
  {
    name: "Pochta",
    src: "../images/logo-pochta.svg",
    image: new Image()
  }
]
const BOARD_WIDTH = 5;
const BOARD_HEIGHT = 5;

const board = new Board(BOARD_WIDTH, BOARD_HEIGHT, GEMS_INFO.map(gem => gem.name));
const canvasService = new CanvasService(BOARD_WIDTH, BOARD_HEIGHT, GEMS_INFO);
canvasService.loadAssets().then(() => {
  dropPhase()
})

function playerPhase() {
  requestAnimationFrame(function render() {
    const hoverGemX = canvasService.hoverGemX;
    const hoverGemY = canvasService.hoverGemY;
    const activeGemX = canvasService.activeGemX;
    const activeGemY = canvasService.activeGemY;
    canvasService.clear();
    canvasService.drawBoard(board, [[hoverGemX, hoverGemY]]);
    if (hoverGemX !== undefined && hoverGemY !== undefined) {
      canvasService.drawGem(hoverGemX, hoverGemY, board.getGem(hoverGemX, hoverGemY), 1.2);
    }
    if (canvasService.isGemExchange) {
      canvasService.isGemExchange = false;
      let targetGemX: number, targetGemY: number
      if (Math.abs(hoverGemX - activeGemX) != Math.abs(hoverGemY - activeGemY)) {
        if (Math.abs(hoverGemX - activeGemX) > Math.abs(hoverGemY - activeGemY)) {
          targetGemX = activeGemX - Math.sign(activeGemX - hoverGemX);
          targetGemY = activeGemY;
        } else {
          targetGemX = activeGemX;
          targetGemY = activeGemY - Math.sign(activeGemY - hoverGemY);
        }
        canvasService.hoverGemX = undefined;
        canvasService.hoverGemY = undefined;
        canvasService.activeGemX = undefined;
        canvasService.activeGemY = undefined;

        gemMovePhase(targetGemX, targetGemY, activeGemX, activeGemY);
      } else {
        requestAnimationFrame(render);
      }
    } else {
      requestAnimationFrame(render);
    }
  })
}

function gemMovePhase(targetGemX: number, targetGemY: number, activeGemX: number, activeGemY: number) {
  const firstGem = board.getGem(activeGemX, activeGemY);
  const secondGem = board.getGem(targetGemX, targetGemY);
  board.setGem(activeGemX, activeGemY, secondGem);
  board.setGem(targetGemX, targetGemY, firstGem);
  if (board.getMatches().length > 0) {
    let animationLength = 200;
    let startTime: undefined | number;
    requestAnimationFrame(function render(timeStamp: number) {
      if (!startTime) { startTime = timeStamp; }
      let timePercent = (animationLength + startTime - timeStamp) / animationLength;
      if (timePercent < 0) { timePercent = 0 }

      canvasService.clear();
      canvasService.drawBoard(board, [[activeGemX, activeGemY], [targetGemX, targetGemY]]);
      canvasService.drawGem(activeGemX + (targetGemX - activeGemX) * timePercent, activeGemY + (targetGemY - activeGemY) * timePercent, secondGem);
      canvasService.drawGem(targetGemX + (activeGemX - targetGemX) * timePercent, targetGemY + (activeGemY - targetGemY) * timePercent, firstGem);
      if (timePercent === 0) {
        explosionPhase();
      } else {
        requestAnimationFrame(render);
      }
    })
  } else {
    let animationLength = 200;
    let startTime: undefined | number;
    requestAnimationFrame(function render(timeStamp: number) {
      if (!startTime) { startTime = timeStamp; }
      let timeCounter = timeStamp - startTime;
      let timePercent = timeCounter / animationLength;
      if (timeCounter > animationLength) {
        timePercent = (2 * animationLength - timeCounter) / animationLength;
      }

      canvasService.clear();
      canvasService.drawBoard(board, [[activeGemX, activeGemY], [targetGemX, targetGemY]]);
      canvasService.drawGem(activeGemX + (targetGemX - activeGemX) * timePercent, activeGemY + (targetGemY - activeGemY) * timePercent, firstGem);
      canvasService.drawGem(targetGemX + (activeGemX - targetGemX) * timePercent, targetGemY + (activeGemY - targetGemY) * timePercent, secondGem);

      if (timeCounter >= 2 * animationLength) {
        board.setGem(activeGemX, activeGemY, firstGem);
        board.setGem(targetGemX, targetGemY, secondGem);
        playerPhase();
      } else {
        requestAnimationFrame(render);
      }
    })
  }
}

function dropPhase() {
  board.recalculatePositions();

  let startTime: undefined | number = undefined;
  requestAnimationFrame(function render(timeStamp: number) {
    if (!startTime) { startTime = timeStamp; }
    const timeCounter: number = (timeStamp - startTime) / 150;
    let offset: number = 0.1;
    canvasService.clear();
    let animationFinished: boolean = true;
    for(let x = 0; x < board.width; x++) {
      for(let y = 0; y < board.height; y++) {
        const gem = board.getGem(x, y);
        if (!gem) { continue; }

        let timeline = timeCounter - offset;
        if (timeline < 0) { timeline = 0; }
        let height = board.getGemFallHeight(x, y) - timeline;
        if (height <= 0) { height = 0; }
        else { animationFinished = false; }
        canvasService.drawGem(x, y + height, gem);
        offset += 0.1 * y;
      }
    }
    if (animationFinished) {
      explosionPhase();
    } else {
      requestAnimationFrame(render);
    }
  })
}

function explosionPhase() {
  const matches = board.sliceMatches();
  if (matches.length > 0) {
    canvasService.clear();
    canvasService.drawBoard(board);
    setTimeout(() => {
      dropPhase();
    }, 300);
  } else {
    playerPhase();
  }
}


