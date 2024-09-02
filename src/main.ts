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

}

function dropPhase() {
  board.recalculatePositions();

  let timeCounter: number = 0;
  requestAnimationFrame(function render() {
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
      timeCounter += 0.1;
      requestAnimationFrame(render);
    }
  })
}

function explosionPhase() {
  const matches = board.sliceMatches();
  if (matches.length > 0) {
    canvasService.clear();
    for(let x = 0; x < board.width; x++) {
      for(let y = 0; y < board.height; y++) {
        const gem = board.getGem(x, y);
        if (!gem) { continue; }

        canvasService.drawGem(x, y, gem);
      }
    }
    setTimeout(() => {
      dropPhase();
    }, 1500);
  } else {
    playerPhase();
  }
}


