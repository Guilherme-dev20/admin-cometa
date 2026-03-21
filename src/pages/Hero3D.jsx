import { useState, useEffect, Suspense, lazy } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import ShirtEditor from '../components/ShirtEditor';
import { Check } from 'lucide-react';
import { supabase } from '../services/api';

const ShirtPreview = lazy(() => import('../components/ShirtPreview'));

export default function Hero3D() {
  const [modelo, setModelo] = useState('camiseta');
  const [cor, setCor] = useState('#ffffff');
  const [stamps, setStamps] = useState([]);
  const [ativo, setAtivo] = useState(true);
  const [textureDataUrl, setTextureDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [snap, setSnap] = useState(null);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_config').select('*').eq('id', 1).single();
    if (!error && data) {
      setModelo(data.modelo || 'camiseta');
      setCor(data.cor || '#ffffff');
      setAtivo(data.ativo ?? true);
      if (Array.isArray(data.stamps) && data.stamps.length > 0)
        setStamps(data.stamps);
    }
    setLoading(false);
  }

  async function uploadNewStamps(list) {
    return Promise.all(list.map(async (s) => {
      if (!s.file) return s;
      const fileName = `stamp-${Date.now()}-${s.file.name}`;
      const { error } = await supabase.storage.from('hero').upload(fileName, s.file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('hero').getPublicUrl(fileName);
      const { file, ...rest } = s;
      return { ...rest, url: data.publicUrl };
    }));
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const uploaded = await uploadNewStamps(stamps);
      const clean = uploaded.map(({ file, ...s }) => s);
      const { error } = await supabase.from('hero_config').upsert({
        id: 1, modelo, cor, ativo, stamps: clean,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setStamps(clean);
      setFeedback({ type: 'success', msg: 'Salvo com sucesso ✓' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Erro ao salvar: ' + err.message });
    }
    setSaving(false);
  }

  if (loading) return (
    <Layout title="Hero 3D">
      <Header title="Hero 3D" />
      <div className="text-center py-10 text-white/60">Carregando...</div>
    </Layout>
  );

  return (
    <Layout title="Hero 3D">
      <Header title="Hero 3D" />

      {/* ── DESKTOP ── */}
      <div className="hidden xl:flex gap-4 items-start">

        {/* Controles */}
        <div className="w-56 flex-shrink-0 space-y-3">
          <Controls
            modelo={modelo} setModelo={setModelo}
            cor={cor} setCor={setCor}
            ativo={ativo} setAtivo={setAtivo}
            stamps={stamps} setStamps={setStamps}
            feedback={feedback} saving={saving} onSave={handleSave}
          />
        </div>

        {/* Editor Konva */}
        <div className="flex-1 min-w-0 rounded-2xl bg-white/5 border border-white/10 p-4">
          <ShirtEditor cor={cor} stamps={stamps} onStampsChange={setStamps} onExport={setTextureDataUrl} />
        </div>

        {/* Preview 3D */}
        <div className="w-64 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex flex-col" style={{ height: 480 }}>
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Preview 3D</p>
            <ViewButtons onSnap={setSnap} />
          </div>
          <div className="flex-1">
            <Suspense fallback={<ModelLoader />}>
              <ShirtPreview modelo={modelo} textureDataUrl={textureDataUrl} snap={snap} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="xl:hidden space-y-3">

        {/* Controles compactos */}
        <div className="space-y-2">
          {/* Modelo + Status em linha */}
          <div className="flex gap-2">
            {[
              { value: 'camiseta', label: 'Camiseta', icon: '👕' },
              { value: 'mangalonga', label: 'Longa', icon: '🧥' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setModelo(opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-sm font-semibold ${
                  modelo === opt.value
                    ? 'border-purple-500 bg-purple-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/50'
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}

            {/* Toggle status */}
            <button
              onClick={() => setAtivo(!ativo)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                ativo ? 'border-purple-500 bg-purple-500/15 text-white' : 'border-white/10 bg-white/5 text-white/50'
              }`}
            >
              <span className={`w-8 h-4 rounded-full relative flex-shrink-0 transition-colors ${ativo ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600' : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${ativo ? 'translate-x-4' : ''}`} />
              </span>
              {ativo ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          {/* Cor — largura total */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <p className="text-xs font-semibold text-white/60 mb-2">Cor da camisa</p>
            <div className="flex gap-2 items-center">
              <ColorSwatch value={cor} onChange={setCor} size="lg" />
              <input
                type="text" value={cor} maxLength={7}
                onChange={(e) => setCor(e.target.value)}
                className="min-w-0 flex-1 px-3 py-2 bg-white/5 text-white border border-white/10 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Preview 3D — sempre visível */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden" style={{ height: 280 }}>
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Preview 3D</p>
            <ViewButtons onSnap={setSnap} />
          </div>
          <div style={{ height: 240 }}>
            <Suspense fallback={<ModelLoader />}>
              <ShirtPreview modelo={modelo} textureDataUrl={textureDataUrl} snap={snap} />
            </Suspense>
          </div>
        </div>

        {/* Editor Konva — sempre visível abaixo */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
          <ShirtEditor cor={cor} stamps={stamps} onStampsChange={setStamps} onExport={setTextureDataUrl} />
        </div>

        {/* Estampas */}
        {stamps.length > 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2">
            <p className="text-sm font-semibold text-white/70">Estampas ({stamps.length})</p>
            <div className="flex gap-2 flex-wrap">
              {stamps.map((s, i) => (
                <div key={s.id} className="relative">
                  <img src={s.url} className="w-12 h-12 object-contain rounded-lg border border-white/10 bg-white/5" />
                  <button
                    onClick={() => setStamps(stamps.filter((x) => x.id !== s.id))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback + Save */}
        {feedback && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300'
              : 'bg-red-500/10 border-red-400/20 text-red-300'
          }`}>
            {feedback.type === 'success' && <Check size={15} />}
            {feedback.msg}
          </div>
        )}
        <button
          onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/20 transition disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar configuração'}
        </button>
      </div>
    </Layout>
  );
}

function Controls({ modelo, setModelo, cor, setCor, ativo, setAtivo, stamps, setStamps, feedback, saving, onSave }) {
  return (
    <>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
        <p className="text-sm font-semibold text-white/70">Modelo</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'camiseta', label: 'Camiseta', icon: '👕' },
            { value: 'mangalonga', label: 'Manga Longa', icon: '🧥' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setModelo(opt.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all text-sm font-semibold ${
                modelo === opt.value
                  ? 'border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/10'
                  : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
        <p className="text-sm font-semibold text-white/70">Cor da camisa</p>
        <div className="flex gap-3 items-center">
          <ColorSwatch value={cor} onChange={setCor} size="lg" />
          <input type="text" value={cor} onChange={(e) => setCor(e.target.value)} maxLength={7}
            className="flex-1 px-3 py-2 bg-white/5 text-white border border-white/10 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="#ffffff" />
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-sm">Status</p>
          <p className="text-xs text-white/40">{ativo ? 'Visível' : 'Oculto'}</p>
        </div>
        <button onClick={() => setAtivo(!ativo)}
          className={`relative w-11 h-6 rounded-full transition-colors ${ativo ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600' : 'bg-white/10'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {stamps.length > 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-white/70">Estampas ({stamps.length})</p>
          <div className="space-y-2">
            {stamps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                <img src={s.url} className="w-10 h-10 object-contain rounded border border-white/10 bg-white/5 flex-shrink-0" />
                <span className="text-xs text-white/50 flex-1 truncate">Estampa {i + 1}</span>
                <button onClick={() => setStamps(stamps.filter((x) => x.id !== s.id))}
                  className="text-red-400/60 hover:text-red-400 text-xs transition">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300'
            : 'bg-red-500/10 border-red-400/20 text-red-300'
        }`}>
          {feedback.type === 'success' && <Check size={15} />}
          {feedback.msg}
        </div>
      )}

      <button onClick={onSave} disabled={saving}
        className="w-full py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/20 transition disabled:opacity-60">
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
    </>
  );
}

function ColorSwatch({ value, onChange, size = 'md' }) {
  const dim = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  return (
    <label className={`relative cursor-pointer flex-shrink-0 ${dim} rounded-xl border-2 border-white/20 overflow-hidden shadow-inner`}
      style={{ backgroundColor: value }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </label>
  );
}

function ViewButtons({ onSnap }) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onSnap({ angle: 0, id: Date.now() })}
        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-semibold transition"
      >
        Frente
      </button>
      <button
        onClick={() => onSnap({ angle: Math.PI, id: Date.now() })}
        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-semibold transition"
      >
        Costas
      </button>
    </div>
  );
}

function ModelLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
      <p className="text-white/30 text-xs">Carregando modelo...</p>
    </div>
  );
}
