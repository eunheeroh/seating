import { useEffect, useRef, useState } from 'react';
import { I18N, LangContext, formatMsg } from './i18n.js';
import {
  clamp, toInt, parseList, autoNames, assignSeparated, assignSimple
} from './lib/seating.js';
import { readRosterFile } from './lib/roster.js';
import { exportSeatingExcel } from './lib/exportExcel.js';
import TopBar from './components/TopBar.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import Classroom from './components/Classroom.jsx';
import ExportBar from './components/ExportBar.jsx';

const MAX_STUDENTS = 50;

export default function App() {
  const [lang, setLang] = useState('ko');
  const t = I18N[lang];

  // 교실 크기: 입력 중인 값 / 실제 적용된 값
  const [colsInput, setColsInput] = useState('5');
  const [rowsInput, setRowsInput] = useState('4');
  const [size, setSize] = useState({ cols: 5, rows: 4 });
  // 각 책상의 상태: true = 사용, false = 빈자리
  const [deskActive, setDeskActive] = useState(() => Array(20).fill(true));

  // 명단
  const [maleNames, setMaleNames] = useState('');
  const [femaleNames, setFemaleNames] = useState('');
  const [maleCount, setMaleCount] = useState('10');
  const [femaleCount, setFemaleCount] = useState('10');

  // 배치 결과: { [책상 번호]: { name, gender } }
  const [assignment, setAssignment] = useState(null);
  const [seated, setSeated] = useState(null);       // { total, male, female }
  const [shuffleId, setShuffleId] = useState(0);

  // 메시지 ({ key, args } 형태라 언어를 바꾸면 자동 번역)
  const [warn, setWarn] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);   // 성별 정보 없는 명단

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t.title]);

  // 명단·인원수를 바꿀 때 합계가 50명을 넘으면 바로 경고
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const m = parseList(maleNames).length || toInt(maleCount);
    const f = parseList(femaleNames).length || toInt(femaleCount);
    setWarn(m + f > MAX_STUDENTS ? { key: 'warnMax' } : null);
  }, [maleNames, femaleNames, maleCount, femaleCount]);

  function clearResult() {
    setAssignment(null);
    setSeated(null);
  }

  // 자리 설정: 입력한 크기로 책상을 새로 만듦
  function applySize() {
    const cols = clamp(toInt(colsInput, 1), 1, 12);
    const rows = clamp(toInt(rowsInput, 1), 1, 12);
    setColsInput(String(cols));
    setRowsInput(String(rows));
    setSize({ cols, rows });
    setDeskActive(Array(cols * rows).fill(true));
    clearResult();
    setWarn(null);
  }

  function toggleDesk(i) {
    setDeskActive(prev => prev.map((v, k) => (k === i ? !v : v)));
    clearResult();
  }

  function randomAssign() {
    // 명단이 있으면 명단 사용, 없으면 입력한 인원수만큼 번호 이름 생성
    const maleList = parseList(maleNames);
    const femaleList = parseList(femaleNames);
    const males = maleList.length > 0 ? maleList : autoNames('male', clamp(toInt(maleCount), 0, MAX_STUDENTS), lang);
    const females = femaleList.length > 0 ? femaleList : autoNames('female', clamp(toInt(femaleCount), 0, MAX_STUDENTS), lang);
    const count = males.length + females.length;

    if (count < 1) { setWarn({ key: 'warnMin' }); return; }
    if (count > MAX_STUDENTS) { setWarn({ key: 'warnMax' }); return; }

    const active = deskActive.map((v, i) => (v ? i : -1)).filter(i => i !== -1);
    if (active.length === 0) { setWarn({ key: 'warnNoSeat' }); return; }
    if (count > active.length) { setWarn({ key: 'warnTooMany', args: [active.length, count] }); return; }

    let result, violations = 0;
    if (males.length > 0 && females.length > 0) {
      // 두 성별 모두 있으면 같은 성별이 이웃하지 않게 분리 배치
      ({ assignment: result, violations } = assignSeparated(active, males, females, size.cols, size.rows));
    } else {
      // 한 성별만 있으면 단순 무작위 배치 (성별 색상 유지)
      const gender = males.length > 0 ? 'male' : 'female';
      result = assignSimple(active, (males.length > 0 ? males : females).map(name => ({ name, gender })));
    }

    setAssignment(result);
    setSeated({ total: count, male: males.length, female: females.length });
    setShuffleId(id => id + 1);
    setWarn(violations > 0 ? { key: 'warnGenderImperfect', args: [violations] } : null);
  }

  // 초기화: 배치만 지움 (책상 크기·빈자리 설정은 유지)
  function reset() {
    clearResult();
    setWarn(null);
  }

  // ── 명단 파일 불러오기 ──
  function setList(gender, names) {
    if (gender === 'male') { setMaleNames(names.join('\n')); setMaleCount(String(names.length)); }
    else { setFemaleNames(names.join('\n')); setFemaleCount(String(names.length)); }
  }

  async function importFile(file) {
    if (!file) return;
    setPendingImport(null);

    let students;
    try {
      students = await readRosterFile(file);
    } catch (err) {
      if (!err.code) console.error(err);
      setImportMsg({ key: err.code || 'importFail' });
      return;
    }

    const males = students.filter(s => s.gender === 'male').map(s => s.name);
    const females = students.filter(s => s.gender === 'female').map(s => s.name);

    // 성별 정보가 전혀 없으면 어느 명단에 넣을지 물어봄
    if (males.length + females.length === 0) {
      setPendingImport({ file: file.name, names: students.map(s => s.name) });
      setImportMsg(null);
      return;
    }

    setList('male', males);
    setList('female', females);
    const skipped = students.length - males.length - females.length;
    setImportMsg({
      key: 'importDone',
      args: [file.name, males.length, females.length],
      extra: skipped > 0 ? { key: 'importSkipped', args: [skipped] } : null
    });
  }

  function choosePending(gender) {
    setList(gender, pendingImport.names);
    setImportMsg({ key: 'importDoneOne', args: [pendingImport.file, pendingImport.names.length, gender] });
    setPendingImport(null);
  }

  // ── 인쇄 / 엑셀 ──
  const total = size.cols * size.rows;
  const activeCount = deskActive.filter(Boolean).length;
  const statusText = t.status(total, activeCount, total - activeCount)
    + (seated ? t.statusAssigned(seated.total, seated.male, seated.female) : '');

  async function saveExcel() {
    try {
      await exportSeatingExcel({ t, ...size, deskActive, assignment, statusText });
    } catch (err) {
      console.error(err);
      setWarn({ key: 'excelFail' });
    }
  }

  return (
    <LangContext.Provider value={t}>
      <div className="layout">
        <TopBar onToggleLang={() => setLang(lang === 'ko' ? 'en' : 'ko')} />

        <ControlPanel
          colsInput={colsInput} rowsInput={rowsInput}
          onColsChange={setColsInput} onRowsChange={setRowsInput} onApply={applySize}
          male={{ names: maleNames, count: maleCount, onNamesChange: setMaleNames, onCountChange: setMaleCount }}
          female={{ names: femaleNames, count: femaleCount, onNamesChange: setFemaleNames, onCountChange: setFemaleCount }}
          onRandom={randomAssign} onReset={reset}
          importProps={{
            onFile: importFile, message: importMsg, pending: pendingImport,
            onChoose: choosePending, onCancel: () => setPendingImport(null)
          }}
        />

        <div className="warn">{formatMsg(t, warn)}</div>
        <p className="hint">{t.hint}</p>
        <div className="legend">
          <span className="legend-item"><span className="dot male-dot" />{t.legendMale}</span>
          <span className="legend-item"><span className="dot female-dot" />{t.legendFemale}</span>
        </div>

        <Classroom
          cols={size.cols} rows={size.rows} deskActive={deskActive}
          assignment={assignment} shuffleId={shuffleId}
          onToggleDesk={toggleDesk} statusText={statusText}
        />

        <ExportBar enabled={!!assignment} onPrint={() => window.print()} onExcel={saveExcel} />
      </div>
    </LangContext.Provider>
  );
}
