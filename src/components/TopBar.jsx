import { useT } from '../i18n.js';

export default function TopBar({ onToggleLang }) {
  const t = useT();
  return (
    <div className="topbar">
      <h1>{t.heading}</h1>
      <button className="lang-toggle" onClick={onToggleLang}>{t.langToggle}</button>
    </div>
  );
}
