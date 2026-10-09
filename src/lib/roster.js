// 명단 파일(엑셀 / csv / txt) → [{ name, gender }]

const NAME_HEAD = /^(이름|성명|학생\s*이름|학생명|name|student|student\s*name|full\s*name)$/i;
const GENDER_HEAD = /^(성별|남녀|gender|sex)$/i;
const MALE_RE = /^(남|남자|남학생|남성|m|male|boy|b)$/i;
const FEMALE_RE = /^(여|여자|여학생|여성|f|female|girl|g)$/i;
const ALLOWED = ['xlsx', 'xls', 'csv', 'txt'];

// 화면에 보여줄 번역 키를 담는 오류
export class RosterError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function toGender(v) {
  const s = String(v ?? '').trim();
  return MALE_RE.test(s) ? 'male' : FEMALE_RE.test(s) ? 'female' : null;
}

function hasNameHead(row) {
  return row.some(c => NAME_HEAD.test(String(c ?? '').trim()));
}

// 표(행×열) → [{ name, gender }]
export function rowsToStudents(rows) {
  rows = rows.map(r => (r || []).map(c => String(c ?? '').trim()));

  // 머리글 행(이름/성별)이 있으면 해당 열 사용
  const headIdx = rows.slice(0, 5).findIndex(hasNameHead);
  if (headIdx !== -1) {
    const head = rows[headIdx];
    const nameCol = head.findIndex(c => NAME_HEAD.test(c));
    const genderCol = head.findIndex(c => GENDER_HEAD.test(c));
    return rows.slice(headIdx + 1)
      .map(r => ({ name: r[nameCol] || '', gender: genderCol !== -1 ? toGender(r[genderCol]) : null }))
      .filter(s => s.name);
  }

  // 머리글이 없으면: 성별 칸은 성별로, 숫자(번호·학번)는 건너뛰고 첫 글자 칸을 이름으로
  const list = [];
  for (const r of rows) {
    let name = '', gender = null;
    for (const c of r) {
      if (!c) continue;
      const g = toGender(c);
      if (g && !gender) gender = g;
      else if (!name && !/^\d+([.-]\d+)*\.?$/.test(c)) name = c;
    }
    if (name) list.push({ name, gender });
  }
  return list;
}

// txt / csv 한 줄 → 칸 배열 ("김민준 남", "1,김민준,남", 탭 구분 모두 지원)
export function splitLine(line) {
  let cells = line.split(/\t|,/).map(c => c.trim().replace(/^"(.*)"$/, '$1'));
  if (cells.length === 1) {
    const tokens = cells[0].split(/\s+/);
    if (tokens.length > 1 && /^\d+\.?$/.test(tokens[0])) tokens.shift();   // 앞 번호 제거
    if (tokens.length > 1 && toGender(tokens[tokens.length - 1])) {
      cells = [tokens.slice(0, -1).join(' '), tokens[tokens.length - 1]];
    } else {
      cells = [tokens.join(' ')];
    }
  }
  return cells;
}

// 한글 윈도우 메모장(ANSI = EUC-KR) 파일도 읽을 수 있게 인코딩 판별
export function decodeText(buf) {
  const utf8 = new TextDecoder('utf-8').decode(buf);
  if (!utf8.includes('\uFFFD')) return utf8.replace(/^\uFEFF/, '');
  try { return new TextDecoder('euc-kr').decode(buf); } catch { return utf8; }
}

export function textToStudents(text) {
  return rowsToStudents(text.split(/\r?\n/).filter(l => l.trim()).map(splitLine));
}

// 엑셀: '명단'처럼 이름 머리글이 있는 시트를 우선 사용
async function workbookToStudents(buf) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'array' });
  const sheets = wb.SheetNames.map(n => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' }));
  const withHead = sheets.find(rows => rows.slice(0, 5).some(hasNameHead));
  return rowsToStudents(withHead || sheets[0] || []);
}

export async function readRosterFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED.includes(ext)) throw new RosterError('importBadType');

  const buf = await file.arrayBuffer();
  const students = (ext === 'txt' || ext === 'csv')
    ? textToStudents(decodeText(buf))
    : await workbookToStudents(buf);

  if (students.length === 0) throw new RosterError('importEmpty');
  return students;
}
