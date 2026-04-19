
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";

export default function SocialMediaPreview({ posts }) {
  const scheduledPosts = posts
    .filter(post => post.status === 'agendado' && post.data_agendamento)
    .slice(0, 4);

  const getPlatformIcon = (platform) => {
    const iconProps = { className: "w-4 h-4" };
    switch (platform) {
      case 'instagram': return <Instagram {...iconProps} className="w-4 h-4 text-pink-500" />;
      case 'facebook': return <Facebook {...iconProps} className="w-4 h-4 text-blue-600" />;
      case 'twitter': return <Twitter {...iconProps} className="w-4 h-4 text-sky-500" />;
      case 'linkedin': return <Linkedin {...iconProps} className="w-4 h-4 text-blue-700" />;
      case 'youtube': return <Youtube {...iconProps} className="w-4 h-4 text-red-500" />;
      default: return <Share2 {...iconProps} />;
    }
  };

  const getPlatformColor = (platform) => {
    const colors = {
      instagram: "bg-pink-100 text-pink-800",
      facebook: "bg-blue-100 text-blue-800", 
      twitter: "bg-sky-100 text-sky-800",
      linkedin: "bg-blue-100 text-blue-800",
      youtube: "bg-red-100 text-red-800"
    };
    return colors[platform] || "bg-slate-100 text-slate-800";
  };

  return (
    <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-slate-600" />
          Próximas Publicações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {scheduledPosts.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Nenhum post agendado</p>
          ) : (
            scheduledPosts.map((post) => (
              <div key={post.id} className="p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors duration-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{post.titulo}</h4>
                  <div className="flex items-center gap-1 ml-2">
                    {getPlatformIcon(post.plataforma)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={getPlatformColor(post.plataforma)}>
                    {post.plataforma.charAt(0).toUpperCase() + post.plataforma.slice(1)}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {post.data_agendamento ? new Date(post.data_agendamento).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
