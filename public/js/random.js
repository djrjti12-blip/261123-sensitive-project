// 공정한 무작위 난수 생성기 (Web Crypto 기반)

/**
 * 0 이상 max 미만의 정수를 균등하게 반환 (치우침 제거)
 * @param {number} max 
 * @returns {number}
 */
export function randomInt(max) {
  if (max <= 1) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

/**
 * 0 이상 1 미만의 실수 난수
 * @returns {number}
 */
export function randomFloat() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000;
}
