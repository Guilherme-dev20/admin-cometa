import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Colors from "./pages/Colors";
import Campaigns from "./pages/Campaigns";
import Destaques from "./pages/Destaques";
import Temas from "./pages/Temas";
import Hero3D from "./pages/Hero3D";
import Avaliacoes from "./pages/Avaliacoes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/colors" element={<Colors />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/destaques" element={<Destaques />} />
        <Route path="/temas" element={<Temas />} />
        <Route path="/hero3d" element={<Hero3D />} />
        <Route path="/avaliacoes" element={<Avaliacoes />} />
      </Routes>
    </BrowserRouter>
  );
}

