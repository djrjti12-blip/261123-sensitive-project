// 서버 /api/analyze 호출 모듈

/**
 * 서버에 텍스트 분석 요청
 * @param {string} text 
 * @returns {Promise<{ ok: boolean, data?: object, code?: string, message?: string }>}
 */
export async function analyzeText(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    clearTimeout(timer);

    let json = null;
    try {
      json = await res.json();
    } catch {
      return {
        ok: false,
        code: 'BAD_RESPONSE',
        message: '서버 응답을 읽지 못했어요.'
      };
    }

    if (!json || typeof json !== 'object') {
      return {
        ok: false,
        code: 'BAD_RESPONSE',
        message: '서버 응답을 읽지 못했어요.'
      };
    }

    if (json.ok && json.data) {
      return {
        ok: true,
        data: json.data
      };
    }

    return {
      ok: false,
      code: json.error?.code || 'AI_ERROR',
      message: json.error?.message || '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.'
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return {
        ok: false,
        code: 'NETWORK_TIMEOUT',
        message: '응답이 너무 늦어요.'
      };
    }
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '인터넷 연결을 확인해 주세요.'
    };
  }
}
