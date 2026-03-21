import { LayoutDashboard, ShoppingCart, Palette, Megaphone, Star, Layers, Box, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/api"; // Certifique-se que o caminho está correto

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      // Encerra a sessão no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Se houver a função onNavigate (usada no mobile), fecha a sidebar
      if (onNavigate) onNavigate();

      // Redireciona para a página de login
      navigate("/");
    } catch (error) {
      console.error("Erro ao sair:", error.message);
      // Mesmo se der erro, forçamos o redirecionamento por segurança
      window.location.href = "/";
    }
  }

  return (
    <aside className="w-64 h-full text-white/80 p-6 flex flex-col bg-slate-950 border-r border-white/10">
      <div className="mb-10 px-2">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-sm italic shadow-lg shadow-purple-500/20">
            C
          </div>
          Cometa Admin
        </h2>
        <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-bold">Acesso Restrito</p>
      </div>

      <nav className="space-y-2 flex-1">
        <MenuLink
          to="/dashboard"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          onClick={onNavigate}
        />
        <MenuLink
          to="/products"
          icon={<ShoppingCart size={20} />}
          label="Produtos"
          onClick={onNavigate}
        />
        <MenuLink
          to="/colors"
          icon={<Palette size={20} />}
          label="Cores"
          onClick={onNavigate}
        />
        <MenuLink
          to="/campaigns"
          icon={<Megaphone size={20} />}
          label="Campanhas"
          onClick={onNavigate}
        />
        <MenuLink
          to="/destaques"
          icon={<Star size={20} />}
          label="Destaques"
          onClick={onNavigate}
        />
        <MenuLink
          to="/temas"
          icon={<Layers size={20} />}
          label="Temas"
          onClick={onNavigate}
        />
        <MenuLink
          to="/hero3d"
          icon={<Box size={20} />}
          label="Hero 3D"
          onClick={onNavigate}
        />
      </nav>

      {/* Botão de Sair com a lógica de autenticação */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-red-400 transition-all mt-auto border border-transparent hover:border-red-500/20 hover:bg-red-500/5 rounded-xl group"
      >
        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
        <span className="font-semibold">Sair do Painel</span>
      </button>
    </aside>
  );
}

function MenuLink({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group border ${
          isActive
            ? "bg-purple-500/15 text-white border-purple-400/20 shadow-lg shadow-purple-500/10"
            : "border-transparent hover:border-white/10 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <span className={({ isActive }) => isActive ? "text-purple-400" : "text-white/80 group-hover:text-white"}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}




