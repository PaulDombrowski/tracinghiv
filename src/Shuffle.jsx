import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query as fsQuery } from 'firebase/firestore';
// SVG placeholder for missing images
const NO_IMAGE_SVG = `
<svg width="100%" height="100%" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="320" height="240" rx="18" fill="#eee"/>
  <rect x="22" y="64" width="276" height="132" rx="12" fill="#ddd"/>
  <rect x="52" y="96" width="80" height="48" rx="8" fill="#e8e8e8"/>
  <rect x="152" y="112" width="96" height="20" rx="6" fill="#e0e0e0"/>
  <rect x="152" y="142" width="64" height="16" rx="5" fill="#e0e0e0"/>
  <rect x="52" y="154" width="44" height="12" rx="4" fill="#e0e0e0"/>
  <rect x="22" y="36" width="120" height="16" rx="5" fill="#e8e8e8"/>
  <rect x="22" y="20" width="64" height="10" rx="4" fill="#e0e0e0"/>
  <rect x="174" y="36" width="124" height="16" rx="5" fill="#e8e8e8"/>
  <rect x="174" y="20" width="64" height="10" rx="4" fill="#e0e0e0"/>
  <rect x="22" y="212" width="276" height="8" rx="3" fill="#e0e0e0"/>
</svg>
`;

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

export default function Shuffle({ onOpenItem }) {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);
  const imgRef = useRef(null);
  const related = useMemo(() => {
    if (!current) return [];
    const cats = safeArr(current.category).filter(Boolean);
    if (!cats.length) return [];
    const scored = items
      .filter((it) => it.id !== current.id)
      .map((it) => {
        const c = safeArr(it.category).filter(Boolean);
        const shared = c.filter((x) => cats.includes(x)).length;
        return { ...it, __score: shared };
      })
      .filter((it) => it.__score > 0)
      .sort((a, b) => b.__score - a.__score);
    return scored.slice(0, 3);
  }, [items, current]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const coll = collection(db, 'uploads');
        let snap;
        try {
          snap = await getDocs(fsQuery(coll, orderBy('createdAt', 'desc')));
        } catch {
          snap = await getDocs(coll);
        }
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setItems(list);
        if (list.length) setCurrent(list[Math.floor(Math.random() * list.length)]);
      } catch (e) {
        console.error('Shuffle load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Shuffle function that avoids repeating the same item, preloads the next image, and updates current.
  const doShuffle = useCallback(() => {
    if (!items.length) return;
    setShuffling(true);
    let next;
    // Avoid showing the same item twice in a row (if >1 item)
    if (items.length > 1 && current) {
      let idx;
      do {
        idx = Math.floor(Math.random() * items.length);
      } while (items[idx].id === current.id);
      next = items[idx];
    } else {
      next = items[Math.floor(Math.random() * items.length)];
    }
    // Preload next image (if any)
    const imgUrl = (safeArr(next.fileURLs)[0] || next.thumbnailURL || null);
    if (imgUrl) {
      const img = new window.Image();
      img.src = imgUrl;
    }
    setTimeout(() => {
      setCurrent(next);
      setShuffling(false);
    }, 160);
  }, [items, current]);
  // Keyboard shortcuts for shuffling: S, space, ArrowRight
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (
        (e.key === 's' || e.key === 'S') ||
        e.key === ' ' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
        doShuffle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doShuffle]);

  const createdAtText = useMemo(() => {
    const ts = current?.createdAt;
    if (!ts) return '—';
    try {
      const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
      return isNaN(d?.getTime?.()) ? '—' : new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch { return '—'; }
  }, [current]);

  return (
    <div className="shuffle__wrap" role="region" aria-label="Shuffle detail">
      <style>{`
        .shuffle__placeholder {
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 12px;
          border: 2px solid rgba(255,255,255,.95);
          background: #eee;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 34px rgba(0,0,0,.35);
          overflow: hidden;
        }
        :root { --shuffleGutter: clamp(32px, 8vw, 96px); }
        .shuffle__wrap { color: #fff; width: min(1180px, 92vw); margin: 0 auto; padding: clamp(14px, 3.5vw, 24px) clamp(18px, 4vw, 32px) clamp(24px, 5vw, 36px); box-sizing: border-box; }
        .shuffle__topBar { position: sticky; top: clamp(12px, 4vw, 24px); display: grid; place-items: center; gap: clamp(10px, 2vw, 16px); margin: 0 0 clamp(18px, 4vw, 28px); text-align: center; z-index: 3; }
        .shuffle__status { font-family: 'Arial, Helvetica, sans-serif'; opacity: .85; font-size: clamp(13px, 2.2vw, 16px); letter-spacing: .08em; text-transform: uppercase; }
        .shuffle__btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: clamp(14px, 3vw, 22px) clamp(36px, 10vw, 72px);
          border-radius: 999px;
          border: 2.5px solid rgba(255,255,255,0.95);
          background: transparent;
          color: #fff;
          font-weight: 900;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          text-transform: uppercase;
          letter-spacing: .14em;
          cursor: pointer;
          box-shadow: 0 18px 38px rgba(0,0,0,0.26);
          overflow: hidden;
          transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s ease, border-color .2s ease;
        }
        .shuffle__btn::before {
          content: '';
          position: absolute;
          inset: -20%;
          background: radial-gradient(120% 120% at 30% 30%, rgba(255,67,67,0.3) 0%, rgba(255,0,0,0.08) 50%, rgba(255,0,0,0) 100%);
          opacity: 0;
          transition: opacity .25s ease;
        }
        .shuffle__btn:hover::before { opacity: 1; }
        .shuffle__btn:hover { transform: translateY(-2px) scale(1.015); box-shadow: 0 22px 42px rgba(0,0,0,0.32); }
        .shuffle__btn:active { transform: translateY(1px) scale(0.985); box-shadow: 0 12px 26px rgba(0,0,0,0.28); border-color: rgba(255,255,255,0.65); }

        .shuffle__title { font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(20px, 6.2vw, 52px); line-height: 1.04; letter-spacing: .06em; margin: 0 0 8px; text-transform: uppercase; white-space: normal; text-wrap: pretty; overflow-wrap: break-word; word-break: normal; word-spacing: .16em; }
        @media (max-width: 560px) { .shuffle__title { line-height: 1.1; } }
        .shuffle__meta { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-bottom: 14px; font-size: clamp(12px, 1.6vw, 16px); font-family: Arial, Helvetica, sans-serif; }
        .shuffle__pill { display: inline-block; padding: 6px 10px; border: 2px solid rgba(255,255,255,.92); border-radius: 999px; font-size: .82rem; }
        .shuffle__pillType { display:inline-block; padding:6px 10px; border-radius:999px; background:#fff; color:#cc0000; font-size:.82rem; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }

        .shuffle__grid { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(0,1fr); gap: clamp(12px, 2vw, 24px); align-items: start; }
        .shuffle__media { position: relative; }
        .shuffle__media::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 120% at 50% 50%, rgba(147,112,219,.22) 0%, rgba(0,0,0,.0) 42%, rgba(0,0,0,.18) 100%); mix-blend-mode: soft-light; opacity: .9; border-radius: 12px; }
        .shuffle__media > * { width: 100%; height: 100%; object-fit: cover; }
        .shuffle__placeholder svg { width: 100%; height: 100%; object-fit: cover; }
        .shuffle__img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; border: 2px solid rgba(255,255,255,.95); box-shadow: 0 12px 34px rgba(0,0,0,.35); transform: translateZ(0); transition: opacity .24s ease, transform .28s cubic-bezier(.2,.8,.2,1); opacity: ${shuffling ? 0.86 : 1}; }

        .shuffle__body { font-family: Arial, Helvetica, sans-serif; line-height: 1.5; font-size: clamp(13px, 1.7vw, 18px); }
        .shuffle__links { display: grid; gap: 6px; }
        .shuffle__links a { color: #fff; text-decoration: underline; word-break: break-all; }
        .shuffle__sectionTitle { margin: 16px 0 8px; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(13px, 1.6vw, 16px); letter-spacing: .03em; text-transform: uppercase; border-bottom: 2px solid rgba(255,255,255,.18); padding-bottom: 6px; }
        @media (max-width: 900px) {
          .shuffle__wrap { width: calc(100% - clamp(28px, 9vw, 64px)); padding: clamp(18px, 5vw, 28px) clamp(16px, 5.5vw, 26px) clamp(28px, 6vw, 36px); }
          .shuffle__grid { grid-template-columns: 1fr; gap: clamp(16px, 5vw, 28px); }
          .shuffle__media::after { opacity: 0.8; }
          .shuffle__body { font-size: clamp(13px, 3.4vw, 17px); }
          .shuffle__relatedList { display: flex; gap: clamp(12px, 4vw, 20px); overflow-x: auto; padding-bottom: 6px; }
          .shuffle__card { min-width: clamp(200px, 60vw, 260px); flex: 0 0 auto; }
          .shuffle__relatedList::-webkit-scrollbar { display: none; }
        }
        .shuffle__relatedWrap { margin-top: clamp(28px, 6vw, 42px); }
        .shuffle__relatedTitle { margin: 16px 0 10px; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(13px, 1.6vw, 16px); letter-spacing: .06em; text-transform: uppercase; border-bottom: 2px solid rgba(255,255,255,.18); padding-bottom: 6px; }
        .shuffle__relatedList { display: flex; flex-wrap: nowrap; gap: clamp(12px, 2.4vw, 22px); overflow-x: auto; padding-bottom: 6px; }
        .shuffle__relatedList::-webkit-scrollbar { display: none; }
        .shuffle__card { flex: 0 0 clamp(200px, 22vw, 260px); }
        .shuffle__card { cursor: pointer; user-select: none; border: 2px solid rgba(255,255,255,.95); border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.04); transition: transform .18s cubic-bezier(.2,.8,.2,1), background .18s ease; box-shadow: 0 8px 20px rgba(0,0,0,.25); }
        .shuffle__card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
        .shuffle__thumb { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
        .shuffle__cardBody { padding: 8px 10px; color: #fff; }
        .shuffle__cardTitle { margin: 0 0 6px; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(12px, 1.6vw, 16px); line-height: 1.2; text-transform: uppercase; letter-spacing: .04em; }
        .shuffle__cardType { display:inline-block; padding:4px 8px; border-radius:999px; background:#fff; color:#cc0000; font-size:.72rem; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        
      `}</style>

        <div className="shuffle__topBar">
          <div className="shuffle__status">
            {loading ? 'Loading…' : (items.length ? `${items.length} items` : 'No items')}
          </div>
          <button type="button" className="shuffle__btn" onClick={doShuffle} disabled={!items.length}>
            {shuffling ? 'Shuffling…' : 'Shuffle'}
          </button>
        </div>

      {!loading && current && (
        <>
          <h2 className="shuffle__title">{current.title || 'Untitled'}</h2>
          <div className="shuffle__meta">
            {current.type && <span className="shuffle__pillType">{current.type}</span>}
            {safeArr(current.category).map((c,i) => <span className="shuffle__pill" key={i}>{c}</span>)}
            {safeArr(current.tags).length > 0 && <span>Tags: {safeArr(current.tags).join(', ')}</span>}
            <span>{createdAtText}</span>
          </div>

          <div className="shuffle__grid">
            <div className="shuffle__media">
              {!(safeArr(current.fileURLs)[0] || current.thumbnailURL) ? (
                <div
                  className="shuffle__placeholder"
                  aria-label="No image available"
                  dangerouslySetInnerHTML={{ __html: NO_IMAGE_SVG }}
                />
              ) : (
                <img
                  ref={imgRef}
                  className="shuffle__img"
                  src={safeArr(current.fileURLs)[0] || current.thumbnailURL || ''}
                  alt=""
                />
              )}
            </div>
            <div className="shuffle__body">
              {current.description || '—'}
              {Array.isArray(current.additionalInfo) && current.additionalInfo.length > 0 && (
                <>
                  <h4 className="shuffle__sectionTitle">Linked Resources</h4>
                  <div className="shuffle__links">
                    {current.additionalInfo.map((u, i) => (
                      <a key={i} href={u} target="_blank" rel="noopener noreferrer">{u}</a>
                    ))}
                  </div>
                </>
              )}
              {current.source && (
                <>
                  <h4 className="shuffle__sectionTitle">Source</h4>
                  <div className="shuffle__links">
                    <a href={current.source} target="_blank" rel="noopener noreferrer">{current.source}</a>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
      <div className="shuffle__relatedWrap">
        <h4 className="shuffle__relatedTitle">Further Echoes</h4>
        {related.length === 0 ? (
          <div style={{opacity:.8}}>No similar items yet.</div>
        ) : (
          <div className="shuffle__relatedList">
            {related.map((r) => (
              <div key={r.id} className="shuffle__card" onClick={() => (onOpenItem ? onOpenItem(r.id) : setCurrent(r))} role="button" tabIndex={0}
                   onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); (onOpenItem ? onOpenItem(r.id) : setCurrent(r)); } }}>
                <img className="shuffle__thumb" src={(safeArr(r.fileURLs)[0] || r.thumbnailURL || '')} alt="" />
                <div className="shuffle__cardBody">
                  <div className="shuffle__cardTitle">{r.title || 'Untitled'}</div>
                  {r.type && <span className="shuffle__cardType">{r.type}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
