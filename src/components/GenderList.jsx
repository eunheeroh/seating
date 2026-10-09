import { useT } from '../i18n.js';

// 남학생 / 여학생 명단 입력 (라벨 + 인원수 + 이름 목록)
export default function GenderList({ gender, names, count, onNamesChange, onCountChange }) {
  const t = useT();
  const isMale = gender === 'male';
  const inputClass = isMale ? 'male-input' : 'female-input';
  const id = isMale ? 'maleNames' : 'femaleNames';

  return (
    <div className="field names-field gender-group">
      <div className="gender-head">
        <label htmlFor={id} className={isMale ? 'male-label' : 'female-label'}>
          {isMale ? t.maleLabel : t.femaleLabel}
        </label>
        <span className="count-box">
          <input
            type="number" className={inputClass} min="0" max="50"
            value={count} onChange={e => onCountChange(e.target.value)}
          />
          <span>{t.personUnit}</span>
        </span>
      </div>
      <textarea
        id={id} className={inputClass}
        placeholder={isMale ? t.malePlaceholder : t.femalePlaceholder}
        value={names} onChange={e => onNamesChange(e.target.value)}
      />
    </div>
  );
}
