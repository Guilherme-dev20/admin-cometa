import { Menu } from "lucide-react";

export default function Header({ title, action, onMenu }) {
  return (
    <div
      className="flex items-center justify-between px-4 md:px-8 py-4 sticky top-0 z-30 w-full
      bg-slate-950/30 backdrop-blur-xl border-b border-white/10"
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={onMenu}
          className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white/80 active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-lg md:text-2xl font-extrabold text-white truncate">
          {title}
        </h1>
      </div>

      <div className="flex-shrink-0 ml-2">{action}</div>
    </div>
  );
}





