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
    onClose?.();
    if (typeof onOpenItem === 'function') {
      onOpenItem(id);
    } else {
      window.location.assign(`/detail/${id}`);
    }
  };

  const onEnter = (item, e) => {
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
        @font-face {
          font-family: "ArchiveHover";
          src: url("/public/Diamons.ttf") format("truetype");
          font-display: swap;
        }
        .arch__overlay {
          position: fixed; inset: clamp(10px, 2vw, 18px);
          z-index: 12; /* above RedMenuOverlay (z:9) */
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px) saturate(1.1);
          -webkit-backdrop-filter: blur(10px) saturate(1.1);
          border-radius: 18px;
          box-shadow: 0 18px 48px rgba(0,0,0,.28);
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.35);
        }
        .arch__header {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          color: #fff;
          background: linear-gradient( to bottom, rgba(255,255,255,.08), rgba(255,255,255,.02) );
        }
        .arch__title {
          margin: 0;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          text-transform: uppercase;
          letter-spacing: .06em;
          font-size: clamp(16px, 3.2vw, 28px);
        }
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
        }
        .arch__search::placeholder { color: rgba(255,255,255,.85); }
        .arch__search:focus {
          background: rgba(255,255,255,.22);
          box-shadow: 0 0 0 6px rgba(255,255,255,.18);
          border-color: #fff;
        }
        .arch__close {
          position: absolute; top: 10px; right: 12px;
          appearance: none;
          border: 2px solid rgba(255,255,255,.9);
          color: #fff; background: transparent;
          border-radius: 999px; padding: 6px 10px; font-weight: 700;
          cursor: pointer;
        }
        .arch__body {
          overflow: auto;
          padding: 8px 12px 16px;
        }
        /* table */
        .archTable { width: 100%; border-collapse: collapse; font-size: .95rem; color: #fff; }
        .archTable th, .archTable td { padding: 12px 10px; border-bottom: 2.5px solid rgba(255,255,255,.92); vertical-align: middle; }
        .archTable th { font-weight: 800; text-transform: uppercase; }
        .col-num { width: 56px; text-align: center; }
        .pill { display: inline-block; padding: 6px 10px; margin: 2px 6px 2px 0; border-radius: 999px; border: 2px solid rgba(255,255,255,.92); background: transparent; font-size: .78rem; line-height: 1; color: #fff; }
        .r { transition: background-color .22s ease, color .22s ease, transform .18s ease, opacity .18s ease; cursor: pointer; }
        .r:hover { background: rgba(255,255,255,.12); }
        .loadingRow, .emptyRow { text-align: center; padding: 22px 12px; color: #fff; }
        /* hover title & image */
        .hoverTitle {
          font-family: "ArchiveHover", Arial, sans-serif;
          position: fixed; inset: 50% auto auto 50%; transform: translate(-50%, -50%);
          font-size: clamp(3rem, 10vw, 10rem);
          color: #fff; opacity: 0; pointer-events: none; z-index: 13;
          letter-spacing: 0.02em; transition: opacity .25s ease, transform .25s ease; white-space: pre-wrap;
          text-shadow: 0 2px 0 rgba(0,0,0,.12), 0 0 22px rgba(255,255,255,.28);
        }
        .hoverTitle.show { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
        .hoverTitle span { display: inline-block; transition: transform .5s ease; will-change: transform; }
        .hoverImage {
          position: fixed; width: clamp(160px, 22vw, 320px); height: clamp(160px, 22vw, 320px);
          object-fit: cover; border-radius: 12px; box-shadow: 0 8px 26px rgba(0,0,0,.35);
          z-index: 13; pointer-events: none;
          border: 2px solid rgba(255,255,255,.9);
        }
        @media (max-width: 760px) {
          .arch__overlay { inset: 0; border-radius: 0; }
          .arch__header { grid-template-columns: 1fr; gap: 8px; }
          .arch__search { min-width: 0; width: 100%; }
        }
      `}</style>

      <div className="arch__overlay" role="dialog" aria-modal="true" aria-label="Archive">
        <button className="arch__close" onClick={() => onClose?.()}>Close</button>
        <div className="arch__header">
          <h2 className="arch__title">All Current Records in the Database</h2>
          <input
            type="text"
            className="arch__search"
            placeholder="Search title / type / category / tags…"
            value={queryStr}
            onChange={(e) => setQueryStr(e.target.value)}
            aria-label="Search archive"
          />
        </div>

        {/* Hover Title */}
        <div className={`hoverTitle ${hoverTitle ? "show" : ""}`} style={{ fontSize: titleSize }} aria-hidden>
          {hoverTitle.split(" ").map((w, i) => (
            <span
              key={`${w}-${i}`}
              style={{
                transform: `translate(${Math.max(-5, Math.min(5, Math.random() * 20 - 10))}%, ${Math.max(-5, Math.min(5, Math.random() * 20 - 10))}%) rotateY(${Math.random() > 0.5 ? 30 : -30}deg)`,
              }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Floating hover image */}
        {hoverImage && (
          <motion.img
            src={hoverImage}
            alt=""
            className="hoverImage"
            style={{ top: hoverImagePos.top, left: hoverImagePos.left }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1.08 }}
            transition={{ duration: 0.22 }}
          />
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