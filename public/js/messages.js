// 화면에 보여줄 오류·안내 문구 모음 (docs/05 명세 준수)
export const MESSAGES = {
  // 2.1 입력 오류
  EMPTY_INPUT: {
    type: 'error',
    title: '내용을 입력해 주세요',
    body: '돌림판에 넣을 항목을 문장으로 적어 주세요.',
    fallback: false
  },
  TEXT_TOO_LONG: {
    type: 'error',
    title: '글이 너무 길어요',
    body: '500자 이내로 입력해 주세요.',
    fallback: false
  },
  INVALID_INPUT: {
    type: 'error',
    title: '입력을 읽을 수 없어요',
    body: '내용을 다시 입력한 뒤 시도해 주세요.',
    fallback: false
  },
  NOT_ENOUGH_ITEMS: {
    type: 'error',
    title: '항목을 2개 이상 찾지 못했어요',
    body: '쉼표(,)로 구분해서 2개 이상 적어 주세요. 예: 짜장, 짬뽕, 볶음밥',
    fallback: false
  },

  // 2.2 AI·서버 오류
  SERVER_CONFIG: {
    type: 'warning',
    title: 'AI 분석을 사용할 수 없어요',
    body: '서버 설정에 문제가 있어 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  AI_TIMEOUT: {
    type: 'warning',
    title: 'AI 응답이 늦어요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  AI_RATE_LIMIT: {
    type: 'warning',
    title: '지금은 AI 사용량이 많아요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요. 잠시 후 다시 시도해 보세요.',
    fallback: true
  },
  AI_ERROR: {
    type: 'warning',
    title: 'AI 분석에 실패했어요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  AI_REFUSED: {
    type: 'warning',
    title: 'AI가 이 내용을 분석하지 않았어요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  AI_BAD_OUTPUT: {
    type: 'warning',
    title: 'AI 결과를 읽지 못했어요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  INTERNAL_ERROR: {
    type: 'warning',
    title: '서버에 문제가 생겼어요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  METHOD_NOT_ALLOWED: {
    type: 'error',
    title: '잘못된 요청이에요',
    body: '페이지를 새로고침한 뒤 다시 시도해 주세요.',
    fallback: false
  },

  // 2.3 네트워크 오류 (브라우저에서만 발생)
  NETWORK_ERROR: {
    type: 'warning',
    title: '인터넷 연결을 확인해 주세요',
    body: '서버에 연결하지 못해 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  NETWORK_TIMEOUT: {
    type: 'warning',
    title: '응답이 너무 늦어요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },
  BAD_RESPONSE: {
    type: 'warning',
    title: '서버 응답을 읽지 못했어요',
    body: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.',
    fallback: true
  },

  // 2.4 안내
  LOW_CONFIDENCE: {
    type: 'warning',
    title: '분석 결과가 정확하지 않을 수 있어요',
    body: '항목이 맞는지 확인해 주세요. 다르면 쉼표로 구분해 다시 입력해 보세요.',
    fallback: false
  },
  FALLBACK_FAILED: {
    type: 'error',
    title: '항목을 나누지 못했어요',
    body: 'AI를 사용할 수 없고, 직접 나누기도 실패했어요. 쉼표(,)로 구분해서 2개 이상 적어 주세요.',
    fallback: false
  }
};

export function getMessage(code) {
  return MESSAGES[code] || MESSAGES.AI_ERROR;
}
