import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query as fsQuery, orderBy, doc, getDoc, where, limit } from "firebase/firestore";
import { motion } from "framer-motion";
export function ItemDetail({ id, onBack, onClose, onOpen }) {
  const [item, setItem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [related, setRelated] = React.useState([]);
  const [relLoading, setRelLoading] = React.useState(false);

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

  // Load related items based on shared categories
  React.useEffect(() => {
    const safeArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    let alive = true;
    (async () => {
      if (!item) return;
      const cats = safeArr(item.category).filter(Boolean);
      if (!cats.length) { setRelated([]); return; }
      try {
        setRelLoading(true);
        const coll = collection(db, 'uploads');
        // Query by any shared category; then filter/sort client-side
        const q = fsQuery(coll, where('category', 'array-contains-any', cats), limit(10));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((docu) => list.push({ id: docu.id, ...docu.data() }));
        // Exclude self, score by number of shared categories
        const scored = list
          .filter((d) => d.id !== item.id)
          .map((d) => {
            const dCats = safeArr(d.category).filter(Boolean);
            const shared = dCats.filter((c) => cats.includes(c)).length;
            return { ...d, __score: shared };
          })
          .sort((a, b) => b.__score - a.__score);
        const top3 = scored.slice(0, 3);
        if (alive) setRelated(top3);
      } catch (e) {
        console.error('Related load error:', e);
        if (alive) setRelated([]);
      } finally {
        if (alive) setRelLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [item]);

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
        .detail__inner { width: min(1180px, 92vw); margin: 0 auto; color: #fff; font-family: 'Arial Black', Arial, Helvetica, sans-serif; pointer-events: auto; }
        .detail__title { margin: 0 0 8px; font-size: clamp(20px, 6.4vw, 56px); line-height: 1.04; letter-spacing: .06em; text-transform: uppercase; white-space: normal; text-wrap: balance; overflow-wrap: anywhere; word-break: normal; word-spacing: .16em; }
        @media (max-width: 560px) { .detail__title { line-height: 1.1; } }
        ._titleLine { word-spacing: .18em; }
        @media (max-width: 560px) { ._titleLine { } }
        .detail__meta { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-bottom: 14px; font-size: clamp(12px, 1.6vw, 16px); font-family: Arial, Helvetica, sans-serif; }
        .detail__pill { display: inline-block; padding: 6px 10px; border: 2px solid rgba(255,255,255,.92); border-radius: 999px; font-size: .82rem; }
        .detail__pillType { display:inline-block; padding:6px 10px; border-radius:999px; background:#fff; color:#cc0000; font-size:.82rem; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        .detail__grid { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(0,1fr); gap: clamp(12px, 2vw, 24px); align-items: start; }
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
        @media (max-width: 900px) {
          .detail__grid { grid-template-columns: 1fr; gap: clamp(16px, 4vw, 28px); }
          .detail__meta { gap: 6px 10px; }
          .detail__extras, .detail__relatedWrap { width: 100%; }
          .detail__relatedList { grid-template-columns: 1fr; }
        }
        .detail__relatedWrap { width: min(1200px, 92vw); margin: 40px auto 0; }
        .detail__relatedTitle { margin: 16px 0 10px; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(13px, 1.6vw, 16px); letter-spacing: .03em; text-transform: uppercase; border-bottom: 2px solid rgba(255,255,255,.18); padding-bottom: 6px; }
        .detail__relatedList { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
        .detail__card { cursor: pointer; user-select: none; border: 2px solid rgba(255,255,255,.95); border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.04); transition: transform .18s cubic-bezier(.2,.8,.2,1), background .18s ease; box-shadow: 0 8px 20px rgba(0,0,0,.25); }
        .detail__card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
        .detail__thumb { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
        .detail__cardBody { padding: 8px 10px; color: #fff; }
        .detail__cardTitle { margin: 0 0 6px; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(12px, 1.6vw, 16px); line-height: 1.2; text-transform: uppercase; letter-spacing: .04em; }
        .detail__cardType { display:inline-block; padding:4px 8px; border-radius:999px; background:#fff; color:#cc0000; font-size:.72rem; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        @media (max-width: 900px) { .detail__relatedList { grid-template-columns: 1fr; } }
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
                {safeArr(item.category).map((c,i) => (
                  <span key={`${c}-${i}`} className="detail__pill">{c}</span>
                ))}
                {safeArr(item.tags).length > 0 && (
                  <span>Tags: {safeArr(item.tags).join(', ')}</span>
                )}
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
              {/* Related items */}
              <div className="detail__relatedWrap">
                <h4 className="detail__relatedTitle">Similar items</h4>
                {relLoading && <div>Loading…</div>}
                {!relLoading && related.length === 0 && <div style={{opacity:.8}}>No similar items found.</div>}
                {!relLoading && related.length > 0 && (
                  <div className="detail__relatedList">
                    {related.map((r) => (
                      <div key={r.id} className="detail__card" onClick={() => onOpen?.(r.id)} role="button" tabIndex={0}
                           onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); onOpen?.(r.id);} }}>
                        <img className="detail__thumb" src={(Array.isArray(r.fileURLs) && r.fileURLs[0]) || r.thumbnailURL || ''} alt="" />
                        <div className="detail__cardBody">
                          <div className="detail__cardTitle">{r.title || 'Untitled'}</div>
                          {r.type && <span className="detail__cardType">{r.type}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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

const safeArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const fmtDate = (dLike) => {
  if (!dLike) return "—";
  try {
    const d =
      dLike?.toDate?.() ??
      (typeof dLike === "number"
        ? new Date(dLike)
        : new Date(dLike?.seconds ? dLike.seconds * 1000 : dLike));
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(d);
  } catch {
    return "—";
  }
};

export default function Archive({ onClose, onOpenItem }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverTitle, setHoverTitle] = useState("");
  const [hoverImage, setHoverImage] = useState("");
  const [hoverImagePos, setHoverImagePos] = useState({ top: 0, left: 0 });
  const [hoverLoaded, setHoverLoaded] = useState(false);
  const [queryStr, setQueryStr] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isCompact, setIsCompact] = useState(false);
  const [allowHoverPreview, setAllowHoverPreview] = useState(true);
  const firstMatchRef = useRef(null);

  // Load data (ordered if createdAt exists)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const coll = collection(db, "uploads");
        let snap;
        try {
          snap = await getDocs(fsQuery(coll, orderBy("createdAt", "desc")));
        } catch {
          snap = await getDocs(coll);
        }
        const out = [];
        let i = 1;
        snap.forEach((doc) => {
          const d = doc.data();
          out.push({
            id: doc.id,
            number: i++,
            title: d?.title || "Untitled",
            type: d?.type || "—",
            category: safeArr(d?.category),
            tags: safeArr(d?.tags),
            createdAt: d?.createdAt ?? null,
            fileURLs: safeArr(d?.fileURLs),
            thumbnailURL: d?.thumbnailURL || "",
          });
        });
        setRows(out);
      } catch (e) {
        console.error("Archive load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(queryStr.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [queryStr]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compactMq = window.matchMedia('(max-width: 850px)');
    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');

    const updateCompact = () => setIsCompact(compactMq.matches);
    const updateHover = () => setAllowHoverPreview(hoverMq.matches);

    updateCompact();
    updateHover();

    compactMq.addEventListener ? compactMq.addEventListener('change', updateCompact) : compactMq.addListener(updateCompact);
    hoverMq.addEventListener ? hoverMq.addEventListener('change', updateHover) : hoverMq.addListener(updateHover);

    return () => {
      compactMq.removeEventListener ? compactMq.removeEventListener('change', updateCompact) : compactMq.removeListener(updateCompact);
      hoverMq.removeEventListener ? hoverMq.removeEventListener('change', updateHover) : hoverMq.removeListener(updateHover);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!debounced) return rows;
    return rows.filter((r) => {
      const inTitle = r.title.toLowerCase().includes(debounced);
      const inType = r.type.toLowerCase().includes(debounced);
      const inCat = r.category.some((c) => c.toLowerCase().includes(debounced));
      const inTags = r.tags.some((t) => t.toLowerCase().includes(debounced));
      return inTitle || inType || inCat || inTags;
    });
  }, [rows, debounced]);

  useEffect(() => {
    if (!debounced) return;
    firstMatchRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [debounced, filtered]);

  useEffect(() => {
    if (!allowHoverPreview) {
      setHoverImage("");
      setHoverTitle("");
    }
  }, [allowHoverPreview]);

  const onRowClick = (id) => {
    if (typeof onOpenItem === 'function') {
      onOpenItem(id);
    }
  };

  const onEnter = (item, e) => {
    if (!allowHoverPreview) return;
    setHoverLoaded(false);
    setHoverTitle(item.title);
    const jitter = (n) => Math.random() * n - n / 2;
    const eventX = e?.clientX ?? window.innerWidth / 2;
    const eventY = e?.clientY ?? window.innerHeight / 2;
    const approxSize = Math.min(Math.max(window.innerWidth * 0.22, 160), 360);
    const range = (value, min, max) => Math.min(Math.max(value, min), max);
    const baseTop = eventY + jitter(40) - approxSize * 0.5;
    const top = range(baseTop, 16, Math.max(16, window.innerHeight - approxSize - 16));
    const left = range(eventX + jitter(40) - approxSize * 0.5, 16, window.innerWidth - approxSize - 16);
    setHoverImagePos({ top, left });
    const img = item.fileURLs[0] || item.thumbnailURL || "";
    setHoverImage(img);
  };

  const onLeave = () => {
    if (!allowHoverPreview) return;
    setHoverTitle("");
    setHoverImage("");
  };

  const titleSize = React.useMemo(() => {
    if (!hoverTitle) return "7rem";
    const words = hoverTitle.split(/\s+/).length;
    if (words > 12) return `${Math.max(6, 12 - words)}rem`;
    return "7rem";
  }, [hoverTitle]);

  return (
    <>
      {/* Inline styles to live on RED MENU LAYER */}
      <style>{`
        :root { --archGutter: clamp(32px, 8vw, 96px); }
        .arch__title {
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-size: clamp(18px, 7vw, 64px);
          letter-spacing: .06em;
          text-transform: uppercase;
          margin: 0 0 12px;
          margin-top: 0;
          white-space: nowrap;
          overflow-wrap: normal;
          word-break: keep-all;
          word-spacing: .16em;
        }
        @media (max-width: 560px) {
          .arch__title {
            white-space: normal;
            text-wrap: balance;
            line-height: 1.08;
          }
        }
        .arch__container {
          position: fixed;
          left: 0; right: 0;
          top: calc(var(--hdrH, 120px) + 72px);
          bottom: 0;
          z-index: 9; /* BELOW the RedMenuOverlay controls (z:10), ABOVE red backdrop */
          width: min(1180px, calc(100% - 2 * var(--archGutter)));
          margin: 0 auto;
          background: transparent;
          padding: clamp(12px, 3.5vw, 28px) clamp(18px, 4vw, 38px) clamp(18px, 4vw, 32px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          animation: archSlide .48s cubic-bezier(.2,.8,.2,1) forwards;
        }
        /* center header contents to same max width as table */
        .arch__header { width: 100%; display: flex; justify-content: center; align-items: center; gap: 12px; padding: 8px 0 16px; color: #fff; background: transparent; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        .arch__search {
          padding: clamp(10px, 1.8vw, 14px) clamp(16px, 3vw, 22px);
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,.9);
          background: rgba(255,255,255,.15);
          color: #fff;
          outline: none;
          font-size: 14px;
          width: 100%;
          max-width: min(1180px, calc(100% - 2 * clamp(18px, 4vw, 38px)));
          transition: box-shadow .2s ease, background .2s ease, border-color .2s ease;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
        }
        .arch__search::placeholder { color: rgba(255,255,255,.85); }
        .arch__search:focus {
          background: rgba(255,255,255,.22);
          box-shadow: 0 0 0 6px rgba(255,255,255,.18);
          border-color: #fff;
        }
        /* body takes remaining height and scrolls */
        .arch__body { flex: 1 1 auto; min-height: 0; overflow: auto; padding: clamp(6px, 1.2vw, 12px) 0 0; font-family: 'Arial Black', Arial, Helvetica, sans-serif; animation: archFade .46s ease forwards; }
        /* table: centered with equal left/right spacing, slightly smaller text */
        .archTable { width: 100%; margin: 0 auto; border-collapse: collapse; font-size: .82rem; color: #fff; font-family: 'Arial Black', Arial, Helvetica, sans-serif; animation: archFade .46s ease forwards; }
        .archTable th, .archTable td { padding: 10px clamp(10px, 2.4vw, 18px); border-bottom: 2.5px solid rgba(255,255,255,.92); vertical-align: middle; }
        .archTable th { font-weight: 800; text-transform: uppercase; font-size: .84rem; }
        .col-num { width: 56px; text-align: center; }
        .pill { display: inline-block; padding: 5px 9px; margin: 2px 6px 2px 0; border-radius: 999px; border: 2px solid rgba(255,255,255,.92); background: transparent; font-size: .7rem; line-height: 1; color: #fff; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        .r { transition: background-color .22s ease, color .22s ease, transform .18s ease, opacity .18s ease; cursor: pointer; }
        .r:hover { background: rgba(255,255,255,.12); }
        .loadingRow, .emptyRow { text-align: center; padding: 22px 12px; color: #fff; }
        /* Hover image wrapper sits above table content, below RedMenu controls */
        .hoverImageWrap {
          position: fixed; width: clamp(160px, 22vw, 360px); height: clamp(160px, 22vw, 360px);
          z-index: 9; /* above table content, below RedMenu controls (z:10) */
          pointer-events: none; border-radius: 12px; overflow: hidden;
          box-shadow: 0 12px 34px rgba(0,0,0,.35);
          border: 2px solid rgba(255,255,255,.95);
          filter: saturate(1.12) contrast(1.03);
        }
        .hoverImageWrap::before {
          content: '';
          position: absolute; inset: 0;
          background: #9370DB; /* flieder */
          mix-blend-mode: color; /* push hue strongly towards flieder */
          opacity: 0.55;
          pointer-events: none;
        }
        .hoverImageWrap::after { /* flieder tint overlay */
          content: '';
          position: absolute; inset: 0;
          background: rgba(147, 112, 219, 0.75); /* flieder: stronger overlay */
          mix-blend-mode: multiply;
          pointer-events: none;
        }
        .hoverCaption {
          position: absolute; left: 10px; right: 10px; top: 10px;
          padding: 0;
          color: #ffffff;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-weight: 900;
          font-size: clamp(18px, 2.8vw, 34px);
          line-height: 1.1;
          text-align: left;
          letter-spacing: .04em;
          opacity: 0; transform: translateY(-10px) scale(.96);
          transition: opacity .24s ease, transform .24s ease;
          text-shadow: 0 2px 0 rgba(0,0,0,.18), 0 0 18px rgba(0,0,0,.26);
          z-index: 1;
          white-space: normal; word-break: break-word; overflow: visible;
        }
        .hoverCaption.show {
          opacity: 1;
          transform: translateY(0) scale(1);
          animation: capPop 320ms cubic-bezier(.2,.8,.2,1) both,
                     capWarp 420ms cubic-bezier(.19,.84,.22,1) 80ms 1,
                     capShake 240ms steps(14) 140ms 1;
        }
        @keyframes archSlide {
          0% { opacity: 0; transform: translateY(-22px) scale(.96); }
          60% { opacity: 1; transform: translateY(4px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes archFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes capPop {
          0%   { opacity: 0; transform: translateY(-10px) scale(.96) skewX(-6deg); filter: blur(2px); }
          60%  { opacity: 1; transform: translateY(0) scale(1.02) skewX(2deg); filter: blur(0); }
          100% { transform: translateY(0) scale(1) skewX(0); }
        }
        @keyframes capWarp {
          0%   { letter-spacing: .02em; transform: translateY(0) scale(1) skewX(0deg) rotateX(0deg); filter: none; }
          35%  { letter-spacing: .14em; transform: translateY(-2px) scale(1.03) skewX(6deg) rotateX(6deg); filter: blur(.4px); }
          60%  { letter-spacing: .08em; transform: translateY(0) scale(1.01) skewX(-3deg) rotateX(0deg); filter: blur(.2px); }
          100% { letter-spacing: .04em; transform: translateY(0) scale(1) skewX(0deg) rotateX(0deg); filter: none; }
        }
        @keyframes capShake {
          0% { transform: translateY(0) translateX(0); }
          20% { transform: translateY(0) translateX(-1.2px); }
          40% { transform: translateY(0) translateX(1.2px); }
          60% { transform: translateY(0) translateX(-.8px); }
          80% { transform: translateY(0) translateX(.8px); }
          100% { transform: translateY(0) translateX(0); }
        }
        .hoverImage { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .archCards { display: none; }
        @media (max-width: 850px) {
          .arch__container { top: calc(var(--hdrH, 120px) + 56px); width: calc(100% - clamp(28px, 10vw, 68px)); padding: clamp(10px, 4vw, 18px) clamp(14px, 5vw, 24px) clamp(18px, 5vw, 28px); box-sizing: border-box; }
          .arch__header { gap: 8px; width: 100%; justify-content: center; }
          .arch__search { width: 100%; max-width: none; }
          .arch__body { padding-bottom: 24px; }
          .archTable { display: none; }
          .archCards { display: grid; gap: 14px; width: 100%; animation: archFade .48s ease forwards; }
          .archCard {
            border: 2px solid rgba(255,255,255,.5);
            border-radius: 16px;
            background: rgba(15,0,0,0.08);
            backdrop-filter: blur(6px) saturate(1.02);
            -webkit-backdrop-filter: blur(6px) saturate(1.02);
            box-shadow: 0 10px 26px rgba(0,0,0,0.18);
          }
          .archCard__button {
            width: 100%;
            padding: 16px clamp(14px, 5vw, 20px) 14px;
            background: transparent;
            border: none;
            color: #fff;
            text-align: left;
            display: grid;
            gap: 10px;
            cursor: pointer;
          }
          .archCard__header { display: flex; align-items: baseline; gap: 12px; }
          .archCard__num { font-size: 0.85rem; opacity: .78; letter-spacing: .18em; text-transform: uppercase; }
          .archCard__title { margin: 0; font-size: 1.12rem; line-height: 1.2; text-transform: uppercase; letter-spacing: .06em; }
          .archCard__meta { display: flex; flex-wrap: wrap; gap: 6px; font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; opacity: .72; }
          .archCard__chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .archCard__chip { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; border: 2px solid rgba(255,255,255,.46); font-size: .68rem; letter-spacing: .05em; background: rgba(255,255,255,0.06); }
          .archCard__chipType { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; background: #ffffff; color: #cc0000; font-weight: 900; letter-spacing: .08em; font-size: .7rem; }
          .archCard__footer { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: .72rem; letter-spacing: .04em; opacity: .78; }
          .archCard__button:focus-visible { outline: 2px solid #fff; outline-offset: 4px; border-radius: 16px; }
          .archCard__button:active { transform: scale(.99); }
        }
      `}</style>

      <div className="arch__container" role="region" aria-label="Archive">
        <div className="arch__header">
          <input
            type="text"
            className="arch__search"
            placeholder="Search title / type / category / tags…"
            value={queryStr}
            onChange={(e) => setQueryStr(e.target.value)}
            aria-label="Search archive"
          />
        </div>


        {/* Floating hover image */}
        {allowHoverPreview && hoverImage && (
          <motion.div
            className="hoverImageWrap"
            style={{ top: hoverImagePos.top, left: hoverImagePos.left }}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1.06 }}
            transition={{ duration: 0.22 }}
          >
            <img
              src={hoverImage}
              alt=""
              className="hoverImage"
              onLoad={() => {
                setHoverLoaded(false);
                setTimeout(() => setHoverLoaded(true), 90); // tiny delay for fancy reveal
              }}
            />
            <div className={"hoverCaption" + (hoverLoaded ? " show" : "")}>{hoverTitle}</div>
          </motion.div>
        )}

        <div className="arch__body">
          {!isCompact ? (
            <table className="archTable">
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Tags</th>
                  <th>Created&nbsp;At</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="loadingRow">Loading…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="emptyRow">No records found.</td></tr>
                )}
                {!loading &&
                  filtered.map((item, idx) => {
                    const isFirstMatch = debounced && idx === 0;
                    return (
                      <motion.tr
                        key={item.id}
                        ref={isFirstMatch ? firstMatchRef : null}
                        className="r"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: idx * 0.02 }}
                        onClick={() => onRowClick(item.id)}
                        onMouseEnter={(e) => onEnter(item, e)}
                        onMouseLeave={onLeave}
                      >
                        <td className="col-num">{item.number}</td>
                        <td>{item.title}</td>
                        <td>{item.type}</td>
                        <td>
                          {safeArr(item.category).map((c, i) => (
                            <span key={`${c}-${i}`} className="pill">{c}</span>
                          ))}
                        </td>
                        <td>{safeArr(item.tags).length ? safeArr(item.tags).join(", ") : "—"}</td>
                        <td>{fmtDate(item.createdAt)}</td>
                      </motion.tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <div className="archCards">
              {loading && <div className="loadingRow">Loading…</div>}
              {!loading && filtered.length === 0 && <div className="emptyRow">No records found.</div>}
              {!loading && filtered.map((item, idx) => {
                const isFirstMatch = debounced && idx === 0;
                return (
                  <motion.article
                    key={item.id}
                    ref={isFirstMatch ? firstMatchRef : null}
                    className="archCard"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: idx * 0.035 }}
                  >
                    <button
                      type="button"
                      className="archCard__button"
                      onClick={() => onRowClick(item.id)}
                      aria-label={`Open archive item ${item.title || 'Untitled'}`}
                    >
                      <header className="archCard__header">
                        <span className="archCard__num">#{item.number}</span>
                        <h3 className="archCard__title">{item.title || 'Untitled'}</h3>
                      </header>
                      <div className="archCard__meta">
                        <span>{fmtDate(item.createdAt)}</span>
                      </div>
                      {(item.type || safeArr(item.category).length > 0) && (
                        <div className="archCard__chips">
                          {item.type && (
                            <span className="archCard__chipType">{item.type}</span>
                          )}
                          {safeArr(item.category).map((c, i) => (
                            <span key={`${c}-${i}`} className="archCard__chip">{c}</span>
                          ))}
                        </div>
                      )}
                      <footer className="archCard__footer">
                        <span>{safeArr(item.tags).length ? safeArr(item.tags).join(', ') : 'No tags'}</span>
                      </footer>
                    </button>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
