import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Colors from "./pages/Colors";
import Campaigns from "./pages/Campaigns";
import Destaques from "./pages/Destaques";
import Temas from "./pages/Temas";

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
      </Routes>
    </BrowserRouter>
  );
}

