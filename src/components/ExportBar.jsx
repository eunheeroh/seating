import { useT } from '../i18n.js';

// 인쇄 / 엑셀 저장: 랜덤 배치가 끝난 뒤에만 사용 가능
export default function ExportBar({ enabled, onPrint, onExcel }) {
  const t = useT();
  return (
    <div className="export-bar">
      <button className="btn-print" disabled={!enabled} onClick={onPrint}>{t.printBtn}</button>
      <button className="btn-excel" disabled={!enabled} onClick={onExcel}>{t.excelBtn}</button>
      {!enabled && <p className="export-hint">{t.exportHint}</p>}
    </div>
  );
}
