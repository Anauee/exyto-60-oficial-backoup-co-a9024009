import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Breadcrumb({ crumbs }) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li className="inline-flex items-center">
          <Link to={createPageUrl('Pastas')} className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-blue-600">
            <Home className="w-4 h-4 me-2.5" />
            Início
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.id}>
            <div className="flex items-center">
              <ChevronRight className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" />
              <Link
                to={crumb.url}
                className="ms-1 text-sm font-medium text-slate-700 hover:text-blue-600 md:ms-2"
              >
                {crumb.nome}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}