import {useEffect, useRef} from 'react';
import {Trash, X} from '@phosphor-icons/react';

const dateText = time => time ? new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}).format(time) : '';

export function WorksDrawer({works, currentId, onOpen, onRename, onDelete, onClose}) {
  const closeRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const key = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); opener?.focus?.(); };
  }, [onClose]);
  return <div className="scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="works-title">
      <header>
        <h2 id="works-title">My rolls</h2>
        <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close My rolls"><X size={20} /></button>
      </header>
      <p className="drawer-note">Rolls are saved in this browser, on this device only. There’s no account or cloud sync, so export a PNG before you switch devices.</p>
      {!works.length && <div className="empty">
        <p><strong>No saved rolls yet.</strong></p>
        <p>Tune a tape, hit Save, and it shows up here.</p>
        <button className="button" onClick={onClose}>Back to the studio</button>
      </div>}
      <ul className="works">
        {works.map(w => <li key={w.id} className={w.id === currentId ? 'current' : ''}>
          <button className="work-open" onClick={() => onOpen(w)} aria-label={`Open ${w.name}`}>
            {w.thumb ? <img src={w.thumb} alt="" width="360" height="90" /> : <span className="work-blank" />}
          </button>
          <div className="work-row">
            <input defaultValue={w.name} aria-label="Roll name" maxLength={40} onBlur={e => { const name = e.target.value.trim(); if (name && name !== w.name) onRename(w, name); else e.target.value = w.name; }} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.target.blur(); }} />
            <button className="icon-button" onClick={() => onDelete(w)} aria-label={`Delete ${w.name}`}><Trash size={17} /></button>
          </div>
          <small>{w.id === currentId ? 'Editing now · ' : ''}{dateText(w.savedAt)}</small>
        </li>)}
      </ul>
    </section>
  </div>;
}
