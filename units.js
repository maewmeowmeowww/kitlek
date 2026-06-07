const startButton = document.querySelector("#startButton");
const answerForm = document.querySelector("#answerForm");
const answerInput = document.querySelector("#answerInput");
const answerButton = answerForm.querySelector('button[type="submit"]');
const problemText = document.querySelector("#problemText");
const resultText = document.querySelector("#resultText");
const questionCount = document.querySelector("#questionCount");
const summaryText = document.querySelector("#summaryText");
const timerText = document.querySelector("#timerText");
const typeInputs = [...document.querySelectorAll('input[name="type"]')];

const totalQuestions = 20;
let currentQuestion = 1;
let currentAnswer = null;
let correctCount = 0;
let missedCurrentQuestion = false;
let activeTypes = [];
let startedAt = null;
let elapsedSeconds = 0;
let timerId = null;

const typeLabels = {
  volume: "ปริมาตร: L, ml",
  weight: "น้ำหนัก: g, kg, t",
  length: "ความยาว: mm, cm, m, km",
  time: "เวลา: s, min, h, d"
};

const unitSets = {
  volume: [
    { from: "L", to: "ml", value: () => randomInt(1, 20), factor: 1000 },
    { from: "ml", to: "L", value: () => randomInt(1, 99) * 100, factor: 0.001 }
  ],
  weight: [
    { from: "kg", to: "g", value: () => randomInt(1, 50), factor: 1000 },
    { from: "g", to: "kg", value: () => randomInt(1, 99) * 100, factor: 0.001 },
    { from: "t", to: "kg", value: () => randomInt(1, 20), factor: 1000 },
    { from: "kg", to: "t", value: () => randomInt(1, 99) * 100, factor: 0.001 }
  ],
  length: [
    { from: "cm", to: "mm", value: () => randomInt(1, 90), factor: 10 },
    { from: "mm", to: "cm", value: () => randomInt(10, 990), factor: 0.1 },
    { from: "m", to: "cm", value: () => randomInt(1, 90), factor: 100 },
    { from: "cm", to: "m", value: () => randomInt(10, 990), factor: 0.01 },
    { from: "km", to: "m", value: () => randomInt(1, 20), factor: 1000 },
    { from: "m", to: "km", value: () => randomInt(100, 9900), factor: 0.001 }
  ],
  time: [
    { from: "min", to: "s", value: () => randomInt(1, 60), factor: 60 },
    { from: "s", to: "min", value: () => randomInt(1, 120) * 30, factor: 1 / 60 },
    { from: "h", to: "min", value: () => randomInt(1, 24), factor: 60 },
    { from: "min", to: "h", value: () => randomInt(1, 96) * 15, factor: 1 / 60 },
    { from: "d", to: "h", value: () => randomInt(1, 14), factor: 24 },
    { from: "h", to: "d", value: () => randomInt(1, 56) * 6, factor: 1 / 24 }
  ]
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectedTypes() {
  return typeInputs.filter((input) => input.checked).map((input) => input.value);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function updateTimer() {
  if (startedAt === null) return;
  elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  timerText.textContent = `เวลา ${formatTime(elapsedSeconds)}`;
}

function startTimer() {
  window.clearInterval(timerId);
  startedAt = Date.now();
  elapsedSeconds = 0;
  updateTimer();
  timerId = window.setInterval(updateTimer, 1000);
}

function stopTimer() {
  updateTimer();
  window.clearInterval(timerId);
  timerId = null;
}

function makeQuestion(type) {
  const choices = unitSets[type];
  const rule = choices[randomInt(0, choices.length - 1)];
  const value = rule.value();
  const answer = Number((value * rule.factor).toFixed(6));
  return {
    text: `${value} ${rule.from} = ? ${rule.to}`,
    answer
  };
}

function parseDecimalAnswer(value) {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return NaN;
  return Number(normalized);
}

function updateProgress() {
  questionCount.textContent = `ข้อที่ ${currentQuestion} / ${totalQuestions}`;
}

function showSummary() {
  summaryText.hidden = false;
  summaryText.innerHTML = `
    <strong>เนื้อหาที่ออกโจทย์</strong>
    ${activeTypes.map((type) => typeLabels[type]).join("<br>")}
    <br>จำนวนข้อ: ${totalQuestions} ข้อ
    <br>เวลา: ${formatTime(elapsedSeconds)}
  `;
}

function hideSummary() {
  summaryText.hidden = true;
  summaryText.textContent = "";
}

function nextQuestion() {
  const types = activeTypes.length > 0 ? activeTypes : selectedTypes();

  if (types.length === 0) {
    problemText.textContent = "? = ?";
    resultText.textContent = "เลือกชนิดของโจทย์ก่อน";
    resultText.className = "is-wrong";
    return;
  }

  if (currentQuestion > totalQuestions) {
    stopTimer();
    problemText.textContent = `${correctCount} / ${totalQuestions}`;
    resultText.textContent = "คะแนน";
    resultText.className = "is-correct";
    answerInput.value = "";
    showSummary();
    return;
  }

  const type = types[randomInt(0, types.length - 1)];
  const question = makeQuestion(type);
  currentAnswer = question.answer;
  missedCurrentQuestion = false;
  problemText.textContent = question.text;
  resultText.textContent = "กำลังทำ";
  resultText.className = "";
  hideSummary();
  answerInput.value = "";
  updateProgress();
  answerInput.focus({ preventScroll: true });
}

function startPractice() {
  activeTypes = selectedTypes();
  currentQuestion = 1;
  correctCount = 0;
  missedCurrentQuestion = false;
  if (activeTypes.length > 0) {
    startTimer();
  }
  nextQuestion();
}

startButton.addEventListener("click", startPractice);

answerButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
});

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentAnswer === null || currentQuestion > totalQuestions) return;
  answerInput.focus({ preventScroll: true });

  const userAnswer = parseDecimalAnswer(answerInput.value);
  const isCorrect = answerInput.value.trim() !== "" && Math.abs(userAnswer - currentAnswer) < 0.000001;
  resultText.textContent = isCorrect ? "ถูกต้อง" : "ยังไม่ถูก ลองอีกครั้ง";
  resultText.className = isCorrect ? "is-correct" : "is-wrong";

  if (!isCorrect) {
    missedCurrentQuestion = true;
    answerInput.select();
    return;
  }

  if (!missedCurrentQuestion) {
    correctCount += 1;
  }
  currentQuestion += 1;
  window.setTimeout(nextQuestion, 350);
});

nextQuestion();
