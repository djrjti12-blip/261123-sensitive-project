// 돌림판 그리기(canvas) 및 회전 애니메이션
import { randomFloat } from './random.js';

// docs/02 §3.5 8색 팔레트 (순서 고정)
const PALETTE = [
  { bg: '#7b42bc', text: '#ffffff' }, // 0. 보라
  { bg: '#ffcf25', text: '#000000' }, // 1. 노랑
  { bg: '#1868f2', text: '#ffffff' }, // 2. 파랑
  { bg: '#00ca8e', text: '#000000' }, // 3. 초록
  { bg: '#e62b1e', text: '#ffffff' }, // 4. 빨강
  { bg: '#14c6cb', text: '#000000' }, // 5. 청록
  { bg: '#911ced', text: '#ffffff' }, // 6. 밝은 보라
  { bg: '#f24c53', text: '#ffffff' }  // 7. 산호
];

/**
 * 칸 색상 가져오기
 * @param {number} index 
 * @param {number} itemCount 
 * @returns {{ bg: string, text: string }}
 */
export function getSegmentColor(index, itemCount) {
  // 항목 개수가 n % 8 === 1 인 경우 (예: 9개) 마지막 칸은 palette[2] 사용
  if (itemCount % 8 === 1 && index === itemCount - 1) {
    return PALETTE[2];
  }
  return PALETTE[index % 8];
}

let fontLoaded = false;
async function ensureFontLoaded() {
  if (fontLoaded) return;
  try {
    const fontPromise = document.fonts?.load ? document.fonts.load('600 16px LevelUp') : Promise.resolve();
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));
    await Promise.race([fontPromise, timeoutPromise]);
  } catch {
    // 폰트 로드 실패 시 시스템 대체 글꼴 사용
  } finally {
    fontLoaded = true;
  }
}

/**
 * 캔버스에 돌림판 그리기
 * @param {HTMLCanvasElement} canvas 
 * @param {string[]} items 
 */
export async function drawWheel(canvas, items = []) {
  await ensureFontLoaded();

  const ctx = canvas.getContext('2d');
  const size = canvas.clientWidth || 320;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const radius = size / 2;
  const cx = radius;
  const cy = radius;

  ctx.clearRect(0, 0, size, size);

  // 빈 돌림판
  if (!items || items.length === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1f232b';
    ctx.fill();

    // 테두리 4px 흰색
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 가운데 원 56px
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // ? 텍스트
    ctx.fillStyle = '#b2b6bd';
    ctx.font = '700 24px LevelUp, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy);
    return;
  }

  const n = items.length;
  const segAngle = 360 / n;
  const segRad = (segAngle * Math.PI) / 180;

  // 글자 크기 결정
  let fontSize = 16;
  if (n <= 6) fontSize = 18;
  else if (n <= 9) fontSize = 16;
  else fontSize = 14;

  ctx.font = `600 ${fontSize}px LevelUp, sans-serif`;

  for (let i = 0; i < n; i++) {
    // 칸 0은 12시 방향(-90도)에서 시작해 시계 방향으로
    const start = ((i * segAngle - 90) * Math.PI) / 180;
    const end = (((i + 1) * segAngle - 90) * Math.PI) / 180;
    const color = getSegmentColor(i, n);

    // 부채꼴 채우기
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius - 2, start, end);
    ctx.closePath();
    ctx.fillStyle = color.bg;
    ctx.fill();

    // 2px 검정 구분선
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // 텍스트 그리기
    ctx.save();
    const midAngle = start + segRad / 2;
    const textDist = radius * 0.62;
    const tx = cx + Math.cos(midAngle) * textDist;
    const ty = cy + Math.sin(midAngle) * textDist;

    ctx.translate(tx, ty);
    ctx.rotate(midAngle + Math.PI / 2);

    ctx.fillStyle = color.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 글자 넘침 말줄임표 처리 (최대 폭: radius * 0.55)
    const maxTextWidth = radius * 0.55;
    let label = items[i];
    if (ctx.measureText(label).width > maxTextWidth) {
      const chars = Array.from(label);
      while (chars.length > 0 && ctx.measureText(chars.join('') + '…').width > maxTextWidth) {
        chars.pop();
      }
      label = chars.join('') + '…';
    }

    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  // 바깥 테두리 4px 흰색
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // 가운데 지름 56px 검정 원 + 2px 흰 테두리
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

/**
 * 돌림판을 당첨 칸으로 회전
 * @param {HTMLCanvasElement} canvas 
 * @param {number} winnerIndex 
 * @param {number} itemCount 
 * @param {number} currentRotation 
 * @param {{ reducedMotion?: boolean }} options 
 * @returns {Promise<number>} 새 누적 rotation 각도
 */
export function spinTo(canvas, winnerIndex, itemCount, currentRotation, options = {}) {
  return new Promise(resolve => {
    const seg = 360 / itemCount;
    const jitter = (randomFloat() - 0.5) * seg * 0.7;
    const target = 360 - (winnerIndex + 0.5) * seg + jitter;
    const current = currentRotation % 360;
    const delta = (target - current + 360) % 360;

    const turns = options.reducedMotion ? 1 : 6;
    const duration = options.reducedMotion ? 600 : 4000;
    const newRotation = currentRotation + 360 * turns + delta;

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      canvas.removeEventListener('transitionend', onEnd);
      clearTimeout(safetyTimer);

      // 자가 확인 (docs/03 §5.4)
      const r = ((newRotation % 360) + 360) % 360;
      const pointerAngle = (360 - r) % 360;
      const landed = Math.floor(pointerAngle / seg);
      if (landed !== winnerIndex) {
        console.error('[wheel] mismatch', { landed, winnerIndex, newRotation, seg, pointerAngle });
      }

      resolve(newRotation);
    };

    const onEnd = e => {
      if (e.target === canvas && e.propertyName === 'transform') {
        cleanup();
      }
    };

    const safetyTimer = setTimeout(cleanup, duration + 500);
    canvas.addEventListener('transitionend', onEnd);

    canvas.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    canvas.style.transform = `rotate(${newRotation}deg)`;
  });
}
