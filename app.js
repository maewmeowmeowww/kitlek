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

let currentQuestion = 1;
const totalQuestions = 20;
let currentAnswer = null;
let correctCount = 0;
let missedCurrentQuestion = false;
let activeTypes = [];
let startedAt = null;
let elapsedSeconds = 0;
let timerId = null;

const typeLabels = {
  "add-2": "บวกเลข 2 หลัก",
  "sub-2": "ลบเลข 2 หลัก",
  "mul-2x1": "คูณ 2 หลัก × 1 หลัก",
  "div-2x1": "หาร 2 หลัก ÷ 1 หลัก ไม่มีเศษ"
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

function makeQuestion(type) {
  if (type === "add-2") {
    const a = randomInt(10, 89);
    const b = randomInt(10, 99 - a);
    return { text: `${a} + ${b} = ?`, answer: a + b };
  }

  if (type === "sub-2") {
    let a = randomInt(10, 99);
    let b = randomInt(10, 99);
    if (b > a) [a, b] = [b, a];
    return { text: `${a} - ${b} = ?`, answer: a - b };
  }

  if (type === "mul-2x1") {
    const a = randomInt(10, 99);
    const b = randomInt(1, 9);
    return { text: `${a} × ${b} = ?`, answer: a * b };
  }

  const divisor = randomInt(2, 9);
  const answer = randomInt(Math.ceil(10 / divisor), Math.floor(99 / divisor));
  const dividend = divisor * answer;
  return { text: `${dividend} ÷ ${divisor} = ?`, answer };
}

function updateProgress() {
  questionCount.textContent = `ข้อที่ ${currentQuestion} / ${totalQuestions}`;
}

function nextQuestion() {
  const types = activeTypes.length > 0 ? activeTypes : selectedTypes();

  if (types.length === 0) {
    problemText.textContent = "? + ? = ?";
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

  const userAnswer = Number(answerInput.value);
  const isCorrect = answerInput.value.trim() !== "" && userAnswer === currentAnswer;
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
