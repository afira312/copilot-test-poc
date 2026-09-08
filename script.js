const INTERVAL_SECONDS = 60;
const ring = document.querySelector('#progress-ring');
const timerDisplay = document.querySelector('#timer-display');
const timerLabel = document.querySelector('#timer-label');
const statusMessage = document.querySelector('#status-message');
const completedCount = document.querySelector('#completed-count');
const startButton = document.querySelector('#start-button');
const resetButton = document.querySelector('#reset-button');
const circumference = 2 * Math.PI * 132;

let secondsRemaining = INTERVAL_SECONDS;
let completedIntervals = 0;
let timerId = null;
let audioContext = null;
let musicGain = null;
let musicSchedulerId = null;
let nextBeatTime = 0;
let beatStep = 0;

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
  completedIntervals += 1;
  secondsRemaining = INTERVAL_SECONDS;
  playCompletionSound();
  setButton(true);
  timerLabel.textContent = 'Interval complete';
  statusMessage.textContent = 'Next minute is underway.';
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
    stopMusic();
    setButton(false);
    timerLabel.textContent = 'Paused';
    statusMessage.textContent = 'Your minute is paused.';
    return;
  }

  timerLabel.textContent = 'In progress';
  statusMessage.textContent = 'Stay with it until the minute is done.';
  setButton(true);
  startMusic();
  timerId = setInterval(tick, 1000);
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  stopMusic();
  secondsRemaining = INTERVAL_SECONDS;
  setButton(false);
  timerLabel.textContent = 'Ready when you are';
  statusMessage.textContent = 'Press start to begin your next minute.';
  render();
}

function stopMusic() {
  if (musicSchedulerId) clearInterval(musicSchedulerId);
  musicSchedulerId = null;
  if (!musicGain || !audioContext) return;
  const fadeTime = audioContext.currentTime + 0.25;
  musicGain.gain.cancelScheduledValues(audioContext.currentTime);
  musicGain.gain.linearRampToValueAtTime(0, fadeTime);
}

function playKick(time) {
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.frequency.setValueAtTime(150, time);
  oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.12);
  volume.gain.setValueAtTime(0.8, time);
  volume.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  oscillator.connect(volume).connect(musicGain);
  oscillator.start(time);
  oscillator.stop(time + 0.2);
}

function playSnare(time) {
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.12, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let sample = 0; sample < noiseData.length; sample += 1) noiseData[sample] = Math.random() * 2 - 1;
  const noise = audioContext.createBufferSource();
  const volume = audioContext.createGain();
  noise.buffer = noiseBuffer;
  volume.gain.setValueAtTime(0.18, time);
  volume.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  noise.connect(volume).connect(musicGain);
  noise.start(time);
  noise.stop(time + 0.13);
}

function playHiHat(time) {
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 4200;
  volume.gain.setValueAtTime(0.035, time);
  volume.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
  oscillator.connect(volume).connect(musicGain);
  oscillator.start(time);
  oscillator.stop(time + 0.04);
}

function playBass(time, frequency) {
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(0.08, time);
  volume.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
  oscillator.connect(volume).connect(musicGain);
  oscillator.start(time);
  oscillator.stop(time + 0.24);
}

function scheduleBeat(time, step) {
  if (step % 4 === 0 || step % 4 === 2) playKick(time);
  if (step % 4 === 1 || step % 4 === 3) playSnare(time);
  playHiHat(time);
  if (step % 2 === 0) playBass(time, step % 8 === 0 ? 98 : 73.42);
}

function playCompletionSound() {
  if (!audioContext || !musicGain) return;
  const startTime = audioContext.currentTime;
  [523.25, 783.99].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const noteStart = startTime + index * 0.16;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0.001, noteStart);
    volume.gain.exponentialRampToValueAtTime(0.3, noteStart + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);
    oscillator.connect(volume).connect(audioContext.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.5);
  });
}

function startMusic() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  audioContext.resume();
  musicGain = audioContext.createGain();
  musicGain.gain.setValueAtTime(0, audioContext.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.55, audioContext.currentTime + 0.5);
  musicGain.connect(audioContext.destination);
  nextBeatTime = audioContext.currentTime + 0.05;
  beatStep = 0;
  const secondsPerBeat = 60 / 128 / 2;
  musicSchedulerId = setInterval(() => {
    while (nextBeatTime < audioContext.currentTime + 0.1) {
      scheduleBeat(nextBeatTime, beatStep);
      nextBeatTime += secondsPerBeat;
      beatStep = (beatStep + 1) % 16;
    }
  }, 25);
}

startButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', resetTimer);
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    toggleTimer();
  }
});

render();