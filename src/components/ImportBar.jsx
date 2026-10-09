import { useRef } from 'react';
import { useT, formatMsg } from '../i18n.js';

// 명단 파일 불러오기 버튼 + 성별 선택 + 결과 메시지
export default function ImportBar({ onFile, message, pending, onChoose, onCancel }) {
  const t = useT();
  const fileRef = useRef(null);

  async function handleChange(e) {
    await onFile(e.target.files[0]);
    e.target.value = '';   // 같은 파일을 다시 골라도 동작하도록
  }

  return (
    <div className="import-row">
      <button className="btn-import" type="button" onClick={() => fileRef.current.click()}>
        {t.importBtn}
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" hidden onChange={handleChange} />
      <span className="import-help">{t.importHelp}</span>

      {pending && (
        <div className="import-choice">
          <span>{t.importAsk(pending.file, pending.names.length)}</span>
          <button type="button" className="btn-to-male" onClick={() => onChoose('male')}>{t.toMaleBtn}</button>
          <button type="button" className="btn-to-female" onClick={() => onChoose('female')}>{t.toFemaleBtn}</button>
          <button type="button" className="btn-cancel" onClick={onCancel}>{t.importCancel}</button>
        </div>
      )}

      <div className="import-msg">{formatMsg(t, message)}</div>
    </div>
  );
}
