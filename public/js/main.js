// 시작점: 버튼 연결, 화면 상태 관리 및 전체 흐름 제어
import { validateInput, splitLocally } from './parser.js';
import { analyzeText } from './api.js';
import { getMessage } from './messages.js';
import { drawWheel, spinTo, getSegmentColor } from './wheel.js';
import { randomInt } from './random.js';

const app = {
  state: 'idle',
  items: [],
  confidence: null,
  reason: '',
  source: null,
  winnerIndex: null,
  rotation: 0
};

// DOM 요소 캐싱
const betInput = document.getElementById('betInput');
const charCount = document.getElementById('charCount');
const analyzeBtn = document.getElementById('analyzeBtn');
const messageBox = document.getElementById('messageBox');
const messageTitle = messageBox?.querySelector('.message-title');
const messageDesc = messageBox?.querySelector('.message-desc');

const analysisEmpty = document.getElementById('analysisEmpty');
const analysisContent = document.getElementById('analysisContent');
const confidenceValue = document.getElementById('confidenceValue');
const confidenceBadge = document.getElementById('confidenceBadge');
const confidenceBar = document.getElementById('confidenceBar');
const confidenceTrack = document.getElementById('confidenceTrack');
const reasonText = document.getElementById('reasonText');
const itemCount = document.getElementById('itemCount');
const itemChips = document.getElementById('itemChips');

const wheelCanvas = document.getElementById('wheelCanvas');
const spinBtn = document.getElementById('spinBtn');

const resultCard = document.getElementById('resultCard');
const resultText = document.getElementById('resultText');
const resultDot = document.getElementById('resultDot');
const respinBtn = document.getElementById('respinBtn');
const resetBtn = document.getElementById('resetBtn');

function showMessage(code) {
  const msg = getMessage(code);
  if (!messageBox || !messageTitle || !messageDesc) return;

  messageBox.hidden = false;
  messageBox.className = `message-box is-${msg.type}`;
  messageTitle.textContent = msg.title;
  messageDesc.textContent = msg.body;
}

function hideMessage() {
  if (messageBox) {
    messageBox.hidden = true;
  }
}

function updateCharCount() {
  const length = betInput.value.length;
  charCount.textContent = `${length} / 500`;

  charCount.classList.remove('is-warning', 'is-error');
  if (length > 500) {
    charCount.classList.add('is-error');
  } else if (length >= 450) {
    charCount.classList.add('is-warning');
  }
}

function renderUI() {
  switch (app.state) {
    case 'idle':
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span>돌림판 만들기</span>';
      spinBtn.disabled = true;
      resultCard.hidden = true;
      resultCard.classList.remove('is-visible');
      betInput.readOnly = false;
      analysisEmpty.hidden = false;
      analysisContent.hidden = true;
      drawWheel(wheelCanvas, []);
      wheelCanvas.setAttribute('aria-label', '돌림판: 준비 중');
      break;

    case 'analyzing':
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span>분석 중…</span>';
      spinBtn.disabled = true;
      resultCard.hidden = true;
      resultCard.classList.remove('is-visible');
      betInput.readOnly = true;
      hideMessage();
      break;

    case 'ready':
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span>돌림판 만들기</span>';
      spinBtn.disabled = false;
      resultCard.hidden = true;
      resultCard.classList.remove('is-visible');
      betInput.readOnly = false;
      analysisEmpty.hidden = true;
      analysisContent.hidden = false;

      // 신뢰도 표시
      confidenceBadge.className = 'badge';
      if (app.source === 'fallback') {
        confidenceValue.textContent = '—';
        confidenceBadge.textContent = 'AI 미사용';
        confidenceTrack.hidden = true;
      } else {
        confidenceTrack.hidden = false;
        confidenceValue.textContent = `${app.confidence}%`;

        let levelClass = 'is-mid';
        let levelText = '보통';
        if (app.confidence >= 80) {
          levelClass = 'is-high';
          levelText = '높음';
        } else if (app.confidence < 50) {
          levelClass = 'is-low';
          levelText = '낮음';
        }
        confidenceBadge.textContent = levelText;
        confidenceBadge.classList.add(levelClass);

        confidenceBar.className = `confidence-bar ${levelClass}`;
        confidenceBar.style.width = '0%';
        requestAnimationFrame(() => {
          confidenceBar.style.width = `${app.confidence}%`;
        });
      }

      reasonText.textContent = app.reason;
      itemCount.textContent = String(app.items.length);

      // 항목 칩 렌더링 (textContent 사용 필수)
      itemChips.textContent = '';
      app.items.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'chip-item';

        const dot = document.createElement('span');
        dot.className = 'chip-dot';
        dot.style.backgroundColor = getSegmentColor(idx, app.items.length).bg;
        dot.setAttribute('aria-hidden', 'true');

        const span = document.createElement('span');
        span.textContent = item;

        li.appendChild(dot);
        li.appendChild(span);
        itemChips.appendChild(li);
      });

      // 캔버스 초기화
      wheelCanvas.style.transition = 'none';
      wheelCanvas.style.transform = 'rotate(0deg)';
      app.rotation = 0;
      drawWheel(wheelCanvas, app.items);
      wheelCanvas.setAttribute('aria-label', `돌림판: ${app.items.join(', ')}`);
      break;

    case 'spinning':
      analyzeBtn.disabled = true;
      spinBtn.disabled = true;
      betInput.readOnly = true;
      resultCard.hidden = true;
      resultCard.classList.remove('is-visible');
      break;

    case 'result':
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span>돌림판 만들기</span>';
      spinBtn.disabled = true;
      betInput.readOnly = false;

      // 당첨 결과 렌더링
      resultCard.hidden = false;
      requestAnimationFrame(() => {
        resultCard.classList.add('is-visible');
      });

      const winnerColor = getSegmentColor(app.winnerIndex, app.items.length);
      resultDot.style.backgroundColor = winnerColor.bg;
      resultText.textContent = app.items[app.winnerIndex];

      respinBtn.focus();
      break;

    case 'error':
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span>돌림판 만들기</span>';
      spinBtn.disabled = true;
      resultCard.hidden = true;
      resultCard.classList.remove('is-visible');
      betInput.readOnly = false;
      break;
  }
}

async function handleAnalyze() {
  const validation = validateInput(betInput.value);
  if (!validation.ok) {
    betInput.setAttribute('aria-invalid', 'true');
    betInput.focus();
    showMessage(validation.code);
    return;
  }

  betInput.removeAttribute('aria-invalid');
  hideMessage();

  app.state = 'analyzing';
  renderUI();

  const res = await analyzeText(validation.text);

  if (res.ok && res.data) {
    app.items = res.data.items;
    app.confidence = res.data.confidence;
    app.reason = res.data.reason;
    app.source = 'ai';
    app.state = 'ready';
    renderUI();

    if (app.confidence < 50) {
      showMessage('LOW_CONFIDENCE');
    }
  } else {
    const errorMsg = getMessage(res.code);
    // 대체 동작 확인
    if (errorMsg.fallback) {
      const fallbackItems = splitLocally(validation.text);
      if (fallbackItems) {
        app.items = fallbackItems;
        app.confidence = null;
        app.reason = 'AI 분석을 사용할 수 없어 쉼표·줄바꿈 기준으로 나눴어요.';
        app.source = 'fallback';
        app.state = 'ready';
        renderUI();
        showMessage(res.code);
        return;
      }
      app.state = 'error';
      renderUI();
      showMessage('FALLBACK_FAILED');
      return;
    }

    app.state = 'error';
    renderUI();
    showMessage(res.code);
  }
}

async function handleSpin() {
  if (app.state !== 'ready' && app.state !== 'result') return;
  if (!app.items || app.items.length === 0) return;

  app.state = 'spinning';
  renderUI();

  app.winnerIndex = randomInt(app.items.length);
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  app.rotation = await spinTo(wheelCanvas, app.winnerIndex, app.items.length, app.rotation, {
    reducedMotion: isReduced
  });

  app.state = 'result';
  renderUI();
}

function handleReset() {
  betInput.value = '';
  betInput.removeAttribute('aria-invalid');
  updateCharCount();
  hideMessage();

  app.state = 'idle';
  app.items = [];
  app.confidence = null;
  app.reason = '';
  app.source = null;
  app.winnerIndex = null;
  app.rotation = 0;

  wheelCanvas.style.transition = 'none';
  wheelCanvas.style.transform = 'rotate(0deg)';

  renderUI();
  betInput.focus();
}

// 이벤트 리스너 등록
betInput.addEventListener('input', () => {
  updateCharCount();
  if (betInput.getAttribute('aria-invalid') === 'true') {
    betInput.removeAttribute('aria-invalid');
    hideMessage();
  }
});

betInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleAnalyze();
  }
});

analyzeBtn.addEventListener('click', handleAnalyze);
spinBtn.addEventListener('click', handleSpin);
respinBtn.addEventListener('click', handleSpin);
resetBtn.addEventListener('click', handleReset);

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    drawWheel(wheelCanvas, app.items);
  }, 150);
});

// 초기화 실행
updateCharCount();
renderUI();
