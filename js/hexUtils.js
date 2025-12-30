// 육각형 그리드 좌표 시스템 (Axial Coordinates)

// ===== HexCoord 클래스 =====
class HexCoord {
  constructor(q, r) {
    this.q = q;
    this.r = r;
  }

  toKey() {
    return `${this.q},${this.r}`;
  }

  static fromKey(key) {
    const [q, r] = key.split(',').map(Number);
    return new HexCoord(q, r);
  }

  equals(other) {
    return this.q === other.q && this.r === other.r;
  }
}

// ===== 육각형 거리 계산 =====
function hexDistance(a, b) {
  const dq = Math.abs(a.q - b.q);
  const dr = Math.abs(a.r - b.r);
  const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
  return Math.max(dq, dr, ds);
}

// ===== 6방향 이웃 =====
function hexNeighbors(hex) {
  const directions = [
    { q: +1, r:  0 }, // E
    { q: +1, r: -1 }, // NE
    { q:  0, r: -1 }, // NW
    { q: -1, r:  0 }, // W
    { q: -1, r: +1 }, // SW
    { q:  0, r: +1 }  // SE
  ];
  return directions.map(d => new HexCoord(hex.q + d.q, hex.r + d.r));
}

// ===== 픽셀 ↔ 육각형 변환 =====
function pixelToHex(x, y, hexSize) {
  const q = (Math.sqrt(3)/3 * x - 1/3 * y) / hexSize;
  const r = (2/3 * y) / hexSize;
  return hexRound(q, r);
}

function hexRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const q_diff = Math.abs(rq - q);
  const r_diff = Math.abs(rr - r);
  const s_diff = Math.abs(rs - s);

  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs;
  } else if (r_diff > s_diff) {
    rr = -rq - rs;
  }

  return new HexCoord(rq, rr);
}

function hexToPixel(hex, hexSize, origin) {
  const x = hexSize * (Math.sqrt(3) * hex.q + Math.sqrt(3)/2 * hex.r);
  const y = hexSize * (3/2 * hex.r);
  return { x: x + origin.x, y: y + origin.y };
}

// ===== 영역 판별 =====
function getZone(hex) {
  if (hex.r < 0) return 'enemy';
  if (hex.r === 0) return 'neutral';
  return 'player';
}

// ===== 그리드 정의 =====
const HEX_GRID = [
  // r=-2 row (3개)
 new HexCoord(-1, -2), new HexCoord(0, -2), new HexCoord(1, -2), new HexCoord(2, -2), new HexCoord(3, -2),
  // r=-1 row (4개)
  new HexCoord(-1, -1), new HexCoord(0, -1), new HexCoord(1, -1), new HexCoord(2, -1),
  // r=0 row (5개)
  new HexCoord(-2, 0), new HexCoord(-1, 0), new HexCoord(0, 0), new HexCoord(1, 0), new HexCoord(2, 0),
  // r=1 row (4개)
  new HexCoord(-2, 1), new HexCoord(-1, 1), new HexCoord(0, 1), new HexCoord(1, 1),
  // r=2 row (3개)
 new HexCoord(-3, 2), new HexCoord(-2, 2), new HexCoord(-1, 2), new HexCoord(0, 2), new HexCoord(1, 2),
];

// ===== 상수 =====
const HEX_SIZE = 80; // 반지름 (픽셀) - 40 → 80 (2배)
const BOARD_CENTER = { x: 500, y: 400 }; // 보드 중심점 - (300,250) → (500,400)
