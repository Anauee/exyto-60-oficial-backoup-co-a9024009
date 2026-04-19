import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function WebhookLogsModal({ isOpen, onClose, webhook, logs }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'failure':
        return <Badge className="bg-red-100 text-red-800">Falha</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Logs do Webhook: {webhook?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {logs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-slate-500">
                <p>Nenhum log registrado ainda para este webhook.</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                      <span className="text-sm text-slate-600">
                        {format(new Date(log.timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {log.error_message && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Erro:</strong> {log.error_message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Payload Recebido</h4>
                      <pre className="text-xs bg-slate-50 p-3 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(log.request_payload, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Resposta</h4>
                      <pre className="text-xs bg-slate-50 p-3 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(log.response_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}