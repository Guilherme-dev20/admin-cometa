import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Plus, Trash2, X } from "lucide-react";
import { supabase } from "../services/api";

export default function Colors() {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newColor, setNewColor] = useState({ name: "", hex: "#000000" });

  useEffect(() => {
    fetchColors();
  }, []);

  async function fetchColors() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cores")
      .select("*")
      .order("nome", { ascending: true });

    if (error) alert("Erro ao carregar cores: " + error.message);
    else setColors(data || []);
    setLoading(false);
  }

  async function removeColor(id) {
    if (!confirm("Remover esta cor?")) return;
    const { error } = await supabase.from("cores").delete().eq("id", id);
    if (error) alert("Erro ao remover: " + error.message);
    else fetchColors();
  }

  async function toggleColorActive(color) {
    const { error } = await supabase
      .from("cores")
      .update({ active: !color.active })
      .eq("id", color.id);

    if (error) alert("Erro ao atualizar cor: " + error.message);
    else fetchColors();
  }

  async function addColor() {
    if (!newColor.name) return alert("Digite o nome da cor");
    const { error } = await supabase.from("cores").insert([
      { nome: newColor.name, hex: newColor.hex, active: true },
    ]);

    if (error) alert("Erro ao salvar cor: " + error.message);
    else {
      setNewColor({ name: "", hex: "#000000" });
      setShowModal(false);
      fetchColors();
    }
  }

  return (
    <Layout title="Cores">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-extrabold text-white">Cores Disponíveis</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white p-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline font-semibold">Adicionar Cor</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-white/60">Carregando cores...</div>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 md:p-8 w-full shadow-lg shadow-purple-500/10">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {colors.map((color) => (
              <div
                key={color.id}
                className="border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition"
              >
                <div
                  className="w-full h-20 rounded-xl shadow-inner border border-white/10"
                  style={{ backgroundColor: color.hex }}
                />

                <div className="text-center w-full min-w-0">
                  <p className="font-extrabold truncate text-white">{color.nome}</p>
                  <p className="text-xs text-white/40 uppercase font-mono">{color.hex}</p>

                  <p
                    className={`text-xs font-bold mt-1 ${
                      color.active ? "text-emerald-300" : "text-white/40"
                    }`}
                  >
                    {color.active ? "Ativo" : "Inativo"}
                  </p>
                </div>

                <button
                  onClick={() => toggleColorActive(color)}
                  className={`w-full py-2 rounded-xl text-xs font-bold ${
                    color.active
                      ? "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border border-emerald-400/20"
                  }`}
                >
                  {color.active ? "Desativar" : "Ativar"}
                </button>

                <button
                  onClick={() => removeColor(color.id)}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-red-400/20"
                >
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            ))}
          </div>

          {colors.length === 0 && (
            <div className="text-center py-10 text-white/50">
              Nenhuma cor cadastrada.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-950 rounded-2xl p-6 w-full max-w-md relative border border-white/10 shadow-2xl shadow-purple-500/20">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/70"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-extrabold mb-6 text-white">Nova Cor</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">
                  Nome da Cor
                </label>
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 text-white placeholder:text-white/30 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Verde Militar"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1">
                  Selecione a Cor
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="w-14 h-10 rounded cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="flex-1 px-4 py-2 bg-white/5 text-white border border-white/10 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <button
                onClick={addColor}
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white py-3 rounded-xl font-extrabold mt-4 shadow-lg shadow-purple-500/20"
              >
                Salvar Cor
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}





