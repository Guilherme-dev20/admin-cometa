import { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import Header from "../components/Header";
import { Check, X, Trash2, Star, Search, ExternalLink } from "lucide-react";
import { supabase } from "../services/api";

const TABS = [
  { key: "pendente",  label: "Pendentes",  color: "text-yellow-300",  bg: "bg-yellow-400/10 border-yellow-400/20" },
  { key: "aprovado",  label: "Aprovadas",  color: "text-emerald-300", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { key: "rejeitado", label: "Rejeitadas", color: "text-red-300",     bg: "bg-red-400/10 border-red-400/20" },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= count ? "text-yellow-400 fill-yellow-400" : "text-white/20"}
        />
      ))}
    </div>
  );
}

function PhotoModal({ url, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white"
        >
          <X size={28} />
        </button>
        <img src={url} className="w-full max-h-[80vh] object-contain rounded-2xl" />
      </div>
    </div>
  );
}

function AvaliacaoCard({ av, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(null);
  const [photoOpen, setPhotoOpen] = useState(false);

  async function handleStatus(status) {
    setLoading(status);
    const { error } = await supabase
      .from("avaliacoes")
      .update({ status })
      .eq("id", av.id);
    if (error) alert("Erro: " + error.message);
    else onUpdate(av.id, { status });
    setLoading(null);
  }

  async function handleDelete() {
    if (!confirm(`Apagar avaliação de ${av.nome}?`)) return;
    setLoading("delete");
    const { error } = await supabase.from("avaliacoes").delete().eq("id", av.id);
    if (error) alert("Erro: " + error.message);
    else onDelete(av.id);
    setLoading(null);
  }

  const data = new Date(av.created_at).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 shadow-lg shadow-purple-500/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-extrabold text-white truncate">{av.nome}</p>
            {av.cidade && (
              <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {av.cidade}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-0.5">{av.produto}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <Stars count={av.estrelas} />
          <p className="text-xs text-white/30 mt-1">{data}</p>
        </div>
      </div>

      {/* Texto */}
      {av.texto && (
        <p className="text-sm text-white/70 leading-relaxed border-l-2 border-white/10 pl-3">
          {av.texto}
        </p>
      )}

      {/* Mídia */}
      <div className="flex gap-2 flex-wrap">
        {av.foto_url && (
          <button onClick={() => setPhotoOpen(true)} className="group relative">
            <img
              src={av.foto_url}
              className="w-20 h-20 object-cover rounded-xl border border-white/10 group-hover:border-purple-400/40 transition"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center">
              <ExternalLink size={16} className="text-white" />
            </div>
          </button>
        )}
        {av.video_url && (
          <a
            href={av.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition text-xs text-white/60 hover:text-white"
          >
            <ExternalLink size={13} /> Ver vídeo
          </a>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 flex-wrap pt-1 border-t border-white/5">
        {av.status !== "aprovado" && (
          <button
            onClick={() => handleStatus("aprovado")}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50"
          >
            <Check size={13} />
            {loading === "aprovado" ? "Aprovando..." : "Aprovar"}
          </button>
        )}
        {av.status !== "rejeitado" && (
          <button
            onClick={() => handleStatus("rejeitado")}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-xs font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
          >
            <X size={13} />
            {loading === "rejeitado" ? "Rejeitando..." : "Rejeitar"}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-semibold hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-300 transition disabled:opacity-50 ml-auto"
        >
          <Trash2 size={13} />
          {loading === "delete" ? "Apagando..." : "Apagar"}
        </button>
      </div>

      {photoOpen && <PhotoModal url={av.foto_url} onClose={() => setPhotoOpen(false)} />}
    </div>
  );
}

export default function Avaliacoes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pendente");
  const [busca, setBusca] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("avaliacoes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) alert("Erro ao carregar: " + error.message);
    else setItems(data || []);
    setLoading(false);
  }

  function handleUpdate(id, changes) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  const counts = useMemo(() => ({
    pendente:  items.filter((a) => a.status === "pendente").length,
    aprovado:  items.filter((a) => a.status === "aprovado").length,
    rejeitado: items.filter((a) => a.status === "rejeitado").length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return items
      .filter((a) => a.status === tab)
      .filter((a) =>
        !q ||
        a.nome?.toLowerCase().includes(q) ||
        a.produto?.toLowerCase().includes(q)
      );
  }, [items, tab, busca]);

  return (
    <Layout title="Avaliações">
      <Header title="Avaliações" />

      {/* Abas */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
              tab === t.key
                ? `${t.bg} ${t.color}`
                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.key ? "bg-white/15" : "bg-white/5"
            }`}>
              {counts[t.key]}
            </span>
          </button>
        ))}

        {/* Busca */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 ml-auto min-w-0 w-full sm:w-auto">
          <Search size={14} className="text-white/30 flex-shrink-0" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou produto..."
            className="bg-transparent text-white text-sm outline-none placeholder:text-white/30 min-w-0 flex-1"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="text-white/30 hover:text-white flex-shrink-0">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="text-center py-10 text-white/60">Carregando avaliações...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center text-white/40">
          {busca
            ? "Nenhuma avaliação encontrada para essa busca."
            : `Nenhuma avaliação ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((av) => (
            <AvaliacaoCard
              key={av.id}
              av={av}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
