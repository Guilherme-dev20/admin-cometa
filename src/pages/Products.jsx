import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Header from "../components/Header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../services/api"; // Garanta que seu api.js exporta 'supabase'

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    imagem_url: "",
    active: true,
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("Erro ao carregar produtos: " + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setFormData({
      nome: "",
      descricao: "",
      preco: "",
      imagem_url: "",
      active: true,
    });
    setFile(null);
    setPreview(null);
    setShowModal(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setFormData({
      nome: product.nome || "",
      descricao: product.descricao || "",
      preco: product.preco ?? "",
      imagem_url: product.imagem_url || "",
      active: product.active ?? true,
    });
    setFile(null);
    setPreview(product.imagem_url || null);
    setShowModal(true);
  }

  async function removeProduct(id) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) alert("Erro ao excluir: " + error.message);
    else fetchProducts();
  }

  async function toggleActive(product) {
    const { error } = await supabase
      .from("produtos")
      .update({ active: !product.active })
      .eq("id", product.id);

    if (error) alert("Erro ao atualizar status: " + error.message);
    else fetchProducts();
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function uploadImageIfNeeded() {
    if (!file) return formData.imagem_url;

    const fileName = `${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("fotos-produtos")
      .upload(fileName, file, { upsert: false });

    if (upErr) {
      throw upErr;
    }

    const { data } = supabase.storage
      .from("fotos-produtos")
      .getPublicUrl(fileName);

    return data?.publicUrl || "";
  }

  function normalizePreco(v) {
    // aceita "R$ 85", "85,50", "85.50"
    const s = String(v ?? "").replace(/[^\d,.-]/g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  async function saveProduct() {
    if (!formData.nome) return alert("Digite o nome");
    const precoNum = normalizePreco(formData.preco);
    if (precoNum === null || precoNum <= 0) return alert("Preço inválido");

    try {
      const imagem_url = await uploadImageIfNeeded();

      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: precoNum,
        imagem_url,
        active: formData.active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("produtos").insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchProducts();
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    }
  }

  const formatMoney = (value) =>
    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Layout title="Produtos">
      <Header
        title="Produtos"
        action={
          <button
            onClick={openAdd}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white p-3 md:px-5 md:py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Adicionar Produto</span>
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-10 text-white/60">Carregando produtos...</div>
      ) : (
        <>
          {/* DESKTOP */}
          <div className="hidden md:block rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden shadow-lg shadow-purple-500/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/60">
                <tr>
                  <th className="p-4">Imagem</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Preço</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="p-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        {product.imagem_url ? (
                          <img
                            src={product.imagem_url}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-extrabold text-white">{product.nome}</p>
                    </td>

                    <td className="p-4">
                      <p className="text-white/60 line-clamp-2">
                        {product.descricao}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-extrabold">
                        {formatMoney(product.preco)}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          product.active
                            ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/20"
                            : "bg-white/5 text-white/60 border-white/10"
                        }`}
                      >
                        {product.active ? "Ativo" : "Inativo"}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-200"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 ? (
              <div className="text-center py-10 text-white/50">
                Nenhum produto cadastrado.
              </div>
            ) : null}
          </div>

          {/* MOBILE */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/5 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-lg shadow-purple-500/10"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-20 bg-white/5 rounded-xl flex-shrink-0 overflow-hidden border border-white/10">
                    {product.imagem_url ? (
                      <img
                        src={product.imagem_url}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-white truncate">
                      {product.nome}
                    </h3>
                    <p className="text-sm text-white/60 line-clamp-2 leading-tight mb-1">
                      {product.descricao}
                    </p>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-extrabold">
                      {formatMoney(product.preco)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleActive(product)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex-1 ${
                      product.active
                        ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/20"
                        : "bg-white/5 text-white/60 border-white/10"
                    }`}
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </button>

                  <button
                    onClick={() => openEdit(product)}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-white/10 p-6 shadow-2xl shadow-purple-500/20">
            <h2 className="text-xl font-extrabold text-white mb-5">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </h2>

            <div className="space-y-4">
              <Input
                label="Nome"
                value={formData.nome}
                onChange={(v) => setFormData({ ...formData, nome: v })}
              />
              <Input
                label="Descrição"
                value={formData.descricao}
                onChange={(v) => setFormData({ ...formData, descricao: v })}
              />
              <Input
                label="Preço"
                value={formData.preco}
                onChange={(v) => setFormData({ ...formData, preco: v })}
                placeholder="Ex: 85 ou 85,90"
              />

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">
                  Imagem
                </label>
                <input
                  type="file"
                  onChange={handleFile}
                  className="w-full text-white/70"
                />
                {preview ? (
                  <img
                    src={preview}
                    className="mt-3 w-full h-48 object-cover rounded-xl border border-white/10"
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveProduct}
                  className="flex-1 py-3 rounded-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/20"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/70 mb-1">
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-white/5 text-white placeholder:text-white/30 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}








