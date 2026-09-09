import React from 'react';
import { 
  PlusCircle, 
  History, 
  Printer, 
  ArrowLeft, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  FileSpreadsheet 
} from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import RiskBadge from '../components/RiskBadge';

export default function PredictionResult({ result, onReset, onViewHistory }) {
  if (!result) return null;

  const data = result.input_data || {};
  const riskFactors = result.risk_factors || [];
  const recommendations = result.recommendations || [];
  const isDelayed = result.target_delayed === 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[#57707A] hover:text-[#191D23] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Evaluation</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="btn-secondary"
          >
            <Printer className="w-3.5 h-3.5 text-[#57707A]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={onViewHistory}
            className="btn-secondary"
          >
            <History className="w-3.5 h-3.5 text-[#57707A]" />
            <span>Audit History</span>
          </button>
        </div>
      </div>

      {/* PRIMARY ASSESSMENT BANNER */}
      <div className="clean-card p-6 sm:p-7 relative overflow-hidden bg-white shadow-sm border border-[#C5BAC4]/80">
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-10">
          {/* Circular Risk Score Gauge (Dedicated Spacious Pod) */}
          <div className="shrink-0 flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-gradient-to-b from-[#FAF9FA] to-[#EDE9EB]/60 border border-[#C5BAC4]/70 shadow-2xs md:min-w-[220px]">
            <RiskGauge 
              score={result.risk_score} 
              level={result.risk_level} 
              size={180} 
              strokeWidth={11}
            />
          </div>

          {/* Outcome Details */}
          <div className="space-y-3.5 flex-1 min-w-0 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#DEDCDC]/60 text-[#191D23] border border-[#C5BAC4] shadow-2xs">
                CASE ID: {result.project_id}
              </span>
              <RiskBadge level={result.risk_level} />
              <RiskBadge level={result.target_delayed} type="outcome" />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7E919F] font-sans">
                Predicted Timeline Status
              </p>
              <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mt-0.5 font-sans ${
                isDelayed ? 'text-rose-600' : 'text-[#57707A]'
              }`}>
                {isDelayed ? 'Potential Delay Detected' : 'On-Schedule Progression'}
              </h2>
              <p className="text-xs sm:text-sm text-[#57707A] mt-1 leading-relaxed font-normal font-sans">
                {isDelayed
                  ? <>The model evaluated this case with an estimated <span className="font-mono font-bold text-[#191D23]">{result.risk_score}%</span> probability of timeline delay. Proactive mitigation is recommended on key process drivers.</>
                  : <>The model evaluated this case with low delay probability (<span className="font-mono font-bold text-[#191D23]">{result.risk_score}%</span>). Standard workflow monitoring should be maintained.</>}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-left">
              <div className="p-2.5 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/70 shadow-2xs">
                <span className="text-[10px] text-[#7E919F] uppercase font-bold font-sans">Project Type</span>
                <p className="text-xs font-bold text-[#191D23] mt-0.5">{data.Project_Type || data.project_type}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/70 shadow-2xs">
                <span className="text-[10px] text-[#7E919F] uppercase font-bold font-sans">Land Area</span>
                <p className="text-xs font-bold text-[#191D23] mt-0.5 font-mono">{data.Land_Area_Acres || data.land_area_acres} Acres</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/70 shadow-2xs">
                <span className="text-[10px] text-[#7E919F] uppercase font-bold font-sans">Current Stage</span>
                <p className="text-xs font-bold text-[#191D23] mt-0.5">{data.Current_Stage || data.current_stage}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/70 shadow-2xs">
                <span className="text-[10px] text-[#7E919F] uppercase font-bold font-sans">Days in Stage</span>
                <p className="text-xs font-bold text-[#191D23] mt-0.5 font-mono">{data.Days_in_Current_Stage || data.days_in_current_stage} Days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN SECTION: RISK FACTORS & SUGGESTED ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* RISK FACTORS (EXPLAINABILITY) */}
        <div className="clean-card p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#DEDCDC] pb-2.5">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#57707A]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#191D23]">
                Risk Factors (Explainability)
              </h3>
            </div>
            <span className="text-[11px] text-[#7E919F] font-medium">Feature Attribution</span>
          </div>

          <p className="text-xs text-[#57707A]">
            Model-driven feature attribution indicating the primary parameters influencing delay probability:
          </p>

          <div className="space-y-2.5 pt-1">
            {riskFactors.slice(0, 5).map((factor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#DEDCDC]/20 border border-[#C5BAC4]/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-[#191D23]">
                      {factor.display_name}
                    </span>
                    <span className="text-[11px] font-mono text-[#7E919F]">
                      ({factor.value})
                    </span>
                  </div>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                    factor.impact_level === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    factor.impact_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                  }`}>
                    {factor.impact}
                  </span>
                </div>

                <p className="text-xs text-[#57707A]">
                  {factor.description}
                </p>

                {/* Progress Contribution Bar */}
                <div className="w-full h-1 rounded-full bg-[#DEDCDC] overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full ${
                      factor.direction === 'INCREASES_RISK' ? 'bg-rose-500' : 'bg-[#57707A]'
                    }`}
                    style={{ width: `${Math.min(Math.max(Math.abs(factor.score) * 4, 15), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUGGESTED ACTIONS & RECOMMENDATIONS */}
        <div className="clean-card p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#DEDCDC] pb-2.5">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-[#57707A]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#191D23]">
                Suggested Actions (Mitigation)
              </h3>
            </div>
            <span className="text-[11px] text-[#7E919F] font-medium">Recommended Action Plan</span>
          </div>

          <p className="text-xs text-[#57707A]">
            Rule-informed operational interventions generated from dominant risk parameters:
          </p>

          <div className="space-y-2.5 pt-1">
            {recommendations.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#DEDCDC]/20 border border-[#C5BAC4]/60 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      action.priority === 'HIGH' ? 'bg-rose-500' :
                      action.priority === 'MEDIUM' ? 'bg-amber-500' :
                      'bg-[#57707A]'
                    }`} />
                    <h4 className="text-xs font-semibold text-[#191D23]">
                      {action.title}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-white text-[#57707A] border border-[#C5BAC4]">
                      {action.category}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                      action.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      action.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                    }`}>
                      {action.priority}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#57707A] leading-relaxed">
                  {action.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#C5BAC4] no-print">
        <button
          onClick={onReset}
          className="btn-primary"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Evaluate Another Case</span>
        </button>

        <button
          onClick={onViewHistory}
          className="btn-secondary"
        >
          <History className="w-3.5 h-3.5 text-[#57707A]" />
          <span>Open Prediction History</span>
        </button>
      </div>
    </div>
  );
}
