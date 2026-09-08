const INTERVAL_SECONDS = 60;
const ring = document.querySelector('#progress-ring');
const timerDisplay = document.querySelector('#timer-display');
const timerLabel = document.querySelector('#timer-label');
const statusMessage = document.querySelector('#status-message');
const completedCount = document.querySelector('#completed-count');
const startButton = document.querySelector('#start-button');
const resetButton = document.querySelector('#reset-button');
const musicButton = document.querySelector('#music-button');
const circumference = 2 * Math.PI * 132;

let secondsRemaining = INTERVAL_SECONDS;
let completedIntervals = 0;
let timerId = null;
let audioContext = null;
let musicGain = null;
let musicNodes = [];

ring.style.strokeDasharray = circumference;

function render() {
  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const seconds = String(secondsRemaining % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
  timerDisplay.dateTime = `PT${secondsRemaining}S`;
  completedCount.textContent = completedIntervals;
  const progress = (INTERVAL_SECONDS - secondsRemaining) / INTERVAL_SECONDS;
  ring.style.strokeDashoffset = circumference * (1 - progress);
}

function setButton(isRunning) {
  startButton.querySelector('.button-icon').textContent = isRunning ? 'Ⅱ' : '▶';
  startButton.querySelector('span:last-child').textContent = isRunning ? 'Pause interval' : 'Start interval';
}

function finishInterval() {
  clearInterval(timerId);
  timerId = null;
  completedIntervals += 1;
  secondsRemaining = INTERVAL_SECONDS;
  setButton(false);
  timerLabel.textContent = 'Interval complete';
  statusMessage.textContent = 'Nice work. Ready for another minute.';
  render();
}

function tick() {
  secondsRemaining -= 1;
  if (secondsRemaining <= 0) {
    finishInterval();
    return;
  }
  render();
}

function toggleTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    setButton(false);
    timerLabel.textContent = 'Paused';
    statusMessage.textContent = 'Your minute is paused.';
    return;
  }

  timerLabel.textContent = 'In progress';
  statusMessage.textContent = 'Stay with it until the minute is done.';
  setButton(true);
  timerId = setInterval(tick, 1000);
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  secondsRemaining = INTERVAL_SECONDS;
  setButton(false);
  timerLabel.textContent = 'Ready when you are';
  statusMessage.textContent = 'Press start to begin your next minute.';
  render();
}

function setMusicButton(isPlaying) {
  musicButton.setAttribute('aria-pressed', String(isPlaying));
  musicButton.querySelector('span:last-child').textContent = isPlaying ? 'Ambient sound on' : 'Ambient sound off';
}

function stopMusic() {
  if (!musicGain || !audioContext) return;
  const fadeTime = audioContext.currentTime + 0.25;
  musicGain.gain.cancelScheduledValues(audioContext.currentTime);
  musicGain.gain.linearRampToValueAtTime(0, fadeTime);
  musicNodes.forEach((node) => node.stop(fadeTime));
  musicNodes = [];
  setMusicButton(false);
}

function startMusic() {
  audioContext = audioContext || new AudioContext();
  musicGain = audioContext.createGain();
  musicGain.gain.setValueAtTime(0, audioContext.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.035, audioContext.currentTime + 1.2);
  musicGain.connect(audioContext.destination);

  [196, 246.94, 293.66].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const voiceGain = audioContext.createGain();
    oscillator.type = index === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    voiceGain.gain.value = index === 0 ? 0.65 : 0.28;
    oscillator.connect(voiceGain).connect(musicGain);
    oscillator.start();
    musicNodes.push(oscillator);
  });
  setMusicButton(true);
}

function toggleMusic() {
  if (musicNodes.length > 0) {
    stopMusic();
    return;
  }
  startMusic();
}

startButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', resetTimer);
musicButton.addEventListener('click', toggleMusic);
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    toggleTimer();
  }
});

render();