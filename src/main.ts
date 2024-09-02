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
  board.generateBonusPositions();

  const gemsFallingHeight: number[] = [];
  for(let x = 0; x < board.width; x++) {
    let solidGems:number = 0;
    for(let y = 0; y < board.height; y++) {
      if (board.getGem(x, y)) {
        solidGems += 1;
      } else {
        break;
      }
    }
    let fallingGems = board.height - solidGems;
    if (fallingGems === 0) { continue; }

    let counter: number = 1;
    while(fallingGems > 0) {
      const fallingGem = board.getGem(x, solidGems + counter)
      if (fallingGem) {
        board.setGem(x, solidGems, fallingGem)
        gemsFallingHeight[solidGems * board.width + x] = counter;
        fallingGems -= 1;
        solidGems += 1;
      } else {
        counter += 1;
      }
    }
  }

  let timeCounter: number = 0;
  requestAnimationFrame(function render() {
    canvasService.clear();
    let animationFinished: boolean = true;
    for(let x = 0; x < board.width; x++) {
      for(let y = 0; y < board.height; y++) {
        const gem = board.getGem(x, y);
        if (!gem) { continue; }

        const index = board.getIndex(x, y);
        let height = (gemsFallingHeight[index] || 0) - timeCounter;
        if (height <= 0) { height = 0; }
        else { animationFinished = false; }
        canvasService.drawGem(x, y + height, gem);
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
  console.log(matches)
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


