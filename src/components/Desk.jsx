import { useState } from 'react';
import { useT } from '../i18n.js';

// 책상 하나 = 상판(.top) + 의자(CSS ::after). 클릭하면 사용/빈자리 전환
export default function Desk({ index, active, student, animate, onToggle }) {
  const t = useT();
  // 뒤집기 애니메이션이 책상마다 조금씩 다르게 시작하도록
  const [delay] = useState(() => (Math.random() * 0.35).toFixed(2) + 's');

  let className = 'desk';
  let content;
  if (!active) {
    className += ' disabled';
    content = <span className="empty-label">{t.emptySeat}</span>;
  } else if (!student) {
    className += ' active';
    content = <><span className="num">{index + 1}</span><span className="empty-label">{t.emptyDesk}</span></>;
  } else {
    className += ' filled' + (student.gender ? ' ' + student.gender : '') + (animate ? ' animate' : '');
    content = <><span className="num">{index + 1}</span>{student.name}</>;
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div
      className={className}
      style={student && animate ? { animationDelay: delay } : undefined}
      role="button" tabIndex={0}
      onClick={onToggle} onKeyDown={handleKey}
    >
      <div className="top">{content}</div>
    </div>
  );
}
