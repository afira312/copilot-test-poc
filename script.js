const INTERVAL_SECONDS = 60;
const REST_SECONDS = 10;
const WORKOUT_PATTERNS = [
  { name: 'Neon Rush', bpm: 132, bass: [65.41, 65.41, 77.78, 87.31, 65.41, 65.41, 98, 87.31], melody: [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25, 880], chords: [[261.63, 329.63, 392], [233.08, 293.66, 349.23], [196, 261.63, 329.63], [220, 293.66, 349.23]] },
  { name: 'Afterglow', bpm: 126, bass: [73.42, 73.42, 87.31, 98, 73.42, 87.31, 110, 98], melody: [440, 493.88, 587.33, 659.25, 587.33, 493.88, 440, 392], chords: [[220, 277.18, 329.63], [246.94, 293.66, 369.99], [196, 246.94, 293.66], [261.63, 329.63, 392]] },
  { name: 'Pulse Check', bpm: 138, bass: [55, 55, 65.41, 73.42, 55, 65.41, 82.41, 73.42], melody: [392, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 440], chords: [[196, 246.94, 293.66], [220, 277.18, 329.63], [174.61, 220, 261.63], [196, 246.94, 329.63]] },
  { name: 'Main Character', bpm: 140, bass: [82.41, 82.41, 98, 110, 82.41, 98, 123.47, 110], melody: [659.25, 783.99, 880, 1046.5, 880, 783.99, 659.25, 587.33], chords: [[329.63, 392, 493.88], [293.66, 369.99, 440], [261.63, 329.63, 392], [329.63, 392, 493.88]] },
  { name: 'Last Set', bpm: 134, bass: [61.74, 61.74, 73.42, 82.41, 61.74, 73.42, 98, 87.31], melody: [493.88, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33], chords: [[246.94, 293.66, 369.99], [220, 277.18, 329.63], [261.63, 329.63, 392], [293.66, 369.99, 440]] },
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

function playKick(time) {
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.frequency.setValueAtTime(150, time);
  oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.12);
  volume.gain.setValueAtTime(0.001, time);
  volume.gain.exponentialRampToValueAtTime(0.28, time + 0.008);
  volume.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  oscillator.connect(volume).connect(musicGain);
  oscillator.start(time);
  oscillator.stop(time + 0.22);
}

function playClap(time) {
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let sample = 0; sample < noiseData.length; sample += 1) noiseData[sample] = Math.random() * 2 - 1;
  const noise = audioContext.createBufferSource();
  const volume = audioContext.createGain();
  noise.buffer = noiseBuffer;
  volume.gain.setValueAtTime(0.001, time);
  volume.gain.exponentialRampToValueAtTime(0.12, time + 0.006);
  volume.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  noise.connect(volume).connect(musicGain);
  noise.start(time);
  noise.stop(time + 0.12);
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
  if (step % 4 === 0 || step % 4 === 2) playKick(time);
  if (step % 4 === 1 || step % 4 === 3) playClap(time);
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