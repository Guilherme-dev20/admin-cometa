import { useEffect, useState } from "react";
import { supabase } from "../services/api";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Limpa a mensagem de erro sempre que o usuário começar a digitar novamente
  useEffect(() => {
    setErrorMsg("");
  }, [email, password]);

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");

    // Validações básicas de preenchimento
    if (!email.trim()) return setErrorMsg("Digite seu e-mail.");
    if (!password) return setErrorMsg("Digite sua senha.");

    setLoading(true);

    try {
      // Chamada oficial ao Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Erros comuns: "Invalid login credentials" ou "Email not confirmed"
        setErrorMsg("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }

      // Sucesso: Redireciona para o dashboard
      window.location.href = "/dashboard";
      
    } catch (err) {
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#05060a] relative overflow-hidden flex items-center justify-center p-4">
      {/* Efeito de Fundo Neon / PowerBI */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute top-24 -right-24 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.10),transparent_50%)]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl">
          <div className="p-7 sm:p-8">
            {/* Cabeçalho do Card */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-400/20 flex items-center justify-center">
                <span className="font-extrabold text-purple-200">C</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Painel Admin
                </h1>
                <p className="text-white/60 text-sm">
                  Cometa Personalização • acesso restrito
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Campo de E-mail */}
              <div>
                <label className="text-white/80 text-sm font-semibold">
                  E-mail institucional
                </label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/30 px-10 py-3 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/30 transition-all"
                    placeholder="Email de acesso"
                  />
                </div>
              </div>

              {/* Campo de Senha */}
              <div>
                <label className="text-white/80 text-sm font-semibold">
                  Senha de acesso
                </label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                    <Lock size={18} />
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/30 px-10 pr-12 py-3 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/30 transition-all"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro */}
              {errorMsg && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-in fade-in slide-in-from-top-1">
                  {errorMsg}
                </div>
              )}

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-bold text-white
                           bg-gradient-to-r from-purple-600 to-fuchsia-600
                           hover:from-purple-500 hover:to-fuchsia-500
                           shadow-lg shadow-purple-700/20
                           disabled:opacity-50 disabled:cursor-not-allowed
                           active:scale-[0.98] transition-all"
              >
                {loading ? "Autenticando..." : "Entrar no Sistema"}
              </button>

              <p className="text-center text-xs text-white/35 pt-2">
                Proteção por criptografia de ponta.
              </p>
            </form>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-4 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Cometa Personalização
        </div>
      </div>
    </div>
  );
}



