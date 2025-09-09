import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query as fsQuery, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";

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

  const onRowClick = (id) => {
    if (typeof onOpenItem === 'function') {
      onOpenItem(id);
    }
  };

  const onEnter = (item, e) => {
    setHoverLoaded(false);
    setHoverTitle(item.title);
    const jitter = (n) => Math.random() * n - n / 2;
    const top = (e?.clientY ?? 0) + jitter(40);
    const left = (e?.clientX ?? 0) + jitter(40);
    setHoverImagePos({ top, left });
    const img = item.fileURLs[0] || item.thumbnailURL || "";
    setHoverImage(img);
  };

  const onLeave = () => {
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
        .arch__container {
          position: fixed;
          left: 0; right: 0;
          top: calc(var(--hdrH, 120px) + 76px);
          bottom: 0;
          z-index: 9; /* BELOW the RedMenuOverlay controls (z:10), ABOVE red backdrop */
          width: 100%;
          background: transparent;
          padding: 0 clamp(10px, 2vw, 20px) 16px;
          display: flex;
          flex-direction: column;
        }
        /* center header contents to same max width as table */
        .arch__header { width: min(1200px, 100%); margin: 0 auto; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; padding: 8px 0 10px; color: #fff; background: transparent; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        .arch__search {
          padding: 10px 16px;
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,.9);
          background: rgba(255,255,255,.15);
          color: #fff;
          outline: none;
          font-size: 14px;
          min-width: min(46vw, 380px);
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
        .arch__body { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 4px 0 0; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        /* table: centered with equal left/right spacing, slightly smaller text */
        .archTable { width: min(1200px, 100%); margin: 0 auto; border-collapse: collapse; font-size: .82rem; color: #fff; font-family: 'Arial Black', Arial, Helvetica, sans-serif; }
        .archTable th, .archTable td { padding: 10px 10px; border-bottom: 2.5px solid rgba(255,255,255,.92); vertical-align: middle; }
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
        @media (max-width: 760px) {
          .arch__container { top: calc(var(--hdrH, 120px) + 64px); padding: 0 12px 12px; }
          .arch__header { width: 100%; }
          .arch__search { min-width: 0; width: 100%; }
          .archTable { width: 100%; }
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
        {hoverImage && (
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
        </div>
      </div>
    </>
  );
}