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

  // --- INTERAKTIVER TITEL (TRACES OF HIV) ---
  const MENU_SENTENCES = {
    About: 'What is this archive?',
    Archive: 'Browse all items',
    Shuffle: 'Discover at random',
    Upload: 'Contribute your own',
    Imprint: 'Legal & contact',
  };
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [titleText, setTitleText] = useState('TRACES OF HIV ARCHIVE');
  const [glitchSet, setGlitchSet] = useState(new Set());
  const timeoutsRef = useRef([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollDirRef = useRef(1); // 1 = down, -1 = up
  const hasScrolledRef = useRef(false);

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
      hasScrolledRef.current = true;
      document.body.classList.add('_scrolled');
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

  // Reveal PDFs from bottom on downscroll (robust)
  useEffect(() => {
    const observeSet = new Set();

    const hideInitial = () => {
      document.querySelectorAll('._pdfWrap').forEach(el => el.classList.remove('_visible'));
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const rootBottom = (entry.rootBounds && entry.rootBounds.bottom) || window.innerHeight;
        const enteringFromBottom = entry.boundingClientRect.top >= rootBottom - Math.min(140, rootBottom * 0.2);
        const scrollingDown = scrollDirRef.current === 1;
        // Only after user scrolled at least once; reveal when scrolling down and either entering from bottom or sufficiently visible
        if (hasScrolledRef.current && scrollingDown && (enteringFromBottom || entry.intersectionRatio > 0.22)) {
          entry.target.classList.add('_visible');
          entry.target.style.removeProperty('opacity');
          entry.target.style.removeProperty('transform');
          entry.target.style.removeProperty('filter');
          io.unobserve(entry.target);
          observeSet.delete(entry.target);
          triggerGlitch(2);
        }
      });
    }, { threshold: [0, 0.12, 0.22, 0.5], rootMargin: '0px 0px -6% 0px' });

    const track = (el) => {
      if (!el || observeSet.has(el)) return;
      el.classList.remove('_visible'); // ensure hidden until reveal
      io.observe(el);
      observeSet.add(el);
    };

    // Initial scan
    hideInitial();
    document.querySelectorAll('._pdfWrap').forEach(track);

    // Re-scan a few times as PDFs mount lazily
    const rescans = [220, 650, 1200, 2200];
    const timers = rescans.map(t => setTimeout(() => {
      document.querySelectorAll('._pdfWrap').forEach(track);
    }, t));

    // MutationObserver to catch dynamically added PDF nodes
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
      timers.forEach(clearTimeout);
      observeSet.clear();
    };
  }, []);

  // Auto-hide the small red scroll prompt after user scrolls or first PDF reveals
  useEffect(() => {
    const prompt = document.querySelector('._scrollMini');
    if (!prompt) return;
    const hide = () => prompt.classList.add('_hide');
    const onScroll = () => hide();
    const firstVisible = () => {
      const anyVisible = document.querySelector('._pdfWrap._visible');
      if (anyVisible) hide();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const iv = window.setInterval(firstVisible, 250);
    return () => { window.removeEventListener('scroll', onScroll); window.clearInterval(iv); };
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
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      {/* globale Styles */}
      <style>{`
        /* RED FADE MENU OVERLAY */
        ._menuOverlay { position: fixed; inset: 0; z-index: 9; pointer-events: none; }
        ._menuOverlay::before { content: ''; position: absolute; inset: 0; background: rgba(255,0,0,0.0); transition: background 260ms ease; }
        ._menuContent { position: absolute; inset: 0; display: grid; place-items: center; opacity: 0; transform: scale(0.98); transition: opacity 260ms ease, transform 260ms ease; }
        ._menuList { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(8px, 2.6vh, 22px); }
        ._menuItem { text-align: center; font-family: 'Arial Black', Arial, Helvetica, sans-serif; text-transform: uppercase; color: #fff; font-size: clamp(18px, 6vw, 54px); letter-spacing: clamp(1px, 0.5vw, 8px); line-height: 1; cursor: pointer; user-select: none; }

        /* Floating red menu button (bottom-left, elegant) */
        ._menuFabBtn {
          position: fixed;
          left: clamp(12px, 2.4vw, 22px);
          bottom: clamp(12px, 2.8vw, 24px);
          z-index: 11;
          width: clamp(44px, 6.4vw, 64px);
          height: clamp(44px, 6.4vw, 64px);
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
        ._menuIcon { position: relative; width: 52%; height: 52%; }
        ._menuIcon span { position: absolute; left: 0; right: 0; height: 2px; background: #fff; border-radius: 2px; transition: transform .28s cubic-bezier(.2,.8,.2,1), width .28s cubic-bezier(.2,.8,.2,1), opacity .2s ease; box-shadow: 0 0 8px rgba(255,255,255,.55); }
        ._menuIcon span:nth-child(1) { top: 18%; width: 78%; margin: 0 auto; }
        ._menuIcon span:nth-child(2) { top: 48%; width: 60%; margin: 0 auto; }
        ._menuIcon span:nth-child(3) { top: 78%; width: 78%; margin: 0 auto; }
        ._menuFabBtn:hover ._menuIcon span:nth-child(1) { transform: translateY(-1px); width: 86%; }
        ._menuFabBtn:hover ._menuIcon span:nth-child(2) { transform: translateX(2px); width: 70%; }
        ._menuFabBtn:hover ._menuIcon span:nth-child(3) { transform: translateY(1px); width: 86%; }
        @media (max-width: 900px) {
          ._menuFabBtn { left: 12px; bottom: 12px; }
        }

        /* Tablet: Panel etwas schmaler */
        ._menuOpen ._menuOverlay { pointer-events: auto; }
        ._menuOpen ._menuOverlay::before { background: rgba(255, 0, 0, 0.82); }
        ._menuOpen ._menuOverlay ._menuContent { opacity: 1; transform: scale(1); }
        /* Title turns white while menu is open */
        ._menuOpen ._titleLine { color: #ffffff; text-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 0 14px rgba(255,255,255,0.28); }
        /* Centered 3D overlay (non-interactive, performance-friendly) */
        html, body, #root { margin: 0; background: transparent; }
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
          transform: translateY(46px) scale(.992);
          filter: blur(2.1px);
          transition: opacity 700ms cubic-bezier(.16,.84,.24,1), transform 780ms cubic-bezier(.16,.84,.24,1), filter 620ms cubic-bezier(.16,.84,.24,1);
          will-change: transform, opacity, filter;
        }
        /* Prevent premature visibility before any scroll */
        ._pdfWrap._visible { opacity: 0; }

        /* Reveal only after first user scroll */
        body._scrolled ._pdfWrap._visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0px);
        }
        ._scrollMini {
          position: fixed; left: 50%; bottom: clamp(10px, 3.6vh, 32px); transform: translateX(-50%);
          z-index: 6; pointer-events: none; font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
          color: #ff0000; opacity: .92; display: grid; place-items: center; gap: 6px;
          animation: _hintFloat 1.6s ease-in-out infinite;
        }
        ._scrollMini._hide { opacity: 0; transition: opacity .28s ease; }
        ._scrollMini ._chev { width: 12px; height: 12px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg); }
        @keyframes _hintFloat { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 5px); } }
        ._pdfWrap:hover {
          transform: translateY(-2px) scale(1.002) rotateX(0deg) !important;
          transition-duration: 300ms;
        }
        ._pdfWrap:hover canvas { transform: translateZ(0) scale(1.003); opacity: .90 !important; }

        ._rightText a { color: #ff0000; text-decoration: none; }
        ._rightText a:hover { text-decoration: underline; }

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
            right: 16px;
            bottom: 16px;
            z-index: 6;
            border: 1px solid rgba(0,0,0,.8);
            background: #fff;
            padding: 10px 14px;
            border-radius: 999px;
            font-size: 14px;
            box-shadow: 0 10px 28px rgba(0,0,0,.18);
          }

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
          ._sheetTitle { margin: 0; font-size: 16px; font-weight: 700; }
          ._sheetClose { appearance: none; border: 1px solid rgba(0,0,0,.6); background: #fff; padding: 6px 10px; border-radius: 999px; }

          /* Links slightly darker red on mobile */
          ._rightText a { color: #c00000; }

          /* Hide custom scrollbars if any */
          ._noScroll { scrollbar-width: thin; }
        }

      `}</style>

      {/* INTERAKTIVER HEADER-TITEL */}
      <TitleHeader titleText={titleText} glitchSet={glitchSet} />

      {/* Minimal red scroll prompt */}
      <div className="_scrollMini" aria-hidden>
        <div className="_chev" />
        <div>scroll to reveal</div>
      </div>


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

      <StageColumns menuOpen={menuOpen} />
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