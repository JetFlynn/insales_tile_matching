export class Board {
  positions: (string | undefined)[]
  gems: string[]
  width: number
  height: number
  constructor(width: number, height: number, gems: string[]) {
    this.width = width;
    this.height = height;
    this.gems = gems;
    this.positions = [];
    this.generateBonusPositions()
  }
  getGemByIndex(index: number) {
    return this.positions[index];
  }
  setGemByIndex(index: number, gem: string) {
    if (index < 0 || index >= this.width * this.height) { return; }
    this.positions[index] = gem;
  }
  getIndex(x: number, y: number) {
    return y * this.width + x;
  }
  getGem(x: number, y: number) {
    return this.positions[y * this.width + x];
  }
  setGem(x: number, y: number, gem: string | undefined) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) { return; }
    this.positions[y * this.width + x] = gem;
  }
  generateBonusPositions() {
    for(let i = 0; i < this.width * this.height; i++) {
      const gem = this.gems[Math.floor(Math.random() * this.gems.length)];
      this.positions[this.width * this.height + i] = gem;
    }
  }
  sliceMatches() : (string | undefined)[] {
    const matches = this.getMatches();
    matches.forEach((_match, index) => { this.positions[index] = undefined; })
    return matches
  }
  getMatches() : (string | undefined)[] {
    const checkForMatches = (indexes: number[]) => {
      let gemCount: number = 1;
      let gemName: string | undefined = this.positions[indexes[0]];
      if (gemName === undefined) { throw new Error('Проверка на совпадения с незаполненными гемами') }

      for(let i = 1; i <= indexes.length; i++) {
        if (gemName == this.positions[indexes[i]] && i != indexes.length) {
          gemCount++;
        } else {
          if (gemCount >= 3) {
            for(let j = 1; j <= gemCount; j++) {
              matches[indexes[i - j]] = gemName;
            }
          };
          gemCount = 1;
          gemName = this.positions[indexes[i]]!;
        }
      }
    }

    const matches: string[] = []
    const horizontalIndexes: Array<number>[] = []
    const verticalIndexes: Array<number>[] = []

    for(let y = 0; y < this.height; y++) {
      horizontalIndexes[y] = [];
      for(let x = 0; x < this.height; x++) {
        if (y === 0) { verticalIndexes[x] = []; };
        horizontalIndexes[y][x] = y * this.width + x;
        verticalIndexes[x][y] = y * this.width + x;
      }
    }
    horizontalIndexes.forEach((indexes) => { checkForMatches(indexes); })
    verticalIndexes.forEach((indexes) => { checkForMatches(indexes); })
    return matches
  }
}

