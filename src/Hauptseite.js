import Archive from './Archive';
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import RightTextComponent from './RightTextComponent';
import HivModelStage from './HivModelStage';
import RedMenuOverlay from './RedMenuOverlay';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Lokaler Worker (vorher einmal kopieren: cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/)
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

// --- Firebase (guard against re-init) ---
const firebaseConfig = {
  apiKey: "AIzaSyDgxBvHfuv0izCJPwNwBd5Ou9brHzGBSqk",
  authDomain: "hivarchive.firebaseapp.com",
  projectId: "hivarchive",
  storageBucket: "hivarchive.appspot.com",
  messagingSenderId: "783300550035",
  appId: "1:783300550035:web:87ecf7b4d901068a7c9c66",
  measurementId: "G-3DESXXFKL1",
};
if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();


function ItemDetail({ id, onBack, onClose }) {
  const [item, setItem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'uploads', id));
        if (alive) setItem(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        console.error('Detail load error:', e);
        if (alive) setItem(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const safeArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  return (
    <div className="detail__wrap" role="region" aria-label="Item detail">
      <style>{`
        .detail__wrap { position: fixed; inset: 0; z-index: 9; pointer-events: none; }
        .detail__scroll {
          position: fixed;
          left: 0; right: 0;
          top: calc(var(--hdrH,120px) + 76px);
          bottom: 0;
          z-index: 9; /* below RedMenu controls (z:10) */
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          pointer-events: auto;
          padding: 0 clamp(10px, 2vw, 20px) 16px;
        }
        .detail__inner { width: min(1200px, 92vw); margin: 0 auto; color: #fff; font-family: 'Arial Black', Arial, Helvetica, sans-serif; pointer-events: auto; }
        .detail__title { margin: 0 0 8px; font-size: clamp(22px, 4.8vw, 56px); line-height: 1; letter-spacing: .06em; text-transform: uppercase; }
        .detail__meta { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-bottom: 14px; font-size: clamp(12px, 1.6vw, 16px); font-family: Arial, Helvetica, sans-serif; }
        .detail__pill { display: inline-block; padding: 6px 10px; border: 2px solid rgba(255,255,255,.92); border-radius: 999px; font-size: .82rem; }
        .detail__pillType { display:inline-block; padding:6px 10px; border-radius:999px; background:#fff; color:#cc0000; font-size:.82rem; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        .detail__grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: clamp(12px, 2vw, 24px); align-items: start; }
        .detail__img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; border: 2px solid rgba(255,255,255,.95); box-shadow: 0 12px 34px rgba(0,0,0,.35); }
        .detail__body { font-family: Arial, Helvetica, sans-serif; line-height: 1.5; font-size: clamp(13px, 1.7vw, 18px); }
        .detail__backHint { margin-top: 12px; opacity: .8; font-size: 12px; font-family: Arial, Helvetica, sans-serif; }
        .detail__extras { width: min(1200px, 92vw); margin: 16px auto 0; color: #fff; font-family: Arial, Helvetica, sans-serif; }
        .detail__sectionTitle { margin: 16px 0 8px; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(13px, 1.6vw, 16px); letter-spacing: .03em; text-transform: uppercase; }
        .detail__filelist { display: grid; gap: 6px; }
        .detail__filelist a { color: #fff; text-decoration: underline; word-break: break-all; }
        .detail__table { width: 100%; border-collapse: collapse; font-size: clamp(12px, 1.4vw, 14px); }
        .detail__table th, .detail__table td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,.25); vertical-align: top; }
        .detail__table th { text-align: left; font-weight: 800; font-family: 'Arial Black', Arial, Helvetica, sans-serif; text-transform: uppercase; font-size: 12px; letter-spacing: .03em; white-space: nowrap; }
        .detail__links { display: grid; gap: 6px; }
        .detail__links a { color: #fff; text-decoration: underline; word-break: break-all; }
        /* subtle grain overlay */
        .detail__wrap::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: -1; background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 3px 3px; opacity: .35; mix-blend-mode: soft-light; }
        /* media wrapper for vignette/tint */
        .detail__media { position: relative; }
        .detail__media::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 120% at 50% 50%, rgba(147,112,219,.22) 0%, rgba(0,0,0,.0) 42%, rgba(0,0,0,.18) 100%); mix-blend-mode: soft-light; animation: breathe 3.6s ease-in-out infinite; opacity: .9; border-radius: 12px; }
        @keyframes breathe { 0%,100% { filter: saturate(1) contrast(1); } 50% { filter: saturate(1.08) contrast(1.05); } }
        /* zebra table + subtle highlight */
        .detail__table tr:nth-child(even) { background: rgba(255,255,255,0.04); }
        .detail__table tr:hover { background: rgba(255,255,255,0.08); }
        .detail__sectionTitle { border-bottom: 2px solid rgba(255,255,255,.18); padding-bottom: 6px; }
        @media (max-width: 900px) { .detail__grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="detail__scroll">
        <div className="detail__inner">
          {loading && <div>Loading…</div>}
          {!loading && !item && <div>Not found.</div>}
          {!loading && item && (
            <>
              <h2 className="detail__title">{item.title || 'Untitled'}</h2>
              <div className="detail__meta">
                {item.type && <span className="detail__pillType">{item.type}</span>}
                {safeArr(item.category).map((c,i) => <span className="detail__pill" key={i}>{c}</span>)}
                {safeArr(item.tags).length > 0 && <span>Tags: {safeArr(item.tags).join(', ')}</span>}
              </div>
              <div className="detail__grid">
                <div className="detail__media">
                  <img className="detail__img" src={(safeArr(item.fileURLs)[0] || item.thumbnailURL || '')} alt="" />
                </div>
                <div className="detail__body">
                  {item.description || '—'}
                  <div className="detail__backHint">Use ← Back to return to the list.</div>
                </div>
              </div>
              <div className="detail__extras">
                {Array.isArray(item.fileURLs) && item.fileURLs.length > 1 && (
                  <>
                    <h4 className="detail__sectionTitle">Files</h4>
                    <div className="detail__filelist">
                      {item.fileURLs.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                      ))}
                    </div>
                  </>
                )}

                <h4 className="detail__sectionTitle">Details</h4>
                <table className="detail__table">
                  <tbody>
                    {item.uploader && (
                      <tr>
                        <th>Uploader:</th>
                        <td>{item.uploader}</td>
                      </tr>
                    )}
                    {item.createdAt && (
                      <tr>
                        <th>Created At:</th>
                        <td>{(() => {
                          try {
                            const ts = item.createdAt;
                            const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
                            return isNaN(d?.getTime?.()) ? '—' : new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
                          } catch { return '—'; }
                        })()}</td>
                      </tr>
                    )}
                    {item.source && (
                      <tr>
                        <th>Source:</th>
                        <td>
                          <a href={item.source} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline', wordBreak: 'break-all' }}>
                            {item.source}
                          </a>
                        </td>
                      </tr>
                    )}
                    {Array.isArray(item.additionalInfo) && item.additionalInfo.length > 0 && (
                      <tr>
                        <th>Linked Resources:</th>
                        <td>
                          <div className="detail__links">
                            {item.additionalInfo.map((u, i) => (
                              <a key={i} href={u} target="_blank" rel="noopener noreferrer">{u}</a>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {(() => {
                      const known = new Set(['id','title','description','motivation','mood','category','type','tags','uploader','createdAt','source','additionalInfo','thumbnailURL','fileURLs']);
                      const entries = Object.entries(item || {}).filter(([k,v]) => !known.has(k) && v != null && v !== '' && !(Array.isArray(v) && v.length === 0));
                      return entries.map(([k,v]) => (
                        <tr key={k}>
                          <th>{k}:</th>
                          <td>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Hauptseite() {
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
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
  const [titleText, setTitleText] = useState('TRACES OF HIV');
  const [glitchSet, setGlitchSet] = useState(new Set());
  const timeoutsRef = useRef([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseRef.current = { x: e.clientX / w, y: e.clientY / h };
      document.documentElement.style.setProperty('--mx', mouseRef.current.x);
      document.documentElement.style.setProperty('--my', mouseRef.current.y);
      triggerGlitch();
    };
    const onScroll = () => {
      triggerGlitch(1); // etwas sanfter bei Scroll
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
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
      setTitleText('TRACES OF HIV');
    }
  }, [selectedMenu]);

  const triggerGlitch = (strength = 2) => {
    const total = titleText.length;
    const picks = Math.max(1, Math.floor(Math.random() * (strength + 2)));
    const indices = new Set(glitchSet);
    for (let i = 0; i < picks; i++) {
      const idx = Math.floor(Math.random() * total);
      if (titleText[idx] === ' ') continue; // Leerzeichen nicht glitchen
      indices.add(idx);
      const to = setTimeout(() => {
        setGlitchSet((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }, 180 + Math.random() * 260);
      timeoutsRef.current.push(to);
    }
    setGlitchSet(indices);
  };

  const canvasRefs = useRef([]);
  const pageWrapRefs = useRef([]);
  const renderQueue = useRef(Promise.resolve());

  const pdfContainerRef = useRef(null);
  const textContainerRef = useRef(null);

  // --- CUSTOM CURSOR (red by default; white when menu open) ---
  const cursorRef = useRef(null);
  useEffect(() => {
    const dot = cursorRef.current;
    if (!dot) return;
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

  // --- PDF LADEN ---
  useEffect(() => {
    const url = `${process.env.PUBLIC_URL}/masti_upload_version-4.pdf`; // liegt in public/
    const loadingTask = pdfjsLib.getDocument(url);

    loadingTask.promise.then(
      (loadedPdf) => {
        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
      },
      (err) => console.error('Error loading PDF:', err)
    );

    return () => {
      try { loadingTask.destroy?.(); } catch {}
    };
  }, []);

  // --- RESPONSIVE: detect mobile/tablet ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => {
      setIsMobile(mq.matches);
    };
    update();
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update);
    };
  }, []);

  // --- PDF SEITEN RENDERN ---
  useEffect(() => {
    if (menuOpen) return;
    if (!pdf || totalPages === 0) return;

    const root = pdfContainerRef.current;
    if (!root) return;

    const renderIfNeeded = (idx) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas || canvas.dataset.rendered === '1') return;
      const deviceScale = isMobile ? 1.1 : 1.5;
      queueRenderPage(pdf, idx + 1, canvas, deviceScale).then(() => {
        canvas.dataset.rendered = '1';
      });
    };

    // Observe wrappers to render visible pages + small buffer
    const items = pageWrapRefs.current.filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number(e.target.dataset.index);
            renderIfNeeded(idx);
            if (idx > 0) renderIfNeeded(idx - 1);
            if (idx < totalPages - 1) renderIfNeeded(idx + 1);
          }
        });
      },
      { root, threshold: 0.12 }
    );

    items.forEach((el, i) => {
      el.dataset.index = i;
      io.observe(el);
    });

    // Render first page eagerly for faster first paint
    renderIfNeeded(0);

    return () => io.disconnect();
  }, [pdf, totalPages, isMobile, menuOpen]);

  const renderAllPages = (loadedPdf) => {
    for (let num = 1; num <= loadedPdf.numPages; num++) {
      const canvas = canvasRefs.current[num - 1];
      if (canvas) queueRenderPage(loadedPdf, num, canvas);
    }
  };

  const queueRenderPage = (loadedPdf, num, canvas, scale = 1.5) => {
    renderQueue.current = renderQueue.current.then(() =>
      renderPage(loadedPdf, num, canvas, scale)
    );
    return renderQueue.current;
  };

  const renderPage = (loadedPdf, num, canvas, scale = 1.5) => {
    return new Promise((resolve, reject) => {
      loadedPdf.getPage(num).then((page) => {
        const viewport = page.getViewport({ scale });
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = { canvasContext: ctx, viewport, background: 'transparent' };
        const renderTask = page.render(renderContext);
        renderTask.promise
          .then(() => resolve())
          .catch((error) => {
            if (error?.name !== 'RenderingCancelledException') {
              console.error('Rendering error:', error);
              reject(error);
            } else {
              resolve();
            }
          });
      });
    });
  };

  // --- PARALLAX: rechter Text langsamer & SMOOTH (Lerp) ---
  useEffect(() => {
    const pdfEl = pdfContainerRef.current;
    const textEl = textContainerRef.current;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    if (!pdfEl || !textEl) return;
    if (menuOpen) return;

    if (isMobile) return; // disable parallax sync on mobile for independence

    let desired = 0;
    let current = 0;
    const factor = 0.35; // <— weniger Bewegung = tiefere Ebene
    const ease = 0.12;   // <— Glätte (0.08–0.18 angenehm)
    let rafId;

    const onScroll = () => {
      desired = pdfEl.scrollTop * factor; // gleiche Richtung, langsamer
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const tick = () => {
      const delta = desired - current;
      current += delta * ease;
      textEl.scrollTop = current;
      if (Math.abs(delta) > 0.5) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    pdfEl.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      pdfEl.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isMobile, menuOpen]);

  // --- Trigger Title Glitch on inner scroll (PDF & Right Text) ---
  useEffect(() => {
    const pdfEl = pdfContainerRef.current;
    const textEl = textContainerRef.current;
    if (menuOpen) return;
    if (!pdfEl && !textEl) return;

    const onInnerScroll = () => triggerGlitch(2);

    if (pdfEl) pdfEl.addEventListener('scroll', onInnerScroll, { passive: true });
    if (textEl) textEl.addEventListener('scroll', onInnerScroll, { passive: true });
    return () => {
      if (pdfEl) pdfEl.removeEventListener('scroll', onInnerScroll);
      if (textEl) textEl.removeEventListener('scroll', onInnerScroll);
    };
  }, [menuOpen]);
  // --- FADE/SLIDE-IN je Seite via IntersectionObserver ---
  useEffect(() => {
    if (menuOpen) return;
    const items = pageWrapRefs.current.filter(Boolean);
    if (!items.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('_visible');
          }
        });
      },
      { root: pdfContainerRef.current, threshold: 0.18 }
    );

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [totalPages, menuOpen]);

  // --- SUPER SMOOTH WHEEL-SCROLL für PDF-Container (rAF + Lerp) ---
  useEffect(() => {
    const pdfEl = pdfContainerRef.current;
    if (!pdfEl) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (menuOpen) return;
    if (prefersReduced) return; // use native scrolling if user prefers reduced motion
    if (isMobile) return; // Use native page scroll on mobile

    let desired = pdfEl.scrollTop;
    let current = pdfEl.scrollTop;
    let rafId = null;

    const ease = 0.14; // Glätte (0.10–0.18)

    const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

    const tick = () => {
      const delta = desired - current;
      current += delta * ease;
      if (Math.abs(delta) < 0.4) {
        current = desired;
      }
      pdfEl.scrollTop = current;
      if (current !== desired) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const onWheel = (e) => {
      // Trackpads liefern viele kleine Deltas, Mäuse größere – beide glätten
      // Wir verhindern das native ruckelige Scrollen und übernehmen selbst
      e.preventDefault();
      const max = pdfEl.scrollHeight - pdfEl.clientHeight;
      desired = clamp(desired + e.deltaY, 0, max);
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    // Optional: Keyboard smoothen (Pfeile, PageUp/Down, Space)
    const keyStep = () => Math.max(80, pdfEl.clientHeight * 0.8);
    const onKeyDown = (e) => {
      const max = pdfEl.scrollHeight - pdfEl.clientHeight;
      if (e.key === 'ArrowDown') {
        e.preventDefault(); desired = clamp(desired + 60, 0, max);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); desired = clamp(desired - 60, 0, max);
      } else if (e.key === 'PageDown') {
        e.preventDefault(); desired = clamp(desired + keyStep(), 0, max);
      } else if (e.key === 'PageUp') {
        e.preventDefault(); desired = clamp(desired - keyStep(), 0, max);
      } else if (e.key === ' ') {
        e.preventDefault(); desired = clamp(desired + keyStep(), 0, max);
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    // Hinweis: passive:false nötig, damit preventDefault auf Wheel wirkt
    pdfEl.addEventListener('wheel', onWheel, { passive: false });
    pdfEl.addEventListener('keydown', onKeyDown);
    // Fokus sicherstellen, damit Keydown ankommt
    pdfEl.tabIndex = 0;

    return () => {
      pdfEl.removeEventListener('wheel', onWheel, { passive: false });
      pdfEl.removeEventListener('keydown', onKeyDown);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isMobile, menuOpen]);

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
        /* Custom cursor dot (red default, white when menu open) */
        ._useCustomCursor { cursor: none; }
        ._cursorDot { position: fixed; z-index: 11; left: 0; top: 0; width: 10px; height: 10px; border-radius: 50%; pointer-events: none; transform: translate(-50%, -50%); will-change: transform, background, box-shadow; transition: background 120ms ease; }
        ._cursorDot._red { background: #ff0000; box-shadow: 0 0 12px rgba(255,0,0,.35); }
        ._cursorDot._white { background: #ffffff; box-shadow: 0 0 14px rgba(255,255,255,.55); width: 12px; height: 12px; }
        @media (hover: none) and (pointer: coarse) { ._useCustomCursor { cursor: auto; } ._cursorDot { display: none; } }
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
          transform: translateY(12px); 
          transition: opacity 700ms cubic-bezier(.2,.8,.2,1), transform 900ms cubic-bezier(.2,.8,.2,1);
          will-change: transform, opacity;
        }
        ._pdfWrap._visible {
          opacity: 1;
          transform: translateY(0);
        }
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

        /* FANCY HEADER TITLE */
        :root { --hdrH: clamp(72px, 12vh, 160px); }
        ._pageHeader {
          position: fixed; top: 0; left: 0; right: 0; height: var(--hdrH);
          z-index: 10; pointer-events: none;
          display: grid; place-items: center; text-align: center;
          mix-blend-mode: normal;
        }
        ._titleLine {
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          letter-spacing: clamp(2px, 0.6vw, 12px);
          line-height: 0.95;
          font-size: clamp(28px, 8vw, 120px);
          text-transform: uppercase;
          color: #ff0000; /* SOLID RED, ALWAYS VISIBLE */
          text-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 0 14px rgba(255,0,0,0.18); /* subtle depth */
          user-select: none;
          white-space: pre;
        }
        ._titleLetter {
          display: inline-block;
          transform: translateZ(0);
          transition: transform .08s ease;
        }
        ._titleLetter._glitch {
          font-family: 'Times New Roman', Georgia, 'Courier New', 'Comic Sans MS', cursive, serif !important;
          font-style: italic;
          transform: translateY(-2px) rotateZ(-2deg) scale(1.04);
          text-shadow: 0 0 0 rgba(0,0,0,0), 0 0 22px rgba(147,112,219,0.25), 0 0 18px rgba(255,0,0,0.25);
        }
        ._pageHeader:hover ._titleLine { filter: drop-shadow(0 8px 26px rgba(255,0,0,0.35)) drop-shadow(0 0 36px rgba(147,112,219,0.32)); }

        /* Tablet: Panel etwas schmaler */

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

          /* Canvas wrapper & canvas full width */
          ._pdfWrap { opacity: 1; transform: none; }
          ._pdfWrap:hover { transform: none !important; }

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
      <header className="_pageHeader" aria-hidden>
        <div className="_titleLine">
          {titleText.split('').map((ch, i) => (
            <span key={i} className={glitchSet.has(i) ? '_titleLetter _glitch' : '_titleLetter'}>
              {ch}
            </span>
          ))}
        </div>
      </header>

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
      />

      {/* Custom Cursor Dot (white when menu is open) */}
      <div ref={cursorRef} className={`_cursorDot ${menuOpen ? '_white' : '_red'}`} aria-hidden />

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

      {/* 3D Model Overlay – full-screen, no CSS classes, over everything */}
      <div
        aria-hidden
        style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <HivModelStage rightBias={1.8} />
        </div>
      </div>

      {/* PDF-Container & Rechte Textspalte: AnimatePresence for smooth fade in/out */}
      <AnimatePresence mode="wait">
        {/* PDF-Container */}
        {!menuOpen && (
          <motion.div
            key="pdf"
            ref={pdfContainerRef}
            className="_noScroll _surface _pdf"
            style={{
              flex: 1,
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 'calc(100vh - var(--hdrH, 120px))',
              marginTop: 'var(--hdrH, 120px)',
              overflowY: 'scroll',
              overflowX: 'visible',
              perspective: '1000px',
              padding: '0 16px 24px',
              gap: 20,
              scrollBehavior: 'auto',      // native smooth für programmatic, Wheel bleibt rAF-smooth via Parallax-Sync
              overscrollBehavior: 'contain',
              scrollbarGutter: 'stable',
              outline: 'none',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ ease: 'easeOut', duration: 0.5 }}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                ref={(el) => (pageWrapRefs.current[i] = el)}
                className="_pdfWrap"
                data-index={i}
                style={{
                  maxWidth: '90%',
                  transformStyle: 'preserve-3d',
                  // subtile alternierende 3D-Neigung
                  rotate: 0,
                }}
              >
                <canvas
                  ref={(el) => (canvasRefs.current[i] = el)}
                  data-rendered=""
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    backgroundColor: 'transparent',
                    transform: 'translateZ(0)',
                    transition: 'transform 900ms cubic-bezier(.2,.8,.2,1), opacity 700ms ease, box-shadow 400ms ease',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.12), 0 0 16px rgba(147,112,219,0.35)',
                    opacity: 0.82,
                    willChange: 'transform',
                  }}
                />
              </div>
            ))}
          </motion.div>
        )}

      {isMobile && (
        <>
          <button
            type="button"
            className="_fab"
            onClick={() => setSheetOpen(true)}
            aria-controls="archive-sheet"
            aria-expanded={sheetOpen}
          >
            Archive
          </button>

          <div
            className={`_sheetBackdrop ${sheetOpen ? '_open' : ''}`}
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />

          <div
            id="archive-sheet"
            className={`_sheet ${sheetOpen ? '_open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Archiv und Text"
          >
            <div className="_sheetHeader">
              <h3 className="_sheetTitle">Archive · Traces of HIV</h3>
              <button type="button" className="_sheetClose" onClick={() => setSheetOpen(false)}>Schließen</button>
            </div>
            <div className="_sheetBody">
              <RightTextComponent />
            </div>
          </div>
        </>
      )}

      {/* Rechte Textspalte: langsamer Parallax-Scroll */}
      {!menuOpen && (
        <motion.div
          key="righttext"
          ref={textContainerRef}
          className="_noScroll _rightText _surface"
          style={{
            flexBasis: '340px',
            height: 'calc(100vh - var(--hdrH, 120px))',
            marginTop: 'var(--hdrH, 120px)',
            overflowY: 'scroll',
            overflowX: 'visible',
            color: '#9370DB', // flieder
            fontSize: 12,
            lineHeight: 1.55,
            padding: '14px 16px',
            textAlign: 'right', // overridden to left on mobile via CSS
            zIndex: 4,
            position: 'relative',
            transform: 'rotateY(28deg)',
            transformStyle: 'preserve-3d',
            scrollBehavior: 'auto',
            overscrollBehavior: 'contain',
            scrollbarGutter: 'stable',
          }}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ ease: 'easeOut', duration: 0.45, delay: 0.06 }}
        >
          <RightTextComponent />
        </motion.div>
      )}
      </AnimatePresence>

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
          />
        )
      )}
      {/* Removed old CursorComponent */}
    </div>
  );
}

export default Hauptseite;