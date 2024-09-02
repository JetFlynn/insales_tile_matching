const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const gems = [
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
const gemsAmount = gems.length;
const boardTilesWidth = 5;
const boardTilesHeight = 5;
const positions: object[] = []

main();



function dropPhase(positions: object[]) {
  for(let y = 0; y < boardTilesHeight; y++) {
    for(let x = 0; x < boardTilesWidth; x++) {
      const index = boardTilesWidth * boardTilesHeight + boardTilesWidth * y + x;
      const gem = gems[Math.floor(Math.random() * gemsAmount)];
      positions[index] = gem;
    }
  }

  const gemsFallingHeight: number[] = [];
  for(let x = 0; x < boardTilesWidth; x++) {
    let solidGems:number = 0;
    for(let y = 0; y < boardTilesHeight; y++) {
      const index = boardTilesWidth * y + x;
      if (positions[index]) {
        solidGems += 1;
      } else {
        break;
      }
    }
    let fallingGems = boardTilesHeight - solidGems;
    if (fallingGems === 0) { continue; }

    let counter: number = 1;
    while(fallingGems > 0) {
      const offsetIndex = boardTilesWidth * (solidGems + counter) + x;
      if (positions[offsetIndex]) {
        positions[solidGems * boardTilesWidth + x] = positions[offsetIndex];
        gemsFallingHeight[solidGems * boardTilesWidth + x] = counter;
        fallingGems -= 1;
        solidGems += 1;
      } else {
        counter += 1;
      }
    }
  }
  positions = positions.slice(0, boardTilesWidth * boardTilesHeight);

  let timeCounter: number = 0;
  requestAnimationFrame(function render() {
    let animationFinished: boolean = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let x = 0; x < boardTilesWidth; x++) {
      for(let y = 0; y < boardTilesHeight; y++) {
        const gem = positions[boardTilesWidth * y + x];
        const index = boardTilesWidth * y + x;
        const height = gemsFallingHeight[index] || 0;
        let heightPixels = height * 200 - timeCounter;
        if (heightPixels <= 0) {
          heightPixels = 0;
        } else {
          animationFinished = false;
        }
        const xpixels = x * 200 + 10;
        const ypixels = (boardTilesHeight - 1 - y) * 200 - heightPixels + 10;
        ctx.drawImage(gem.image, xpixels, ypixels, 180, 180);
      }
    }
    if (animationFinished) {
      explosionPhase(positions);
    } else {
      timeCounter += 20;
      requestAnimationFrame(render);
    }
  })
}

function explosionPhase(positions: object[]) {
  const checkForMatches = (indexes) => {
    let gemCount = 1;
    let gemName = positions[indexes[0]]?.name;
    for(let i = 1; i <= indexes.length; i++) {
      if (gemName == positions[indexes[i]]?.name && i != indexes.length) {
        gemCount++;
      } else {
        if (gemCount >= 3) {
          for(let j = 1; j <= gemCount; j++) {
            matches[indexes[i - j]] = gemName;
          }
        };
        gemCount = 1;
        gemName = positions[indexes[i]]?.name;
      }
    }
  }

  const matches: Array<string>[] = []
  const horizontalIndexes: Array<number>[] = []
  const verticalIndexes: Array<number>[] = []

  for(let y = 0; y < boardTilesHeight; y++) {
    horizontalIndexes[y] = [];
    for(let x = 0; x < boardTilesWidth; x++) {
      if (y === 0) { verticalIndexes[x] = []; };
      horizontalIndexes[y][x] = y * boardTilesWidth + x;
      verticalIndexes[x][y] = y * boardTilesWidth + x;
    }
  }
  horizontalIndexes.forEach((indexes) => { checkForMatches(indexes); })
  verticalIndexes.forEach((indexes) => { checkForMatches(indexes); })

  matches.forEach((match, index) => { positions[index] = null; })
  if (matches.length > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let x = 0; x < boardTilesWidth; x++) {
      for(let y = 0; y < boardTilesHeight; y++) {
        const gem = positions[boardTilesWidth * y + x];
        if (!gem) { continue; }
        const xpixels = x * 200 + 10;
        const ypixels = (boardTilesHeight - 1 - y) * 200 + 10;
        ctx.drawImage(gem.image, xpixels, ypixels, 180, 180);
      }
    }
    setTimeout(() => {
      dropPhase(positions);
    }, 1500);
  }
}

async function main() {
  canvas.width = 1000;
  canvas.height = 1000;
  canvas.style.width = '500px';
  canvas.style.height = '500px';


  const loadAssets = function() {
    const promiseList: Promise<void>[] = [];
    gems.forEach((gem) => {
      promiseList.push(new Promise<void>((resolve) => {
        gem.image.src = gem.src;
        gem.image.onload = () => {
          resolve();
        };
      }));
    })
    return Promise.all(promiseList);
  };

  await loadAssets()
  dropPhase(positions);
}

