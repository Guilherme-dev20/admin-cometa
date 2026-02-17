import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children, title, action }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex w-full overflow-x-hidden bg-slate-950
      bg-[radial-gradient(1000px_500px_at_20%_0%,rgba(168,85,247,0.35),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(124,58,237,0.30),transparent_55%)]"
    >
      {/* Sidebar Desktop */}
      <div className="hidden md:block sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-50 w-72 max-w-[85vw] h-full bg-slate-950 border-r border-white/10 shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title={title} action={action} onMenu={() => setOpen(true)} />

        <main className="p-4 md:p-8 w-full flex flex-col items-center">
          <div className="w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}







