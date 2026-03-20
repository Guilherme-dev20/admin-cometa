import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-white font-bold text-xl mb-2">Algo deu errado</p>
          <p className="text-white/50 text-sm mb-6 max-w-md">
            {this.state.error?.message || "Erro desconhecido"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
