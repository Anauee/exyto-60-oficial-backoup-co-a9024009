import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "./LoginPage";
import Pages from "@/pages/index";

export default function Auth() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Se não houver sessão, renderiza a página de login
  if (!session) {
    return <LoginPage />;
  }

  // Se houver sessão, renderiza o sistema completo (com Router, Sidebar, e todas as rotas)
  // A página SelecionarEmpresa é uma ROTA dentro do Pages, não um componente separado.
  // O Layout.jsx e o Dashboard.jsx já tratam o redirecionamento se não houver empresa selecionada.
  return <Pages />;
}