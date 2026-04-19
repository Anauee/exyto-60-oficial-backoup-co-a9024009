import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "positive",
  icon: Icon,
  color = "blue"
}) {
  const themeColors = {
    blue: {
      bg: "from-blue-500/20 to-blue-600/20",
      icon: "text-blue-500"
    },
    green: {
      bg: "from-emerald-500/20 to-emerald-600/20",
      icon: "text-emerald-500"
    },
    purple: {
      bg: "from-purple-500/20 to-purple-600/20",
      icon: "text-purple-500"
    },
    orange: {
      bg: "from-orange-500/20 to-orange-600/20",
      icon: "text-orange-500"
    },
    red: {
      bg: "from-red-500/20 to-red-600/20",
      icon: "text-red-500"
    }
  };

  const selectedColor = themeColors[color] || themeColors.blue;

  return (
    <Card className="relative overflow-hidden border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group">
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${selectedColor.bg} border border-white/5`}>
            <Icon className={`w-6 h-6 ${selectedColor.icon} group-hover:scale-110 transition-transform duration-500`} />
          </div>
          {change && (
            <div className={`flex items-center text-xs font-black px-3 py-1.5 rounded-full ${
              changeType === "positive" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            } border border-current/10`}>
              {changeType === "positive" ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
          <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}