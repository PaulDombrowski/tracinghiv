import React, { useEffect, useRef, useState } from 'react';
import TitleHeader from './TitleHeader';
import CursorDot from './CursorDot';
import StageColumns from './StageColumns';
import RedMenuOverlay from './RedMenuOverlay';
import Archive, { ItemDetail } from './Archive';




function Hauptseite() {
  const [selectedArchiveItemId, setSelectedArchiveItemId] = useState(null);
  // --- MENU state & helpers ---
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfOn, setPdfOn] = useState(false);

  // ESC to close + lock body scroll when menu is open
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle('_pdfOn', pdfOn);
    if (pdfOn) {
      const revealNow = () => {
        const vh = window.innerHeight || 1;
        document.querySelectorAll('._pdfWrap').forEach((el) => {
          if (!el.classList.contains('_visible')) {
            const r = el.getBoundingClientRect();
            if (r.top < vh * 0.96 && r.bottom > 0) {
              el.classList.add('_visible');
              el.style.removeProperty('opacity');
              el.style.removeProperty('transform');
              el.style.removeProperty('filter');
            }
          }
        });
      };
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(revealNow);
      } else {
        revealNow();
      }
    }
    return () => {
      document.body.classList.remove('_pdfOn');
    };
  }, [pdfOn]);

  // --- INTERAKTIVER TITEL (TRACES OF HIV) ---
  const MENU_SENTENCES = {
    About: 'What is this archive?',
    Archive: 'Browse all items',
    Shuffle: 'Discover at random',
    Upload: 'Contribute your own',
    Imprint: 'Imprint',
  };
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [titleText, setTitleText] = useState('TRACES OF HIV ARCHIVE');
  const [glitchSet, setGlitchSet] = useState(new Set());
  const timeoutsRef = useRef([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollDirRef = useRef(1); // 1 = down, -1 = up
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => {
      document.body.classList.toggle('_touchDevice', mq.matches);
    };
    update();
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update);
      document.body.classList.remove('_touchDevice');
    };
  }, []);
  useEffect(() => {
    const lastTickRef = { t: 0 };
    const tick = (strength = 2) => {
      const now = performance.now();
      if (now - lastTickRef.t < 70) return; // throttle to ~14 Hz
      lastTickRef.t = now;
      triggerGlitch(strength);
    };

    const onMouseMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseRef.current = { x: e.clientX / w, y: e.clientY / h };
      document.documentElement.style.setProperty('--mx', mouseRef.current.x);
      document.documentElement.style.setProperty('--my', mouseRef.current.y);
      tick(1);
    };

    const onScroll = () => {
      const y = window.scrollY || 0;
      scrollDirRef.current = y >= lastScrollYRef.current ? 1 : -1;
      lastScrollYRef.current = y;
      tick(1);
    };

    const onTouchStart = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const t = e.touches[0];
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseRef.current = { x: t.clientX / w, y: t.clientY / h };
      document.documentElement.style.setProperty('--mx', mouseRef.current.x);
      document.documentElement.style.setProperty('--my', mouseRef.current.y);
      tick(1);
    };
    const onTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const t = e.touches[0];
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseRef.current = { x: t.clientX / w, y: t.clientY / h };
      document.documentElement.style.setProperty('--mx', mouseRef.current.x);
      document.documentElement.style.setProperty('--my', mouseRef.current.y);
      tick(1);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('wheel', onScroll, { passive: true });
    const onKeyScroll = (e) => {
      const keys = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Spacebar',' '];
      if (keys.includes(e.key)) tick(1);
    };
    window.addEventListener('keydown', onKeyScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('keydown', onKeyScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  // Keep header title in sync with selected menu
  useEffect(() => {
    if (selectedMenu && MENU_SENTENCES[selectedMenu]) {
      setTitleText(MENU_SENTENCES[selectedMenu]);
      triggerGlitch(3);
    } else {
      setTitleText('TRACES OF HIV ARCHIVE');
    }
  }, [selectedMenu]);

  const triggerGlitch = (strength = 2) => {
    const total = titleText.length;
    const picks = Math.max(1, Math.floor(Math.random() * (strength + 3))); // slightly more activity
    const indices = new Set(glitchSet);
    for (let i = 0; i < picks; i++) {
      const idx = Math.floor(Math.random() * total);
      if (titleText[idx] === ' ') continue; // keep spaces intact
      indices.add(idx);
      const to = setTimeout(() => {
        setGlitchSet((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }, 160 + Math.random() * 240); // even quicker decay
      timeoutsRef.current.push(to);
    }
    setGlitchSet(indices);
  };

  // Reveal PDFs after toggle and when they enter viewport
  useEffect(() => {
    const observed = new Set();

    const revealIfEligible = (el) => {
      if (!document.body.classList.contains('_pdfOn')) return;
      if (!el || el.classList.contains('_visible')) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const intersects = r.top < vh * 0.96 && r.bottom > 0;
      if (intersects) {
        el.classList.add('_visible');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        el.style.removeProperty('filter');
        return true;
      }
      return false;
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (!entry.isIntersecting) return;
        if (document.body.classList.contains('_pdfOn') && entry.intersectionRatio > 0.06) {
          el.classList.add('_visible');
          el.style.removeProperty('opacity');
          el.style.removeProperty('transform');
          el.style.removeProperty('filter');
          io.unobserve(el);
          observed.delete(el);
          triggerGlitch(2);
        }
      });
    }, { threshold: [0, 0.06, 0.2], rootMargin: '0px 0px -2% 0px' });

    const track = (el) => {
      if (!el || observed.has(el)) return;
      el.classList.remove('_visible');
      io.observe(el);
      observed.add(el);
    };

    document.querySelectorAll('._pdfWrap').forEach(track);

    const onScrollReveal = () => {
      if (!document.body.classList.contains('_pdfOn')) return;
      document.querySelectorAll('._pdfWrap').forEach(revealIfEligible);
    };
    window.addEventListener('scroll', onScrollReveal, { passive: true });

    const mo = new MutationObserver((muts) => {
      muts.forEach(m => {
        m.addedNodes && m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.classList && n.classList.contains('_pdfWrap')) track(n);
          n.querySelectorAll && n.querySelectorAll('._pdfWrap').forEach(track);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScrollReveal);
      observed.clear();
    };
  }, []);

  return (
    <div
      className={`_layout _useCustomCursor ${menuOpen ? '_menuOpen' : ''}`}
      onMouseDown={(e) => {
        const el = e.target;
        const isInteractive = el.closest && el.closest('a, button, [role="button"], input, textarea, select');
        if (!menuOpen && !isInteractive) setMenuOpen(true);
      }}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* globale Styles */}
      <style>{`
        ._layout { position: relative; width: 100%; min-height: 100vh; overflow: hidden; }

        /* RED FADE MENU OVERLAY */
        ._menuOverlay { position: fixed; inset: 0; z-index: 9; pointer-events: none; overflow: hidden; }
        ._menuOverlay::before { content: ''; position: absolute; inset: 0; background: rgba(255,0,0,0.0); transition: background 260ms ease; }
        ._menuContent { position: absolute; inset: 0; display: grid; place-items: center; opacity: 0; transform: scale(0.98); transition: opacity 260ms ease, transform 260ms ease; }
        ._menuList { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(8px, 2.6vh, 22px); }
        ._menuItem { text-align: center; font-family: 'Arial Black', Arial, Helvetica, sans-serif; text-transform: uppercase; color: #fff; font-size: clamp(24px, 8vw, 62px); letter-spacing: clamp(2px, 0.8vw, 10px); line-height: 1.08; cursor: pointer; user-select: none; }

        /* Floating red menu button (bottom-left, elegant) */
        ._menuFabBtn {
          position: fixed;
          left: clamp(12px, 2.4vw, 22px);
          bottom: clamp(12px, 3vw, 28px);
          z-index: 11;
          width: clamp(58px, 8vw, 92px);
          height: clamp(58px, 8vw, 92px);
          border-radius: 999px;
          background: radial-gradient(120% 120% at 30% 30%, #ff3b3b 0%, #ff0000 55%, #d80000 100%);
          border: none;
          box-shadow: 0 10px 28px rgba(255,0,0,.28), 0 0 22px rgba(255,0,0,.38);
          display: inline-grid;
          place-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s ease, background .22s ease, filter .22s ease;
          backdrop-filter: saturate(1.05);
        }
        ._menuFabBtn:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 16px 36px rgba(255,0,0,.34), 0 0 34px rgba(255,0,0,.5); filter: brightness(1.05); }
        ._menuFabBtn:active { transform: translateY(0) scale(.98); }
        ._menuFabBtn:focus-visible { outline: 2px solid rgba(255,255,255,.9); outline-offset: 3px; }
        ._menuIcon { position: relative; width: 58%; height: 58%; }
        ._menuIcon span { position: absolute; left: 0; right: 0; height: 3px; background: #fff; border-radius: 3px; transition: transform .28s cubic-bezier(.2,.8,.2,1), width .28s cubic-bezier(.2,.8,.2,1), opacity .2s ease; box-shadow: 0 0 8px rgba(255,255,255,.55); }
        ._menuIcon span:nth-child(1) { top: 18%; width: 82%; margin: 0 auto; }
        ._menuIcon span:nth-child(2) { top: 50%; width: 64%; margin: 0 auto; }
        ._menuIcon span:nth-child(3) { top: 82%; width: 82%; margin: 0 auto; }
        ._menuFabBtn:hover ._menuIcon span:nth-child(1) { transform: translateY(-1px); width: 86%; }
        ._menuFabBtn:hover ._menuIcon span:nth-child(2) { transform: translateX(2px); width: 70%; }
        ._menuFabBtn:hover ._menuIcon span:nth-child(3) { transform: translateY(1px); width: 86%; }
        @media (max-width: 900px) {
          ._menuFabBtn { left: 12px; bottom: 16px; }
        }

        /* Tablet: Panel etwas schmaler */
        ._menuOpen ._menuOverlay { pointer-events: auto; }
        ._menuOpen ._menuOverlay::before { background: rgba(255, 0, 0, 0.58); }
        ._menuOpen ._menuOverlay ._menuContent { opacity: 1; transform: scale(1); }
        /* Title turns white while menu is open */
        ._menuOpen ._titleLine { color: #ffffff; text-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 0 14px rgba(255,255,255,0.28); }
        /* Centered 3D overlay (non-interactive, performance-friendly) */
        html, body, #root { margin: 0; background: transparent; }
        html, body { overflow: hidden; height: 100%; }
        ._centerStage { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index: 4; pointer-events: none; }
        ._stageFrame {
          width: 100vw; height: 100vh;
          transform: scale(var(--stageScale, .55));
          transform-origin: center;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,.12);
          pointer-events: none;
        }
        @media (max-width: 1200px) { ._stageFrame { --stageScale: .45; } }
        @media (max-width: 900px)  { ._stageFrame { --stageScale: .34; } }


        ._noScroll::-webkit-scrollbar { display: none; }
        ._noScroll { -ms-overflow-style: none; scrollbar-width: none; }

        ._pdfWrap {
          opacity: 0;
          transform: translateY(36px) scale(.992);
          filter: blur(1.8px);
          transition: opacity 900ms cubic-bezier(.22,.61,.36,1), transform 980ms cubic-bezier(.22,.61,.36,1), filter 800ms cubic-bezier(.22,.61,.36,1);
          will-change: transform, opacity, filter;
        }
        /* Prevent premature visibility before any scroll */
        ._pdfWrap._visible { opacity: 0; }

        /* Reveal controlled via toggle */
        body._pdfOn ._pdfWrap._visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0px);
        }
        ._pdfWrap:hover {
          transform: translateY(-2px) scale(1.002) rotateX(0deg) !important;
          transition-duration: 300ms;
        }
        ._pdfWrap:hover canvas { transform: translateZ(0) scale(1.003); opacity: .90 !important; }

        ._rightText a { color: #ff0000; text-decoration: none; }
        ._rightText a:hover { text-decoration: underline; }

        /* Floating red PDF toggle (above the menu button) */
        ._pdfFabBtn {
          position: fixed;
          left: clamp(12px, 2.4vw, 22px);
          bottom: calc(clamp(12px, 3vw, 28px) + clamp(72px, 9vw, 96px) + clamp(16px, 2.6vh, 32px));
          z-index: 11;
          width: clamp(60px, 8.6vw, 96px);
          height: clamp(60px, 8.6vw, 96px);
          border-radius: 999px;
          background: radial-gradient(120% 120% at 30% 30%, #ff3b3b 0%, #ff0000 55%, #d80000 100%);
          border: none;
          box-shadow: 0 10px 28px rgba(255,0,0,.28), 0 0 22px rgba(255,0,0,.38);
          display: inline-grid;
          place-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s ease, background .22s ease, filter .22s ease;
          backdrop-filter: saturate(1.05);
        }
        ._pdfFabBtn:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 16px 36px rgba(255,0,0,.34), 0 0 34px rgba(255,0,0,.5); filter: brightness(1.05); }
        ._pdfFabBtn:active { transform: translateY(0) scale(.98); }
        ._pdfFabBtn:focus-visible { outline: 2px solid rgba(255,255,255,.9); outline-offset: 3px; }
        ._pdfFabBtn._on {
          box-shadow: 0 14px 32px rgba(255,0,0,.36), 0 0 38px rgba(255,0,0,.52), 0 0 0 1px rgba(255,0,0,.25) inset;
          filter: brightness(1.06) saturate(1.04);
        }
        ._pdfLabel {
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: clamp(14px, 2.6vw, 22px);
          color: #fff;
          text-shadow: 0 0 10px rgba(255,255,255,.45);
          user-select: none;
        }
        @media (max-width: 900px) {
          ._pdfFabBtn {
            left: 12px;
            bottom: calc(16px + clamp(72px, 9vw, 96px) + clamp(16px, 2.6vh, 32px));
          }
        }

        ._surface {
          background: transparent;
        }


        @media (max-width: 1200px) and (min-width: 901px) {
          ._rightText {
            font-size: 12px;
          }
          ._surface._pdf { gap: 16px; }
        }

        /* Mobile Layout */
        @media (max-width: 900px) {
          /* Stack layout */
          ._layout { flex-direction: column; height: auto; min-height: 100dvh; }

          /* PDF container: natural page scroll, no inner scrolling */
          ._surface._pdf {
            height: auto;
            max-height: none;
            overflow-y: visible;
            padding: 12px 0 12px;
            gap: 12px;
          }

          /* Right text is not split on mobile; use bottom sheet instead */
          ._rightText { display: none; }

          /* Floating action button to open the archive sheet */
          ._fab {
            position: fixed;
            left: 50%;
            bottom: clamp(18px, 5vw, 28px);
            transform: translateX(-50%);
            z-index: 8;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: clamp(6px, 1.8vw, 9px) clamp(16px, 6vw, 30px);
            border-radius: 999px;
            border: 1.6px solid rgba(255,0,0,0.78);
            background: rgba(255,255,255,0.5);
            color: #ff0000;
            font-family: 'Arial Black', Arial, Helvetica, sans-serif;
            font-weight: 900;
            font-size: clamp(9px, 2.2vw, 12px);
            letter-spacing: .1em;
            text-transform: uppercase;
            cursor: pointer;
            box-shadow: 0 12px 24px rgba(255,0,0,0.12);
            overflow: hidden;
            transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s ease, border-color .22s ease, background .22s ease;
          }
          ._fab::before {
            content: '';
            position: absolute;
            inset: -25%;
            background: radial-gradient(120% 120% at 30% 30%, rgba(255,80,80,0.32) 0%, rgba(255,0,0,0.12) 55%, rgba(255,0,0,0) 100%);
            opacity: 0;
            transition: opacity .28s ease;
            pointer-events: none;
          }
          ._fab:hover::before { opacity: 1; }
          ._fab:hover { transform: translateX(-50%) translateY(-2px) scale(1.015); box-shadow: 0 22px 42px rgba(255,0,0,0.24); }
          ._fab:active { transform: translateX(-50%) translateY(1px) scale(0.985); box-shadow: 0 12px 24px rgba(255,0,0,0.2); border-color: rgba(255,0,0,0.75); }

          /* Bottom sheet + backdrop */
          ._sheetBackdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.25);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            opacity: 0;
            pointer-events: none;
            transition: opacity .25s ease;
            z-index: 7;
          }
          ._sheetBackdrop._open { opacity: 1; pointer-events: auto; }

          ._sheet {
            position: fixed;
            left: 0; right: 0; bottom: 0;
            height: 78vh;
            background: rgba(255,255,255,0.65);
            color: #9370DB;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            box-shadow: 0 -10px 32px rgba(0,0,0,0.18);
            transform: translateY(100%);
            transition: transform .32s cubic-bezier(.2,.8,.2,1);
            z-index: 8;
            display: flex;
            flex-direction: column;
          }
          ._sheet._open { transform: translateY(0); }
          ._sheet a { color: #ff0000; text-decoration: none; }
          ._sheet a:hover { text-decoration: underline; }

          ._sheetHeader {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.08);
          }
          ._sheetBody { flex: 1; overflow-y: auto; padding: 12px 16px; }
          ._sheetTitle { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
          ._sheetClose { appearance: none; border: 1px solid rgba(0,0,0,.6); background: #fff; padding: 6px 10px; border-radius: 999px; }
          ._sheetBody { font-size: clamp(12px, 3.2vw, 15px); line-height: 1.58; }

          /* Links slightly darker red on mobile */
          ._rightText a { color: #c00000; }

          /* Hide custom scrollbars if any */
          ._noScroll { scrollbar-width: thin; }
        }

      `}</style>

      {/* INTERAKTIVER HEADER-TITEL */}
      <TitleHeader titleText={titleText} glitchSet={glitchSet} />

      {/* Bottom-left floating PDF toggle (shows/hides PDFs) */}
      {!menuOpen && (
        <button
          type="button"
          className={`_pdfFabBtn${pdfOn ? ' _on' : ''}`}
          aria-label={pdfOn ? 'Hide archive pages' : 'Show archive pages'}
          onClick={(e) => {
            e.stopPropagation();
            setPdfOn((prev) => !prev);
          }}
        >
          <span className="_pdfLabel" aria-hidden>PDF</span>
        </button>
      )}

      {/* Fullpage Menu Overlay (separate component) */}
      <RedMenuOverlay
        open={menuOpen}
        onClose={() => { setMenuOpen(false); setSelectedMenu(null); }}
        items={['About', 'Archive', 'Shuffle', 'Upload', 'Imprint']}
        selectedKey={selectedMenu}
        onSelect={(key) => setSelectedMenu(key)}
        onBack={() => {
          if (selectedMenu === 'Archive' && selectedArchiveItemId) {
            setSelectedArchiveItemId(null); // go back to table
          } else {
            setSelectedMenu(null); // leave red overlay
          }
        }}
        sentences={MENU_SENTENCES}
        onOpenArchiveItem={(id) => { setSelectedMenu('Archive'); setSelectedArchiveItemId(id); }}
      />

      {/* Custom Cursor Dot (white when menu open) */}
      <CursorDot white={menuOpen} />


      {/* Bottom-left floating red menu button (hidden when menu is open) */}
      {!menuOpen && (
        <button
          type="button"
          className="_menuFabBtn"
          aria-label="Open menu"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
        >
          <span className="_menuIcon" aria-hidden>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      )}

      <StageColumns menuOpen={menuOpen} pdfOn={pdfOn} />
      {/* ARCHIVE on red menu layer */}
      {menuOpen && selectedMenu === 'Archive' && (
        !selectedArchiveItemId ? (
          <Archive
            onClose={() => { setSelectedMenu(null); }}
            onOpenItem={(id) => setSelectedArchiveItemId(id)}
          />
        ) : (
          <ItemDetail
            id={selectedArchiveItemId}
            onBack={() => setSelectedArchiveItemId(null)}
            onClose={() => setSelectedMenu(null)}
            onOpen={(id) => setSelectedArchiveItemId(id)}
          />
        )
      )}
      {/* Removed old CursorComponent */}
    </div>
  );
}

export default Hauptseite;
