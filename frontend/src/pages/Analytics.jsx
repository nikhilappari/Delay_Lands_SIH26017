import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Layers, 
  AlertTriangle, 
  RefreshCw,
  FolderKanban,
  Database,
  MapPin,
  Building2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { getAnalytics, seedDataset } from '../services/api';

export default function Analytics({ setActiveTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDataset(50);
      await fetchAnalyticsData();
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-6 h-6 text-[#57707A] animate-spin" />
        <p className="text-[#57707A] text-xs font-semibold">Aggregating analytical data...</p>
      </div>
    );
  }

  const hasData = analytics && analytics.total_cases > 0;
  const stateData = analytics?.state_distribution || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
            Portfolio & Spatial Delay Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#57707A] mt-0.5">
            Aggregated statistical insights, State delay distributions, and statutory stage bottlenecks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab && setActiveTab('gis-map')}
            className="btn-secondary"
          >
            <MapPin className="w-3.5 h-3.5 text-[#57707A]" />
            <span>Interactive GIS Map</span>
          </button>
          
          <button
            onClick={fetchAnalyticsData}
            className="p-2 rounded-lg bg-white border border-[#C5BAC4] text-[#57707A] hover:text-[#191D23] shadow-xs transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="clean-card p-10 text-center max-w-lg mx-auto space-y-3 border border-[#C5BAC4]/70">
          <BarChart3 className="w-8 h-8 text-[#7E919F] mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-[#191D23]">Insufficient Data for Analytics</h3>
            <p className="text-xs text-[#57707A] mt-1">
              The analytics dashboard requires evaluated cases to compute distributions.
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn-primary"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{seeding ? 'Processing Dataset...' : 'Seed 50 Sample Cases'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <MetricCard
              title="Total Cases"
              value={analytics.total_cases}
              subtitle="Logged predictions"
              icon={FolderKanban}
              color="blue"
            />
            <MetricCard
              title="High Risk Proportion"
              value={`${((analytics.high_risk_cases / analytics.total_cases) * 100).toFixed(1)}%`}
              subtitle={`${analytics.high_risk_cases} flagged`}
              icon={AlertTriangle}
              color="rose"
            />
            <MetricCard
              title="Overall Delay Rate"
              value={`${((analytics.delayed_cases / analytics.total_cases) * 100).toFixed(1)}%`}
              subtitle={`${analytics.delayed_cases} delayed`}
              icon={TrendingUp}
              color="amber"
            />
            <MetricCard
              title="Average Risk"
              value={`${analytics.avg_risk_score}%`}
              subtitle="Confidence baseline"
              icon={BarChart3}
              color="purple"
            />
          </div>

          {/* State-Wise Delay Risk Distribution */}
          {stateData.length > 0 && (
            <div className="clean-card p-5 space-y-3 border border-[#C5BAC4]/70">
              <div className="flex items-center justify-between border-b border-[#C5BAC4]/50 pb-2.5">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#57707A]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
                    State-Wise Delay Risk Distribution (%)
                  </h3>
                </div>
                <span className="text-[11px] text-[#7E919F]">Mean Risk Score</span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DEDCDC" vertical={false} />
                    <XAxis dataKey="state" stroke="#7E919F" fontSize={11} angle={-20} textAnchor="end" interval={0} />
                    <YAxis stroke="#7E919F" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', fontSize: '11px', color: '#191D23' }}
                      formatter={(val, name, item) => [`${val}% Risk (${item.payload.total_cases} cases)`, 'Mean Risk']}
                    />
                    <Bar dataKey="avg_risk" fill="#57707A" radius={[4, 4, 0, 0]} barSize={24}>
                      {stateData.map((entry, index) => (
                        <Cell key={`cell-st-${index}`} fill={entry.avg_risk >= 70 ? '#e11d48' : entry.avg_risk >= 40 ? '#d97706' : '#57707A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart Row 1: Risk & Outcome Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Risk Distribution Donut */}
            <div className="clean-card p-5 border border-[#C5BAC4]/70">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23] mb-0.5">
                Risk Categorization Share
              </h3>
              <p className="text-[11px] text-[#57707A] mb-3">
                Proportion in Low (&lt;30%), Medium (30-70%), and High (&gt;70%) brackets
              </p>

              <div className="h-56">
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
                      paddingAngle={4}
                    >
                      {analytics.risk_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Low Risk' ? '#57707A' : entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', fontSize: '11px', color: '#191D23' }}
                      formatter={(val, name, entry) => [`${val} cases (${entry.payload.percentage}%)`, name]}
                    />
                    <Legend verticalAlign="bottom" height={32} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Outcome Share */}
            <div className="clean-card p-5 border border-[#C5BAC4]/70">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23] mb-0.5">
                Target Outcome Projection
              </h3>
              <p className="text-[11px] text-[#57707A] mb-3">
                Class distribution: Class 1 (Delay Expected) vs Class 0 (On Schedule)
              </p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.outcome_distribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {analytics.outcome_distribution.map((entry, index) => (
                        <Cell key={`cell-outcome-${index}`} fill={entry.name === 'On Schedule (Class 0)' ? '#57707A' : entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', fontSize: '11px', color: '#191D23' }}
                      formatter={(val, name, entry) => [`${val} cases (${entry.payload.percentage}%)`, name]}
                    />
                    <Legend verticalAlign="bottom" height={32} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart Row 2: Stage Bottlenecks and Complexity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Stage-wise Delay Risk */}
            <div className="clean-card p-5 border border-[#C5BAC4]/70">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23] mb-0.5">
                Delay Risk by Land Acquisition Stage
              </h3>
              <p className="text-[11px] text-[#57707A] mb-3">
                Mean risk score (%) across statutory stages
              </p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.stage_risk} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DEDCDC" vertical={false} />
                    <XAxis dataKey="stage" stroke="#7E919F" fontSize={11} tickLine={false} />
                    <YAxis stroke="#7E919F" fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', fontSize: '11px', color: '#191D23' }}
                      formatter={(val) => [`${val}%`, 'Avg Risk']}
                    />
                    <Bar dataKey="avg_risk" fill="#57707A" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Land Record Complexity Impact */}
            <div className="clean-card p-5 border border-[#C5BAC4]/70">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23] mb-0.5">
                Risk by Land Record Complexity
              </h3>
              <p className="text-[11px] text-[#57707A] mb-3">
                Correlation between title deed complexity and delay vulnerability
              </p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.complexity_risk} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DEDCDC" vertical={false} />
                    <XAxis dataKey="complexity" stroke="#7E919F" fontSize={11} tickLine={false} />
                    <YAxis stroke="#7E919F" fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', fontSize: '11px', color: '#191D23' }}
                      formatter={(val) => [`${val}%`, 'Avg Risk']}
                    />
                    <Bar dataKey="avg_risk" fill="#191D23" radius={[4, 4, 0, 0]} barSize={32}>
                      {analytics.complexity_risk.map((entry, index) => (
                        <Cell 
                          key={`cell-comp-${index}`} 
                          fill={entry.complexity === 'High' ? '#e11d48' : entry.complexity === 'Medium' ? '#d97706' : '#57707A'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
