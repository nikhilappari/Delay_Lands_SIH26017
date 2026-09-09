import React from 'react';
import { AlertTriangle, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';

export default function RiskBadge({ level, type = 'risk', size = 'md' }) {
  if (type === 'outcome') {
    const isDelayed = level === 1 || level === 'DELAYED' || level === 'Delayed';
    return (
      <span className={`inline-flex items-center space-x-1.5 font-semibold rounded-md badge-3d ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs'
      } ${
        isDelayed
          ? 'bg-gradient-to-b from-rose-50 to-rose-100/70 text-rose-700 border border-rose-200'
          : 'bg-gradient-to-b from-emerald-50 to-emerald-100/70 text-emerald-700 border border-emerald-200'
      }`}>
        {isDelayed ? (
          <>
            <Clock className="w-3 h-3 text-rose-600" />
            <span>Delayed</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>On Schedule</span>
          </>
        )}
      </span>
    );
  }

  // Risk Level Badges
  const lvl = (level || '').toUpperCase();

  if (lvl === 'HIGH') {
    return (
      <span className={`inline-flex items-center space-x-1.5 font-semibold rounded-md badge-3d bg-gradient-to-b from-rose-50 to-rose-100/80 text-rose-700 border border-rose-200/90 ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs'
      }`}>
        <AlertOctagon className="w-3 h-3 text-rose-600" />
        <span>High Risk</span>
      </span>
    );
  }

  if (lvl === 'MEDIUM') {
    return (
      <span className={`inline-flex items-center space-x-1.5 font-semibold rounded-md badge-3d bg-gradient-to-b from-amber-50 to-amber-100/80 text-amber-800 border border-amber-200/90 ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs'
      }`}>
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        <span>Medium Risk</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 font-semibold rounded-md badge-3d bg-gradient-to-b from-[#FAF9FA] to-[#EAE6E8] text-[#57707A] border border-[#C5BAC4] ${
      size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs'
    }`}>
      <CheckCircle2 className="w-3 h-3 text-[#57707A]" />
      <span>Low Risk</span>
    </span>
  );
}
