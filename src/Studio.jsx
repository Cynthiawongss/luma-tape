import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react';
import {ArrowCounterClockwise, ArrowUUpLeft, ArrowUUpRight, CaretDown, Check, DownloadSimple, HandGrabbing, MagicWand, MagnifyingGlass, Minus, PaintBrush, Pause, Play, Plus, Scissors, Shuffle, X} from '@phosphor-icons/react';
import {collections, allThemes, pops} from './catalog';
import {createWaterScene} from './waterScene';
import {DrawingEditor} from './DrawingEditor';
import {Library} from './Library';
import {WorksDrawer} from './WorksDrawer';
import {loadSprites, loadImage} from './sprites';
import {paintFlat} from './patterns';
import {harmonize} from './color';
import {SESSION_KEY, LEGACY_KEYS, WORKS_KEY, normalizeDesign, parseWorks, upsertWork} from './works';
import './studio.css';

const themeById = id => allThemes.find(t => t.id === id);
const collectionOf = id => collections.find(c => c.items.some(t => t.id === id));
const defaultDesign = theme => normalizeDesign({theme: theme.id, look: theme.look}, allThemes);
const lookNames = {dreamy: 'Blur', stitch: 'Stitch', symbol: 'Symbol', classic: 'Classic'};
const displayName = theme => theme.en;
const styleName = style => (style === 'paper' ? 'Washi paper' : 'Glitter film');

// The paper shader lightens the base slightly at low strength; flat previews use the same rule.
function paperBase(hex, density) {
  const n = parseInt(hex.slice(1), 16), k = (1 - density) * .12;
  const mix = v => Math.round(v + (255 - v) * k);
  return `rgb(${mix(n >> 16 & 255)},${mix(n >> 8 & 255)},${mix(n & 255)})`;
}

function readStart() {
  let saved = null;
  try {
    for (const key of [SESSION_KEY, ...LEGACY_KEYS]) {
      saved = normalizeDesign(JSON.parse(localStorage.getItem(key)), allThemes);
      if (saved) break;
    }
  } catch { saved = null; }
  const linked = themeById(decodeURIComponent(location.hash.replace(/^#\/t\//, '')));
  if (linked && linked.id !== saved?.theme) return defaultDesign(linked);
  return saved || defaultDesign(allThemes[0]);
}

const palettes = [
  ['Cobalt', ['#2b50ff', '#0a1a8c', '#ff9bd6']],
  ['Bubblegum', ['#ff9ec7', '#161616', '#ffffff']],
  ['Tangerine', ['#ffb347', '#f0451a', '#e9c9ff']],
  ['Acid', ['#e8ff4f', '#2b50ff', '#ff4fa3']],
  ['Lilac', ['#c9b8ff', '#3a1f8c', '#fff06a']],
  ['Ecru', ['#f3f0e8', '#e0312b', '#2b50ff']],
];

function Slider({label, value, onChange, min = 0, max = 1, step = .01, format = v => `${Math.round(v * 100)}%`}) {
  const id = useId();
  return <div className="slider">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
    <output htmlFor={id}>{format(value)}</output>
  </div>;
}

export function App() {
  const [design, setDesign] = useState(readStart);
  const patch = useCallback(part => setDesign(d => ({...d, ...part})), []);
  const theme = themeById(design.theme), collection = collectionOf(design.theme);
  const {colors, style, glitter, density, ripple, scale, fill, look} = design;
  const art = theme.id === 'blank' ? design.art : '';

  const [progress, setProgress] = useState(.76), [unrolling, setUnrolling] = useState(false), [cut, setCut] = useState(false);
  const [playing, setPlaying] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [zoom, setZoom] = useState(1.2), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [editor, setEditor] = useState(false), [drawer, setDrawer] = useState(false), [menu, setMenu] = useState(false);
  const [toast, setToast] = useState(null), [sprites, setSprites] = useState(null), [artImage, setArtImage] = useState(null);
  const [query, setQuery] = useState('');
  const [works, setWorks] = useState(() => { try { return parseWorks(localStorage.getItem(WORKS_KEY), allThemes); } catch { return []; } });
  const [workId, setWorkId] = useState(null);
  const host = useRef(null), engine = useRef(null), cfg = useRef(null), strip = useRef(null), menuRef = useRef(null);

  cfg.current = {mode: theme.mode, theme: theme.id, colors, color: colors[0], style, glitter, extension: progress, motion: playing, view: cut ? 'strip' : 'roll', density, ripple, zoom, art, patternScale: scale, patternFill: fill, patternLook: look};

  // ---- 3D preview
  useEffect(() => {
    try { engine.current = createWaterScene(host.current, () => cfg.current, () => setReady(true), setError); }
    catch (e) { setError('The 3D preview couldn’t start in this browser. Try the latest Chrome, Edge or Safari with hardware acceleration turned on.'); console.error(e); }
    return () => engine.current?.dispose();
  }, []);
  useEffect(() => { loadSprites().then(setSprites).catch(() => setError('The artwork didn’t load. Check your connection, then refresh the page.')); }, []);
  useEffect(() => {
    if (!art) { setArtImage(null); return; }
    let live = true;
    loadImage(art).then(im => { if (live) setArtImage(im); }).catch(() => {});
    return () => { live = false; };
  }, [art]);
  useEffect(() => {
    if (!unrolling) return;
    const id = setInterval(() => setProgress(v => { if (v >= 1) { setUnrolling(false); return 1; } return Math.min(1, v + .012); }), 40);
    return () => clearInterval(id);
  }, [unrolling]);

  // ---- Flat preview: the same print the roll and the export use
  const patternOptions = useMemo(() => sprites && {...sprites, theme: theme.id, mode: theme.mode, colors, artImage: art ? artImage : null, scale, fill, look},
    [sprites, theme, colors, art, artImage, scale, fill, look]);
  const flatBase = style === 'paper' ? paperBase(colors[0], density) : colors[0];
  const emptyBlank = theme.id === 'blank' && !art;
  useEffect(() => {
    if (!patternOptions || !strip.current) return;
    paintFlat(strip.current, patternOptions, {from: 1056, to: 3616, base: flatBase});
  }, [patternOptions, flatBase]);

  // ---- Undo / redo over the whole design
  const snapshot = JSON.stringify(design);
  const committed = useRef(snapshot), past = useRef([]), future = useRef([]), restoring = useRef(false);
  const [, refresh] = useState(0);
  useEffect(() => {
    if (snapshot === committed.current) return;
    if (restoring.current) { restoring.current = false; committed.current = snapshot; refresh(n => n + 1); return; }
    const id = setTimeout(() => {
      past.current.push(committed.current); if (past.current.length > 40) past.current.shift();
      future.current = []; committed.current = snapshot; refresh(n => n + 1);
    }, 350);
    return () => clearTimeout(id);
  }, [snapshot]);
  const restore = text => { restoring.current = true; setCut(false); setDesign(JSON.parse(text)); };
  const undo = useCallback(() => {
    if (snapshot !== committed.current) { future.current.push(snapshot); restore(committed.current); return; }
    const previous = past.current.pop(); if (!previous) return;
    future.current.push(snapshot); restore(previous);
  }, [snapshot]);
  const redo = useCallback(() => {
    const next = future.current.pop(); if (!next) return;
    past.current.push(snapshot); restore(next);
  }, [snapshot]);
  const canUndo = past.current.length > 0 || snapshot !== committed.current, canRedo = future.current.length > 0;

  // ---- Persistence: the session restores after a refresh; works are explicit saves
  useEffect(() => {
    const id = setTimeout(() => { try { localStorage.setItem(SESSION_KEY, snapshot); } catch { /* the explicit save reports storage problems */ } }, 600);
    return () => clearTimeout(id);
  }, [snapshot]);
  // Keep the address bar clean: an incoming #/t/<theme> link is honoured above, then dropped.
  useEffect(() => { if (location.hash) history.replaceState(null, '', location.pathname + location.search); }, [theme.id]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), toast.action ? 7000 : 3500); return () => clearTimeout(id); }, [toast]);
  const say = (text, action) => setToast({text, action});

  const storeWorks = next => { localStorage.setItem(WORKS_KEY, JSON.stringify(next)); setWorks(next); };
  const save = () => {
    const thumb = document.createElement('canvas'); thumb.width = 360; thumb.height = 90;
    if (patternOptions) paintFlat(thumb, patternOptions, {from: 1188, to: 3236, base: flatBase});
    const id = workId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const existing = works.find(w => w.id === id);
    const name = existing?.name || displayName(theme);
    try {
      storeWorks(upsertWork(works, {id, name, savedAt: Date.now(), thumb: thumb.toDataURL('image/jpeg', .82), design}));
      setWorkId(id);
      say(existing ? `Saved changes to “${name}”` : `Saved “${name}” to My rolls`, {label: 'View', run: () => setDrawer(true)});
    } catch { say('Your browser’s storage is full, so this roll wasn’t saved. Export a PNG, or delete a few rolls from My rolls and try again.'); }
  };
  const openWork = work => { setDesign(work.design); setWorkId(work.id); setCut(false); setDrawer(false); say(`Opened “${work.name}”`); };
  const renameWork = (work, name) => { try { storeWorks(works.map(w => (w.id === work.id ? {...w, name} : w))); } catch { say('The new name wasn’t saved because your browser’s storage is full.'); } };
  const deleteWork = work => {
    const before = works;
    try { storeWorks(works.filter(w => w.id !== work.id)); } catch { return; }
    if (work.id === workId) setWorkId(null);
    say(`Deleted “${work.name}”`, {label: 'Undo', run: () => { try { storeWorks(before); } catch { /* nothing to restore into */ } }});
  };

  const choose = t => { if (t.id === theme.id) return; setDesign(d => ({...defaultDesign(t), style: d.style, art: d.art})); setWorkId(null); setCut(false); };
  const startBlank = t => { choose(t); setEditor(true); };
  // A pasted or edited link (#/t/<theme>) opens that theme without a reload.
  const chooseRef = useRef(choose); chooseRef.current = choose;
  useEffect(() => {
    const follow = () => { const linked = themeById(decodeURIComponent(location.hash.replace(/^#\/t\//, ''))); if (linked) chooseRef.current(linked); };
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);
  // One tap for a fresh idea: another palette and print style on the same motif.
  const shuffle = () => setDesign(d => {
    const palettesLeft = pops.filter(p => p[0] !== d.colors[0]), looksLeft = ['dreamy', 'stitch', 'symbol'].filter(l => l !== d.look);
    return {...d, colors: palettesLeft[Math.floor(Math.random() * palettesLeft.length)], look: theme.id === 'blank' ? d.look : looksLeft[Math.floor(Math.random() * looksLeft.length)]};
  });
  const exportFlat = () => {
    setMenu(false);
    if (!patternOptions) return;
    const flat = document.createElement('canvas'); flat.width = 3072; flat.height = 512;
    paintFlat(flat, patternOptions, {from: 512, to: 3584, base: flatBase});
    download(flat.toDataURL('image/png'), 'flat'); say('Flat strip PNG exported');
  };
  const resetLook = () => setDesign(d => ({...defaultDesign(theme), style: d.style, art: d.art}));

  const download = (url, kind) => { const a = document.createElement('a'); a.href = url; a.download = `Luma Tape-${displayName(theme)}-${styleName(style)}-${kind}.png`; a.click(); };
  const exportSticker = async () => { setMenu(false); try { download(await engine.current.exportSticker(), 'sticker'); say('Sticker PNG exported'); } catch { say('The export didn’t work. Refresh the page and try again.'); } };
  const exportShowcase = async () => { setMenu(false); try { download(await engine.current.exportPng(), 'showcase'); say('Showcase PNG exported'); } catch { say('The export didn’t work. Refresh the page and try again.'); } };

  // ---- Keyboard: undo/redo anywhere outside text fields, arrows on the roll
  useEffect(() => {
    const key = e => {
      if (editor || drawer) return;
      if (e.key === 'Escape') setMenu(false);
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range') return;
      e.preventDefault(); if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [editor, drawer, undo, redo]);
  useEffect(() => {
    if (!menu) return;
    const away = e => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, [menu]);
  const stageKey = e => {
    const step = {ArrowLeft: [-.14, 0], ArrowRight: [.14, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05]}[e.key];
    if (step) { e.preventDefault(); engine.current?.nudge(...step); }
    if (e.key === 'Home') { e.preventDefault(); engine.current?.reset(); }
  };
  const resetView = () => { engine.current?.reset(); setZoom(1.2); };
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const busy = !ready || !!error;

  return <div className="app" style={{'--tape': colors[0], '--tape-deep': colors[1], '--tape-accent': colors[2]}}>
    <header className="topbar">
      <span className="brand" translate="no">Luma Tape<sup>(studio)</sup></span>
      <div className="search">
        <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tapes: sakura, INFP, Mars…" aria-label="Search tapes" autoComplete="off" spellCheck={false} />
        {query && <button className="icon-button small" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} weight="bold" /></button>}
      </div>
      <button className="button quiet" onClick={() => setDrawer(true)}>My rolls{works.length > 0 && <span className="count">{works.length}</span>}</button>
      <button className="button" onClick={save}>{workId ? 'Save changes' : 'Save'}</button>
      <div className="menu-anchor" ref={menuRef}>
        <button className="button primary" disabled={busy} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><DownloadSimple size={18} weight="bold" />Export<CaretDown size={13} weight="bold" /></button>
        {menu && <div className="menu" role="menu">
          <button role="menuitem" onClick={exportFlat}><strong>Flat strip</strong><small>The print laid flat. PNG, 3072 × 512. Best for GoodNotes and digital journals.</small></button>
          <button role="menuitem" onClick={exportSticker}><strong>Sticker, transparent</strong><small>A cut strip. PNG, 2400 × 1400. Drops straight into your journal.</small></button>
          <button role="menuitem" onClick={exportShowcase}><strong>Showcase, white</strong><small>The whole roll at this angle. PNG, 2400 × 1600. Made for sharing.</small></button>
        </div>}
      </div>
    </header>

    <div className="workspace">
      <Library sprites={sprites} themeId={theme.id} query={query} onQuery={setQuery} onChoose={choose} onBlank={startBlank} />

      <main className="stage-col">
        <div className="title-row">
          <div>
            <h1>{theme.id === 'blank' ? 'Your Own Tape' : displayName(theme)}</h1>
            <p className="subtitle"><span>{collection.en}</span><span>{styleName(style)}</span>{theme.id !== 'blank' && <span>{lookNames[look]}</span>}</p>
          </div>
          <div className="title-actions">
          <button className="button" onClick={shuffle}><Shuffle size={16} weight="bold" />Shuffle</button>
          <div className="history">
            <button className="icon-button" disabled={!canUndo} onClick={undo} aria-label="Undo" title="Undo (⌘Z)"><ArrowUUpLeft size={19} weight="bold" /></button>
            <button className="icon-button" disabled={!canRedo} onClick={redo} aria-label="Redo" title="Redo (⇧⌘Z)"><ArrowUUpRight size={19} weight="bold" /></button>
          </div>
          </div>
        </div>

        <div className="stage" data-testid="world-stage">
          <div ref={host} className="three-host" tabIndex={0} role="img" onKeyDown={stageKey}
            aria-label={`3D preview of ${displayName(theme)} in ${styleName(style)}. Drag or use the arrow keys to turn it. Press Home to reset the view.`} />
          {!ready && !error && <div className="stage-status">Unrolling your tape…</div>}
          {error && <div className="stage-status error" role="alert">{error}</div>}
          <span className="fig" aria-hidden="true">( fig. {String(allThemes.indexOf(theme) + 1).padStart(2, '0')} )</span>
          <div className="stage-tools">
            <span className="hint"><HandGrabbing size={18} weight="bold" />Drag to turn</span>
            <button className="button small" onClick={resetView}><ArrowCounterClockwise size={15} weight="bold" />Reset view</button>
            <button className="icon-button" onClick={() => setZoom(z => Math.max(.75, +(z - .08).toFixed(2)))} disabled={zoom <= .75} aria-label="Zoom out"><Minus size={15} weight="bold" /></button>
            <button className="icon-button" onClick={() => setZoom(z => Math.min(1.7, +(z + .08).toFixed(2)))} disabled={zoom >= 1.7} aria-label="Zoom in"><Plus size={15} weight="bold" /></button>
          </div>
        </div>

        <div className="roll-bar">
          <Slider label={cut ? 'Cut length' : 'Pull out'} value={progress} onChange={v => { setUnrolling(false); setProgress(v); }} />
          <button className="button" onClick={() => { setCut(false); setProgress(0); setUnrolling(true); }}><ArrowCounterClockwise size={16} weight="bold" />Unroll again</button>
          <button className={cut ? 'button selected' : 'button'} aria-pressed={cut} onClick={() => { setCut(!cut); setUnrolling(false); }}><Scissors size={17} weight="bold" />{cut ? 'Put it back' : 'Cut a strip'}</button>
          {style === 'world' && <button className="button" aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}{playing ? 'Pause shimmer' : 'Play shimmer'}</button>}
        </div>

        <section className="pattern" aria-labelledby="pattern-title">
          <div className="pattern-head">
            <h2 id="pattern-title">The print, flat</h2>
            <button className="button" onClick={() => (theme.id === 'blank' ? setEditor(true) : startBlank(themeById('blank')))}>
              <PaintBrush size={17} weight="bold" />{theme.id === 'blank' ? (art ? 'Keep drawing' : 'Start drawing') : 'Draw your own'}
            </button>
          </div>
          <div className={emptyBlank ? 'strip empty-strip' : 'strip'} style={{background: flatBase}}>
            <canvas ref={strip} width={1600} height={320} role="img" aria-label={`Flat print of ${displayName(theme)}`} />
            {emptyBlank && <button className="strip-cta" onClick={() => setEditor(true)}>This roll is blank. Draw on it, add stickers, or upload your own art.</button>}
          </div>
        </section>
      </main>

      <aside className="inspector" aria-label="Customize">
        <section>
          <h3>Material</h3>
          <div className="materials">
            <button className={style === 'world' ? 'material selected' : 'material'} aria-pressed={style === 'world'} onClick={() => patch({style: 'world'})}>
              <span className="swatch glitter-swatch">{style === 'world' && <Check size={13} weight="bold" />}</span>Glitter film
            </button>
            <button className={style === 'paper' ? 'material selected' : 'material'} aria-pressed={style === 'paper'} onClick={() => patch({style: 'paper'})}>
              <span className="swatch paper-swatch">{style === 'paper' && <Check size={13} weight="bold" />}</span>Washi paper
            </button>
          </div>
          <p className="help">{style === 'paper' ? 'Opaque paper with visible fibres and a crisp print.' : 'Clear film with the print and glitter inside. It sparkles as you turn it.'}</p>
        </section>

        <section>
          <h3>Colors</h3>
          <div className="palette-row">
            {palettes.map(([name, p]) => { const on = p.every((c, i) => c === colors[i]); return <button key={name} className={on ? 'dot selected' : 'dot'} style={{background: p[0]}} aria-label={`${name} palette`} aria-pressed={on} title={name} onClick={() => patch({colors: p})}>{on && <Check size={14} weight="bold" />}</button>; })}
          </div>
          <div className="wells">
            {['Base', 'Print', 'Accent'].map((label, i) => <label key={label} className="well">
              <span className="well-dot" style={{background: colors[i]}}><input type="color" value={colors[i]} aria-label={`${label} color`} onChange={e => patch({colors: colors.map((c, j) => (i === j ? e.target.value : c))})} /></span>
              <span>{label}</span><code>{colors[i].toUpperCase()}</code>
            </label>)}
          </div>
          <button className="button wide" onClick={() => patch({colors: harmonize(colors[0])})}><MagicWand size={17} weight="bold" />Match to base color</button>
          <Slider label={style === 'paper' ? 'Color depth' : 'Film tint'} value={density} onChange={v => patch({density: v})} />
        </section>

        <section>
          <h3>Finish</h3>
          <Slider label={style === 'paper' ? 'Paper fibre' : 'Ripple'} value={ripple} onChange={v => patch({ripple: v})} />
          <Slider label="Glitter" value={glitter} onChange={v => patch({glitter: v})} />
        </section>

        {theme.id !== 'blank' && <section>
          <h3>Print</h3>
          <div className="segments" role="group" aria-label="Print style">
            {Object.entries(lookNames).map(([id, name]) => <button key={id} className={look === id ? 'selected' : ''} aria-pressed={look === id} onClick={() => patch({look: id})}>{name}</button>)}
          </div>
          <Slider label="Size" value={scale} min={.6} max={1.4} onChange={v => patch({scale: v})} />
          <Slider label="Density" value={fill} onChange={v => patch({fill: v})} />
        </section>}

        <button className="button wide quiet" onClick={resetLook}><ArrowCounterClockwise size={16} weight="bold" />Reset this tape</button>
      </aside>
    </div>

    {editor && <DrawingEditor art={design.art} base={flatBase} ink={colors[1]} sprites={sprites} onClose={() => setEditor(false)}
      onApply={value => { patch({art: value}); setEditor(false); say('Your art is on the tape'); }} />}
    {drawer && <WorksDrawer works={works} currentId={workId} onOpen={openWork} onRename={renameWork} onDelete={deleteWork} onClose={closeDrawer} />}
    {toast && <div className="toast" role="status"><span>{toast.text}</span>{toast.action && <button onClick={() => { toast.action.run(); setToast(null); }}>{toast.action.label}</button>}</div>}
  </div>;
}
