import Match3Preloader from '../src/game-manager'

let match3: Match3Preloader | null = null;

const startButton = document.getElementById('startButton') as HTMLButtonElement;
const stopButton = document.getElementById('stopButton') as HTMLButtonElement;
const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
const resumeButton = document.getElementById('resumeButton') as HTMLButtonElement;
const scoreElement = document.getElementById('score') as HTMLDivElement;

function updateScore(newValue: number) {
  scoreElement.textContent = `Score: ${newValue}`;
}

function createGame() {
  match3 = new Match3Preloader('#gameCanvas', { score: 0 }, {
    scoreUpdate: updateScore
  });
}

startButton.addEventListener('click', () => {
  if (!match3) {
    createGame();
  }
  match3?.start();
  startButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false;
  resumeButton.disabled = true;
});

stopButton.addEventListener('click', () => {
  match3?.stop();
  match3 = null;
  updateScore(0);
  startButton.disabled = false;
  stopButton.disabled = true;
  pauseButton.disabled = true;
  resumeButton.disabled = true;
});

pauseButton.addEventListener('click', () => {
  match3?.pause();
  startButton.disabled = false;
  stopButton.disabled = false;
  pauseButton.disabled = true;
  resumeButton.disabled = false;
});

resumeButton.addEventListener('click', () => {
  match3?.resume();
  startButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false;
  resumeButton.disabled = true;
});

// Initial state
stopButton.disabled = true;
  pauseButton.disabled = true;
  resumeButton.disabled = true;
