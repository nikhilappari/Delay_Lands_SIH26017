import React from 'react';
import { 
  X, 
  Layers, 
  MapPin, 
  Users, 
  Scale, 
  FileText, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Calendar,
  Sparkles,
  Printer
} from 'lucide-react';
import RiskGauge from './RiskGauge';
import RiskBadge from './RiskBadge';

export default function PredictionDetailModal({ prediction, onClose }) {
  if (!prediction) return null;

  const data = prediction.input_data || prediction;
  const riskFactors = prediction.risk_factors || [];
  const recommendations = prediction.recommendations || [];
  const isDelayed = prediction.target_delayed === 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#191D23]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white border border-[#C5BAC4] rounded-2xl shadow-elevated overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C5BAC4]/50 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#DEDCDC] border border-[#C5BAC4] flex items-center justify-center text-[#191D23]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#191D23] font-mono">
                  {prediction.project_id}
                </h3>
                <RiskBadge level={prediction.risk_level} size="sm" />
                <RiskBadge level={prediction.target_delayed} type="outcome" size="sm" />
              </div>
              <p className="text-[11px] text-[#7E919F]">
                Evaluation Date: {new Date(prediction.created_at || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="btn-secondary text-xs"
              title="Print Executive Briefing"
            >
              <Printer className="w-3.5 h-3.5 text-[#57707A]" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7E919F] hover:text-[#191D23] hover:bg-[#DEDCDC]/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Top Row: Risk Gauge and Outcome Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white rounded-xl p-4 border border-[#C5BAC4]/70 items-center">
            <div className="flex justify-center md:border-r border-[#C5BAC4]/50 md:pr-4">
              <RiskGauge score={prediction.risk_score} level={prediction.risk_level} size={150} strokeWidth={10} />
            </div>

            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#57707A]">
                  Target Outcome
                </span>
                <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded border ${
                  isDelayed 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                }`}>
                  {isDelayed ? 'Delay Expected (Class 1)' : 'On-Schedule (Class 0)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/60">
                  <span className="text-[10px] text-[#7E919F] uppercase font-medium">Project Type</span>
                  <p className="text-xs font-semibold text-[#191D23] mt-0.5">{data.project_type || prediction.project_type}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/60">
                  <span className="text-[10px] text-[#7E919F] uppercase font-medium">Land Area</span>
                  <p className="text-xs font-semibold text-[#191D23] mt-0.5 font-mono">{data.land_area_acres || prediction.land_area_acres} Acres</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/60">
                  <span className="text-[10px] text-[#7E919F] uppercase font-medium">Current Stage</span>
                  <p className="text-xs font-semibold text-[#191D23] mt-0.5">{data.current_stage || prediction.current_stage}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Parameters Matrix */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#57707A] mb-2.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-[#57707A]" />
              <span>Full Case Parameters</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Landowners', val: data.owners, icon: Users },
                { label: 'Active Disputes', val: data.disputes, icon: Scale, highlight: data.disputes > 0 },
                { label: 'Objections Filed', val: data.objections, icon: AlertTriangle, highlight: data.objections > 0 },
                { label: 'Pending Docs', val: data.pending_documents, icon: FileText, highlight: data.pending_documents > 0 },
                { label: 'Pending Approvals', val: data.pending_approvals, icon: CheckCircle2, highlight: data.pending_approvals > 0 },
                { label: 'Compensation Pending', val: data.compensation_pending, icon: DollarSign, highlight: data.compensation_pending > 5 },
                { label: 'Days in Stage', val: `${data.days_in_current_stage || 0} days`, icon: Clock, highlight: data.days_in_current_stage > 30 },
                { label: 'Total Days', val: `${data.total_days || 0} days`, icon: Calendar },
                { label: 'Prior Delays', val: data.previous_delays, icon: AlertTriangle, highlight: data.previous_delays > 0 },
                { label: 'Record Complexity', val: data.land_record_complexity, icon: Layers },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-lg border transition-colors ${
                      item.highlight 
                        ? 'bg-rose-50/50 border-rose-200 text-rose-800' 
                        : 'bg-[#FAF8FA] border-[#C5BAC4]/60 text-[#191D23]'
                    }`}
                  >
                    <div className="flex items-center space-x-1 text-[#57707A] mb-0.5">
                      <Icon className="w-3 h-3" />
                      <span className="text-[11px] font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#191D23] font-mono">
                      {item.val !== undefined ? String(item.val) : 'N/A'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Factors Breakdown */}
          {riskFactors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#57707A] mb-2.5 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#57707A]" />
                <span>Primary Risk Drivers (Explainability)</span>
              </h4>
              <div className="space-y-2">
                {riskFactors.slice(0, 5).map((factor, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/60 text-xs"
                  >
                    <div className="space-y-0.5 max-w-lg">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-[#191D23]">
                          {factor.display_name}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                          factor.impact_level === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          factor.impact_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                        }`}>
                          {factor.impact}
                        </span>
                      </div>
                      <p className="text-[#57707A] text-[11px]">{factor.description}</p>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-semibold ${
                        factor.direction === 'INCREASES_RISK' ? 'text-rose-600' : 'text-[#57707A]'
                      }`}>
                        {factor.direction === 'INCREASES_RISK' ? '+' : '-'}{Math.abs(factor.score)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions Checklist */}
          {recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#57707A] mb-2.5 flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#57707A]" />
                <span>Suggested Actions & Mitigation</span>
              </h4>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-[#FAF8FA] border border-[#C5BAC4]/60 flex items-start space-x-2.5 text-xs"
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 border ${
                      rec.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      rec.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                    }`}>
                      {rec.priority}
                    </span>
                    <div>
                      <h5 className="font-semibold text-[#191D23]">{rec.title}</h5>
                      <p className="text-[#57707A] mt-0.5 leading-relaxed text-[11px]">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#C5BAC4]/50 bg-white">
          <button
            onClick={onClose}
            className="btn-dark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
