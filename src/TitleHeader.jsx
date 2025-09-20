import React, { useEffect, useRef, useState } from 'react';

export default function TitleHeader({ titleText, glitchSet }) {
  const lineRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Fit the single-line header into the viewport width by scaling down if needed
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;

    const compute = () => {
      // Available width: viewport minus inline padding estimated here to match CSS clamp
      const vw = window.innerWidth || 1;
      // Read computed padding from styles to be precise
      const cs = window.getComputedStyle(el);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const available = Math.max(1, vw - padL - padR);

      // Reset scale to measure natural width
      el.style.setProperty('--hdrScale', '1');
      const needed = el.scrollWidth;
      const s = Math.min(1, available / Math.max(1, needed));
      el.style.setProperty('--hdrScale', String(s));
      setScale(s);
    };

    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [titleText]);

  return (
    <header className="_pageHeader" aria-hidden>
      <style>{`
        :root { --hdrH: clamp(72px, 12vh, 160px); }
        ._pageHeader {
          position: fixed; top: 0; left: 0; right: 0; height: var(--hdrH);
          z-index: 10; pointer-events: none; display: grid; place-items: center; text-align: center;
        }
        ._titleLine {
          box-sizing: border-box;
          display: inline-flex;
          flex-wrap: nowrap; /* ALWAYS one line */
          align-items: baseline;
          justify-content: center;
          gap: clamp(8px, 1.8vw, 26px); /* spacing BETWEEN words */
          font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-weight: 900;
          letter-spacing: clamp(1px, 0.5vw, 10px); line-height: 1; font-size: clamp(22px, 7vw, 96px);
          text-transform: uppercase; color: #ff0000; text-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 0 14px rgba(255,0,0,0.18);
          user-select: none; padding-inline: clamp(6px, 2.5vw, 20px);
          max-width: 100vw; width: 100%;
          transform: scale(var(--hdrScale, 1));
          transform-origin: 50% 0%; /* center-top */
          will-change: transform;
          white-space: nowrap; /* enforce one line */
          overflow: visible;
        }
        @media (max-width: 560px) {
          ._titleLine { font-size: clamp(22px, 9vw, 64px); }
        }
        ._titleLetter { display: inline-block; transform: translateZ(0); transition: transform .16s ease, text-shadow .16s ease, font-family .16s ease; }
        ._titleLetter._glitch {
          font-family: 'Times New Roman', Georgia, 'Courier New', 'Comic Sans MS', cursive, serif !important;
          font-style: italic; transform: translateY(-2px) rotateZ(-2deg) scale(1.035);
          text-shadow: 0 0 0 rgba(0,0,0,0), 0 0 22px rgba(147,112,219,0.25), 0 0 18px rgba(255,0,0,0.25);
        }
      `}</style>
      <div ref={lineRef} className="_titleLine" style={{ ['--hdrScale']: scale }}>
        {(() => {
          let gi = 0; // global index across all characters including spaces
          const parts = [];
          const words = titleText.split(' ');
          words.forEach((word, wi) => {
            const wordSpans = [];
            for (let ci = 0; ci < word.length; ci++) {
              const ch = word[ci];
              const isGlitch = glitchSet.has(gi);
              wordSpans.push(
                <span key={`w${wi}c${ci}`} className={isGlitch ? '_titleLetter _glitch' : '_titleLetter'}>
                  {ch}
                </span>
              );
              gi += 1;
            }
            parts.push(
              <span key={`w${wi}`} style={{ display: 'inline-flex' }}>{wordSpans}</span>
            );
            if (wi < words.length - 1) {
              // account for the space in the global index; space not rendered but counted for glitchSet alignment
              gi += 1;
            }
          });
          return parts;
        })()}
      </div>
    </header>
  );
}