import { useState } from 'react';
import { useT } from '../i18n.js';
import ImportBar from './ImportBar.jsx';
import GenderList from './GenderList.jsx';

export default function ControlPanel({
  colsInput, rowsInput, onColsChange, onRowsChange, onApply,
  male, female, onRandom, onReset, importProps
}) {
  const t = useT();
  const [dragging, setDragging] = useState(false);

  // 파일 끌어다 놓기
  function handleDrag(e) {
    e.preventDefault();
    setDragging(true);
  }
  function handleDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    importProps.onFile(e.dataTransfer.files[0]);
  }

  return (
    <div
      className={'panel' + (dragging ? ' dragging' : '')}
      onDragEnter={handleDrag} onDragOver={handleDrag}
      onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      <ImportBar {...importProps} />

      <div className="grid-setting">
        <div className="setting-row">
          <div className="field">
            <label htmlFor="cols">{t.colsLabel}</label>
            <input type="number" id="cols" min="1" max="12" value={colsInput} onChange={e => onColsChange(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rows">{t.rowsLabel}</label>
            <input type="number" id="rows" min="1" max="12" value={rowsInput} onChange={e => onRowsChange(e.target.value)} />
          </div>
        </div>
        <button className="btn-apply" onClick={onApply}>{t.applyBtn}</button>
      </div>

      <GenderList gender="male" {...male} />
      <GenderList gender="female" {...female} />

      <div className="buttons">
        <button className="btn-random" onClick={onRandom}>{t.randomBtn}</button>
        <button className="btn-reset" onClick={onReset}>{t.resetBtn}</button>
      </div>
    </div>
  );
}
