import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Search, FileText, Trash2 } from "lucide-react";
import { TarefaSalva } from "@/api/entities";

export default function TarefasSalvasModal({ isOpen, onClose, onSelect, empresaId }) {
  const [tarefasSalvas, setTarefasSalvas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadTarefasSalvas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await TarefaSalva.filter({ empresa_id: empresaId }, "-created_date");
      setTarefasSalvas(data);
    } catch (error) {
      console.error("Erro ao carregar tarefas salvas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (isOpen && empresaId) {
      loadTarefasSalvas();
    }
  }, [isOpen, empresaId, loadTarefasSalvas]);

  const handleDelete = async (tarefaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa salva?')) {
      try {
        await TarefaSalva.delete(tarefaId);
        loadTarefasSalvas();
      } catch (error) {
        console.error("Erro ao excluir tarefa:", error);
      }
    }
  };

  const filteredTarefas = tarefasSalvas.filter(tarefa =>
    tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tarefa.detalhamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            Tarefas Salvas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar tarefas salvas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredTarefas.length} tarefa(s)
            </Badge>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          ) : filteredTarefas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTarefas.map((tarefa) => (
                <Card 
                  key={tarefa.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelect(tarefa)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-medium line-clamp-1 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {tarefa.titulo}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tarefa.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {tarefa.detalhamento}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {tarefa.categoria || 'Geral'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Clique para usar
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Nenhuma tarefa salva encontrada
                </h3>
                <p className="text-slate-500 text-center">
                  {searchTerm ? 
                    "Nenhuma tarefa corresponde à sua busca" : 
                    "Você ainda não salvou nenhuma tarefa para reuso"
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}