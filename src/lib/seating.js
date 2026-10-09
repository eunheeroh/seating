// 자리 배치 알고리즘 (화면과 무관한 순수 함수)

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function toInt(v, fallback = 0) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

// 텍스트 → 이름 배열 (한 줄에 한 명)
export function parseList(text) {
  return text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
}

// 명단 미입력 시 성별 번호 이름 자동 생성 (남1, 남2 … / B1, B2 …)
export function autoNames(gender, n, lang) {
  const prefix = lang === 'ko'
    ? (gender === 'male' ? '남' : '여')
    : (gender === 'male' ? 'B' : 'G');
  return Array.from({ length: n }, (_, i) => prefix + (i + 1));
}

// Fisher-Yates 셔플
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 사용 중 책상들 사이의 이웃 쌍 (오른쪽/아래만 → 중복 방지)
function neighborPairs(active, cols, rows) {
  const set = new Set(active);
  const pairs = [];
  for (const idx of active) {
    const r = Math.floor(idx / cols), c = idx % cols;
    if (c < cols - 1 && set.has(idx + 1)) pairs.push([idx, idx + 1]);      // 오른쪽
    if (r < rows - 1 && set.has(idx + cols)) pairs.push([idx, idx + cols]); // 아래
  }
  return pairs;
}

// 같은 성별이 이웃한 쌍 수
function countViolations(genderMap, pairs) {
  let v = 0;
  for (const [a, b] of pairs) {
    if (genderMap[a] && genderMap[b] && genderMap[a] === genderMap[b]) v++;
  }
  return v;
}

function placeNames(assignment, seats, names, gender) {
  for (let k = 0; k < names.length; k++) {
    assignment[seats[k]] = { name: names[k], gender };
  }
}

// 성별 분리 배치 (체스판 방식 → 실패 시 지역 탐색)
export function assignSeparated(active, males, females, cols, rows) {
  // 1) 체스판(격자 2색) 방식: 인접한 두 책상은 항상 다른 색 → 성별별로 색을 나누면 위반 0
  const classA = [], classB = [];
  for (const idx of active) {
    const r = Math.floor(idx / cols), c = idx % cols;
    ((r + c) % 2 === 0 ? classA : classB).push(idx);
  }
  const M = males.length, F = females.length;
  const options = [];
  if (M <= classA.length && F <= classB.length) options.push([classA, classB]);
  if (M <= classB.length && F <= classA.length) options.push([classB, classA]);

  if (options.length > 0) {
    const [maleClass, femaleClass] = options[Math.floor(Math.random() * options.length)];
    const assignment = {};
    placeNames(assignment, shuffle(maleClass), shuffle(males), 'male');
    placeNames(assignment, shuffle(femaleClass), shuffle(females), 'female');
    return { assignment, violations: 0 };
  }

  // 2) 체스판이 불가능한 인원 비율 → 무작위 재시작 + 스왑 지역탐색으로 위반 최소화
  const pairs = neighborPairs(active, cols, rows);
  const total = active.length;
  let best = null, bestV = Infinity;

  for (let restart = 0; restart < 25 && bestV > 0; restart++) {
    const genders = shuffle(
      Array(M).fill('male').concat(Array(F).fill('female'), Array(total - M - F).fill(null))
    );
    const map = {};
    active.forEach((idx, i) => (map[idx] = genders[i]));

    let improved = true, guard = 0;
    while (improved && guard++ < 300) {
      improved = false;
      const v = countViolations(map, pairs);
      if (v === 0) break;
      for (let i = 0; i < total && !improved; i++) {
        for (let j = i + 1; j < total; j++) {
          const a = active[i], b = active[j];
          if (map[a] === map[b]) continue;
          [map[a], map[b]] = [map[b], map[a]];
          if (countViolations(map, pairs) < v) { improved = true; break; }
          [map[a], map[b]] = [map[b], map[a]];
        }
      }
    }
    const v = countViolations(map, pairs);
    if (v < bestV) { bestV = v; best = { ...map }; }
  }

  const maleSeats = active.filter(idx => best[idx] === 'male');
  const femaleSeats = active.filter(idx => best[idx] === 'female');
  const assignment = {};
  placeNames(assignment, shuffle(maleSeats), shuffle(males), 'male');
  placeNames(assignment, shuffle(femaleSeats), shuffle(females), 'female');
  return { assignment, violations: bestV };
}

// 성별 구분 없는 단순 무작위 배치
export function assignSimple(active, students) {
  const seats = shuffle(active);
  const shuffled = shuffle(students);
  const assignment = {};
  shuffled.forEach((s, k) => (assignment[seats[k]] = s));
  return assignment;
}
