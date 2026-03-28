import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Plus, Pencil, Trash2, X, Package } from "lucide-react";
import { supabase } from "../services/api";

const EMPTY = { nome: "", slug: "", icone: "", cor: "#7c3aed", descricao: "", ativo: true, ordem: 0, items: [] };
const EMPTY_ITEM = { name: "", price: "", url: "", _mainFile: null, _mainPreview: null };

function sanitize(name) {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function uploadFile(bucket, file) {
  const fileName = `${Date.now()}-${sanitize(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data?.publicUrl || "";
}

export default function Temas() {
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Sub-form de item
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);

  useEffect(() => { fetchTemas(); }, []);

  async function fetchTemas() {
    setLoading(true);
    const { data, error } = await supabase.from("temas").select("*").order("ordem", { ascending: true });
    if (error) alert("Erro ao carregar temas: " + error.message);
    else setTemas(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setCoverFile(null);
    setCoverPreview(null);
    setShowModal(true);
  }

  function openEdit(tema) {
    setEditing(tema.id);
    const items = Array.isArray(tema.items)
      ? tema.items.map((it) =>
          typeof it === "string"
            ? { url: it, name: "", price: "" }
            : { url: it.url || "", name: it.name || "", price: it.price || "" }
        )
      : [];
    setForm({
      nome: tema.nome || "",
      slug: tema.slug || "",
      icone: tema.icone || "",
      cor: tema.cor || "#7c3aed",
      descricao: tema.descricao || "",
      ativo: tema.ativo ?? true,
      ordem: tema.ordem ?? 0,
      items,
    });
    setCoverFile(null);
    setCoverPreview(tema.cover_url || null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY);
    setCoverFile(null);
    setCoverPreview(null);
  }

  // ---- Sub-form item ----
  function openAddItem() {
    setEditingItemIdx(null);
    setItemForm(EMPTY_ITEM);
    setShowItemForm(true);
  }

  function openEditItem(idx) {
    const it = form.items[idx];
    setItemForm({ ...EMPTY_ITEM, ...it, _mainFile: null, _mainPreview: it.url || null });
    setEditingItemIdx(idx);
    setShowItemForm(true);
  }

  function removeItem(idx) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  async function confirmItem() {
    if (!itemForm.name) return alert("Digite o nome do produto");
    if (!itemForm._mainFile && !itemForm.url) return alert("Adicione uma imagem");
    setSaving(true);
    try {
      let url = itemForm.url;
      if (itemForm._mainFile) url = await uploadFile("temas", itemForm._mainFile);
      const item = { url, name: itemForm.name, price: itemForm.price };
      setForm((f) => {
        const items = [...f.items];
        if (editingItemIdx !== null) items[editingItemIdx] = item;
        else items.push(item);
        return { ...f, items };
      });
      setShowItemForm(false);
    } catch (e) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // ---- Salvar tema ----
  async function save() {
    if (!form.nome.trim()) return alert("Nome é obrigatório");
    setSaving(true);
    try {
      let cover_url = editing ? temas.find((t) => t.id === editing)?.cover_url || "" : "";
      if (coverFile) cover_url = await uploadFile("temas", coverFile);

      const payload = {
        nome: form.nome.trim(),
        slug: form.slug.trim(),
        icone: form.icone.trim(),
        cor: form.cor,
        cover_url,
        descricao: form.descricao.trim(),
        ativo: form.ativo,
        ordem: Number(form.ordem) || 0,
        items: form.items,
      };

      let error;
      if (editing) {
        ({ error } = await supabase.from("temas").update(payload).eq("id", editing));
      } else {
        ({ error } = await supabase.from("temas").insert([payload]));
      }

      if (error) alert("Erro ao salvar: " + error.message);
      else { closeModal(); fetchTemas(); }
    } catch (e) {
      alert("Erro ao salvar: " + e.message);
    }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm("Excluir este tema?")) return;
    const { error } = await supabase.from("temas").delete().eq("id", id);
    if (error) alert("Erro ao excluir: " + error.message);
    else fetchTemas();
  }

  async function toggleAtivo(tema) {
    const { error } = await supabase.from("temas").update({ ativo: !tema.ativo }).eq("id", tema.id);
    if (error) alert("Erro: " + error.message);
    else setTemas((prev) => prev.map((t) => t.id === tema.id ? { ...t, ativo: !t.ativo } : t));
  }

  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setItem = (key) => (v) => setItemForm((p) => ({ ...p, [key]: v }));

  return (
    <Layout title="Temas">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-extrabold text-white">Temas</h2>
        <button onClick={openNew} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/20">
          <Plus size={20} />
          <span className="hidden sm:inline font-semibold">Novo Tema</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-white/60">Carregando temas...</div>
      ) : (
        <>
          {/* DESKTOP */}
          <div className="hidden md:block rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden shadow-lg shadow-purple-500/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/60 text-sm">
                <tr>
                  <th className="p-4">Tema</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Ícone</th>
                  <th className="p-4">Cor</th>
                  <th className="p-4 text-center">Produtos</th>
                  <th className="p-4">Ordem</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {temas.map((tema) => (
                  <tr key={tema.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {tema.cover_url && <img src={tema.cover_url} className="w-10 h-10 rounded-lg object-cover border border-white/10" />}
                        <div>
                          <p className="font-extrabold text-white">{tema.nome}</p>
                          {tema.descricao && <p className="text-xs text-white/40 line-clamp-1">{tema.descricao}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-white/50 font-mono text-sm">{tema.slug}</td>
                    <td className="p-4 text-white/70 text-lg">{tema.icone}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: tema.cor }} />
                        <span className="text-white/40 font-mono text-xs">{tema.cor}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-white/50 text-sm">
                      {Array.isArray(tema.items) && tema.items.length > 0 ? tema.items.length : <span className="text-white/20">—</span>}
                    </td>
                    <td className="p-4 text-white/50">{tema.ordem}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleAtivo(tema)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${tema.ativo ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" : "bg-white/5 text-white/40 border-white/10"}`}>
                        {tema.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(tema)} className="p-2 rounded-xl bg-white/5 hover:bg-purple-500/20 text-white/50 hover:text-purple-300 border border-white/10 hover:border-purple-400/20 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => remove(tema.id)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-300 border border-white/10 hover:border-red-400/20 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {temas.length === 0 && <div className="text-center py-10 text-white/50">Nenhum tema cadastrado.</div>}
          </div>

          {/* MOBILE */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {temas.map((tema) => (
              <div key={tema.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-purple-500/10">
                <div className="flex items-start gap-3">
                  {tema.cover_url && <img src={tema.cover_url} className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{tema.icone}</span>
                      <p className="font-extrabold text-white">{tema.nome}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${tema.ativo ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" : "bg-white/5 text-white/40 border-white/10"}`}>{tema.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                    {tema.descricao && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{tema.descricao}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: tema.cor }} />
                      <span className="text-white/30 font-mono text-xs">{tema.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => toggleAtivo(tema)} className="flex-1 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 text-white/60">{tema.ativo ? "Desativar" : "Ativar"}</button>
                  <button onClick={() => openEdit(tema)} className="flex-1 py-2 rounded-xl text-xs font-bold border border-purple-400/20 bg-purple-500/10 text-purple-300">Editar</button>
                  <button onClick={() => remove(tema.id)} className="flex-1 py-2 rounded-xl text-xs font-bold border border-red-400/20 bg-red-500/10 text-red-300">Excluir</button>
                </div>
              </div>
            ))}
            {temas.length === 0 && <div className="text-center py-10 text-white/50">Nenhum tema cadastrado.</div>}
          </div>
        </>
      )}

      {/* MODAL TEMA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-950 rounded-2xl w-full max-w-lg relative border border-white/10 shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <h2 className="text-xl font-extrabold text-white">{editing ? "Editar Tema" : "Novo Tema"}</h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white/70"><X size={24} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <Field label="Nome *">
                <input type="text" value={form.nome} onChange={(e) => field("nome", e.target.value)} placeholder="Ex: Marvel" className="input" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Slug">
                  <input type="text" value={form.slug} onChange={(e) => field("slug", e.target.value)} placeholder="ex: marvel" className="input font-mono" />
                </Field>
                <Field label="Ícone (emoji)">
                  <input type="text" value={form.icone} onChange={(e) => field("icone", e.target.value)} placeholder="🦸" className="input" />
                </Field>
              </div>

              <Field label="Cor principal">
                <div className="flex gap-2">
                  <input type="color" value={form.cor} onChange={(e) => field("cor", e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent" />
                  <input type="text" value={form.cor} onChange={(e) => field("cor", e.target.value)} className="flex-1 input font-mono" />
                </div>
              </Field>

              <Field label="Imagem de capa">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} className="w-full text-sm text-white/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-purple-500 cursor-pointer" />
                {coverPreview && (
                  <div className="relative mt-2">
                    <img src={coverPreview} className="w-full h-36 object-cover rounded-xl border border-white/10" />
                    <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"><X size={14} /></button>
                  </div>
                )}
              </Field>

              <Field label="Descrição">
                <textarea value={form.descricao} onChange={(e) => field("descricao", e.target.value)} rows={3} placeholder="Descrição do tema..." className="input resize-none" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ordem">
                  <input type="number" value={form.ordem} onChange={(e) => field("ordem", e.target.value)} className="input" min={0} />
                </Field>
                <Field label="Status">
                  <button type="button" onClick={() => field("ativo", !form.ativo)} className={`w-full h-10 rounded-xl font-bold text-sm border transition-colors ${form.ativo ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" : "bg-white/5 text-white/40 border-white/10"}`}>
                    {form.ativo ? "Ativo" : "Inativo"}
                  </button>
                </Field>
              </div>

              {/* Produtos do tema */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-white/70">Produtos do tema ({form.items.length})</label>
                  <button type="button" onClick={openAddItem} className="flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                    <Plus size={14} /> Adicionar produto
                  </button>
                </div>

                {form.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-white/30">Nenhum produto adicionado ainda</div>
                ) : (
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                          {item.url ? <img src={item.url} className="w-full h-full object-cover" /> : <Package size={20} className="text-white/20" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{item.name || "Sem nome"}</p>
                          <p className="text-xs text-white/50">{item.price ? `R$ ${item.price}` : "Sem preço"}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button type="button" onClick={() => openEditItem(idx)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"><Pencil size={14} /></button>
                          <button type="button" onClick={() => removeItem(idx)} className="p-1.5 rounded-lg bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-200"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex-shrink-0">
              <button onClick={save} disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-60 text-white py-3 rounded-xl font-extrabold shadow-lg shadow-purple-500/20">
                {saving ? "Salvando..." : "Salvar Tema"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ITEM */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 pb-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-extrabold text-white">{editingItemIdx !== null ? "Editar produto" : "Adicionar produto"}</h3>
              <button onClick={() => setShowItemForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <Field label="Imagem *">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setItemForm((p) => ({ ...p, _mainFile: f, _mainPreview: URL.createObjectURL(f) })); }} className="w-full text-white/70 text-sm" />
                {itemForm._mainPreview && <img src={itemForm._mainPreview} className="mt-2 w-full h-36 object-cover rounded-xl border border-white/10" />}
              </Field>

              <Field label="Nome do produto *">
                <input type="text" value={itemForm.name} onChange={(e) => setItem("name")(e.target.value)} placeholder="Ex: Camisa Baby Shark" className="input" />
              </Field>

              <Field label="Preço">
                <input type="text" value={itemForm.price} onChange={(e) => setItem("price")(e.target.value)} placeholder="Ex: 39,99" className="input" />
              </Field>
            </div>

            <div className="p-5 pt-4 border-t border-white/10 flex-shrink-0 flex gap-3">
              <button onClick={confirmItem} disabled={saving} className="flex-1 py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 disabled:opacity-60">
                {saving ? "Salvando..." : editingItemIdx !== null ? "Salvar" : "Adicionar"}
              </button>
              <button onClick={() => setShowItemForm(false)} className="flex-1 py-3 rounded-xl font-bold text-white/70 bg-white/5 border border-white/10">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/70 mb-1">{label}</label>
      {children}
    </div>
  );
}
