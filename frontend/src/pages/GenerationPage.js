import React, { useEffect, useState } from 'react';
import api from '../api';
import './GenerationPage.css';

export default function GenerationPage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('black-forest-labs/FLUX.1-schnell');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorPayload, setErrorPayload] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'clips' | 'enrich' | 'recent'
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmFilename, setConfirmFilename] = useState('');
  // Mini-clips state
  const [clipPrompt, setClipPrompt] = useState('');
  const [clipUrl, setClipUrl] = useState('');
  const [clipLoading, setClipLoading] = useState(false);
  const [clipError, setClipError] = useState('');
  const [clipErrorPayload, setClipErrorPayload] = useState(null);
  const [recentClips, setRecentClips] = useState([]);
  const [recentUploadedClips, setRecentUploadedClips] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [clipModelUsed, setClipModelUsed] = useState('');
  // Image → Video removed

  // Dynamic section title per area
  const sectionTitle = (
    activeTab === 'images' ? 'Génération d’images' :
    activeTab === 'clips' ? 'Génération de mini-clips' :
    activeTab === 'enrich' ? 'Enrichissement automatique des vidéos' :
    'Récents'
  );

  const loadRecent = async () => {
    try {
      const res = await api.get('/api/generation/recent/?limit=12');
      setRecent(res.data.items || []);
    } catch (e) {
      // Ignore silently for now
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecentClips = async () => {
    try {
      const res = await api.get('/api/generation/recent-clips/?limit=12');
      setRecentClips(res.data.items || []);
    } catch {}
  };

  const loadRecentUploadedClips = async () => {
    try {
      const res = await api.get('/api/generation/recent-uploads/?limit=12');
      setRecentUploadedClips(res.data.items || []);
    } catch {}
  };

  const deleteUploaded = async (filename) => {
    if (!filename) return;
    try {
      await api.delete(`/api/generation/upload/${encodeURIComponent(filename)}/`);
      setRecentUploadedClips((prev) => prev.filter((it) => it.filename !== filename));
    } catch (e) {
      alert('Suppression échouée');
    }
  };

  // Update browser tab title for a nicer workspace feel
  useEffect(() => {
    try { document.title = `${sectionTitle} • Génération Multimédia`; } catch {}
  }, [sectionTitle]);

  const downloadCurrent = async () => {
    const active = selectedUrl || imageUrl;
    if (!active) return;
    const url = `http://127.0.0.1:8000${active}`;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
  const suggested = (active.split('/').pop()) || 'generated.png';
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setError('Téléchargement échoué');
    }
  };

  const generate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  setImageUrl('');
  setErrorPayload(null);

    try {
      const res = await api.post('/api/generation/text-to-image/', {
        prompt,
        model,
      });
  setImageUrl(res.data.image_url);
  setSelectedUrl(res.data.image_url);
  loadRecent();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.detail || 'Échec de la génération';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setErrorPayload(data || null);
    } finally {
      setLoading(false);
    }
  };

  const performDelete = async (filename) => {
    if (!filename) return;
    try {
      const lower = filename.toLowerCase();
      const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.gif');
      if (isVideo) {
        await api.delete(`/api/generation/clip/${encodeURIComponent(filename)}/`);
        const deletedUrl = `/media/generated/videos/${filename}`;
        setRecentClips((prev) => prev.filter((it) => it.filename !== filename));
        if (clipUrl === deletedUrl) setClipUrl('');
      } else {
        await api.delete(`/api/generation/image/${encodeURIComponent(filename)}/`);
        const deletedUrl = `/media/generated/${filename}`;
        setRecent((prev) => prev.filter((it) => it.filename !== filename));
        if (imageUrl === deletedUrl) setImageUrl('');
        if (selectedUrl === deletedUrl) { setSelectedUrl(''); setIsModalOpen(false); }
      }
    } catch (e) {
      alert('Suppression échouée');
    } finally {
      setConfirmOpen(false);
      setConfirmFilename('');
    }
  };
  const askDelete = (filename) => { setConfirmFilename(filename); setConfirmOpen(true); };

  const downloadClip = async () => {
    if (!clipUrl) return;
    const url = `http://127.0.0.1:8000${clipUrl}`;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const suggested = (clipUrl.split('/').pop()) || 'clip.mp4';
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setClipError('Téléchargement du clip échoué');
    }
  };

  const generateClip = async (e) => {
    e.preventDefault();
    setClipLoading(true);
    setClipError('');
    setClipErrorPayload(null);
    setClipUrl('');
    setClipModelUsed('');
    try {
      const res = await api.post('/api/generation/text-to-video/', {
        prompt: clipPrompt,
      });
      setClipUrl(res.data.video_url);
      setClipModelUsed(res.data.model_used || 'pexels');
      loadRecentClips();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.detail || 'Échec de la génération du clip';
      setClipError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setClipErrorPayload(data || null);
    } finally {
      setClipLoading(false);
    }
  };

  return (
    <div className="bg-black text-white">
      <div className="gm-layout">
        {/* Sidebar */}
        <aside className="gm-sidebar">
          <div className="gm-sidebar-header">
            <div className="text-lg font-semibold">Génération Multimédia</div>
            <div className="text-white/60 text-xs mt-1">Espace de création</div>
            <div className="mt-3">
              <a
                href="/"
                className="gm-btn gm-btn-white inline-flex items-center gap-2"
                title="Retour à l’accueil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06L5.81 10.25H21a.75.75 0 0 1 0 1.5H5.81l5.22 5.22a.75.75 0 1 1-1.06 1.06l-6.5-6.5a.75.75 0 0 1 0-1.06l6.5-6.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                </svg>
                Accueil
              </a>
            </div>
          </div>
          <nav className="gm-nav">
            <button
              className={activeTab === 'images' ? 'gm-nav-item gm-nav-item-active' : 'gm-nav-item'}
              onClick={() => setActiveTab('images')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.5 6a3 3 0 1 1-6.001 0A3 3 0 0 1 19.5 6ZM3 5.25A2.25 2.25 0 0 1 5.25 3h6a2.25 2.25 0 0 1 2.25 2.25v6A2.25 2.25 0 0 1 11.25 13.5h-6A2.25 2.25 0 0 1 3 11.25v-6Z" />
                <path d="M15 11.25A2.25 2.25 0 0 1 17.25 9h1.5A2.25 2.25 0 0 1 21 11.25v6A2.25 2.25 0 0 1 18.75 19.5h-6A2.25 2.25 0 0 1 10.5 17.25v-1.5A2.25 2.25 0 0 1 12.75 13.5H15v-2.25Z" />
              </svg>
              <span>Images</span>
            </button>
            <button
              className={activeTab === 'clips' ? 'gm-nav-item gm-nav-item-active' : 'gm-nav-item'}
              onClick={() => setActiveTab('clips')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h10.5A2.25 2.25 0 0 1 18 6.75v2.19l2.03-1.159A1.125 1.125 0 0 1 21.75 8.78v6.44a1.125 1.125 0 0 1-1.72.999L18 15.06v2.19a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z" />
              </svg>
              <span>Mini-clips</span>
            </button>
            <button
              className={activeTab === 'enrich' ? 'gm-nav-item gm-nav-item-active' : 'gm-nav-item'}
              onClick={() => { setActiveTab('enrich'); loadRecentClips(); loadRecentUploadedClips(); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M11.644 1.59a.75.75 0 0 1 .712 0l2.25 1.2a.75.75 0 0 1 .394.657v2.287l1.982 1.058 1.982-1.058V3.447a.75.75 0 0 1 .394-.657l2.25-1.2a.75.75 0 0 1 1.094.657v15.177a.75.75 0 0 1-.394.657l-2.25 1.2a.75.75 0 0 1-1.094-.657V9.823l-1.982 1.058-1.982-1.058v8.2a.75.75 0 0 1-.394.657l-2.25 1.2a.75.75 0 0 1-1.094-.657V2.247a.75.75 0 0 1 .394-.657l2.25-1.2Z" clipRule="evenodd" />
              </svg>
              <span>Enrichissement</span>
            </button>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
            <button
              className={activeTab === 'recent' ? 'gm-nav-item gm-nav-item-active' : 'gm-nav-item'}
              onClick={() => { setActiveTab('recent'); loadRecent(); loadRecentClips(); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v5.25c0 .199.079.39.22.53l3.75 3.75a.75.75 0 1 0 1.06-1.06l-3.53-3.53V6Z" clipRule="evenodd" />
              </svg>
              <span>Récents</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-10">
          <h1 className="text-2xl font-bold mb-4">{sectionTitle}</h1>

          {activeTab === 'images' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Right: Image viewer */}
              <div className="order-2 md:order-2">
                <div className="rounded-lg border border-white/10 bg-black/30 h-[50vh] flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={`http://127.0.0.1:8000${imageUrl}`}
                      alt="Généré"
                      className="h-full w-full object-contain cursor-zoom-in"
                      onClick={() => { setSelectedUrl(imageUrl); setIsModalOpen(true); }}
                      title="Cliquer pour ouvrir en plein écran"
                    />
                  ) : (
                    <div className="text-white/60 text-sm">Aucune image générée pour l’instant.</div>
                  )}
                </div>

                {imageUrl && (
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/20"
                      onClick={() => { setSelectedUrl(imageUrl); setIsModalOpen(true); }}
                    >
                      Plein écran
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded bg-white text-black font-medium border border-white/10"
                      onClick={downloadCurrent}
                    >
                      Télécharger
                    </button>
                  </div>
                )}
              </div>

              {/* Left: Form and error */}
              <div className="order-1 md:order-1">
                <form onSubmit={generate} className="space-y-4 border border-white/10 p-4 rounded-lg bg-white/5">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Prompt</label>
                    <textarea
                      className="w-full rounded bg-black/40 border border-white/10 p-3"
                      rows={4}
                      placeholder="Décrivez l'image à générer..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 mb-1">Modèle</label>
                    <select
                      className="w-full rounded bg-black/40 border border-white/10 p-2"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    >
                      <option value="black-forest-labs/FLUX.1-schnell">FLUX.1-schnell (rapide)</option>
                      <option value="black-forest-labs/FLUX.1-dev">FLUX.1-dev</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-50"
                  >
                    {loading ? 'Génération...' : 'Générer'}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-3 rounded bg-red-900/30 border border-red-700/40 text-red-200 text-sm">
                    <div className="font-semibold mb-1">{error}</div>
                    {errorPayload && (
                      <pre className="whitespace-pre-wrap text-xs text-red-200/90 overflow-auto max-h-64">{JSON.stringify(errorPayload, null, 2)}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'clips' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Right: Video viewer */}
              <div className="order-2 md:order-2">
                <div className="rounded-lg border border-white/10 bg-black/30 h-[50vh] flex items-center justify-center overflow-hidden">
                  {clipUrl ? (
                    (() => {
                      // Try to find subtitles for the current clip in recentClips by filename
                      const filename = (clipUrl.split('/').pop()) || '';
                      const currentItem = recentClips.find(it => it.filename === filename);
                      const vttUrl = currentItem?.subtitles?.vtt ? `http://127.0.0.1:8000${currentItem.subtitles.vtt}` : null;
                      return (
                        <video
                          src={`http://127.0.0.1:8000${clipUrl}`}
                          className="h-full w-full object-contain"
                          controls
                          loop
                        >
                          {vttUrl && (
                            <track src={vttUrl} kind="subtitles" srcLang="fr" label="Français" default />
                          )}
                        </video>
                      );
                    })()
                  ) : (
                    <div className="text-white/60 text-sm">Aucun clip généré pour l’instant.</div>
                  )}
                </div>

                {clipUrl && clipModelUsed && (
                  <div className="mt-2 text-xs text-white/70">
                    Modèle utilisé: <span className="font-mono text-white/90">{clipModelUsed}</span>
                  </div>
                )}

                {clipUrl && (
                  <div className="flex items-center gap-3 mt-3">
                    <a
                      className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/20"
                      href={`http://127.0.0.1:8000${clipUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ouvrir dans un nouvel onglet
                    </a>
                    <button
                      type="button"
                      className="px-3 py-2 rounded bg-white text-black font-medium border border-white/10"
                      onClick={downloadClip}
                    >
                      Télécharger
                    </button>
                  </div>
                )}
              </div>

              {/* Left: Forms and error */}
              <div className="order-1 md:order-1">
                {/* Only Text → Video mode remains */}
                <form onSubmit={generateClip} className="space-y-4 border border-white/10 p-4 rounded-lg bg-white/5">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Prompt</label>
                    <textarea
                      className="w-full rounded bg-black/40 border border-white/10 p-3"
                      rows={4}
                      placeholder="Décrivez le clip à générer..."
                      value={clipPrompt}
                      onChange={(e) => setClipPrompt(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={clipLoading || !clipPrompt.trim()}
                    className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-50"
                  >
                    {clipLoading ? 'Loading...' : 'Generate'}
                  </button>
                </form>
                

                {clipError && (
                  <div className="mt-4 p-3 rounded bg-red-900/30 border border-red-700/40 text-red-200 text-sm">
                    <div className="font-semibold mb-1">{clipError}</div>
                    {clipErrorPayload && (
                      <pre className="whitespace-pre-wrap text-xs text-red-200/90 overflow-auto max-h-64">{JSON.stringify(clipErrorPayload, null, 2)}</pre>
                    )}
                  </div>
                )}

                {/* Recent clips */}
                <div className="mt-6 border border-white/10 p-4 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Clips récents</h3>
                    <button className="gm-btn" onClick={loadRecentClips}>Rafraîchir</button>
                  </div>
                  {recentClips.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {recentClips.map((it) => (
                        <div key={it.filename} className="relative group bg-white/5 border border-white/10 rounded overflow-hidden">
                          <video
                            src={`http://127.0.0.1:8000${it.video_url}`}
                            className="w-full h-32 object-cover"
                            controls
                            muted
                            preload="metadata"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 p-1 rounded bg-black/60 hover:bg-black/70 border border-white/20"
                            onClick={() => { setConfirmFilename(it.filename); setConfirmOpen(true); }}
                            title="Supprimer"
                            aria-label={`Supprimer ${it.filename}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 0v-.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V7m-7 0v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7M9.5 11v6m5-6v6" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 text-sm">Aucun clip récent.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'enrich' && (
            <div className="mt-2 space-y-6">
              {/* Upload form */}
              <div className="border border-white/10 p-4 rounded-lg bg-white/5">
                <h3 className="text-lg font-semibold mb-3">Téléverser une vidéo</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!uploadFile) return;
                    setUploadLoading(true);
                    setUploadError('');
                    try {
                      const fd = new FormData();
                      fd.append('video', uploadFile);
                      const res = await api.post('/api/generation/upload-video/', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      // Prepend to uploaded clips list
                      setRecentUploadedClips((prev) => [res.data, ...prev]);
                      setUploadFile(null);
                    } catch (err) {
                      const data = err?.response?.data;
                      const msg = data?.detail || 'Échec du téléversement';
                      setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
                    } finally {
                      setUploadLoading(false);
                    }
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <input
                    type="file"
                    accept="video/*"
                    className="flex-1 rounded bg-black/40 border border-white/10 p-2"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={uploadLoading || !uploadFile}
                    className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-50"
                  >
                    {uploadLoading ? 'Téléversement…' : 'Téléverser'}
                  </button>
                </form>
                {uploadError && (
                  <div className="mt-3 p-2 rounded bg-red-900/30 border border-red-700/40 text-red-200 text-sm">{uploadError}</div>
                )}
              </div>

              <div className="border border-white/10 p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Clips téléchargés (uploads)</h3>
                  <button className="gm-btn" onClick={loadRecentUploadedClips}>Rafraîchir</button>
                </div>
                {recentUploadedClips.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentUploadedClips.map((it) => (
                      <EnrichCard
                        key={`upl-${it.filename}`}
                        item={it}
                        location="uploads"
                        onDelete={(fn) => deleteUploaded(fn)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">Aucun clip téléversé trouvé dans uploads/.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="mt-2 space-y-6">
              {/* Images recents */}
              <div className="border border-white/10 p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Images récentes</h3>
                  <button className="gm-btn" onClick={() => { loadRecent(); loadRecentClips(); }}>Rafraîchir</button>
                </div>
                {recent.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {recent.map((it) => (
                      <div key={it.filename} className="relative group bg-white/5 border border-white/10 rounded overflow-hidden">
                        <button
                          className="block w-full"
                          onClick={() => { setSelectedUrl(it.image_url); setIsModalOpen(true); }}
                          title={it.filename}
                        >
                          <img
                            src={`http://127.0.0.1:8000${it.image_url}`}
                            alt={it.filename}
                            className="w-full h-32 object-cover group-hover:opacity-90"
                          />
                        </button>
                        <button
                          type="button"
                          className="absolute top-1 right-1 p-1 rounded bg-black/60 hover:bg-black/70 border border-white/20"
                          onClick={() => askDelete(it.filename)}
                          title="Supprimer"
                          aria-label={`Supprimer ${it.filename}`}
                        >
                          {/* Trash icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 0v-.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V7m-7 0v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7M9.5 11v6m5-6v6" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">Aucune image récente.</div>
                )}
              </div>

              {/* Clips recents */}
              <div className="border border-white/10 p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Clips récents</h3>
                  <button className="gm-btn" onClick={loadRecentClips}>Rafraîchir</button>
                </div>
                {recentClips.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {recentClips.map((it) => (
                      <div key={it.filename} className="relative group bg-white/5 border border-white/10 rounded overflow-hidden">
                        <video
                          src={`http://127.0.0.1:8000${it.video_url}`}
                          className="w-full h-32 object-cover"
                          controls
                          muted
                          preload="metadata"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 p-1 rounded bg-black/60 hover:bg-black/70 border border-white/20"
                          onClick={() => { setConfirmFilename(it.filename); setConfirmOpen(true); }}
                          title="Supprimer"
                          aria-label={`Supprimer ${it.filename}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 0v-.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V7m-7 0v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7M9.5 11v6m5-6v6" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">Aucun clip récent.</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Fullscreen image modal */}
      {isModalOpen && (
        <div className="gm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="gm-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={`http://127.0.0.1:8000${selectedUrl || imageUrl}`}
              alt="Généré"
              className="gm-modal-image"
            />
            <div className="gm-modal-actions">
              <a
                className="gm-btn gm-btn-primary"
                href={`http://127.0.0.1:8000${selectedUrl || imageUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir dans un nouvel onglet
              </a>
              <button className="gm-btn gm-btn-white" onClick={downloadCurrent}>
                Télécharger
              </button>
              <button className="gm-btn" onClick={() => setIsModalOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmOpen && (
        <div className="gm-modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="gm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-lg border border-white/20 bg-black/70 p-5 min-w-[280px] max-w-[90vw]">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-.75 5.25a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0v-6Zm.75 9a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Supprimer ce média ?</h3>
                  <p className="text-white/80 text-sm break-all">{confirmFilename}</p>
                </div>
              </div>
              <div className="gm-modal-actions mt-4">
                <button className="gm-btn" onClick={() => { setConfirmOpen(false); setConfirmFilename(''); }}>Annuler</button>
                <button className="gm-btn gm-btn-danger" onClick={() => performDelete(confirmFilename)}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnrichCard({ item, location = 'generated', onDelete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorPayload, setErrorPayload] = useState(null);
  const [result, setResult] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const runSubtitles = async (format = 'srt') => {
    setLoading(true);
    setError('');
    setErrorPayload(null);
    setResult(null);
    try {
      const res = await api.post('/api/generation/subtitles/', { filename: item.filename, format, location });
      setResult(res.data);
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.detail || 'Échec de la génération des sous-titres';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setErrorPayload(data || null);
    } finally {
      setLoading(false);
    }
  };

  // Embed (soft/hard) controls removed as requested

  return (
    <div className="border border-white/10 rounded p-3 bg-black/30">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-white/70 truncate" title={item.filename}>{item.filename}</div>
        {location === 'uploads' && onDelete && (
          <button
            type="button"
            className="p-1 rounded bg-black/60 hover:bg-black/70 border border-white/20"
            title="Supprimer"
            aria-label={`Supprimer ${item.filename}`}
            disabled={deleting}
            onClick={async () => {
              try {
                if (!window.confirm(`Supprimer ${item.filename} ?`)) return;
                setDeleting(true);
                await onDelete(item.filename);
              } finally {
                setDeleting(false);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 0v-.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V7m-7 0v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7M9.5 11v6m5-6v6" />
            </svg>
          </button>
        )}
      </div>
      <div className="mb-2">
        <video
          src={`http://127.0.0.1:8000${item.video_url}`}
          className="w-full h-40 object-cover"
          controls
          muted
          preload="metadata"
        >
          {/* Prefer existing VTT, else if we just generated and it is VTT, attach it */}
          {item?.subtitles?.vtt && (
            <track src={`http://127.0.0.1:8000${item.subtitles.vtt}`} kind="subtitles" srcLang="fr" label="Français" default />
          )}
          {result?.format === 'vtt' && result?.subtitles_url && (
            <track src={`http://127.0.0.1:8000${result.subtitles_url}`} kind="subtitles" srcLang="fr" label="Français" default />
          )}
        </video>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <button className="gm-btn gm-btn-primary" disabled={loading} onClick={() => runSubtitles('srt')}>
          {loading ? 'Traitement…' : 'Générer SRT'}
        </button>
        <button className="gm-btn" disabled={loading} onClick={() => runSubtitles('vtt')}>Générer VTT</button>
      </div>
      {/* Embed buttons removed */}
      {result && (
        <div className="text-xs text-white/80">
          <div className="mb-1">Format: {result.format?.toUpperCase()}</div>
          <a className="gm-btn" href={`http://127.0.0.1:8000${result.subtitles_url}`} target="_blank" rel="noreferrer">Télécharger</a>
        </div>
      )}
      {/* Embed result removed */}
      {error && (
        <div className="mt-2 p-2 rounded bg-red-900/30 border border-red-700/40 text-red-200 text-xs">
          <div className="font-semibold mb-1">{error}</div>
          {errorPayload && (
            <pre className="whitespace-pre-wrap text-[10px] text-red-200/90 overflow-auto max-h-48">{JSON.stringify(errorPayload, null, 2)}</pre>
          )}
        </div>
      )}
      {/* Embed error removed */}
    </div>
  );
}
