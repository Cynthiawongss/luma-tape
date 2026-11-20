import {useEffect, useRef, useState} from 'react';
import {ArrowUUpLeft, ArrowUUpRight, Eraser, PaintBrush, Sticker, TextT, Trash, UploadSimple, X} from '@phosphor-icons/react';
import {loadImage} from './sprites';
import {assetUrl} from './assets';
import {cleanSprite} from './patterns';

const W = 1200, H = 360;
const inks = ['#1f1f1f', '#e2483d', '#f08a24', '#f2c230', '#3f9a5a', '#2f6fe0', '#8a5cd6', '#ffffff'];

// Every illustration the themes use is also a sticker you can place yourself.
function stickerList(sprites, extra) {
  const list = [];
  if (sprites) {
    list.push({id: 'koi', label: 'Koi', source: cleanSprite(sprites.koi), ratio: .5});
    const sheet = cleanSprite(sprites.atlas), cell = sheet.width / 6;
    for (let i = 0; i < 36; i++) list.push({id: `m${i}`, label: `Sticker ${i + 1}`, source: sheet, crop: [(i % 6) * cell, Math.floor(i / 6) * cell, cell, cell], ratio: 1});
  }
  for (const [id, label] of [['butterfly', 'Butterfly'], ['daisies', 'Daisies']]) if (extra[id]) list.push({id, label, source: cleanSprite(extra[id]), ratio: extra[id].height / extra[id].width});
  return list;
}
function drawSticker(ctx, s, x, y, width) {
  const h = width * s.ratio;
  if (s.crop) ctx.drawImage(s.source, ...s.crop, x - width / 2, y - h / 2, width, h);
  else ctx.drawImage(s.source, x - width / 2, y - h / 2, width, h);
}
function StickerThumb({sticker}) {
  const ref = useRef(null);
  useEffect(() => { const ctx = ref.current.getContext('2d'); ctx.clearRect(0, 0, 96, 96); drawSticker(ctx, sticker, 48, 48, sticker.ratio > 1 ? 86 / sticker.ratio : 86); }, [sticker]);
  return <canvas ref={ref} width={96} height={96} aria-hidden="true" />;
}

export function DrawingEditor({onClose, onApply, art, base, ink: startInk, sprites}) {
  const canvas = useRef(null), drawing = useRef(null), undoStack = useRef([]), redoStack = useRef([]), closeRef = useRef(null);
  const [tool, setTool] = useState('brush'), [ink, setInk] = useState(startInk || inks[0]), [size, setSize] = useState(18);
  const [stickerId, setStickerId] = useState('koi'), [stickerSize, setStickerSize] = useState(150), [words, setWords] = useState('');
  const [extra, setExtra] = useState({}), [, refresh] = useState(0), [notice, setNotice] = useState('');
  const stickers = stickerList(sprites, extra), sticker = stickers.find(s => s.id === stickerId) || stickers[0];
  const context = () => canvas.current.getContext('2d', {willReadFrequently: true});

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    for (const id of ['butterfly', 'daisies']) loadImage(assetUrl(`${id}.png`)).then(image => setExtra(e => ({...e, [id]: image}))).catch(() => {});
    if (art) loadImage(art).then(image => canvas.current?.getContext('2d').drawImage(image, 0, 0, W, H)).catch(() => {});
    return () => opener?.focus?.();
  }, []);

  const remember = () => { undoStack.current.push(context().getImageData(0, 0, W, H)); if (undoStack.current.length > 30) undoStack.current.shift(); redoStack.current = []; refresh(n => n + 1); };
  const step = (from, to) => { const image = from.current.pop(); if (!image) return; const ctx = context(); to.current.push(ctx.getImageData(0, 0, W, H)); ctx.putImageData(image, 0, 0); refresh(n => n + 1); };
  const undo = () => step(undoStack, redoStack), redo = () => step(redoStack, undoStack);

  useEffect(() => {
    const key = e => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.target.type !== 'text') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const point = e => { const r = canvas.current.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  const down = e => {
    const ctx = context(), [x, y] = point(e);
    if (tool === 'text' && !words.trim()) { setNotice('Type something in the box above first, then tap the canvas.'); return; }
    setNotice(''); remember();
    if (tool === 'brush' || tool === 'eraser') {
      try { canvas.current.setPointerCapture(e.pointerId); } catch { /* a pointer that is already gone still draws its dot */ }
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = ink; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + .1, y + .1); ctx.stroke();
      drawing.current = {x, y};
    } else if (tool === 'sticker' && sticker) drawSticker(ctx, sticker, x, y, stickerSize);
    else if (tool === 'text') {
      ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(size * 2.4 + 16)}px ui-rounded, "SF Pro Rounded", -apple-system, "Segoe UI", "PingFang SC", sans-serif`;
      ctx.fillText(words.trim(), x, y);
    }
  };
  // Midpoint smoothing keeps fast strokes round instead of polygonal.
  const move = e => {
    const last = drawing.current; if (!last) return;
    const ctx = context();
    for (const event of e.nativeEvent.getCoalescedEvents?.() ?? [e]) {
      const [x, y] = point(event), mx = (last.x + x) / 2, my = (last.y + y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, mx, my); ctx.stroke(); ctx.beginPath(); ctx.moveTo(mx, my);
      last.x = x; last.y = y;
    }
  };
  const up = () => { if (drawing.current) { drawing.current = null; context().globalCompositeOperation = 'source-over'; } };

  const upload = e => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => setNotice('That image couldn’t be read. Try another PNG or JPG.');
    reader.onload = () => loadImage(reader.result).then(image => {
      remember();
      const k = Math.min(1100 / image.width, 300 / image.height, 1), w = image.width * k, h = image.height * k;
      context().drawImage(image, (W - w) / 2, (H - h) / 2, w, h); setNotice('');
    }).catch(() => setNotice('That file isn’t a usable image. Try a PNG or JPG.'));
    reader.readAsDataURL(file);
  };
  const clear = () => { remember(); context().clearRect(0, 0, W, H); };

  const toolButton = (id, label, Icon) => <button className={tool === id ? 'button selected' : 'button'} aria-pressed={tool === id} onClick={() => setTool(id)}><Icon size={17} />{label}</button>;

  return <div className="scrim center">
    <section className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <header>
        <div><h2 id="editor-title">Draw your own tape</h2><p>The canvas is one flat stretch of tape. Your art repeats along the roll.</p></div>
        <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close without using these changes"><X size={20} /></button>
      </header>

      <div className="editor-tools">
        {toolButton('brush', 'Brush', PaintBrush)}{toolButton('eraser', 'Eraser', Eraser)}{toolButton('sticker', 'Stickers', Sticker)}{toolButton('text', 'Text', TextT)}
        <label className="button upload"><UploadSimple size={17} />Upload<input type="file" accept="image/*" onChange={upload} /></label>
        <span className="spacer" />
        <button className="button quiet" disabled={!undoStack.current.length} onClick={undo}><ArrowUUpLeft size={17} />Undo</button>
        <button className="button quiet" disabled={!redoStack.current.length} onClick={redo}><ArrowUUpRight size={17} />Redo</button>
        <button className="button quiet" onClick={clear}><Trash size={17} />Clear</button>
      </div>

      <div className="editor-options">
        {(tool === 'brush' || tool === 'text') && <div className="ink-row" role="group" aria-label="Color">
          {inks.map(c => <button key={c} className={c === ink ? 'dot selected' : 'dot'} style={{background: c}} aria-label={`Color ${c}`} aria-pressed={c === ink} onClick={() => setInk(c)} />)}
          <label className="dot custom" style={{background: ink}} title="Custom color"><input type="color" value={ink} onChange={e => setInk(e.target.value)} aria-label="Custom color" /></label>
        </div>}
        {tool !== 'sticker' && <label className="inline-range">{tool === 'text' ? 'Size' : 'Width'}<input type="range" min="3" max="60" value={size} onChange={e => setSize(+e.target.value)} /></label>}
        {tool === 'text' && <input className="text-field" type="text" value={words} onChange={e => setWords(e.target.value)} placeholder="Type something, then tap the canvas…" aria-label="Text to place" maxLength={40} />}
        {tool === 'sticker' && <>
          <label className="inline-range">Size<input type="range" min="60" max="320" value={stickerSize} onChange={e => setStickerSize(+e.target.value)} /></label>
          <div className="sticker-grid" role="group" aria-label="Choose a sticker">
            {stickers.map(s => <button key={s.id} className={s.id === sticker?.id ? 'sticker selected' : 'sticker'} aria-label={s.label} aria-pressed={s.id === sticker?.id} onClick={() => setStickerId(s.id)}><StickerThumb sticker={s} /></button>)}
          </div>
        </>}
      </div>

      <div className="editor-paper" style={{background: base}}>
        <canvas ref={canvas} width={W} height={H} className={`tool-${tool}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Tape canvas" />
      </div>
      <p className="editor-notice" role="status">{notice || {brush: 'Press and drag to draw.', eraser: 'Press and drag to erase.', sticker: 'Tap the canvas to place a sticker. Tap again for more.', text: 'Tap the canvas to place your text.'}[tool]}</p>

      <footer>
        <button className="button" onClick={onClose}>Cancel</button>
        <button className="button primary" onClick={() => onApply(canvas.current.toDataURL('image/png'))}>Use on my tape</button>
      </footer>
    </section>
  </div>;
}
