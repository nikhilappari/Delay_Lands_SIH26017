import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  badgeText,
  badgeType = 'neutral'
}) {
  return (
    <div className="metric-card-3d p-4 transition-all group relative overflow-hidden">
      {/* Top subtle specular reflection line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#57707A] font-sans">
            {title}
          </p>
          <div className="flex items-baseline space-x-2 pt-0.5">
            <h3 className="text-2xl font-bold tracking-tight text-[#191D23] font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              {value}
            </h3>
            {badgeText && (
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold badge-3d ${
                badgeType === 'danger' ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs' :
                badgeType === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs' :
                badgeType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' :
                'bg-[#FAF8FA] text-[#57707A] border border-[#C5BAC4] shadow-xs'
              }`}>
                {badgeText}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#FAF8FA] to-[#EAE6E8] text-[#57707A] border border-[#C5BAC4]/70 shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:bg-[#191D23] group-hover:text-white group-hover:border-[#191D23] transition-all duration-200 group-hover:scale-105">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-[#7E919F] mt-2.5 font-medium font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
}
