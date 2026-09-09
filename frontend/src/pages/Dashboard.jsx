import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  PlusCircle, 
  Layers, 
  Database,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  MapPin,
  Bell
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

import MetricCard from '../components/MetricCard';
import RiskBadge from '../components/RiskBadge';
import PredictionDetailModal from '../components/PredictionDetailModal';
import { getAnalytics, getPredictionHistory, seedDataset } from '../services/api';

export default function Dashboard({ setActiveTab, setSelectedPrediction }) {
  const [analytics, setAnalytics] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsData, historyData] = await Promise.all([
        getAnalytics(),
        getPredictionHistory({ limit: 6, sort_by: 'date_desc' })
      ]);
      setAnalytics(analyticsData);
      setRecentCases(historyData.items || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDataset(50);
      await fetchData();
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-6 h-6 text-[#7E919F] animate-spin" />
        <p className="text-[#57707A] text-xs font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const hasData = analytics && analytics.total_cases > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
              Land Acquisition Delay Intelligence
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white text-[#57707A] font-mono font-medium border border-[#C5BAC4] shadow-xs">
              RF Classifier v1.0
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#57707A] mt-1 font-normal">
            Predictive surveillance for statutory timeline risks, stage cycle bottlenecks, and mitigation workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('gis-map')}
            className="btn-secondary"
          >
            <MapPin className="w-3.5 h-3.5 text-[#57707A]" />
            <span>GIS Map</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className="btn-secondary"
          >
            <Bell className="w-3.5 h-3.5 text-[#57707A]" />
            <span>Alerts Hub</span>
          </button>

          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 rounded-lg bg-white border border-[#C5BAC4] text-[#57707A] hover:text-[#191D23] hover:border-[#7E919F] shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTab('predict')}
            className="btn-primary"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Prediction</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {hasData ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <MetricCard
            title="Total Cases"
            value={analytics.total_cases}
            subtitle="Analyzed records"
            icon={FolderKanban}
            color="blue"
          />
          <MetricCard
            title="High Risk"
            value={analytics.high_risk_cases}
            subtitle={`${((analytics.high_risk_cases / analytics.total_cases) * 100).toFixed(0)}% of total`}
            icon={AlertOctagon}
            color="rose"
            badgeText="Action Req."
            badgeType="danger"
          />
          <MetricCard
            title="Medium Risk"
            value={analytics.medium_risk_cases}
            subtitle={`${((analytics.medium_risk_cases / analytics.total_cases) * 100).toFixed(0)}% of total`}
            icon={AlertTriangle}
            color="amber"
          />
          <MetricCard
            title="Low Risk"
            value={analytics.low_risk_cases}
            subtitle={`${((analytics.low_risk_cases / analytics.total_cases) * 100).toFixed(0)}% of total`}
            icon={CheckCircle2}
            color="emerald"
          />
          <MetricCard
            title="Delayed"
            value={analytics.delayed_cases}
            subtitle={`${analytics.non_delayed_cases} on-schedule`}
            icon={Clock}
            color="purple"
          />
          <MetricCard
            title="Avg Risk"
            value={`${analytics.avg_risk_score}%`}
            subtitle="Mean delay prob"
            icon={TrendingUp}
            color="blue"
          />
        </div>
      ) : null}

      {/* Charts Section */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Risk Level Distribution */}
          <div className="clean-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-semibold text-[#191D23] uppercase tracking-wider">
                    Risk Categorization
                  </h3>
                  <p className="text-[11px] text-[#57707A]">Cases by delay probability bracket</p>
                </div>
                <span className="text-[11px] font-mono text-[#57707A] bg-[#DEDCDC]/50 px-2 py-0.5 rounded">
                  {analytics.total_cases} Cases
                </span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.risk_distribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {analytics.risk_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', boxShadow: '0 2px 4px rgba(25,29,35,0.06)', fontSize: '11px' }}
                      itemStyle={{ color: '#191D23', fontWeight: '500' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={32}
                      formatter={(val, entry) => <span className="text-[11px] text-[#57707A]">{val} ({entry.payload.count})</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#DEDCDC] text-center text-xs">
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-rose-600 font-semibold block">{analytics.high_risk_cases}</span>
                <span className="text-[#7E919F] text-[10px] uppercase font-medium">High</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-amber-700 font-semibold block">{analytics.medium_risk_cases}</span>
                <span className="text-[#7E919F] text-[10px] uppercase font-medium">Medium</span>
              </div>
              <div className="p-2 rounded-lg bg-[#DEDCDC]/40 border border-[#C5BAC4]/60">
                <span className="text-[#57707A] font-semibold block">{analytics.low_risk_cases}</span>
                <span className="text-[#7E919F] text-[10px] uppercase font-medium">Low</span>
              </div>
            </div>
          </div>

          {/* Project Type Risk Profile */}
          <div className="clean-card p-5 flex flex-col justify-between lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold text-[#191D23] uppercase tracking-wider">
                  Risk by Project Type
                </h3>
                <p className="text-[11px] text-[#57707A]">Average risk score (%) across infrastructure sectors</p>
              </div>
              <button 
                onClick={() => setActiveTab('analytics')}
                className="text-xs text-[#57707A] hover:text-[#191D23] flex items-center space-x-1 font-medium"
              >
                <span>Full Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.project_type_risk} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DEDCDC" vertical={false} />
                  <XAxis dataKey="project_type" stroke="#7E919F" fontSize={11} tickLine={false} />
                  <YAxis stroke="#7E919F" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', boxShadow: '0 2px 4px rgba(25,29,35,0.06)', fontSize: '11px' }}
                    itemStyle={{ color: '#191D23', fontWeight: '500' }}
                    formatter={(val) => [`${val}%`, 'Avg Risk']}
                  />
                  <Bar dataKey="avg_risk" radius={[4, 4, 0, 0]} barSize={32}>
                    {analytics.project_type_risk.map((entry, index) => (
                      <Cell 
                        key={`cell-pt-${index}`} 
                        fill={entry.avg_risk >= 70 ? '#e11d48' : entry.avg_risk >= 30 ? '#d97706' : '#57707A'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#57707A] pt-2.5 border-t border-[#DEDCDC] font-medium">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#57707A]"></span>
                <span>Low Risk (&lt;30%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Medium (30-70%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>High (&gt;70%)</span>
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Empty State when no cases recorded yet */}
      {!hasData && (
        <div className="clean-card p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#DEDCDC]/50 text-[#57707A] flex items-center justify-center mx-auto border border-[#C5BAC4]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#191D23]">No Case Predictions Recorded</h3>
            <p className="text-xs text-[#57707A] mt-1 max-w-sm mx-auto">
              Submit your first land acquisition case or seed historical cases from the training dataset to inspect analytics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => setActiveTab('predict')}
              className="btn-primary"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Prediction</span>
            </button>

            <button
              onClick={handleSeed}
              disabled={seeding}
              className="btn-secondary"
            >
              <Database className="w-3.5 h-3.5 text-[#57707A]" />
              <span>{seeding ? 'Processing Dataset...' : 'Seed 50 Sample Cases'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Predictions Stream */}
      {recentCases.length > 0 && (
        <div className="clean-card p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#191D23]">Recent Case Predictions</h3>
              <p className="text-[11px] text-[#57707A]">Latest evaluations processed through the Random Forest model</p>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-medium text-[#57707A] hover:text-[#191D23] flex items-center space-x-1"
            >
              <span>View All ({analytics?.total_cases || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-[#C5BAC4]/70 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-medium text-[#57707A] bg-[#DEDCDC]/40 border-b border-[#C5BAC4]/70">
                <tr>
                  <th className="py-2.5 px-3.5">Project ID</th>
                  <th className="py-2.5 px-3.5">Type</th>
                  <th className="py-2.5 px-3.5">Land Area</th>
                  <th className="py-2.5 px-3.5">Stage</th>
                  <th className="py-2.5 px-3.5">Risk Score</th>
                  <th className="py-2.5 px-3.5">Risk Level</th>
                  <th className="py-2.5 px-3.5">Outcome</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCDC]/60 text-[#191D23]">
                {recentCases.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => setActiveModalItem(item)}
                    className="hover:bg-[#DEDCDC]/30 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3.5 font-mono font-medium text-[#191D23]">
                      {item.project_id}
                    </td>
                    <td className="py-2.5 px-3.5 font-normal text-[#57707A]">
                      {item.project_type}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[#57707A]">
                      {item.land_area_acres} ac
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#DEDCDC]/50 text-[11px] font-normal text-[#191D23] border border-[#C5BAC4]/60">
                        {item.current_stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold">
                      <span className={
                        item.risk_score >= 70 ? 'text-rose-600' :
                        item.risk_score >= 30 ? 'text-amber-700' :
                        'text-[#57707A]'
                      }>
                        {item.risk_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <RiskBadge level={item.risk_level} size="sm" />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <RiskBadge level={item.target_delayed} type="outcome" size="sm" />
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <span className="text-[#57707A] font-medium hover:text-[#191D23]">
                        Details →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {activeModalItem && (
        <PredictionDetailModal
          prediction={activeModalItem}
          onClose={() => setActiveModalItem(null)}
        />
      )}
    </div>
  );
}
