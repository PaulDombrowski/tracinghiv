// src/Upload.jsx
import React, { useMemo, useRef, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage();

const ALL_CATEGORIES = [
  'ANGER','BEAUTY','COMFORT','DENIAL','FEAR','HOPE','INSPIRATION','LOSS','LOVE','MOURNING','LIBERATION','PAIN','PASSION','SEX','SHAME','STIGMA','STRENGTH','TRACES','VIOLENCE'
];

const ALL_TYPES = [
  'Advertisement','Article','Artwork','Audio','Book','Blogpost','Case Study','Collected Volume','Conference Paper','Dataset','Diary','Documentary','Essay','Exhibition','Film','Flyer','Interview','Journal','Legal Document','Letter','Magazine','Memoir','Monograph','Movie','Music Video','Newspaper','News Clip','Newsletter','Novel','Official Document','Oral History','Pamphlet','Photograph','Performance/Theatre','Podcast','Poster','Presentation','Research Paper','Screenshot','Short Story','Social Media Comment','Social Media Post','Speech','Survey','Testimony','Thesis','TV-Series','Video','Website','Other'
];

export default function Upload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState([]);
  const [type, setType] = useState('');
  const [source, setSource] = useState('');
  const [files, setFiles] = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(['']);
  const [uploader, setUploader] = useState('');
  const [motivation, setMotivation] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const toggleCategory = (cat) => {
    setCategory((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 4) { setError('You can upload up to 4 files only.'); return; }
    const tooBig = selected.find((f) => f.size > 1048576);
    if (tooBig) { setError('Each file must be 1MB or less.'); return; }
    setError(null);
    setFiles(selected);
  };

  const handleAdditionalInfoChange = (index, value) => {
    setAdditionalInfo((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const addMoreInfoField = () => setAdditionalInfo((prev) => [...prev, '']);

  const canSubmit = useMemo(() => {
    return title && description && category.length && type && uploader && mood && !busy;
  }, [title, description, category, type, uploader, mood, busy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    if (!canSubmit) { setError('Please fill in all required fields.'); return; }
    setError(null);
    setBusy(true);

    try {
      // Upload files
      const fileURLs = [];
      for (const file of files) {
        const safeName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `uploads/${safeName}`);
        const uploadResult = await uploadBytes(storageRef, file);
        fileURLs.push(await getDownloadURL(uploadResult.ref));
      }

      // Thumbnail: file takes precedence if provided, else URL field
      let thumbnailURL = thumbnailUrl;
      if (thumbnail && !thumbnailUrl) {
        const safeName = `${Date.now()}-${thumbnail.name}`;
        const thumbRef = ref(storage, `thumbnails/${safeName}`);
        const thumbUpload = await uploadBytes(thumbRef, thumbnail);
        thumbnailURL = await getDownloadURL(thumbUpload.ref);
      }

      await addDoc(collection(db, 'uploads'), {
        title,
        description,
        category,
        type,
        source,
        fileURLs,
        thumbnailURL: thumbnailURL || '',
        additionalInfo: additionalInfo.filter((s) => s && s.trim() !== ''),
        uploader,
        motivation,
        mood,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        createdAt: serverTimestamp(),
      });

      // Reset
      setTitle(''); setDescription(''); setCategory([]); setType(''); setSource('');
      setFiles([]); setThumbnail(null); setThumbnailUrl(''); setAdditionalInfo(['']);
      setUploader(''); setMotivation(''); setMood(''); setTags('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbInputRef.current) thumbInputRef.current.value = '';
      setSuccess(true);
    } catch (err) {
      console.error('Upload error', err);
      setError('Error uploading file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      {/* scoped styles to match red overlay aesthetics */}
      <style>{`
        .u_wrap {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          padding: 0 clamp(18px, 6vw, 48px);
          box-sizing: border-box;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
          display: grid;
          gap: clamp(28px, 5vw, 48px);
        }
        .u_intro {
          display: grid;
          gap: clamp(12px, 2.4vw, 22px);
          max-width: 100%;
        }
        .u_introTitle {
          margin: 0;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-size: clamp(22px, 4.4vw, 42px);
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .u_p {
          margin: 0;
          font-size: clamp(15px, 2.4vw, 22px);
          line-height: 1.62;
          text-wrap: pretty;
        }
        .u_p + .u_p {
          margin-top: clamp(10px, 2vw, 18px);
        }
        .u_title {
          margin: 0;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-size: clamp(22px, 3.6vw, 30px);
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .u_form {
          display: grid;
          gap: clamp(18px, 3vw, 26px);
          max-width: 100%;
          box-sizing: border-box;
        }
        .u_row {
          display: grid;
          gap: 10px;
        }
        .u_row label {
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: .1em;
        }
        .u_req {
          color: #fff;
          background: #cc0000;
          padding: 0 6px;
          border-radius: 999px;
          margin-left: 8px;
          font-size: 10px;
          letter-spacing: .08em;
        }
        .u_input, .u_textarea, .u_select {
          width: 100%;
          padding: 14px 18px;
          border-radius: 20px;
          border: 2px solid rgba(255,255,255,0.78);
          background: rgba(255,255,255,0.1);
          color: #fff;
          outline: none;
          transition: border-color .22s ease, background .22s ease, box-shadow .22s ease, transform .22s ease;
          box-sizing: border-box;
        }
        .u_input::placeholder, .u_textarea::placeholder {
          color: rgba(255,255,255,0.75);
        }
        .u_input:focus, .u_textarea:focus, .u_select:focus {
          background: rgba(255,255,255,0.18);
          border-color: #ffffff;
          box-shadow: 0 0 0 6px rgba(255,255,255,0.16);
          transform: translateY(-1px);
        }
        .u_select {
          appearance: none;
          background-image: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0));
        }
        .u_textarea {
          min-height: 120px;
          resize: vertical;
        }
        .u_pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .u_pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,0.88);
          background: transparent;
          color: #fff;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-size: 11px;
          letter-spacing: .08em;
          cursor: pointer;
          user-select: none;
          transition: transform .18s ease, background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease;
          max-width: 100%;
          text-align: center;
          white-space: normal;
        }
        .u_pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.24);
        }
        .u_pill._active {
          background: #ffffff;
          color: #cc0000;
          border-color: #ffffff;
        }
        .u_files {
          display: grid;
          gap: 8px;
        }
        .u_help {
          font-size: 12px;
          opacity: .86;
          letter-spacing: .04em;
        }
        .u_btnRow {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .u_btn {
          background: rgba(255,255,255,0.96);
          color: #cc0000;
          border: none;
          border-radius: 999px;
          padding: 12px 22px;
          font-family: 'Arial Black', Arial, Helvetica, sans-serif;
          font-size: 12px;
          letter-spacing: .14em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(0,0,0,0.22);
          transition: transform .18s ease, filter .18s ease;
        }
        .u_btn:hover {
          filter: brightness(.96);
          transform: translateY(-2px);
        }
        .u_btn:active {
          transform: translateY(0);
        }
        .u_btn._ghost {
          background: rgba(255,255,255,0.82);
        }
        .u_msg {
          padding: 12px 16px;
          border-radius: 16px;
          font-weight: 700;
          letter-spacing: .06em;
        }
        .u_msg._error {
          background: rgba(0,0,0,0.36);
          border: 2px solid rgba(255,255,255,0.9);
        }
        .u_msg._ok {
          background: rgba(255,255,255,0.9);
          color: #cc0000;
        }
        @media (max-width: 760px) {
          .u_wrap { gap: 28px; padding: 0 clamp(18px, 8vw, 32px); }
          .u_intro { gap: 18px; }
        }
      `}</style>

      <div className="u_wrap">
        <section className="u_intro">
          <h2 className="u_introTitle">Share a trace</h2>
          <p className="u_p">This archive gathers signals that do not sit quietly—snippets from chat logs, flyers left on club floors, policy drafts that tremble with urgency. Bring the pieces that keep vibrating so they can resonate with the rest.</p>
          <p className="u_p">Upload captures, recordings, screenshots, or written accounts alongside the context that nourishes them. Describe how you found the material, who tended to it, and what it continues to move.</p>
          <p className="u_p">Remove sensitive identifiers, confirm you have consent where needed, and note if access restrictions should stay attached to the trace.</p>
        </section>
        <h3 className="u_title">Contribution Form</h3>
        <form className={`u_form${success ? ' _success' : ''}`} onSubmit={handleSubmit}>
          <div className="u_row">
            <label>Title<span className="u_req">*</span></label>
            <input className="u_input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="u_row">
            <label>Description<span className="u_req">*</span></label>
            <textarea className="u_textarea" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="u_row">
            <label>Category<span className="u_req">*</span></label>
            <div className="u_pills">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`u_pill ${category.includes(cat) ? '_active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div className="u_row">
            <label>Type<span className="u_req">*</span></label>
            <select className="u_select" value={type} onChange={(e) => setType(e.target.value)} required>
              <option value="" disabled>Select…</option>
              {ALL_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>

          <div className="u_row">
            <label>Source (optional)</label>
            <input className="u_input" type="url" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://…" />
          </div>

          <div className="u_row">
            <label>Uploader<span className="u_req">*</span></label>
            <input className="u_input" type="text" value={uploader} onChange={(e) => setUploader(e.target.value)} required />
          </div>

          <div className="u_row">
            <label>Upload Thumbnail (optional)</label>
            <input ref={thumbInputRef} className="u_input" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} disabled={!!thumbnailUrl} />
          </div>

          <div className="u_row">
            <label>Thumbnail URL (optional)</label>
            <input className="u_input" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" disabled={!!thumbnail} />
          </div>

          <div className="u_row">
            <label>Files (up to 4, max 1MB each)</label>
            <div className="u_files">
              <input ref={fileInputRef} className="u_input" type="file" multiple onChange={handleFileChange} />
              <span className="u_help">{files.length ? `${files.length} file(s) selected.` : 'No files selected.'}</span>
            </div>
          </div>

          <div className="u_row">
            <label>Linked Resources</label>
            {additionalInfo.map((info, idx) => (
              <input
                key={idx}
                className="u_input"
                type="url"
                value={info}
                placeholder="https://…"
                onChange={(e) => handleAdditionalInfoChange(idx, e.target.value)}
              />
            ))}
            <div className="u_btnRow">
              <button type="button" className="u_btn _ghost" onClick={addMoreInfoField}>Add Another URL</button>
            </div>
          </div>

          <div className="u_row">
            <label>Motivation</label>
            <textarea className="u_textarea" value={motivation} onChange={(e) => setMotivation(e.target.value)} />
          </div>

          <div className="u_row">
            <label>Mood<span className="u_req">*</span></label>
            <textarea className="u_textarea" value={mood} onChange={(e) => setMood(e.target.value)} required />
          </div>

          <div className="u_row">
            <label>Tags (comma separated)</label>
            <input className="u_input" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="beauty, pop, …" />
          </div>

          {error && <div className="u_msg _error">{error}</div>}
          {success && <div className="u_msg _ok">Trace received — thank you.</div>}

          <div className="u_btnRow">
            <button type="submit" disabled={!canSubmit} className="u_btn">{busy ? 'Sending…' : 'Send Trace'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
