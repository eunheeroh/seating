import { useT } from '../i18n.js';
import { todayText } from '../lib/exportExcel.js';
import Desk from './Desk.jsx';

function Door({ label, className }) {
  return (
    <div className={'door ' + className}>
      <span className="door-icon">🚪</span>
      <span className="door-label">{label}</span>
    </div>
  );
}

export default function Classroom({ cols, rows, deskActive, assignment, shuffleId, onToggleDesk, statusText }) {
  const t = useT();

  return (
    <div className="classroom">
      {/* 인쇄할 때만 보이는 제목 */}
      <div className="print-title">{t.title} · {todayText()}</div>

      <div className="board">{t.board}</div>

      {/* 교실 본체: 좌(선생님 책상) · 중앙(자리) · 우(앞문/뒷문) */}
      <div className="room-body">
        <div className="left-wall">
          <div className="teacher">{t.teacher}</div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))` }}>
          {Array.from({ length: cols * rows }, (_, i) => (
            // 랜덤 배치할 때마다 key가 바뀌어 책상이 새로 그려지며 애니메이션 재생
            <Desk
              key={`${shuffleId}-${i}`}
              index={i}
              active={deskActive[i]}
              student={assignment?.[i]}
              animate={shuffleId > 0}
              onToggle={() => onToggleDesk(i)}
            />
          ))}
        </div>

        <div className="right-wall">
          <Door label={t.frontDoor} className="door-front" />
          <div className="wall-spacer" />
          <Door label={t.backDoor} className="door-back" />
        </div>
      </div>

      <div className="status">{statusText}</div>
    </div>
  );
}
