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
        .u_intro { margin: 0 auto 18px; width: min(1200px, 92vw); color: #fff; font-family: Arial, Helvetica, sans-serif; }
        .u_h2 { font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(22px, 6vw, 44px); line-height: 1.02; letter-spacing: .04em; margin: 0 0 10px; text-transform: none; }
        .u_p { font-size: clamp(14px, 2.2vw, 18px); line-height: 1.6; margin: 0 0 10px; }
        .u_p + .u_p { margin-top: 6px; }
        .u_wrap { width: min(1200px, 92vw); margin: 0 auto; color: #fff; font-family: Arial, Helvetica, sans-serif; }
        .u_title { font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: clamp(18px, 3.4vw, 28px); margin: 0 0 12px; letter-spacing: .04em; }
        .u_form { display: grid; gap: 14px; }
        .u_row { display: grid; gap: 8px; }
        .u_row label { font-family: 'Arial Black', Arial, Helvetica, sans-serif; text-transform: uppercase; font-size: 12px; letter-spacing: .06em; }
        .u_req { color: #fff; background:#cc0000; padding: 0 6px; border-radius: 6px; margin-left: 6px; font-size: 10px; }
        .u_input, .u_textarea, .u_select { width: 100%; padding: 12px 14px; border-radius: 12px; border: 2px solid rgba(255,255,255,.92); background: rgba(255,255,255,.12); color: #fff; outline: none; transition: box-shadow .2s ease, background .2s ease, border-color .2s ease, transform .2s ease; }
        .u_input::placeholder, .u_textarea::placeholder { color: rgba(255,255,255,.85); }
        .u_input:focus, .u_textarea:focus, .u_select:focus { background: rgba(255,255,255,.2); box-shadow: 0 0 0 6px rgba(255,255,255,.18); border-color: #fff; transform: translateY(-1px); }
        .u_textarea { min-height: 96px; resize: vertical; }
        .u_help { font-size: 12px; opacity: .9; }
        .u_pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .u_pill { display: inline-block; padding: 8px 12px; border-radius: 999px; border: 2px solid rgba(255,255,255,.92); background: transparent; color: #fff; font-family: 'Arial Black', Arial, Helvetica, sans-serif; font-size: 12px; cursor: pointer; user-select:none; transition: transform .18s ease, background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease; }
        .u_pill:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(0,0,0,.18); }
        .u_pill._active { background: #ffffff; color: #cc0000; border-color: #ffffff; }
        .u_files { display: grid; gap: 8px; }
        .u_btnRow { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .u_btn { background: rgba(255,255,255,0.96); color: #cc0000; border: none; border-radius: 999px; padding: 10px 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; box-shadow: 0 8px 18px rgba(0,0,0,0.18); transition: transform .18s ease, filter .18s ease; }
        .u_btn:hover { filter: brightness(.96); transform: translateY(-1px); }
        .u_btn:active { transform: translateY(0); }
        .u_btn._ghost { background: rgba(255,255,255,0.85); }
        .u_msg { padding: 10px 12px; border-radius: 12px; font-weight: 700; }
        .u_msg._error { background: rgba(0,0,0,.2); border: 2px solid #fff; }
        .u_msg._ok { background: rgba(255,255,255,.92); color: #cc0000; }
        .u_grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 760px){ .u_grid2 { grid-template-columns: 1fr; } }
        @media (max-width: 760px){
          .u_intro { padding: 0 2px; }
        }
      `}</style>

      <div className="u_wrap">
        <section className="u_intro">
          <h2 className="u_h2">HOW CAN ARCHIVES BE MADE MORE PARTICIPATORY?</h2>
          <p className="u_p">Since institutional archives not only take special care to maintain their collection structures, but also endeavor to preserve materials and maintain their preservation in order to protect the actual sources and keep them alive in a certain way, certain hurdles become clear with regard to the accessibility of archives and the archival records stored in them, some of which are hidden.</p>
          <p className="u_p">Against this backdrop, the digital space opens up new possibilities for accessibility. In addition to browsing, stumbling across and drifting through the collection of digital testimonies, users are given the opportunity to archive digital traces themselves. This participatory form rethinks accessibility: users are given a creative function in the archiving process.</p>
          <p className="u_p">In this way, the character of an archive below becomes clear. The users become part of a new collectivization process of memories. If we consider memory as a resource, we could say that collectivization processes aim to use this resource in such a way that it is accessible to the entirety of the group.</p>
          <p className="u_p">In this sense, collectivizing memory means ensuring that certain memories are not lost, but are available to the community as a whole and remain anchored as part of a collective memory. Just as queer and feminist emancipation movements have done by collecting their own pamphlets, protocols, posters, and personal legacies such as photos and diaries, thus keeping the upper hand on how their stories can be told and passed on as knowledge to others, the online archive HIV/AIDS Legacy also generates itself through the desire of self-responsibility and self-empowerment of memories, of history, of knowledge.</p>
        </section>
        <h3 className="u_title">Contribute your own</h3>
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

          <div className="u_grid2">
            <div className="u_row">
              <label>Source (optional)</label>
              <input className="u_input" type="url" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://…" />
            </div>
            <div className="u_row">
              <label>Uploader<span className="u_req">*</span></label>
              <input className="u_input" type="text" value={uploader} onChange={(e) => setUploader(e.target.value)} required />
            </div>
          </div>

          <div className="u_grid2">
            <div className="u_row">
              <label>Upload Thumbnail (optional)</label>
              <input ref={thumbInputRef} className="u_input" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} disabled={!!thumbnailUrl} />
            </div>
            <div className="u_row">
              <label>Thumbnail URL (optional)</label>
              <input className="u_input" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" disabled={!!thumbnail} />
            </div>
          </div>

          <div className="u_row">
            <label>Files (up to 4, max 1MB each)</label>
            <div className="u_files">
              <input ref={fileInputRef} className="u_input" type="file" multiple onChange={handleFileChange} />
              <span className="u_help">{files.length ? `${files.length} file(s) selected)` : 'No files selected.'}</span>
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
          {success && <div className="u_msg _ok">Thanks for your contribution!</div>}

          <div className="u_btnRow">
            <button type="submit" disabled={!canSubmit} className="u_btn">{busy ? 'Uploading…' : 'Upload'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}