
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FolderOpen, User, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import ProjetoModal from "./ProjetoModal";
import ProjetoDetalhes from "./ProjetoDetalhes";

// Helper functions (moved outside the main component as per outline suggestion)
const getStatusColor = (status) => {
  const colors = {
    planejamento: 'bg-gray-100 text-gray-800',
    em_andamento: 'bg-blue-100 text-blue-800',
    concluido: 'bg-green-100 text-green-800',
    pausado: 'bg-yellow-100 text-yellow-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status) => {
  const labels = {
    planejamento: 'Planejamento',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    pausado: 'Pausado'
  };
  return labels[status] || status;
};

// ProjetoCard component
function ProjetoCard({ projeto, tarefas, onViewDetails, onEdit }) {
  const projetoTarefas = tarefas.filter(t => t.projeto_id === projeto.id);
  const totalTarefas = projetoTarefas.length;
  const tarefasConcluidas = projetoTarefas.filter(t => t.status === 'concluido').length;
  
  const progresso = totalTarefas > 0 ? 
    (tarefasConcluidas / totalTarefas) * 100 
    : 0;

  return (
    <Card 
      key={projeto.id} 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onViewDetails(projeto)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {projeto.titulo}
            </CardTitle>
          </div>
          <Badge className={getStatusColor(projeto.status)}>
            {getStatusLabel(projeto.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {projeto.descricao && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {projeto.descricao}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4" />
            <span>{projeto.responsavel}</span>
          </div>

          {projeto.data_vencimento && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>
                Vence em {format(new Date(projeto.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>{totalTarefas} tarefa(s)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Progresso</span>
            <span className="font-medium">{progresso.toFixed(0)}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// Main ProjetosTab component
export default function ProjetosTab({ projetos, tarefas, onUpdate, empresaId, membros = [] }) {
  const [showModal, setShowModal] = useState(false); 
  const [showDetails, setShowDetails] = useState(false); 
  const [selectedProjeto, setSelectedProjeto] = useState(null);

  const handleEdit = (projeto) => { 
    setSelectedProjeto(projeto);
    setShowDetails(false); 
    setShowModal(true);
  };

  const handleViewDetails = (projeto) => { 
    setSelectedProjeto(projeto);
    setShowDetails(true);
  };

  const handleNovoProjeto = () => {
    setSelectedProjeto(null);
    setShowModal(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciamento de Projetos</h2>
          <p className="text-slate-600">Organize e acompanhe o progresso dos seus projetos</p>
        </div>
        <Button onClick={handleNovoProjeto} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projetos.map((projeto) => (
          <ProjetoCard 
            key={projeto.id} 
            projeto={projeto} 
            tarefas={tarefas} 
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
          />
        ))}

        {projetos.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed border-2 border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Nenhum projeto encontrado
                </h3>
                <p className="text-slate-500 text-center mb-4">
                  Comece criando seu primeiro projeto para organizar melhor suas atividades
                </p>
                <Button onClick={handleNovoProjeto} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjetoModal
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setSelectedProjeto(null);
        }}
        onSave={onUpdate}
        projeto={selectedProjeto}
        empresaId={empresaId}
        membros={membros}
      />

      {selectedProjeto && ( 
        <ProjetoDetalhes
          isOpen={showDetails} 
          onClose={() => {
            setShowDetails(false);
            setSelectedProjeto(null);
          }}
          projeto={selectedProjeto}
          tarefas={tarefas.filter(t => t.projeto_id === selectedProjeto?.id)}
          onEdit={handleEdit}
          onUpdate={onUpdate}
          empresaId={empresaId}
          membros={membros}
        />
      )}
    </>
  );
}
