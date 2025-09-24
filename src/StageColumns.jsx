import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import RightTextComponent from './RightTextComponent';
import HivModelStage from './HivModelStage';

// pdf.js Worker (einmal in public/ bereitstellen: pdf.worker.min.js)
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

export default function StageColumns({ menuOpen, pdfOn }) {
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const canvasRefs = useRef([]);
  const pageWrapRefs = useRef([]);
  const renderQueue = useRef(Promise.resolve());
  const pdfContainerRef = useRef(null);
  const textContainerRef = useRef(null);

  // --- PDF LADEN ---
  useEffect(() => {
    const url = `${process.env.PUBLIC_URL}/masti_upload_version-4.pdf`;
    const loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise.then(
      (loadedPdf) => {
        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
      },
      (err) => console.error('Error loading PDF:', err)
    );
    return () => { try { loadingTask.destroy?.(); } catch {} };
  }, []);

  // --- RESPONSIVE ---
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update);
    };
  }, []);

  // --- PDF SEITEN RENDERN ---
  useEffect(() => {
    if (menuOpen || !pdfOn) return;
    if (!pdf || totalPages === 0) return;
    const root = pdfContainerRef.current;
    if (!root) return;

    const renderIfNeeded = (idx) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas) return;
      const state = canvas.dataset.rendered;
      if (state === '1' || state === 'loading') return;
      canvas.dataset.rendered = 'loading';
      const deviceScale = isMobile ? 1.1 : 1.5;
      queueRenderPage(pdf, idx + 1, canvas, deviceScale).then(() => {
        canvas.dataset.rendered = '1';
      }).catch(() => {
        canvas.dataset.rendered = '';
      });
    };

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

    items.forEach((el, i) => { el.dataset.index = i; io.observe(el); });
    renderIfNeeded(0);
    return () => io.disconnect();
  }, [pdf, totalPages, isMobile, menuOpen, pdfOn]);

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

  // --- PARALLAX RightText ---
  useEffect(() => {
    const pdfEl = pdfContainerRef.current;
    const textEl = textContainerRef.current;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !pdfEl || !textEl || menuOpen || isMobile || !pdfOn) return;

    let desired = 0, current = 0, rafId;
    const factor = 0.35, ease = 0.12;

    const onScroll = () => {
      desired = pdfEl.scrollTop * factor;
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const tick = () => {
      const delta = desired - current;
      current += delta * ease;
      textEl.scrollTop = current;
      if (Math.abs(delta) > 0.5) rafId = requestAnimationFrame(tick);
      else rafId = null;
    };

    pdfEl.addEventListener('scroll', onScroll, { passive: true });
    return () => { pdfEl.removeEventListener('scroll', onScroll); if (rafId) cancelAnimationFrame(rafId); };
  }, [isMobile, menuOpen, pdfOn]);

  // --- Fade-In je Seite ---
  useEffect(() => {
    if (menuOpen || !pdfOn) return;
    const items = pageWrapRefs.current.filter(Boolean);
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('_visible'); }),
      { root: pdfContainerRef.current, threshold: 0.18 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [totalPages, menuOpen, pdfOn]);

  useEffect(() => {
    if (!pdfOn || menuOpen) return;
    if (typeof window === 'undefined') return;
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) return;
    const pdfEl = pdfContainerRef.current;
    if (!pdfEl) return;

    const updateTilt = () => {
      const max = Math.max(1, pdfEl.scrollHeight - pdfEl.clientHeight);
      const progress = pdfEl.scrollTop / max;
      const clamped = Math.min(1, Math.max(0, progress));
      document.documentElement.style.setProperty('--touch-tilt', clamped.toFixed(3));
    };

    updateTilt();
    pdfEl.addEventListener('scroll', updateTilt, { passive: true });
    return () => {
      pdfEl.removeEventListener('scroll', updateTilt);
      document.documentElement.style.removeProperty('--touch-tilt');
    };
  }, [menuOpen, pdfOn, totalPages]);

  // --- Smooth Wheel Scroll (Desktop) ---
  useEffect(() => {
    const pdfEl = pdfContainerRef.current;
    if (!pdfEl) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (menuOpen || prefersReduced || isMobile || !pdfOn) return;

    let desired = pdfEl.scrollTop, current = pdfEl.scrollTop, rafId = null;
    const ease = 0.14;
    const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

    const tick = () => {
      const delta = desired - current;
      current += delta * ease;
      if (Math.abs(delta) < 0.4) current = desired;
      pdfEl.scrollTop = current;
      if (current !== desired) rafId = requestAnimationFrame(tick);
      else rafId = null;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const max = pdfEl.scrollHeight - pdfEl.clientHeight;
      desired = clamp(desired + e.deltaY, 0, max);
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const keyStep = () => Math.max(80, pdfEl.clientHeight * 0.8);
    const onKeyDown = (e) => {
      const max = pdfEl.scrollHeight - pdfEl.clientHeight;
      if (e.key === 'ArrowDown') { e.preventDefault(); desired = clamp(desired + 60, 0, max); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); desired = clamp(desired - 60, 0, max); }
      else if (e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); desired = clamp(desired + keyStep(), 0, max); }
      else if (e.key === 'PageUp') { e.preventDefault(); desired = clamp(desired - keyStep(), 0, max); }
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    pdfEl.addEventListener('wheel', onWheel, { passive: false });
    pdfEl.addEventListener('keydown', onKeyDown);
    pdfEl.tabIndex = 0;
    return () => {
      pdfEl.removeEventListener('wheel', onWheel, { passive: false });
      pdfEl.removeEventListener('keydown', onKeyDown);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isMobile, menuOpen, pdfOn]);

  useEffect(() => {
    if (!pdfOn) setSheetOpen(false);
  }, [pdfOn]);

  useEffect(() => {
    if (menuOpen) setSheetOpen(false);
  }, [menuOpen]);

  return (
    <>
      {/* 3D Overlay */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <HivModelStage rightBias={1.8} />
        </div>
      </div>

      {/* PDF + Right Text */}
      <AnimatePresence mode="wait">
        {!menuOpen && (
          <motion.div
            key="pdf"
            ref={pdfContainerRef}
            className="_noScroll _surface _pdf"
            style={{
              flex: 1, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',
              height: 'calc(100vh - var(--hdrH, 120px))', marginTop: 'var(--hdrH, 120px)',
              overflowY: 'scroll', overflowX: 'visible', perspective: '1000px',
              padding: '0 16px 24px', gap: 20, scrollBehavior: 'auto', overscrollBehavior: 'contain',
              scrollbarGutter: 'stable', outline: 'none',
              pointerEvents: pdfOn ? 'auto' : 'none',
            }}
            initial={false}
            animate={{ opacity: pdfOn ? 1 : 0, y: pdfOn ? 0 : 16 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ ease: 'easeOut', duration: 0.45 }}
            aria-hidden={!pdfOn}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                ref={(el) => (pageWrapRefs.current[i] = el)}
                className="_pdfWrap"
                data-index={i}
                style={{ maxWidth: '90%', transformStyle: 'preserve-3d', rotate: 0 }}
              >
                <canvas
                  ref={(el) => (canvasRefs.current[i] = el)}
                  data-rendered=""
                  style={{
                    display: 'block', width: '100%', height: 'auto', backgroundColor: 'transparent',
                    transform: 'translateZ(0)', transition: 'transform 900ms cubic-bezier(.2,.8,.2,1), opacity 700ms ease, box-shadow 400ms ease',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.12), 0 0 16px rgba(147,112,219,0.35)', opacity: 0.82, willChange: 'transform',
                  }}
                />
              </div>
            ))}
          </motion.div>
        )}

        {!menuOpen && (
          <motion.div
            key="righttext"
            ref={textContainerRef}
            className="_noScroll _rightText _surface"
            style={{
              flexBasis: '340px',
              height: 'calc(100vh - var(--hdrH, 120px))',
              marginTop: 'var(--hdrH, 120px)',
              overflowY: 'scroll', overflowX: 'visible',
              color: '#9370DB', fontSize: 12, lineHeight: 1.55, padding: '14px 16px',
              textAlign: 'right', zIndex: 4, position: 'relative', transform: 'rotateY(28deg)',
              transformStyle: 'preserve-3d', scrollBehavior: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable',
              pointerEvents: pdfOn ? 'auto' : 'none',
            }}
            initial={false}
            animate={{ opacity: pdfOn ? 1 : 0, x: pdfOn ? 0 : 16 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ ease: 'easeOut', duration: 0.4, delay: pdfOn ? 0.06 : 0 }}
            aria-hidden={!pdfOn}
          >
            <RightTextComponent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet */}
      {isMobile && pdfOn && !menuOpen && (
        <>
          <button
            type="button"
            className="_fab"
            onClick={() => setSheetOpen(true)}
            aria-controls="archive-sheet"
            aria-expanded={sheetOpen}
          >
            Bibliographies
          </button>

          <div className={`_sheetBackdrop ${sheetOpen ? '_open' : ''}`} onClick={() => setSheetOpen(false)} aria-hidden />
          <div id="archive-sheet" className={`_sheet ${sheetOpen ? '_open' : ''}`} role="dialog" aria-modal="true" aria-label="Bibliographies and text">
            <div className="_sheetHeader">
              <h3 className="_sheetTitle">Bibliographies · Traces of HIV</h3>
              <button type="button" className="_sheetClose" onClick={() => setSheetOpen(false)}>Close</button>
            </div>
            <div className="_sheetBody">
              <RightTextComponent />
            </div>
          </div>
        </>
      )}
    </>
  );
}
