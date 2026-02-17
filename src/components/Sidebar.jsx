import { LayoutDashboard, ShoppingCart, Palette, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="w-64 h-full text-white/80 p-6 flex flex-col bg-slate-950 border-r border-white/10">
      <div className="mb-10 px-2">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-sm italic shadow-lg shadow-purple-500/20">
            C
          </div>
          Cometa Admin
        </h2>
        <p className="text-xs text-white/40 mt-1"></p>
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
      </nav>

      <button className="flex items-center gap-3 px-4 py-3 text-white/50 hover:text-red-300 transition-colors mt-auto">
        <LogOut size={20} />
        Sair
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
      <span className="text-white/80 group-hover:text-white">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}




