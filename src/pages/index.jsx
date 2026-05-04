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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    MidiaSocial: MidiaSocial,
    
    Financeiro: Financeiro,
    
    Agendas: Agendas,
    
    ClientesProdutos: ClientesProdutos,
    
    SelecionarEmpresa: SelecionarEmpresa,
    
    Documentos: Documentos,
    
    Equipe: Equipe,
    
    HomeDaEmpresa: HomeDaEmpresa,
    
    Pastas: Pastas,
    
    Automacoes: Automacoes,
    AIAssistant: AIAssistant,
    Analytics: Analytics,
    CompleteProfile: CompleteProfile,
    PainelPessoal: PainelPessoal,
}

function _getCurrentPage(url) {
    if (!url) return Object.keys(PAGES)[0];
    
    // Remover query strings e barras finais para uma comparação limpa
    const cleanPath = url.split('?')[0].replace(/\/$/, '');
    const urlParts = cleanPath.split('/');
    const urlLastPart = urlParts[urlParts.length - 1] || 'dashboard';
    
    // Encontrar a página correspondente no objeto PAGES (case insensitive)
    const pageName = Object.keys(PAGES).find(page => 
        page.toLowerCase() === urlLastPart.toLowerCase()
    );
    
    return pageName || 'Dashboard';
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/midiasocial" element={<MidiaSocial />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/agendas" element={<Agendas />} />
                <Route path="/clientesprodutos" element={<ClientesProdutos />} />
                <Route path="/selecionarempresa" element={<SelecionarEmpresa />} />
                <Route path="/documentos" element={<Documentos />} />
                <Route path="/equipe" element={<Equipe />} />
                <Route path="/homedaempresa" element={<HomeDaEmpresa />} />
                <Route path="/pastas" element={<Pastas />} />
                <Route path="/automacoes" element={<Automacoes />} />
                <Route path="/ia-assistente" element={<AIAssistant />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/completar-perfil" element={<CompleteProfile />} />
                <Route path="/painelpessoal" element={<PainelPessoal />} />
                <Route path="/auth/callback/:provider" element={<AuthCallback />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}