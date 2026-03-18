import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Header from "../components/Header";
import { Star } from "lucide-react";
import { supabase } from "../services/api";

export default function Destaques() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, descricao, preco, imagem_url, destaque")
      .eq("active", true)
      .order("nome", { ascending: true });

    if (error) alert("Erro ao carregar produtos: " + error.message);
    else setProducts(data || []);
    setLoading(false);
  }

  async function toggleDestaque(product) {
    setUpdating(product.id);

    const { error } = await supabase
      .from("produtos")
      .update({ destaque: !product.destaque })
      .eq("id", product.id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, destaque: !p.destaque } : p))
      );
    }

    setUpdating(null);
  }

  const totalDestaques = products.filter((p) => p.destaque).length;

  const formatMoney = (value) =>
    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Layout title="Produtos em Destaque">
      <Header title="Produtos em Destaque" />

      {/* Counter bar */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between mb-2">
        <div>
          <p className="text-white font-extrabold text-lg">
            {totalDestaques}
            <span className="text-white/40 font-normal text-base"> em destaque</span>
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            Ative ou desative o destaque de qualquer produto.
          </p>
        </div>
        <Star size={20} className="text-yellow-400 fill-yellow-400 opacity-60" />
      </div>

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
                  <th className="p-4">Preço</th>
                  <th className="p-4 text-center">Destaque</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-t border-white/10 transition-colors ${
                      product.destaque ? "bg-yellow-500/5" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="p-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        {product.imagem_url && (
                          <img src={product.imagem_url} className="w-full h-full object-cover" />
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-white">{product.nome}</p>
                        {product.destaque && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
                            <Star size={11} className="fill-yellow-300" />
                            Destaque
                          </span>
                        )}
                      </div>
                      {product.descricao && (
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{product.descricao}</p>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-extrabold">
                        {formatMoney(product.preco)}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <Toggle
                        checked={product.destaque}
                        disabled={updating === product.id}
                        onChange={() => toggleDestaque(product)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-10 text-white/50">Nenhum produto ativo encontrado.</div>
            )}
          </div>

          {/* MOBILE */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {products.map((product) => (
              <div
                key={product.id}
                className={`border backdrop-blur-xl p-4 rounded-2xl shadow-lg flex items-center gap-4 transition-colors ${
                  product.destaque
                    ? "bg-yellow-500/5 border-yellow-400/20 shadow-yellow-500/5"
                    : "bg-white/5 border-white/10 shadow-purple-500/10"
                }`}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                  {product.imagem_url && (
                    <img src={product.imagem_url} className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-white truncate">{product.nome}</p>
                    {product.destaque && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 flex-shrink-0">
                        <Star size={10} className="fill-yellow-300" />
                        Destaque
                      </span>
                    )}
                  </div>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-extrabold text-sm mt-0.5">
                    {formatMoney(product.preco)}
                  </p>
                </div>

                <Toggle
                  checked={product.destaque}
                  disabled={updating === product.id}
                  onChange={() => toggleDestaque(product)}
                />
              </div>
            ))}

            {products.length === 0 && (
              <div className="text-center py-10 text-white/50">Nenhum produto ativo encontrado.</div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-yellow-400" : "bg-white/10 hover:bg-white/20"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
