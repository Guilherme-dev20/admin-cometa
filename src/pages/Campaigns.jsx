import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Header from "../components/Header";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Image, X, Package } from "lucide-react";
import { supabase } from "../services/api";

const EMPTY_FORM = {
  tab: "",
  badge: "",
  badge_color: "#7c3aed",
  title: "",
  subtitle: "",
  description: "",
  banner_url: "",
  collection_link: "/produtos",
  images: [], // [{url, name, price, modelos:[]}]
  active: true,
  ordem: 0,
};

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  url: "",
  _mainFile: null,
  _mainPreview: null,
};

function sanitize(name) {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function uploadFile(file) {
  const fileName = `${Date.now()}-${sanitize(file.name)}`;
  const { error } = await supabase.storage.from("campanhas").upload(fileName, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("campanhas").getPublicUrl(fileName);
  return data?.publicUrl || "";
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Sub-form de produto
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductIdx, setEditingProductIdx] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);

  useEffect(() => { fetchCampaigns(); }, []);

  async function fetchCampaigns() {
    setLoading(true);
    const { data, error } = await supabase.from("campanhas").select("*").order("ordem", { ascending: true });
    if (error) alert("Erro ao carregar campanhas: " + error.message);
    else setCampaigns(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setBannerFile(null);
    setBannerPreview(null);
    setShowModal(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    const images = Array.isArray(c.images)
      ? c.images.map((item) =>
          typeof item === "string"
            ? { url: item, name: "", price: "", modelos: [] }
            : { url: item.url || "", name: item.name || "", price: item.price || "", modelos: Array.isArray(item.modelos) ? item.modelos : [] }
        )
      : [];
    setFormData({ ...EMPTY_FORM, ...c, images });
    setBannerFile(null);
    setBannerPreview(c.banner_url || null);
    setShowModal(true);
  }

  async function removeCampaign(id) {
    if (!confirm("Excluir esta campanha?")) return;
    const { error } = await supabase.from("campanhas").delete().eq("id", id);
    if (error) alert("Erro: " + error.message);
    else fetchCampaigns();
  }

  async function toggleActive(c) {
    const { error } = await supabase.from("campanhas").update({ active: !c.active }).eq("id", c.id);
    if (error) alert("Erro: " + error.message);
    else fetchCampaigns();
  }

  // ---- Sub-form produto ----
  function openAddProduct() {
    setEditingProductIdx(null);
    setProductForm(EMPTY_PRODUCT);
    setShowProductForm(true);
  }

  function openEditProduct(idx) {
    const item = formData.images[idx];
    setProductForm({ ...EMPTY_PRODUCT, ...item, _mainFile: null, _mainPreview: item.url || null });
    setEditingProductIdx(idx);
    setShowProductForm(true);
  }

  function removeProduct(idx) {
    setFormData((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function handleProductMainFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProductForm((p) => ({ ...p, _mainFile: f, _mainPreview: URL.createObjectURL(f) }));
  }

  async function confirmProduct() {
    if (!productForm.name) return alert("Digite o nome do produto");
    if (!productForm._mainFile && !productForm.url) return alert("Adicione uma imagem principal");
    setSaving(true);
    try {
      let url = productForm.url;
      if (productForm._mainFile) url = await uploadFile(productForm._mainFile);

      const item = { url, name: productForm.name, price: productForm.price };

      setFormData((f) => {
        const imgs = [...f.images];
        if (editingProductIdx !== null) imgs[editingProductIdx] = item;
        else imgs.push(item);
        return { ...f, images: imgs };
      });
      setShowProductForm(false);
    } catch (e) {
      alert("Erro ao salvar produto: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // ---- Salvar campanha ----
  async function saveCampaign() {
    if (!formData.tab) return alert("Digite a Tab");
    if (!formData.title) return alert("Digite o Título");
    setSaving(true);
    try {
      let banner_url = formData.banner_url;
      if (bannerFile) banner_url = await uploadFile(bannerFile);

      const payload = {
        tab: formData.tab,
        badge: formData.badge || null,
        badge_color: formData.badge_color,
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        banner_url: banner_url || null,
        collection_link: formData.collection_link || "/produtos",
        images: formData.images,
        active: formData.active,
        ordem: Number(formData.ordem) || 0,
      };

      if (editingId) {
        const { error } = await supabase.from("campanhas").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("campanhas").insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchCampaigns();
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  const set = (field) => (v) => setFormData((f) => ({ ...f, [field]: v }));
  const setProd = (field) => (v) => setProductForm((p) => ({ ...p, [field]: v }));

  return (
    <Layout title="Campanhas">
      <Header
        title="Campanhas"
        action={
          <button onClick={openAdd} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white p-3 md:px-5 md:py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/20">
            <Plus size={20} />
            <span className="hidden md:inline">Nova Campanha</span>
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-10 text-white/60">Carregando campanhas...</div>
      ) : (
        <>
          {/* DESKTOP */}
          <div className="hidden md:block rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden shadow-lg shadow-purple-500/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/60">
                <tr>
                  <th className="p-4">Banner</th>
                  <th className="p-4">Tab / Título</th>
                  <th className="p-4">Badge</th>
                  <th className="p-4 text-center">Produtos</th>
                  <th className="p-4 text-center">Ordem</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-4">
                      <div className="w-24 h-14 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                        {c.banner_url ? <img src={c.banner_url} className="w-full h-full object-cover" /> : <Image size={20} className="text-white/20" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-extrabold text-white">{c.title}</p>
                      <p className="text-xs text-white/50 mt-0.5">tab: {c.tab}</p>
                      {c.subtitle && <p className="text-xs text-white/40 mt-0.5">{c.subtitle}</p>}
                    </td>
                    <td className="p-4">
                      {c.badge ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: c.badge_color || "#7c3aed" }}>{c.badge}</span>
                      ) : <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="p-4 text-center text-white/60 text-sm">{Array.isArray(c.images) ? c.images.length : 0}</td>
                    <td className="p-4 text-center text-white/60">{c.ordem}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleActive(c)} className={`px-3 py-1 rounded-full text-xs font-bold border ${c.active ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" : "bg-white/5 text-white/60 border-white/10"}`}>
                        {c.active ? "Ativa" : "Inativa"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80"><Pencil size={16} /></button>
                        <button onClick={() => removeCampaign(c.id)} className="p-2 rounded-lg bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-200"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && <div className="text-center py-10 text-white/50">Nenhuma campanha cadastrada.</div>}
          </div>

          {/* MOBILE */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-lg shadow-purple-500/10 overflow-hidden">
                {c.banner_url && <img src={c.banner_url} className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-extrabold text-white">{c.title}</p>
                      <p className="text-xs text-white/50 mt-0.5">tab: {c.tab}</p>
                    </div>
                    {c.badge && <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: c.badge_color || "#7c3aed" }}>{c.badge}</span>}
                  </div>
                  <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="flex items-center gap-1 text-xs text-white/40 mb-3">
                    {expandedId === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedId === c.id ? "Menos detalhes" : "Mais detalhes"}
                  </button>
                  {expandedId === c.id && (
                    <div className="mb-3 space-y-1 text-xs text-white/50">
                      {c.subtitle && <p>Subtítulo: {c.subtitle}</p>}
                      <p>Link: {c.collection_link}</p>
                      <p>Ordem: {c.ordem}</p>
                      {Array.isArray(c.images) && c.images.length > 0 && <p>{c.images.length} produto(s) na campanha</p>}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(c)} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${c.active ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" : "bg-white/5 text-white/60 border-white/10"}`}>
                      {c.active ? "Ativa" : "Inativa"}
                    </button>
                    <button onClick={() => openEdit(c)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80"><Pencil size={16} /></button>
                    <button onClick={() => removeCampaign(c.id)} className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-200"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && <div className="text-center py-10 text-white/50">Nenhuma campanha cadastrada.</div>}
          </div>
        </>
      )}

      {/* MODAL CAMPANHA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-white/10 shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4 border-b border-white/10 flex-shrink-0">
              <h2 className="text-xl font-extrabold text-white">{editingId ? "Editar Campanha" : "Nova Campanha"}</h2>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Tab *" value={formData.tab} onChange={set("tab")} placeholder="Ex: destaque" />
                <Input label="Ordem" value={formData.ordem} onChange={set("ordem")} placeholder="0" type="number" />
              </div>
              <Input label="Título *" value={formData.title} onChange={set("title")} placeholder="Nome da campanha" />
              <Input label="Subtítulo" value={formData.subtitle} onChange={set("subtitle")} placeholder="Texto secundário" />

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Input label="Badge" value={formData.badge} onChange={set("badge")} placeholder="Ex: NOVO, -20%" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-1">Cor do Badge</label>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <input type="color" value={formData.badge_color} onChange={(e) => set("badge_color")(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0" />
                    <input value={formData.badge_color} onChange={(e) => set("badge_color")(e.target.value)} className="flex-1 min-w-0 px-3 py-2 bg-white/5 text-white text-sm placeholder:text-white/30 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" placeholder="#7c3aed" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">Descrição</label>
                <textarea value={formData.description} onChange={(e) => set("description")(e.target.value)} rows={3} placeholder="Descrição da campanha..." className="w-full px-4 py-2 bg-white/5 text-white placeholder:text-white/30 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>

              <Input label="Link da Coleção" value={formData.collection_link} onChange={set("collection_link")} placeholder="/produtos" />

              {/* Banner */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">Banner</label>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); } }} className="w-full text-white/70 text-sm" />
                {!bannerFile && <Input label="Ou URL do banner" value={formData.banner_url} onChange={set("banner_url")} placeholder="https://..." />}
                {bannerPreview && <img src={bannerPreview} className="mt-3 w-full h-40 object-cover rounded-xl border border-white/10" />}
              </div>

              {/* Produtos da campanha */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-white/70">
                    Produtos da campanha ({formData.images.length})
                  </label>
                  <button type="button" onClick={openAddProduct} className="flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                    <Plus size={14} /> Adicionar produto
                  </button>
                </div>

                {formData.images.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-white/30">
                    Nenhum produto adicionado ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.images.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                          {item.url ? <img src={item.url} className="w-full h-full object-cover" /> : <Package size={20} className="m-auto mt-3 text-white/20" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{item.name || "Sem nome"}</p>
                          <p className="text-xs text-white/50">{item.price ? `R$ ${item.price}` : "Sem preço"}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button type="button" onClick={() => openEditProduct(idx)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"><Pencil size={14} /></button>
                          <button type="button" onClick={() => removeProduct(idx)} className="p-1.5 rounded-lg bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-200"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle ativo */}
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => set("active")(!formData.active)} className={`relative w-11 h-6 rounded-full transition-colors ${formData.active ? "bg-purple-600" : "bg-white/10"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.active ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <span className="text-sm font-semibold text-white/70">{formData.active ? "Campanha ativa" : "Campanha inativa"}</span>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-white/10 flex-shrink-0 flex gap-3">
              <button onClick={saveCampaign} disabled={saving} className="flex-1 py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/20 disabled:opacity-60">
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUTO */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 pb-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-extrabold text-white">{editingProductIdx !== null ? "Editar produto" : "Adicionar produto"}</h3>
              <button onClick={() => setShowProductForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Imagem principal */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">Imagem principal *</label>
                <input type="file" accept="image/*" onChange={handleProductMainFile} className="w-full text-white/70 text-sm" />
                {productForm._mainPreview && (
                  <img src={productForm._mainPreview} className="mt-2 w-full h-36 object-cover rounded-xl border border-white/10" />
                )}
              </div>

              <Input label="Nome do produto *" value={productForm.name} onChange={setProd("name")} placeholder="Ex: Camisa Baby Shark" />
              <Input label="Preço" value={productForm.price} onChange={setProd("price")} placeholder="Ex: 39,99" />
            </div>

            <div className="p-5 pt-4 border-t border-white/10 flex-shrink-0 flex gap-3">
              <button onClick={confirmProduct} disabled={saving} className="flex-1 py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 disabled:opacity-60">
                {saving ? "Salvando..." : editingProductIdx !== null ? "Salvar alterações" : "Adicionar"}
              </button>
              <button onClick={() => setShowProductForm(false)} className="flex-1 py-3 rounded-xl font-bold text-white/70 bg-white/5 border border-white/10">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/70 mb-1">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2 bg-white/5 text-white placeholder:text-white/30 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
    </div>
  );
}
