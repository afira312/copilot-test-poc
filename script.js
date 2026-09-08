const INTERVAL_SECONDS = 60;
const REST_SECONDS = 10;
const WORKOUT_PATTERNS = [
  { name: 'Raga Rise', bpm: 128, bass: [98, 73.42, 98, 82.41, 110, 82.41, 98, 73.42], melody: [293.66, 329.63, 369.99, 440, 493.88, 440, 369.99, 329.63], chords: [[196, 246.94, 293.66], [220, 277.18, 329.63], [196, 246.94, 293.66], [164.81, 196, 246.94]] },
  { name: 'Desi Sprint', bpm: 136, bass: [110, 110, 82.41, 98, 110, 123.47, 98, 82.41], melody: [329.63, 392, 440, 523.25, 587.33, 523.25, 440, 392], chords: [[220, 261.63, 329.63], [246.94, 293.66, 369.99], [196, 246.94, 293.66], [220, 277.18, 329.63]] },
  { name: 'Monsoon Flow', bpm: 122, bass: [73.42, 87.31, 98, 87.31, 73.42, 98, 110, 98], melody: [293.66, 329.63, 392, 440, 493.88, 440, 392, 329.63], chords: [[146.83, 220, 293.66], [174.61, 261.63, 349.23], [196, 246.94, 293.66], [174.61, 220, 293.66]] },
  { name: 'Festival Charge', bpm: 142, bass: [130.81, 130.81, 98, 110, 130.81, 146.83, 110, 123.47], melody: [392, 493.88, 587.33, 659.25, 783.99, 659.25, 587.33, 493.88], chords: [[261.63, 329.63, 392], [293.66, 369.99, 440], [246.94, 329.63, 392], [261.63, 329.63, 392]] },
  { name: 'Victory Groove', bpm: 132, bass: [98, 116.54, 130.81, 116.54, 98, 87.31, 110, 130.81], melody: [329.63, 392, 493.88, 587.33, 659.25, 587.33, 493.88, 392], chords: [[196, 246.94, 293.66], [233.08, 293.66, 349.23], [261.63, 329.63, 392], [220, 277.18, 329.63]] },
];
const ring = document.querySelector('#progress-ring');
const timerDisplay = document.querySelector('#timer-display');
const timerLabel = document.querySelector('#timer-label');
const timerUnit = document.querySelector('#timer-unit');
const statusMessage = document.querySelector('#status-message');
const completedCount = document.querySelector('#completed-count');
const startButton = document.querySelector('#start-button');
const resetButton = document.querySelector('#reset-button');
const circumference = 2 * Math.PI * 132;

let secondsRemaining = INTERVAL_SECONDS;
let completedIntervals = 0;
let timerId = null;
let timerPhase = 'ready';
let currentPattern = 0;
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
  timerUnit.textContent = timerPhase === 'rest' ? 'seconds to go' : 'minutes';
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
  timerPhase = 'rest';
  stopMusic();
  playCompletionSound();
  secondsRemaining = REST_SECONDS;
  setButton(true);
  timerLabel.textContent = 'Great work';
  statusMessage.textContent = '10-second recovery. Next rep starts automatically.';
  render();
}

function startNextInterval() {
  timerPhase = 'work';
  currentPattern = completedIntervals % WORKOUT_PATTERNS.length;
  secondsRemaining = INTERVAL_SECONDS;
  setButton(true);
  timerLabel.textContent = `Rep ${completedIntervals + 1}`;
  statusMessage.textContent = `${WORKOUT_PATTERNS[currentPattern].name} · track ${currentPattern + 1} of 5.`;
  startMusic(currentPattern);
  render();
}

function tick() {
  secondsRemaining -= 1;
  if (secondsRemaining <= 0) {
    if (timerPhase === 'work') finishInterval();
    else startNextInterval();
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

  if (timerPhase === 'ready') {
    timerPhase = 'work';
    currentPattern = 0;
    timerLabel.textContent = 'Rep 1';
    statusMessage.textContent = `${WORKOUT_PATTERNS[currentPattern].name} · track 1 of 5.`;
    startMusic(currentPattern);
  } else if (timerPhase === 'work') {
    timerLabel.textContent = `Rep ${completedIntervals + 1}`;
    statusMessage.textContent = `${WORKOUT_PATTERNS[currentPattern].name} · track ${currentPattern + 1} of 5.`;
    startMusic(currentPattern);
  } else {
    timerLabel.textContent = 'Recovery';
    statusMessage.textContent = '10-second recovery. Next rep starts automatically.';
  }
  setButton(true);
  timerId = setInterval(tick, 1000);
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  stopMusic();
  timerPhase = 'ready';
  currentPattern = 0;
  completedIntervals = 0;
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

function playMelodyNote(time, frequency) {
  [frequency, frequency * 2].forEach((noteFrequency, index) => {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = index === 0 ? 'triangle' : 'sawtooth';
    oscillator.frequency.setValueAtTime(noteFrequency * 1.04, time);
    oscillator.frequency.exponentialRampToValueAtTime(noteFrequency, time + 0.16);
    volume.gain.setValueAtTime(0.001, time);
    volume.gain.exponentialRampToValueAtTime(index === 0 ? 0.1 : 0.025, time + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
    oscillator.connect(volume).connect(musicGain);
    oscillator.start(time);
    oscillator.stop(time + 0.35);
  });
}

function playTabla(time, high) {
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(high ? 230 : 130, time);
  oscillator.frequency.exponentialRampToValueAtTime(high ? 120 : 70, time + 0.08);
  volume.gain.setValueAtTime(0.001, time);
  volume.gain.exponentialRampToValueAtTime(0.1, time + 0.008);
  volume.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  oscillator.connect(volume).connect(musicGain);
  oscillator.start(time);
  oscillator.stop(time + 0.14);
}

function playChord(time, frequencies) {
  frequencies.forEach((frequency) => {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0.001, time);
    volume.gain.exponentialRampToValueAtTime(0.035, time + 0.08);
    volume.gain.exponentialRampToValueAtTime(0.001, time + 0.9);
    oscillator.connect(volume).connect(musicGain);
    oscillator.start(time);
    oscillator.stop(time + 1);
  });
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

function scheduleBeat(time, step, pattern) {
  playMelodyNote(time, pattern.melody[step % pattern.melody.length]);
  if (step % 2 === 0) playBass(time, pattern.bass[step / 2]);
  if (step % 4 === 0) playChord(time, pattern.chords[(step / 4) % pattern.chords.length]);
  if (step % 2 === 0) playTabla(time, step % 4 === 0);
}

function playCompletionSound() {
  if (!audioContext || !musicGain) return;
  const startTime = audioContext.currentTime;
  [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const noteStart = startTime + index * 0.16;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0.001, noteStart);
    volume.gain.exponentialRampToValueAtTime(0.45, noteStart + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);
    oscillator.connect(volume).connect(audioContext.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.5);
  });
}

function startMusic(patternIndex) {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  audioContext.resume();
  const pattern = WORKOUT_PATTERNS[patternIndex];
  musicGain = audioContext.createGain();
  musicGain.gain.setValueAtTime(0, audioContext.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.38, audioContext.currentTime + 0.5);
  musicGain.connect(audioContext.destination);
  nextBeatTime = audioContext.currentTime + 0.05;
  beatStep = 0;
  const secondsPerBeat = 60 / pattern.bpm / 2;
  musicSchedulerId = setInterval(() => {
    while (nextBeatTime < audioContext.currentTime + 0.1) {
      scheduleBeat(nextBeatTime, beatStep, pattern);
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