// src/RedMenuOverlay.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Fullscreen rotes Fade-Menü (Titel bleibt darüber sichtbar).
 * - Klick auf roten Hintergrund schließt das Menü.
 * - Klick auf Items schließt das Menü (Navigation kann oben drauf gesetzt werden).
 * - Items animieren „glitchy“ wie der Titel.
 */
export default function RedMenuOverlay({ open, onClose, items = [] }) {
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
        ._menuOverlay { position: fixed; inset: 0; z-index: 9; pointer-events: auto; }
        /* Solid red backdrop (no transparency) */
        ._menuOverlay::before { content: ''; position: absolute; inset: 0; background: rgb(255, 0, 0); }
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
      {/* Close Button (big white X) */}
      <button
        type="button"
        className="_menuClose"
        aria-label="Close menu"
        onClick={(e) => { e.stopPropagation(); onClose?.(); }}
      >
        ×
      </button>

      <div className="_menuContent">
        <ul className="_menuList">
          {items.map((label) => (
            <li
              key={label}
              className="_menuItem"
              onClick={() => onClose?.()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose?.()}
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
