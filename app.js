const lessons = [
  {
    key: "greeting",
    title: "안녕하세요",
    guide: {
      hand: "오른손을 가볍게 들어 인사 동작을 자연스럽게 연결",
      pose: "어깨를 편안하게 유지하고 상대를 향해 몸을 정면으로",
      face: "밝은 표정과 짧은 눈맞춤",
    },
    target: { hand: 78, pose: 72, face: 80 },
  },
  {
    key: "hospital_help",
    title: "도움이 필요합니다",
    guide: {
      hand: "핵심 동작을 크게 끊지 않고 이어서 표현",
      pose: "상체를 안정적으로 고정, 동작 시작/끝 구분",
      face: "요청 상황에 맞는 진지한 표정",
    },
    target: { hand: 82, pose: 77, face: 74 },
  },
  {
    key: "where_reception",
    title: "접수처가 어디인가요?",
    guide: {
      hand: "질문형 동작의 방향성과 위치를 명확히",
      pose: "질문 시 상체 전방 기울임을 과하지 않게",
      face: "의문형 표정(눈썹/시선) 자연스럽게 반영",
    },
    target: { hand: 80, pose: 74, face: 79 },
  },
];

const assistTemplates = [
  "진료 예약을 하고 싶어요.",
  "통역 지원을 받을 수 있나요?",
  "수업 자료를 다시 설명해 주세요.",
  "신분증을 어디에 제출하나요?",
  "잠시 천천히 말씀해 주세요.",
];

const signDictionary = {
  안녕하세요: "[인사] + [상대 향해 시선]",
  접수: "[창구/서류] + [진행]",
  어디: "[위치 질문 동작]",
  진료: "[병원/치료]",
  도움: "[도움 요청 동작]",
  필요: "[필요함 강조]",
  천천히: "[속도 늦춤 동작]",
  설명: "[전달/설명 동작]",
};

const reverseTokens = [
  "화장실",
  "도움 필요",
  "통역 요청",
  "아파요",
  "천천히",
  "감사합니다",
  "다시 말해 주세요",
];

const els = {
  tabs: document.querySelectorAll(".tab"),
  panels: document.querySelectorAll(".panel"),
  lessonSelect: document.getElementById("lessonSelect"),
  lessonGuide: document.getElementById("lessonGuide"),
  startCameraBtn: document.getElementById("startCameraBtn"),
  stopCameraBtn: document.getElementById("stopCameraBtn"),
  webcam: document.getElementById("webcam"),
  handScore: document.getElementById("handScore"),
  poseScore: document.getElementById("poseScore"),
  faceScore: document.getElementById("faceScore"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  feedback: document.getElementById("feedback"),
  progressSummary: document.getElementById("progressSummary"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  templateButtons: document.getElementById("templateButtons"),
  inputSentence: document.getElementById("inputSentence"),
  voiceBtn: document.getElementById("voiceBtn"),
  translateBtn: document.getElementById("translateBtn"),
  signGuide: document.getElementById("signGuide"),
  signButtons: document.getElementById("signButtons"),
  clearComposeBtn: document.getElementById("clearComposeBtn"),
  composeBtn: document.getElementById("composeBtn"),
  composedSigns: document.getElementById("composedSigns"),
  reverseOutput: document.getElementById("reverseOutput"),
};

let cameraStream = null;
let composed = [];

function setupTabs() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((t) => t.classList.remove("active"));
      els.panels.forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
}

function renderLessons() {
  lessons.forEach((lesson) => {
    const option = document.createElement("option");
    option.value = lesson.key;
    option.textContent = lesson.title;
    els.lessonSelect.appendChild(option);
  });
  els.lessonSelect.addEventListener("change", renderLessonGuide);
  renderLessonGuide();
}

function getCurrentLesson() {
  return lessons.find((l) => l.key === els.lessonSelect.value) || lessons[0];
}

function renderLessonGuide() {
  const lesson = getCurrentLesson();
  els.lessonGuide.innerHTML = `
    <p><strong>학습 문장:</strong> ${lesson.title}</p>
    <p>🖐️ 손동작: ${lesson.guide.hand}</p>
    <p>🧍 자세: ${lesson.guide.pose}</p>
    <p>🙂 표정: ${lesson.guide.face}</p>
  `;
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    els.feedback.textContent = "이 브라우저는 카메라 API를 지원하지 않습니다.";
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    els.webcam.srcObject = cameraStream;
  } catch (e) {
    els.feedback.textContent = `카메라 접근 실패: ${e.message}`;
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    els.webcam.srcObject = null;
  }
}

function scoreMessage(label, value, target) {
  const diff = value - target;
  if (diff >= 5) return `✅ ${label} 매우 좋습니다. 목표 대비 +${diff}점`;
  if (diff >= -5) return `🟡 ${label} 양호합니다. 목표와 거의 유사합니다.`;
  return `⚠️ ${label} 보완 필요. 목표 대비 ${Math.abs(diff)}점 부족`;
}

function analyzeLesson() {
  const lesson = getCurrentLesson();
  const hand = Number(els.handScore.value);
  const pose = Number(els.poseScore.value);
  const face = Number(els.faceScore.value);
  const weighted = Math.round(hand * 0.45 + pose * 0.3 + face * 0.25);

  const feedback = [
    `문장: ${lesson.title}`,
    `종합 정확도: ${weighted}/100`,
    scoreMessage("손동작", hand, lesson.target.hand),
    scoreMessage("자세", pose, lesson.target.pose),
    scoreMessage("표정", face, lesson.target.face),
    "\n권장 연습:",
    `- 손동작 포인트: ${lesson.guide.hand}`,
    `- 자세 포인트: ${lesson.guide.pose}`,
    `- 표정 포인트: ${lesson.guide.face}`,
  ].join("\n");

  els.feedback.textContent = feedback;
  saveProgress({ lesson: lesson.title, score: weighted, at: new Date().toISOString() });
}

function saveProgress(record) {
  const existing = JSON.parse(localStorage.getItem("signProgress") || "[]");
  existing.push(record);
  localStorage.setItem("signProgress", JSON.stringify(existing));
  renderProgress();
}

function renderProgress() {
  const records = JSON.parse(localStorage.getItem("signProgress") || "[]");
  if (!records.length) {
    els.progressSummary.textContent = "아직 기록이 없습니다.";
    return;
  }
  const avg = Math.round(records.reduce((acc, cur) => acc + cur.score, 0) / records.length);
  const last = records[records.length - 1];
  const date = new Date(last.at).toLocaleString("ko-KR");
  els.progressSummary.innerHTML = `총 <strong>${records.length}회</strong> 학습, 평균 <strong>${avg}점</strong>, 최근 기록 <strong>${last.lesson}</strong> (${date})`;
}

function renderTemplates() {
  assistTemplates.forEach((template) => {
    const button = document.createElement("button");
    button.className = "chip";
    button.textContent = template;
    button.addEventListener("click", () => {
      els.inputSentence.value = template;
    });
    els.templateButtons.appendChild(button);
  });
}

function tokenizeKorean(sentence) {
  return sentence
    .replace(/[?.!,]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function buildSignGuide(sentence) {
  const tokens = tokenizeKorean(sentence);
  if (!tokens.length) {
    return "문장을 입력해 주세요.";
  }

  const mapped = tokens.map((token) => {
    const normalized = token.trim();
    return signDictionary[normalized] || `[${normalized}]`;
  });

  return [
    `입력 문장: ${sentence}`,
    "\n수어 가이드(순차 표현):",
    ...mapped.map((m, i) => `${i + 1}. ${m}`),
    "\n아바타 출력 텍스트:",
    mapped.join(" → "),
    "\n안내: 실제 통역 현장에서는 문맥/표정/공간 지시를 통합해 전문가 검수가 필요합니다.",
  ].join("\n");
}

function setupVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.voiceBtn.disabled = true;
    els.voiceBtn.textContent = "🎤 음성 입력 미지원 브라우저";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("result", (event) => {
    const text = event.results[0][0].transcript;
    els.inputSentence.value = text;
  });

  recognition.addEventListener("end", () => {
    els.voiceBtn.textContent = "🎤 음성 입력 시작";
  });

  els.voiceBtn.addEventListener("click", () => {
    els.voiceBtn.textContent = "듣는 중...";
    recognition.start();
  });
}

function renderReverseButtons() {
  reverseTokens.forEach((token) => {
    const button = document.createElement("button");
    button.className = "chip";
    button.textContent = token;
    button.addEventListener("click", () => {
      composed.push(token);
      renderComposed();
    });
    els.signButtons.appendChild(button);
  });
}

function renderComposed() {
  els.composedSigns.textContent = composed.length ? composed.join(" + ") : "(없음)";
}

function composeToText() {
  if (!composed.length) {
    els.reverseOutput.textContent = "선택된 표현이 없습니다.";
    return;
  }
  const sentence = composed.join(", ");
  els.reverseOutput.textContent = `인식 보조 결과: "${sentence}"\n\n권장: 상황에 맞는 어순과 맥락을 확인한 뒤 전달하세요.`;
}

function clearCompose() {
  composed = [];
  renderComposed();
  els.reverseOutput.textContent = "";
}

function attachEvents() {
  els.startCameraBtn.addEventListener("click", startCamera);
  els.stopCameraBtn.addEventListener("click", stopCamera);
  els.analyzeBtn.addEventListener("click", analyzeLesson);
  els.resetProgressBtn.addEventListener("click", () => {
    localStorage.removeItem("signProgress");
    renderProgress();
  });
  els.translateBtn.addEventListener("click", () => {
    els.signGuide.textContent = buildSignGuide(els.inputSentence.value);
  });
  els.composeBtn.addEventListener("click", composeToText);
  els.clearComposeBtn.addEventListener("click", clearCompose);
}

function init() {
  setupTabs();
  renderLessons();
  renderProgress();
  renderTemplates();
  setupVoiceInput();
  renderReverseButtons();
  attachEvents();
}

init();
