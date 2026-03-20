import { useEffect, useState } from "react";
import { supabase } from "../services/api";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!error && data) setSession(data.session);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Escuta mudanças (login/logout)
    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setLoading(false);
      });
      subscription = data?.subscription;
    } catch {
      setLoading(false);
    }

    return () => {
      try { subscription?.unsubscribe(); } catch {}
    };
  }, []);

  return { session, loading };
}