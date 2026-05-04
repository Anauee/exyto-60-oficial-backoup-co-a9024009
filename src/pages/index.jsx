import { BrowserRouter as Router, Route, Routes, Outlet, useLocation } from 'react-router-dom';

import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import MidiaSocial from "./MidiaSocial";
import Financeiro from "./Financeiro";
import Agendas from "./Agendas";
import ClientesProdutos from "./ClientesProdutos";
import SelecionarEmpresa from "./SelecionarEmpresa";
import Documentos from "./Documentos";
import Equipe from "./Equipe";
import HomeDaEmpresa from "./HomeDaEmpresa";
import Pastas from "./Pastas";
import Automacoes from "./Automacoes";
import AIAssistant from "./AIAssistant";
import AuthCallback from "./AuthCallback";
import Analytics from "./Analytics";
import CompleteProfile from "./CompleteProfile";
import PainelPessoal from "./PainelPessoal";


// Este componente serve como "casca" com Layout para as rotas internas da empresa
function AppLayout() {
    const location = useLocation();
    const pageName = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    return (
        <Layout currentPageName={pageName}>
            <Outlet />
        </Layout>
    );
}

// Páginas globais (sem sidebar): só renderiza os filhos
function GlobalLayout() {
    return <Outlet />;
}

export default function Pages() {
    return (
        <Router>
            <Routes>
                {/* Rotas com Layout de Empresa (sidebar) */}
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/midiasocial" element={<MidiaSocial />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/agendas" element={<Agendas />} />
                    <Route path="/clientesprodutos" element={<ClientesProdutos />} />
                    <Route path="/documentos" element={<Documentos />} />
                    <Route path="/equipe" element={<Equipe />} />
                    <Route path="/homedaempresa" element={<HomeDaEmpresa />} />
                    <Route path="/pastas" element={<Pastas />} />
                    <Route path="/automacoes" element={<Automacoes />} />
                    <Route path="/ia-assistente" element={<AIAssistant />} />
                    <Route path="/analytics" element={<Analytics />} />
                </Route>

                {/* Rotas Globais (sem sidebar) */}
                <Route element={<GlobalLayout />}>
                    <Route path="/selecionarempresa" element={<SelecionarEmpresa />} />
                    <Route path="/painelpessoal" element={<PainelPessoal />} />
                    <Route path="/completar-perfil" element={<CompleteProfile />} />
                    <Route path="/auth/callback/:provider" element={<AuthCallback />} />
                </Route>
            </Routes>
        </Router>
    );
}