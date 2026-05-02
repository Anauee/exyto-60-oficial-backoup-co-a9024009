import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { List, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const getStatusBadge = (status) => {
  const statusMap = {
    'ideia': { color: 'bg-gray-100 text-gray-800', label: 'Ideia' },
    'producao': { color: 'bg-blue-100 text-blue-800', label: 'Produção' },
    'revisao': { color: 'bg-yellow-100 text-yellow-800', label: 'Revisão' },
    'agendado': { color: 'bg-green-100 text-green-800', label: 'Agendado' },
    'publicado': { color: 'bg-purple-100 text-purple-800', label: 'Publicado' }
  };
  const statusInfo = statusMap[status] || statusMap['ideia'];
  return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
};

const formatDateSafely = (dateString, formatString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    return '-';
  }
};

export default function PostListTable({ 
  posts = [], 
  onPostClick, 
  membros = [], 
  contas = [], 
  formatos = [],
  plataformas = [] 
}) {
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedPosts = () => {
    if (!sortConfig.key) return posts;

    return [...posts].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'titulo':
          aValue = (a.titulo || '').toLowerCase();
          bValue = (b.titulo || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'data_agendamento':
          aValue = a.data_agendamento ? new Date(a.data_agendamento).getTime() : 0;
          bValue = b.data_agendamento ? new Date(b.data_agendamento).getTime() : 0;
          break;
        case 'conta':
          aValue = getLookupName(a.conta_social_id, contas, 'id', 'nome_usuario').toLowerCase();
          bValue = getLookupName(b.conta_social_id, contas, 'id', 'nome_usuario').toLowerCase();
          break;
        case 'plataforma':
          const aConta = contas.find(c => c.id === a.conta_social_id);
          const aPlat = plataformas.find(p => p.id === aConta?.plataforma_id);
          const bConta = contas.find(c => c.id === b.conta_social_id);
          const bPlat = plataformas.find(p => p.id === bConta?.plataforma_id);
          aValue = (aPlat?.nome || '').toLowerCase();
          bValue = (bPlat?.nome || '').toLowerCase();
          break;
        case 'formato':
          aValue = getLookupName(a.formato_id, formatos).toLowerCase();
          bValue = getLookupName(b.formato_id, formatos).toLowerCase();
          break;
        case 'responsavel':
          aValue = getLookupName(a.responsavel_id, membros).toLowerCase();
          bValue = getLookupName(b.responsavel_id, membros).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedPosts = getSortedPosts();

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30 group-hover/head:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };
  const getLookupName = (id, list, key = 'id', nameKey = 'nome') => {
    if (!id || !list) return '-';
    const item = list.find(i => i[key] === id);
    return item ? item[nameKey] : '-';
  };

  return (
    <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <List className="w-6 h-6 text-purple-500" />
            </div>
            Lista de Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/20 bg-muted/30">
                <TableHead 
                  onClick={() => handleSort('titulo')}
                  className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                >
                  <div className="flex items-center">
                    Título <SortIcon columnKey="titulo" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('status')}
                  className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                >
                  <div className="flex items-center">
                    Status <SortIcon columnKey="status" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('data_agendamento')}
                  className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                >
                  <div className="flex items-center">
                    Agendamento <SortIcon columnKey="data_agendamento" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('conta')}
                  className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                >
                  <div className="flex items-center">
                    Conta <SortIcon columnKey="conta" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('plataforma')}
                  className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                >
                  <div className="flex items-center">
                    Plataforma <SortIcon columnKey="plataforma" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('formato')}
                  className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                >
                  <div className="flex items-center">
                    Formato <SortIcon columnKey="formato" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('responsavel')}
                  className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head text-right"
                >
                  <div className="flex items-center justify-end">
                    Responsável <SortIcon columnKey="responsavel" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPosts.map((post) => {
                const conta = contas.find(c => c.id === post.conta_social_id);
                const plataforma = plataformas.find(p => p.id === conta?.plataforma_id);
                return (
                  <TableRow
                    key={post.id}
                    className="group hover:bg-muted/30 transition-all duration-300 cursor-pointer border-b border-border/10"
                    onClick={() => onPostClick(post)}
                  >
                    <TableCell className="font-medium max-w-xs truncate" title={post.titulo}>
                      {post.titulo}
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>{formatDateSafely(post.data_agendamento, "dd/MM/yyyy 'às' HH:mm")}</TableCell>
                    <TableCell>{getLookupName(post.conta_social_id, contas, 'id', 'nome_usuario')}</TableCell>
                    <TableCell>
                      {plataforma ? (
                        <Badge variant="outline">{plataforma.nome}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getLookupName(post.formato_id, formatos)}</TableCell>
                    <TableCell>{getLookupName(post.responsavel_id, membros)}</TableCell>
                  </TableRow>
                );
              })}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan="7" className="text-center text-slate-500 py-10">
                    Nenhum post encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}