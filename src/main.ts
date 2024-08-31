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
  const newGemsPositions: object[] = [];
  for(let y = 0; y < boardTilesHeight; y++) {
    for(let x = 0; x < boardTilesWidth; x++) {
      const index = boardTilesWidth * y + x;
      if (positions[index]) { continue; }
      const gem = gems[Math.floor(Math.random() * gemsAmount)];
      positions[index] = gem;
      newGemsPositions.push(gem);
    }
  }

  let counter = 1000;
  requestAnimationFrame(function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    newGemsPositions.forEach((gem, index) => {
      const offset = counter + index * 100;
      if (offset <= 0) {
        const x = (index % boardTilesWidth) * 200 + 10;
        const y = (boardTilesWidth - 1 - Math.floor(index / boardTilesWidth)) * 200 + 10;
        ctx.drawImage(gem.image, x, y, 180, 180);
        return;
      }
      const x = (index % boardTilesWidth) * 200 + 10;
      const y = (boardTilesWidth - 1 - Math.floor(index / boardTilesWidth)) * 200 + 10 - offset;
      ctx.drawImage(gem.image, x, y, 180, 180);
    })
    counter -= 50;
    if (counter + boardTilesWidth * boardTilesHeight * 100 > 0) {
      requestAnimationFrame(render);
    } else {
      explosionPhase(positions);
    }
  })
}

function explosionPhase(positions: object[]) {
  const checkForMatches = (indexes) => {
    let gemCount = 1;
    let gemName = positions[indexes[0]]?.name;
    console.log(indexes[0], 0, gemCount, gemName)
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
      console.log(indexes[i], gemCount, gemName)
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
    console.log('next round', positions)
    dropPhase(positions);
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

