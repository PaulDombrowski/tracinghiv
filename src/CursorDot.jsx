import React from 'react';

export default function CursorDot({ white = false }) {
  const dotRef = React.useRef(null);

  React.useEffect(() => {
    const dot = dotRef.current; if (!dot) return;
    const move = (e) => {
      const x = ('touches' in e) ? e.touches[0].clientX : e.clientX;
      const y = ('touches' in e) ? e.touches[0].clientY : e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
    };
  }, []);

  return (
    <>
      <style>{`
        ._useCustomCursor { cursor: none; }
        ._cursorDot { position: fixed; z-index: 11; left: 0; top: 0; width: 10px; height: 10px; border-radius: 50%; pointer-events: none; transform: translate(-50%, -50%); will-change: transform, background, box-shadow; transition: background 120ms ease; }
        ._cursorDot._red { background: #ff0000; box-shadow: 0 0 12px rgba(255,0,0,.35); }
        ._cursorDot._white { background: #ffffff; box-shadow: 0 0 14px rgba(255,255,255,.55); width: 12px; height: 12px; }
        @media (hover: none) and (pointer: coarse) { ._useCustomCursor { cursor: auto; } ._cursorDot { display: none; } }
      `}</style>
      <div ref={dotRef} className={`_cursorDot ${white ? '_white' : '_red'}`} aria-hidden />
    </>
  );
}