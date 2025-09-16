// src/RedMenuOverlay.jsx
import React, { useEffect, useRef, useState } from 'react';
import About from './About';
import Shuffle from './Shuffle';
import Upload from './Upload';
import Imprint from './Imprint';

/**
 * Fullscreen rotes Fade-Menü (Titel bleibt darüber sichtbar).
 * - Klick auf roten Hintergrund schließt das Menü.
 * - Klick auf Items schließt das Menü (Navigation kann oben drauf gesetzt werden).
 * - Items animieren „glitchy“ wie der Titel.
 */
export default function RedMenuOverlay({ open, onClose, items = [], selectedKey, onSelect, onBack, sentences = {}, onOpenArchiveItem }) {
  const [moving, setMoving] = useState(false);
  const moveTO = useRef(null);

  // mark as moving while the pointer moves; stop shortly after
  const handleMouseMove = () => {
    if (!open) return;
    setMoving(true);
    if (moveTO.current) clearTimeout(moveTO.current);
    moveTO.current = setTimeout(() => setMoving(false), 140);
  };

  useEffect(() => () => moveTO.current && clearTimeout(moveTO.current), []);

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const dprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const resize = () => {
      const dpr = (window.devicePixelRatio || 1);
      dprRef.current = dpr;
      const w = window.innerWidth; const h = window.innerHeight;
      cvs.width = Math.floor(w * dpr);
      cvs.height = Math.floor(h * dpr);
      cvs.style.width = w + 'px';
      cvs.style.height = h + 'px';
    };
    resize();

    const ctx = cvs.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getXY = (e) => {
      const x = ('touches' in e) ? e.touches[0].clientX : e.clientX;
      const y = ('touches' in e) ? e.touches[0].clientY : e.clientY;
      return { x, y };
    };

    const down = (e) => {
      e.preventDefault();
      drawingRef.current = true;
      lastRef.current = getXY(e);
    };
    const up = (e) => { drawingRef.current = false; };
    const move = (e) => {
      if (!drawingRef.current) return;
      const { x, y } = getXY(e);
      const dpr = dprRef.current;
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.96;
      ctx.lineWidth = 2.6 * dpr;
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x * dpr, lastRef.current.y * dpr);
      ctx.lineTo(x * dpr, y * dpr);
      ctx.stroke();
      lastRef.current = { x, y };
    };

    cvs.addEventListener('mousedown', down);
    cvs.addEventListener('mouseup', up);
    cvs.addEventListener('mousemove', move);
    cvs.addEventListener('mouseleave', up);
    cvs.addEventListener('touchstart', down, { passive: false });
    cvs.addEventListener('touchend', up);
    cvs.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('resize', resize);

    return () => {
      cvs.removeEventListener('mousedown', down);
      cvs.removeEventListener('mouseup', up);
      cvs.removeEventListener('mousemove', move);
      cvs.removeEventListener('mouseleave', up);
      cvs.removeEventListener('touchstart', down);
      cvs.removeEventListener('touchend', up);
      cvs.removeEventListener('touchmove', move);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`_menuOverlay ${moving ? '_moving' : ''}`}
      onMouseDown={(e) => {
        e.stopPropagation();
        const target = e.target;
        // Close only if clicking real backdrop, not the canvas or menu content
        if (target.classList && target.classList.contains('_menuOverlay')) onClose?.();
      }}
      onMouseMove={handleMouseMove}
      role="dialog"
      aria-modal="true"
      aria-hidden={false}
    >
      <style>{`
        /* Fixed scroll region for non-Archive content (About / Shuffle / Upload / Imprint) */
        ._scrollRegion {
          position: fixed;
          left: 0; right: 0;
          top: calc(var(--hdrH, 120px) + 76px);
          bottom: 0;
          overflow: auto;
          z-index: 9; /* below controls bar (z:10), above red backdrop */
          padding: 12px clamp(10px, 2vw, 20px) 16px; /* always a little top spacing */
          pointer-events: auto;
          -webkit-overflow-scrolling: touch;
        }
        /* Center inner content similar to Archive/ItemDetail widths */
        ._contentWrap { display: grid; place-items: start center; min-height: 0; padding: 0; }
        ._contentInner { width: min(1200px, 92vw); color: #fff; text-align: left; }
        ._contentTitle { font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(18px, 7vw, 64px); letter-spacing: .06em; text-transform: uppercase; margin: 0 0 12px; margin-top: 0; white-space: nowrap; overflow-wrap: normal; word-break: keep-all; word-spacing: .16em; }
        @media (max-width: 560px) { ._contentTitle { white-space: normal; text-wrap: balance; line-height: 1.08; } }
        @media (max-width: 760px) {
          ._scrollRegion { top: calc(var(--hdrH, 120px) + 64px); padding: 10px 12px 14px; }
          ._contentInner { width: 100%; }
        }
        ._backBtn { position: absolute; top: clamp(12px, 2vh, 20px); left: clamp(12px, 2vw, 20px); z-index: 10; background: rgba(255,255,255,0.96); color: #cc0000; border: none; border-radius: 999px; padding: 10px 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; box-shadow: 0 8px 18px rgba(0,0,0,0.18); }
        ._backBtn:hover { filter: brightness(0.96); transform: translateY(-1px); }
        ._backBtn:active { transform: translateY(0); }
        ._contentBody { font-size: clamp(14px, 2.4vw, 18px); line-height: 1.6; color: #fff; }
        ._menuList._hidden { display: none; }
        ._menuOverlay { position: fixed; inset: 0; z-index: 9; pointer-events: auto; isolation: isolate; }
        /* Luminance-preserving red tint (keeps details of 3D model) */
        ._menuOverlay::before {
          content: '';
          position: absolute; inset: 0;
          background: #ff0000; /* solid red */
          mix-blend-mode: color; /* preserve luminance/detail, tint only */
          opacity: 1;
          z-index: 0;
        }
        /* Subtle vignette + tiny contrast/saturation boost to bring back edges */
        ._menuOverlay::after {
          content: '';
          position: absolute; inset: 0;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.25) 100%);
          backdrop-filter: saturate(1.1) contrast(1.06);
          -webkit-backdrop-filter: saturate(1.1) contrast(1.06);
        }
        /* Fallback for browsers without blend-mode support */
        @supports not (mix-blend-mode: color) {
          ._menuOverlay::before { background: rgba(255,0,0,0.82); }
        }
        ._menuContent { position: absolute; inset: 0; display: grid; place-items: center; opacity: 1; transform: none; z-index: 9; }
        ._menuList { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(8px, 2.6vh, 22px); }
        ._menuItem { text-align: center; font-family: 'Arial Black', Arial, Helvetica, sans-serif; text-transform: uppercase; color: #fff; font-size: clamp(18px, 6vw, 54px); letter-spacing: clamp(1px, 0.5vw, 8px); line-height: 1; cursor: pointer; user-select: none; position: relative; isolation: isolate; }
        ._menuItem::after {
          content: '';
          position: absolute; left: 50%; bottom: -6px; height: 2px; width: 0%; transform: translateX(-50%);
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 50%, #fff 100%);
          border-radius: 2px; box-shadow: 0 0 10px rgba(255,255,255,.45);
          transition: width .28s cubic-bezier(.2,.8,.2,1);
        }
        ._menuItem:hover { letter-spacing: clamp(1.2px, 0.6vw, 10px); transform: translateY(-2px) skewX(-1deg); }
        ._menuItem:hover::after { width: 82%; }

        /* Big white close X inside the overlay, top-right */
        ._menuClose { position: absolute; top: clamp(10px, 2vh, 16px); right: clamp(10px, 2vh, 16px); z-index: 10; border: none; background: none; color: #fff; font-size: clamp(28px, 6vw, 56px); line-height: 1; padding: 4px 10px; cursor: pointer; -webkit-tap-highlight-color: transparent; text-shadow: 0 2px 10px rgba(0,0,0,0.25); }
        ._menuClose:hover { opacity: .9; }
        ._menuClose:focus { outline: 2px solid rgba(255,255,255,.75); outline-offset: 2px; border-radius: 6px; }
        ._drawPad { position: absolute; inset: 0; z-index: 8; pointer-events: auto; background: transparent; }

        /* Controls bar styles (centered under global header) */
        ._controlsBar {
          position: absolute;
          top: calc(var(--hdrH, 120px) + 8px);
          left: 0; right: 0;
          display: flex; align-items: center; justify-content: center;
          gap: clamp(10px, 2.6vw, 22px);
          z-index: 10;
          pointer-events: auto;
        }
        ._ctrlBtn {
          background: rgba(255,255,255,0.96);
          color: #cc0000;
          border: none; border-radius: 999px;
          padding: 10px 14px; font-weight: 800; text-transform: uppercase;
          letter-spacing: .06em; cursor: pointer; box-shadow: 0 8px 18px rgba(0,0,0,0.18);
        }
        ._ctrlBtn:hover { filter: brightness(0.96); transform: translateY(-1px); }
        ._ctrlBtn:active { transform: translateY(0); }
        ._ctrlBtn._close { background: rgba(255,255,255,0.92); }
        ._ctrlBtn._back  { background: rgba(255,255,255,0.96); }
      `}</style>
      {/* White drawing pad (canvas) */}
      <canvas
        ref={canvasRef}
        className="_drawPad"
        aria-hidden
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      />

      {/* Controls bar: centered under global header */}
      <div className="_controlsBar" onMouseDown={(e) => e.stopPropagation()}>
        {selectedKey && (
          <button type="button" className="_ctrlBtn _back" onClick={(e) => { e.stopPropagation(); onBack?.(); }} aria-label="Back">← Back</button>
        )}
        <button type="button" className="_ctrlBtn _close" onClick={(e) => { e.stopPropagation(); onClose?.(); }} aria-label="Close">Close ×</button>
      </div>

      <div className="_menuContent">
        <ul className={"_menuList" + (selectedKey ? ' _hidden' : '')}>
          {items.map((label) => (
            <li
              key={label}
              className="_menuItem"
              onClick={() => onSelect?.(label)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(label)}
            >
              {label}
            </li>
          ))}
        </ul>
        {selectedKey && selectedKey !== 'Archive' && (
          <div className="_scrollRegion" onMouseDown={(e) => e.stopPropagation()}>
            <div className="_contentWrap">
              <div className="_contentInner">
                {selectedKey !== 'Shuffle' && selectedKey !== 'About' && (
                  <h2 className="_contentTitle">{sentences[selectedKey] || selectedKey}</h2>
                )}
                <div className="_contentBody">
                  {selectedKey === 'About' && <About />}
                  {selectedKey === 'Shuffle' && <Shuffle onOpenItem={onOpenArchiveItem} />}
                  {selectedKey === 'Upload' && <Upload />}
                  {selectedKey === 'Imprint' && <Imprint />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}