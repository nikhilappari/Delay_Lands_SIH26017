import React from 'react';

export default function RiskGauge({ score = 0, level = 'LOW', size = 180, strokeWidth = 10 }) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let colorHex = '#57707A'; // Slate Teal (Low)
  let badgeBg = 'bg-[#FAF8FA] text-[#57707A] border-[#C5BAC4] shadow-2xs';

  if (level === 'HIGH') {
    colorHex = '#e11d48'; // Rose Red (High)
    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs';
  } else if (level === 'MEDIUM') {
    colorHex = '#d97706'; // Warm Amber (Medium)
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-2xs';
  }

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0 select-none" style={{ width: size, height: size }}>
      {/* 3D Dial Backdrop Disc */}
      <div 
        className="absolute inset-0 m-auto rounded-full bg-gradient-to-b from-white via-[#FAF9FA] to-[#EDE9EB] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-[#C5BAC4]/50"
        style={{ width: size - strokeWidth * 2 - 4, height: size - strokeWidth * 2 - 4 }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 relative z-10 overflow-visible">
        <defs>
          <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E1E4"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Dynamic Progress Arc with 3D shadow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorHex}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          filter="url(#gaugeShadow)"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Value Content with 3D Emboss */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
        <span className="text-[10px] font-bold text-[#7E919F] uppercase tracking-wider font-sans">
          Delay Risk
        </span>
        <span className="text-2xl font-bold tracking-tight text-[#191D23] font-mono my-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {normalizedScore.toFixed(1)}%
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border badge-3d ${badgeBg}`}>
          {level} Risk
        </span>
      </div>
    </div>
  );
}
