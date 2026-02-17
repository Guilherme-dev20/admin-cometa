import { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import { Package, Palette, CheckCircle } from "lucide-react";
import { supabase } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ativos: 0,
    total: 0,
    coresAtivas: 0,
    coresTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);

      const { count: totalCount } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true });

      const { count: activeCount } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      const { count: coresTotal } = await supabase
        .from("cores")
        .select("*", { count: "exact", head: true });

      const { count: coresAtivas } = await supabase
        .from("cores")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      setStats({
        total: totalCount || 0,
        ativos: activeCount || 0,
        coresTotal: coresTotal || 0,
        coresAtivas: coresAtivas || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const produtosPct = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round((stats.ativos / stats.total) * 100);
  }, [stats.total, stats.ativos]);

  const coresPct = useMemo(() => {
    if (!stats.coresTotal) return 0;
    return Math.round((stats.coresAtivas / stats.coresTotal) * 100);
  }, [stats.coresTotal, stats.coresAtivas]);

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Visão Geral</h2>
          <p className="text-white/50">KPIs e status do catálogo.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Produtos Ativos"
            value={loading ? "..." : stats.ativos}
            subtitle={!loading ? `${produtosPct}% ativos` : ""}
            icon={<CheckCircle className="text-emerald-300" />}
          />
          <KpiCard
            title="Total de Produtos"
            value={loading ? "..." : stats.total}
            subtitle="Catálogo completo"
            icon={<Package className="text-blue-300" />}
          />
          <KpiCard
            title="Cores Ativas"
            value={loading ? "..." : stats.coresAtivas}
            subtitle={!loading ? `${coresPct}% ativas` : ""}
            icon={<CheckCircle className="text-emerald-300" />}
          />
          <KpiCard
            title="Total de Cores"
            value={loading ? "..." : stats.coresTotal}
            subtitle="Disponíveis no site"
            icon={<Palette className="text-purple-300" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel
            title="Atividade de Produtos"
            right={!loading ? `${stats.ativos}/${stats.total}` : ""}
          >
            <Bar label="Ativos" pct={produtosPct} />
            <div className="mt-3 text-xs text-white/50">
              Quanto do catálogo está ativo e aparecendo no site do cliente.
            </div>
          </Panel>

          <Panel
            title="Atividade de Cores"
            right={!loading ? `${stats.coresAtivas}/${stats.coresTotal}` : ""}
          >
            <Bar label="Ativas" pct={coresPct} />
            <div className="mt-3 text-xs text-white/50">
              Cores inativas ficam ocultas no seletor do cliente.
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}

function KpiCard({ title, value, subtitle, icon }) {
  return (
    <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-white/60 text-sm font-medium">{title}</p>
          <p className="text-white text-3xl font-extrabold mt-1">{value}</p>
          {subtitle ? (
            <p className="text-white/45 text-xs mt-1">{subtitle}</p>
          ) : null}
        </div>
        <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-400/20">
          {icon}
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full" />
      </div>
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold">{title}</h3>
        {right ? <span className="text-white/50 text-sm">{right}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Bar({ label, pct }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="text-white/60">{pct}%</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}







