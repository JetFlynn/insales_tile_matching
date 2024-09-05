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
    const hoverGemX: number | undefined = canvasService.hoverGemX;
    const hoverGemY: number | undefined = canvasService.hoverGemY;
    const activeGemX: number | undefined = canvasService.activeGemX;
    const activeGemY: number | undefined = canvasService.activeGemY;
    canvasService.clear();
    const exceptions = hoverGemX != undefined && hoverGemY != undefined ? [[hoverGemX, hoverGemY]] : undefined;
    canvasService.drawBoard(board, exceptions);
    if (hoverGemX !== undefined && hoverGemY !== undefined) {
      const gemName = board.getGem(hoverGemX, hoverGemY)
      if (gemName !== undefined) {
        canvasService.drawGem(hoverGemX, hoverGemY, gemName, 1);
      }
    }
    if (canvasService.isGemExchange && hoverGemX !== undefined && hoverGemY !== undefined && activeGemX !== undefined && activeGemY !== undefined) {
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
        canvasService.isGemExchange = false;

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
  if (firstGem === undefined || secondGem === undefined) {
    playerPhase();
    return;
  }
  board.setGem(activeGemX, activeGemY, secondGem);
  board.setGem(targetGemX, targetGemY, firstGem);

  const animation = (timeFuction: Function, collback: Function, animationLength: number) => {
    let startTime: number | undefined = undefined;
    requestAnimationFrame(function render(timeStamp: number) {
      if (!startTime) { startTime = timeStamp; }
      let timeCounter = timeStamp - startTime;
      let timePercent = timeCounter / animationLength;

      const tArr: number[] = timeFuction(timePercent);
      let tPos: number = tArr[0];
      let tRot: number = tArr[1];

      canvasService.clear();
      canvasService.drawBoard(board, [[activeGemX, activeGemY], [targetGemX, targetGemY]]);
      canvasService.drawGem(targetGemX + (activeGemX - targetGemX) * tPos, targetGemY + (activeGemY - targetGemY) * tPos, secondGem, 0.9 * (1 - tRot / 5));
      canvasService.drawGem(activeGemX + (targetGemX - activeGemX) * tPos, activeGemY + (targetGemY - activeGemY) * tPos, firstGem, 0.9 * (1 + tRot / 10));

      if (timePercent >= 1) {
        collback();
      } else {
        requestAnimationFrame(render);
      }
    })
  }

  if (board.getMatches().length > 0) {
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
      explosionPhase();
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
      board.setGem(activeGemX, activeGemY, firstGem);
      board.setGem(targetGemX, targetGemY, secondGem);
      playerPhase();
    }, 600);
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
  const matches = board.getMatches();
  if (matches.length > 0) {
    let animationLength = 300;
    let startTime: undefined | number;
    requestAnimationFrame(function render(timeStamp: number) {
      if (!startTime) { startTime = timeStamp; }
      let timePercent = (animationLength + startTime - timeStamp) / animationLength;
      if (timePercent < 0) { timePercent = 0 }

      canvasService.clear();
      canvasService.drawBoard(board, matches);
      matches.forEach((match) => {
        const gem = board.getGem(match[0], match[1])
        if (!gem) { return; }
        canvasService.drawGem(match[0], match[1], gem, 0.9 * timePercent);
      })

      if (timePercent === 0) {
        board.sliceMatches();
        dropPhase();
      } else {
        requestAnimationFrame(render);
      }
    })
  } else {
    playerPhase();
  }
}


