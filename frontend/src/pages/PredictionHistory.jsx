import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw, 
  Eye, 
  ArrowUpDown, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Database,
  PlusCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Scale,
  FileText,
  MapPin,
  ChevronsUpDown,
  ExternalLink
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import PredictionDetailModal from '../components/PredictionDetailModal';
import { getPredictionHistory, deletePrediction, clearAllPredictions, seedDataset } from '../services/api';

export default function PredictionHistory({ setActiveTab }) {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        sort_by: sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (riskFilter !== 'ALL') params.risk_level = riskFilter;
      if (typeFilter !== 'ALL') params.project_type = typeFilter;

      const data = await getPredictionHistory(params);
      const items = data.items || [];
      setHistory(items);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [riskFilter, typeFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const toggleRow = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandedRowIds.size === history.length) {
      setExpandedRowIds(new Set());
    } else {
      setExpandedRowIds(new Set(history.map(item => item.id)));
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this prediction record?')) return;
    try {
      await deletePrediction(id);
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all prediction history?')) return;
    try {
      await clearAllPredictions();
      fetchHistory();
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDataset(50);
      fetchHistory();
    } catch (err) {
      console.error('Failed to seed:', err);
    } finally {
      setSeeding(false);
    }
  };

  const exportCSV = () => {
    if (history.length === 0) return;
    const headers = [
      'Project_ID', 
      'Project_Type', 
      'State',
      'District',
      'Land_Area_Acres', 
      'Owners', 
      'Disputes',
      'Objections',
      'Current_Stage', 
      'Days_in_Stage',
      'Risk_Score', 
      'Risk_Level', 
      'Target_Delayed', 
      'Top_Risk_Factors',
      'Suggested_Actions',
      'Created_At'
    ];
    
    const rows = history.map(item => {
      const factorsStr = (item.risk_factors || [])
        .map(f => `${f.display_name || f.feature} (${f.impact || f.impact_level})`)
        .join('; ');
      
      const actionsStr = (item.recommendations || [])
        .map(a => `[${a.priority || 'ACTION'}] ${a.title || a.action}`)
        .join('; ');

      return [
        `"${item.project_id}"`,
        `"${item.project_type}"`,
        `"${item.state || 'Maharashtra'}"`,
        `"${item.district || 'Pune'}"`,
        item.land_area_acres,
        item.owners,
        item.disputes ?? 0,
        item.objections ?? 0,
        `"${item.current_stage}"`,
        item.days_in_current_stage ?? 0,
        item.risk_score,
        `"${item.risk_level}"`,
        item.target_delayed,
        `"${factorsStr.replace(/"/g, '""')}"`,
        `"${actionsStr.replace(/"/g, '""')}"`,
        `"${item.created_at}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `land_delay_predictions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
            Prediction History & Governance Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-[#57707A] mt-0.5">
            Comprehensive case registry with model-driven risk factors, SHAP attributions, and actionable mitigation plans for every evaluated project.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={toggleExpandAll}
              className="btn-secondary text-xs"
              title="Expand or collapse risk factors for all cases"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#57707A]" />
              <span>{expandedRowIds.size === history.length ? 'Collapse All' : 'Expand All Factors'}</span>
            </button>
          )}

          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#57707A]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn-secondary text-xs"
          >
            <Database className="w-3.5 h-3.5 text-[#57707A]" />
            <span>{seeding ? 'Seeding...' : 'Seed Sample Cases'}</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="clean-card p-3.5 border border-[#C5BAC4]/70 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Project Type, State, or Stage..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs text-[#191D23] placeholder-[#979DAB] focus:outline-none focus:border-[#57707A] transition-all font-medium"
            />
            <Search className="w-3.5 h-3.5 text-[#7E919F] absolute left-2.5 top-2" />
          </form>

          {/* Risk Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:border-[#57707A] transition-all font-medium"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk Only</option>
              <option value="MEDIUM">Medium Risk Only</option>
              <option value="LOW">Low Risk Only</option>
            </select>
          </div>

          {/* Project Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:border-[#57707A] transition-all font-medium"
            >
              <option value="ALL">All Project Types</option>
              <option value="Highway">Highway</option>
              <option value="Railway">Railway</option>
              <option value="Dam">Dam</option>
              <option value="Airport">Airport</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:border-[#57707A] transition-all font-medium"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="risk_desc">Risk: High to Low</option>
              <option value="risk_asc">Risk: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Registry Table */}
      <div className="clean-card overflow-hidden border border-[#C5BAC4]/70 shadow-xs">
        <div className="px-5 py-3 border-b border-[#C5BAC4]/50 bg-white flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#57707A]">
            Evaluated Cases: <span className="text-[#191D23] font-mono font-bold">{total}</span>
          </span>
          <button
            onClick={fetchHistory}
            className="text-xs text-[#57707A] hover:text-[#191D23] flex items-center space-x-1 transition-colors font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Clock className="w-8 h-8 text-[#7E919F] mx-auto" />
            <h4 className="text-sm font-bold text-[#191D23]">No Prediction Records Found</h4>
            <p className="text-xs text-[#57707A] max-w-xs mx-auto">
              Try adjusting your search criteria or create a new case prediction to start recording history.
            </p>
            <button
              onClick={() => setActiveTab('predict')}
              className="btn-primary"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Prediction</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-[#57707A] bg-[#DEDCDC]/40 border-b border-[#C5BAC4]">
                <tr>
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Project ID</th>
                  <th className="py-2.5 px-3">Type & Location</th>
                  <th className="py-2.5 px-3">Land Area</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Key Risk Factors</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5BAC4]/40 text-[#191D23]">
                {history.map((item) => {
                  const isExpanded = expandedRowIds.has(item.id);
                  const factors = item.risk_factors || [];
                  const recommendations = item.recommendations || [];

                  return (
                    <React.Fragment key={item.id}>
                      {/* Main Table Row */}
                      <tr
                        onClick={() => toggleRow(item.id)}
                        className={`hover:bg-[#DEDCDC]/30 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[#FAF8FA]' : ''
                        }`}
                      >
                        {/* Expand / Collapse Toggle Icon */}
                        <td className="py-2.5 px-3 text-center text-[#7E919F]">
                          <button
                            onClick={(e) => toggleRow(item.id, e)}
                            className="p-1 rounded hover:bg-[#DEDCDC] transition-colors cursor-pointer"
                            title={isExpanded ? 'Collapse factors & actions' : 'Expand factors & actions'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#191D23]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#57707A]" />
                            )}
                          </button>
                        </td>

                        {/* Project ID */}
                        <td className="py-2.5 px-3 font-mono font-bold text-[#191D23] whitespace-nowrap">
                          {item.project_id}
                        </td>

                        {/* Type & Location */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#191D23]">{item.project_type}</div>
                          <div className="text-[11px] text-[#7E919F] flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-[#7E919F] shrink-0" />
                            <span>{item.district || 'Pune'}, {item.state || 'Maharashtra'}</span>
                          </div>
                        </td>

                        {/* Land Area & Owners */}
                        <td className="py-2.5 px-3 font-mono text-[#57707A] whitespace-nowrap">
                          <div>{item.land_area_acres} ac</div>
                          <div className="text-[10px] text-[#7E919F]">{item.owners} owners</div>
                        </td>

                        {/* Stage */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#DEDCDC] border border-[#C5BAC4] text-[11px] font-medium text-[#191D23]">
                            {item.current_stage}
                          </span>
                          {item.days_in_current_stage !== undefined && (
                            <div className="text-[10px] text-[#7E919F] mt-0.5 font-mono">
                              {item.days_in_current_stage}d elapsed
                            </div>
                          )}
                        </td>

                        {/* Risk Score */}
                        <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                          <span className={
                            item.risk_score >= 70 ? 'text-rose-600 font-bold' :
                            item.risk_score >= 30 ? 'text-amber-700 font-bold' :
                            'text-[#57707A] font-bold'
                          }>
                            {item.risk_score.toFixed(1)}%
                          </span>
                        </td>

                        {/* Risk Level Badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <RiskBadge level={item.risk_level} size="sm" />
                        </td>

                        {/* Inline Risk Factors Badges */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {factors.slice(0, 2).map((f, fIdx) => (
                              <span
                                key={fIdx}
                                className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${
                                  f.impact_level === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' :
                                  f.impact_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                                }`}
                              >
                                {f.display_name || f.feature}
                              </span>
                            ))}
                            {factors.length > 2 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DEDCDC]/70 text-[#57707A] font-mono">
                                +{factors.length - 2} more
                              </span>
                            )}
                            {factors.length === 0 && (
                              <span className="text-[10px] text-[#7E919F] italic">Standard parameters</span>
                            )}
                          </div>
                        </td>

                        {/* Date Evaluated */}
                        <td className="py-2.5 px-3 text-[11px] text-[#7E919F] whitespace-nowrap">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalItem(item);
                            }}
                            className="p-1 rounded text-[#7E919F] hover:text-[#191D23] transition-colors"
                            title="Open Full Detail Modal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1 rounded text-[#7E919F] hover:text-rose-600 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Sub-Panel for Risk Factors & Suggested Actions */}
                      {isExpanded && (
                        <tr className="bg-[#FAF9FB] border-b border-[#C5BAC4]/60">
                          <td colSpan={10} className="p-4 sm:p-5">
                            <div className="space-y-4 animate-in fade-in duration-200">
                              
                              {/* Quick Milestone Parameter Bar */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] p-2.5 rounded-lg bg-white border border-[#C5BAC4]/70">
                                <div>
                                  <span className="text-[#7E919F] block">Active Disputes:</span>
                                  <strong className={item.disputes > 0 ? 'text-rose-600' : 'text-[#191D23]'}>
                                    {item.disputes ?? 0} disputes
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[#7E919F] block">Filed Objections:</span>
                                  <strong className={item.objections > 0 ? 'text-amber-700' : 'text-[#191D23]'}>
                                    {item.objections ?? 0} objections
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[#7E919F] block">Pending Documents:</span>
                                  <strong className="text-[#191D23]">{item.pending_documents ?? 0} docs</strong>
                                </div>
                                <div>
                                  <span className="text-[#7E919F] block">Pending Approvals:</span>
                                  <strong className="text-[#191D23]">{item.pending_approvals ?? 0} approvals</strong>
                                </div>
                                <div>
                                  <span className="text-[#7E919F] block">Record Complexity:</span>
                                  <strong className="text-[#191D23]">{item.land_record_complexity || 'Medium'}</strong>
                                </div>
                              </div>

                              {/* Two-Column Grid: Risk Factors vs Suggested Actions */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                
                                {/* 1. Risk Factors (Explainability) */}
                                <div className="p-3.5 rounded-xl bg-white border border-[#C5BAC4]/80 space-y-2.5 shadow-2xs">
                                  <div className="flex items-center justify-between border-b border-[#C5BAC4]/40 pb-2">
                                    <div className="flex items-center space-x-1.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-[#57707A]" />
                                      <h4 className="text-xs font-bold text-[#191D23]">
                                        Risk Factors & Drivers ({factors.length})
                                      </h4>
                                    </div>
                                    <span className="text-[10px] text-[#7E919F] font-mono">SHAP Feature Attribution</span>
                                  </div>

                                  {factors.length === 0 ? (
                                    <p className="text-xs text-[#7E919F] italic py-2">
                                      No elevated delay risk factors identified. Case parameters operate within expected baseline milestones.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {factors.map((factor, fIdx) => (
                                        <div 
                                          key={fIdx}
                                          className="p-2.5 rounded-lg bg-[#DEDCDC]/20 border border-[#C5BAC4]/50 space-y-1 text-xs"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-1.5">
                                              <span className="font-semibold text-[#191D23]">
                                                {factor.display_name || factor.feature}
                                              </span>
                                              {factor.value !== undefined && (
                                                <span className="text-[11px] font-mono text-[#7E919F]">
                                                  ({factor.value})
                                                </span>
                                              )}
                                            </div>

                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                              factor.impact_level === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                              factor.impact_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                              'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                                            }`}>
                                              {factor.impact || factor.impact_level}
                                            </span>
                                          </div>

                                          <p className="text-[11.5px] text-[#57707A] leading-relaxed">
                                            {factor.description || `${factor.display_name || factor.feature} contributed to the delay probability score.`}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* 2. Suggested Actions (Mitigation Directives) */}
                                <div className="p-3.5 rounded-xl bg-white border border-[#C5BAC4]/80 space-y-2.5 shadow-2xs">
                                  <div className="flex items-center justify-between border-b border-[#C5BAC4]/40 pb-2">
                                    <div className="flex items-center space-x-1.5">
                                      <Lightbulb className="w-3.5 h-3.5 text-[#57707A]" />
                                      <h4 className="text-xs font-bold text-[#191D23]">
                                        Suggested Mitigation Actions ({recommendations.length})
                                      </h4>
                                    </div>
                                    <span className="text-[10px] text-[#7E919F] font-mono">Administrative Directives</span>
                                  </div>

                                  {recommendations.length === 0 ? (
                                    <p className="text-xs text-[#7E919F] italic py-2">
                                      Standard monitoring directive: maintain statutory acquisition schedule according to RFCTLARR guidelines.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {recommendations.map((action, aIdx) => (
                                        <div 
                                          key={aIdx}
                                          className="p-2.5 rounded-lg bg-[#DEDCDC]/20 border border-[#C5BAC4]/50 space-y-1 text-xs"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-1.5">
                                              <span className={`w-1.5 h-1.5 rounded-full ${
                                                action.priority === 'HIGH' ? 'bg-rose-500' :
                                                action.priority === 'MEDIUM' ? 'bg-amber-500' :
                                                'bg-[#57707A]'
                                              }`} />
                                              <span className="font-semibold text-[#191D23]">
                                                {action.title}
                                              </span>
                                            </div>

                                            <div className="flex items-center space-x-1.5">
                                              {action.category && (
                                                <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-white text-[#57707A] border border-[#C5BAC4]">
                                                  {action.category}
                                                </span>
                                              )}
                                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                                action.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                action.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-[#DEDCDC] text-[#57707A] border-[#C5BAC4]'
                                              }`}>
                                                {action.priority || 'NORMAL'}
                                              </span>
                                            </div>
                                          </div>

                                          <p className="text-[11.5px] text-[#57707A] leading-relaxed">
                                            {action.action}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Footer for this specific project */}
                              <div className="flex items-center justify-between pt-1 border-t border-[#C5BAC4]/40 text-xs">
                                <span className="text-[11px] text-[#7E919F] font-mono">
                                  Coordinates: {item.latitude?.toFixed(4) || '18.5204'}, {item.longitude?.toFixed(4) || '73.8567'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveModalItem(item);
                                  }}
                                  className="text-xs font-semibold text-[#57707A] hover:text-[#191D23] flex items-center space-x-1 cursor-pointer"
                                >
                                  <span>View Executive PDF Briefing Modal</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Modal View */}
      {activeModalItem && (
        <PredictionDetailModal
          prediction={activeModalItem}
          onClose={() => setActiveModalItem(null)}
        />
      )}
    </div>
  );
}
