const startButton = document.querySelector("#startButton");
const answerForm = document.querySelector("#answerForm");
const answerButton = answerForm.querySelector('button[type="submit"]');
const problemText = document.querySelector("#problemText");
const resultText = document.querySelector("#resultText");
const questionCount = document.querySelector("#questionCount");
const summaryText = document.querySelector("#summaryText");
const timerText = document.querySelector("#timerText");
const typeInputs = [...document.querySelectorAll('input[name="type"]')];

const totalQuestions = 10;
let currentQuestion = 1;
let currentProblem = null;
let correctCount = 0;
let missedCurrentQuestion = false;
let activeTypes = [];
let startedAt = null;
let elapsedSeconds = 0;
let timerId = null;

const typeLabels = {
  "frac-add": "บวกเศษส่วน ต้องทำส่วนให้เท่ากัน",
  "frac-sub": "ลบเศษส่วน ต้องทำส่วนให้เท่ากัน",
  "mixed-add": "บวกจำนวนคละ",
  "mixed-sub": "ลบจำนวนคละ"
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function compareFractions(left, right) {
  return left.n * right.d - right.n * left.d;
}

function toImproper(mixed) {
  return { n: mixed.whole * mixed.d + mixed.n, d: mixed.d };
}

function properFraction() {
  const d = randomInt(2, 9);
  return { n: randomInt(1, d - 1), d };
}

function fractionPair() {
  let left = properFraction();
  let right = properFraction();
  while (left.d === right.d) {
    right = properFraction();
  }
  return [left, right];
}

function mixedNumber() {
  const fraction = properFraction();
  return {
    whole: randomInt(1, 5),
    n: fraction.n,
    d: fraction.d
  };
}

function formatFraction(fraction) {
  return `${fraction.n}/${fraction.d}`;
}

function formatMixed(mixed) {
  return `${mixed.whole} ${mixed.n}/${mixed.d}`;
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

function makeProblem(type) {
  let left;
  let right;
  let text;
  let operator;

  if (type === "frac-add" || type === "frac-sub") {
    [left, right] = fractionPair();
    operator = type === "frac-add" ? "+" : "-";
    text = `${formatFraction(left)} ${operator} ${formatFraction(right)}`;
  } else {
    const leftMixed = mixedNumber();
    const rightMixed = mixedNumber();
    left = toImproper(leftMixed);
    right = toImproper(rightMixed);
    operator = type === "mixed-add" ? "+" : "-";
    text = `${formatMixed(leftMixed)} ${operator} ${formatMixed(rightMixed)}`;
  }

  const commonDenominator = lcm(left.d, right.d);
  const commonLeft = left.n * (commonDenominator / left.d);
  const commonRight = right.n * (commonDenominator / right.d);
  const rawNumerator = operator === "+" ? commonLeft + commonRight : commonLeft - commonRight;
  const cannotSubtract = rawNumerator < 0;
  const reduceBy = cannotSubtract ? 1 : gcd(rawNumerator, commonDenominator);
  const canReduce = !cannotSubtract && reduceBy > 1;

  return {
    text,
    operator,
    commonLeft,
    commonRight,
    commonDenominator,
    rawNumerator,
    rawDenominator: commonDenominator,
    finalNumerator: canReduce ? rawNumerator / reduceBy : null,
    finalDenominator: canReduce ? commonDenominator / reduceBy : null,
    finalShouldBeBlank: cannotSubtract || !canReduce
  };
}

function blank(name) {
  return `<input class="inline-answer" data-answer="${name}" type="number" inputmode="numeric" autocomplete="off" enterkeyhint="next">`;
}

function renderProblem(problem) {
  problemText.innerHTML = `
    <div class="fraction-line original-line">${problem.text}</div>
    <div class="fraction-line">= ${blank("commonLeft")}/${blank("commonDenominatorLeft")} ${problem.operator} ${blank("commonRight")}/${blank("commonDenominatorRight")}</div>
    <div class="fraction-line">= ${blank("rawNumerator")}/${blank("rawDenominator")}</div>
    <div class="fraction-line">= ${blank("finalNumerator")}/${blank("finalDenominator")}</div>
  `;
}

function answerInputs() {
  return [...problemText.querySelectorAll("[data-answer]")];
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

function focusFirstAnswer() {
  const first = answerInputs()[0];
  if (first) first.focus({ preventScroll: true });
}

function expectedValue(name) {
  const expected = {
    commonLeft: currentProblem.commonLeft,
    commonDenominatorLeft: currentProblem.commonDenominator,
    commonRight: currentProblem.commonRight,
    commonDenominatorRight: currentProblem.commonDenominator,
    rawNumerator: currentProblem.rawNumerator,
    rawDenominator: currentProblem.rawDenominator,
    finalNumerator: currentProblem.finalNumerator,
    finalDenominator: currentProblem.finalDenominator
  };
  return expected[name];
}

function isAnswerCorrect() {
  return answerInputs().every((input) => {
    const name = input.dataset.answer;
    const raw = input.value.trim();

    if (currentProblem.finalShouldBeBlank && (name === "finalNumerator" || name === "finalDenominator")) {
      return raw === "";
    }

    return raw !== "" && Number(raw) === expectedValue(name);
  });
}

function nextQuestion() {
  const types = activeTypes.length > 0 ? activeTypes : selectedTypes();

  if (types.length === 0) {
    problemText.textContent = "? / ? + ? / ? = ?";
    resultText.textContent = "เลือกชนิดของโจทย์ก่อน";
    resultText.className = "is-wrong";
    return;
  }

  if (currentQuestion > totalQuestions) {
    stopTimer();
    problemText.textContent = `${correctCount} / ${totalQuestions}`;
    resultText.textContent = "คะแนน";
    resultText.className = "is-correct";
    showSummary();
    return;
  }

  const type = types[randomInt(0, types.length - 1)];
  currentProblem = makeProblem(type);
  missedCurrentQuestion = false;
  renderProblem(currentProblem);
  resultText.textContent = "เติมตัวเลขในช่องว่าง";
  resultText.className = "";
  hideSummary();
  updateProgress();
  focusFirstAnswer();
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
  if (currentProblem === null || currentQuestion > totalQuestions) return;

  const isCorrect = isAnswerCorrect();
  resultText.textContent = isCorrect ? "ถูกต้อง" : "ยังไม่ถูก ลองอีกครั้ง";
  resultText.className = isCorrect ? "is-correct" : "is-wrong";

  if (!isCorrect) {
    missedCurrentQuestion = true;
    focusFirstAnswer();
    return;
  }

  if (!missedCurrentQuestion) {
    correctCount += 1;
  }
  currentQuestion += 1;
  window.setTimeout(nextQuestion, 450);
});

nextQuestion();
