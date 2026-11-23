// AI 실패 시 직접 나누기(대체 동작) 및 입력 유효성 검사

/**
 * 사용자 입력 문자열 사전 검사
 * @param {string} text 
 * @returns {{ ok: boolean, text?: string, code?: string }}
 */
export function validateInput(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, code: 'EMPTY_INPUT' };
  }
  if (trimmed.length > 500) {
    return { ok: false, code: 'TEXT_TOO_LONG' };
  }
  return { ok: true, text: trimmed };
}

/**
 * AI 불가 시 쉼표/줄바꿈/구분자 기준 로컬 분리 (대체 동작)
 * @param {string} text 
 * @returns {string[] | null}
 */
export function splitLocally(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. 구분자 분리: 쉼표 , ，, 줄바꿈, 가운뎃점 ·, 슬래시 /, 세로선 |, 공백 동반 vs / VS
  const separatorRegex = /[,，\n·\/|]+|\s+vs\s+/i;
  const rawPieces = text.split(separatorRegex);

  const seen = new Set();
  const items = [];

  for (const piece of rawPieces) {
    // 2. 각 조각 trim 및 연속 공백 1칸 축소
    const cleaned = piece.trim().replace(/\s+/g, ' ');

    // 3. 빈 조각 건너뛰기
    if (!cleaned) continue;

    // 4. 20자 초과 조각은 앞 20자만 (Array.from 사용으로 이모지 보호)
    const truncated = Array.from(cleaned).slice(0, 20).join('');

    // 5. 중복 제거 (대소문자 무시 비교, 최초 등장 유지)
    const lower = truncated.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      items.push(truncated);
    }

    // 6. 최대 12개 제한
    if (items.length >= 12) {
      break;
    }
  }

  // 7. 2개 미만이면 실패 (null)
  if (items.length < 2) {
    return null;
  }

  return items;
}
