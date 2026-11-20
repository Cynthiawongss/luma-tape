import {useEffect, useMemo, useRef, useState} from 'react';
import {Check, Plus} from '@phosphor-icons/react';
import {collections, allThemes} from './catalog';
import {paintFlat, PATTERN_H} from './patterns';

const presetCollections = collections.filter(c => c.id !== 'blank');
const blankTheme = allThemes.find(t => t.id === 'blank');
const collectionOf = id => collections.find(c => c.items.some(t => t.id === id));

// A cover is a real crop of the theme's own print, never a separate illustration.
const shapes = [3 / 4, 1, 4 / 5, 1, 1, 3 / 4];
const label = t => (/^[A-Z]{4}$/.test(t.id) ? `${t.id} · ${t.en}` : t.en);

function Cover({theme, sprites, shape}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!sprites) return;
    paintFlat(ref.current, {...sprites, theme: theme.id, mode: theme.mode, colors: theme.colors, look: theme.look},
      {from: 1452, to: 1452 + PATTERN_H * shape, base: theme.colors[0]});
  }, [sprites, theme, shape]);
  return <canvas ref={ref} width={400} height={Math.round(400 / shape)} style={{aspectRatio: shape}} aria-hidden="true" />;
}

export function Library({sprites, themeId, query, onQuery, onChoose, onBlank}) {
  const [category, setCategory] = useState(() => { const c = collectionOf(themeId); return c && c.id !== 'blank' ? c.id : 'landscape'; });
  useEffect(() => { const c = collectionOf(themeId); if (c && c.id !== 'blank') setCategory(c.id); }, [themeId]);
  const text = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!text) return null;
    return presetCollections.flatMap(c => c.items.filter(t => [t.name, t.en, t.id, c.name, c.short, c.en, c.tab].some(v => v.toLowerCase().includes(text))));
  }, [text]);
  const current = presetCollections.find(c => c.id === category);
  const shown = results || current.items;

  return <aside className="library" aria-label="Tape library">
    {!results && <div className="chips" role="tablist" aria-label="Collections">
      {presetCollections.map(c => <button key={c.id} role="tab" aria-selected={c.id === category} className={c.id === category ? 'chip selected' : 'chip'} onClick={() => setCategory(c.id)}>{c.tab}</button>)}
    </div>}
    <p className="library-meta" aria-live="polite">
      {results ? (results.length ? `${results.length} ${results.length === 1 ? 'tape' : 'tapes'} for “${query.trim()}”` : '') : `${current.en} · ${current.items.length} tapes`}
    </p>
    {results && !results.length && <div className="empty">
      <p>No tapes match “{query.trim()}”. Try a flower, a planet or a zodiac sign.</p>
      <button className="button" onClick={() => onQuery('')}>Show all tapes</button>
    </div>}
    <div className="covers">
      {shown.map((t, i) => <button key={t.id} className={t.id === themeId ? 'cover selected' : 'cover'} onClick={() => onChoose(t)} aria-pressed={t.id === themeId}>
        <span className="cover-art"><Cover theme={t} sprites={sprites} shape={shapes[i % shapes.length]} />{t.id === themeId && <span className="cover-check"><Check size={13} weight="bold" /></span>}</span>
        <span className="cover-name"><span className="cover-no">{String(allThemes.indexOf(t) + 1).padStart(2, '0')}</span>{label(t)}</span>
      </button>)}
    </div>
    {!results && current.note && <p className="library-note">{current.note}</p>}
    <button className={themeId === 'blank' ? 'blank-entry selected' : 'blank-entry'} onClick={() => onBlank(blankTheme)}>
      <Plus size={20} weight="bold" /><span>Blank roll<small>Draw, add stickers or upload art</small></span>
    </button>
  </aside>;
}
