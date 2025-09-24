import { useEffect, useState } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*&?@';

export function useScrambleText(text, triggerKey) {
  const [display, setDisplay] = useState(text || '');

  useEffect(() => {
    const target = text ?? '';
    if (!target) {
      setDisplay('');
      return () => {};
    }
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setDisplay(target);
      return () => {};
    }

    let frame = 0;
    const length = target.length || 1;
    const totalFrames = Math.min(48, Math.max(18, length * 2));
    let raf = null;

    const update = () => {
      const reveal = Math.floor((frame / totalFrames) * length);
      const output = target.split('').map((char, idx) => {
        if (char === ' ' || char === '\n') return char;
        if (idx <= reveal) return char;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');
      setDisplay(output);
      frame += 1;
      if (frame <= totalFrames) {
        raf = window.requestAnimationFrame(update);
      } else {
        setDisplay(target);
      }
    };

    setDisplay('');
    raf = window.requestAnimationFrame(update);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [text, triggerKey]);

  return display;
}

export function ScrambleText({ text, triggerKey, as: Component = 'span', ...rest }) {
  const value = useScrambleText(text, triggerKey);
  return <Component {...rest}>{value}</Component>;
}
