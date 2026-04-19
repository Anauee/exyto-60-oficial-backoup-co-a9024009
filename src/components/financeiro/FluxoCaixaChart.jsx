import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200">
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-green-600">{`Receitas: R$ ${payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</p>
        <p className="text-red-600">{`Despesas: R$ ${payload[1].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</p>
      </div>
    );
  }
  return null;
};

export default function FluxoCaixaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          axisLine={{ stroke: '#e2e8f0' }} 
          tickLine={{ stroke: '#e2e8f0' }} 
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          axisLine={{ stroke: '#e2e8f0' }} 
          tickLine={{ stroke: '#e2e8f0' }} 
          tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Line type="monotone" dataKey="receitas" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="despesas" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}