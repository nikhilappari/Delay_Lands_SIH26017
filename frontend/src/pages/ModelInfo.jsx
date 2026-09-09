import React, { useState, useEffect } from 'react';
import { 
  Info, 
  Cpu, 
  CheckCircle2, 
  TrendingUp, 
  Settings, 
  Sliders, 
  Layers, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Clock,
  Database,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { getModelInfo, updateThresholds, retrainModel, getRetrainingHistory } from '../services/api';

export default function ModelInfo() {
  const [modelInfo, setModelInfo] = useState(null);
  const [retrainHistory, setRetrainHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowMax, setLowMax] = useState(30);
  const [medMax, setMedMax] = useState(70);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [thresholdMsg, setThresholdMsg] = useState(null);
  
  // Retraining state
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  const fetchInfo = async () => {
    try {
      setLoading(true);
      const [infoData, histData] = await Promise.all([
        getModelInfo(),
        getRetrainingHistory().catch(() => [])
      ]);
      setModelInfo(infoData);
      setRetrainHistory(histData || []);
      if (infoData.thresholds) {
        setLowMax(infoData.thresholds.low_max || 30);
        setMedMax(infoData.thresholds.medium_max || 70);
      }
    } catch (err) {
      console.error('Failed to load model info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setRetrainResult(null);
      const res = await retrainModel();
      setRetrainResult(res);
      await fetchInfo();
    } catch (err) {
      console.error('Retraining failed:', err);
      setRetrainResult({ error: err.response?.data?.detail || 'Retraining failed. Please try again.' });
    } finally {
      setRetraining(false);
    }
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    setThresholdMsg(null);
    if (parseFloat(lowMax) >= parseFloat(medMax)) {
      setThresholdMsg({ type: 'error', text: 'Low Risk Upper Bound must be strictly less than Medium Risk Upper Bound.' });
      return;
    }
    try {
      setSavingThresholds(true);
      await updateThresholds({
        low_max: parseFloat(lowMax),
        medium_max: parseFloat(medMax)
      });
      setThresholdMsg({ type: 'success', text: 'Risk thresholds updated successfully.' });
      setTimeout(() => setThresholdMsg(null), 4000);
    } catch (err) {
      setThresholdMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update thresholds.' });
    } finally {
      setSavingThresholds(false);
    }
  };

  if (loading && !modelInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-6 h-6 text-[#57707A] animate-spin" />
        <p className="text-[#57707A] text-xs font-semibold">Fetching model telemetry...</p>
      </div>
    );
  }

  const cm = modelInfo?.confusion_matrix || [[0, 0], [0, 0]];
  const featureImportances = modelInfo?.feature_importance?.slice(0, 10) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
            Model Governance & Continuous Learning
          </h1>
          <p className="text-xs sm:text-sm text-[#57707A] mt-0.5">
            Random Forest specifications, online retraining pipeline, feature importance, and threshold calibration.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-md bg-[#DEDCDC] text-[#57707A] border border-[#C5BAC4] text-xs font-mono font-bold">
            Active: {retrainHistory[0]?.version || 'v1.0'}
          </span>
        </div>
      </div>

      {/* CONTINUOUS MODEL LEARNING BANNER */}
      <div className="clean-card p-5 space-y-3.5 border border-[#C5BAC4]/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#57707A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
                Continuous Online Model Retraining
              </h3>
            </div>
            <p className="text-xs text-[#57707A] leading-relaxed">
              As ongoing and completed land acquisition projects are evaluated and resolved, the system dynamically incorporates newly validated records into the training corpus to improve prediction accuracy.
            </p>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="btn-primary"
          >
            <Zap className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Retraining Pipeline...' : 'Trigger Online Retraining'}</span>
          </button>
        </div>

        {retrainResult && (
          <div className="p-3.5 rounded-lg bg-[#DEDCDC]/40 border border-[#C5BAC4] text-xs space-y-2 animate-in fade-in">
            {retrainResult.error ? (
              <p className="text-rose-600 font-semibold">{retrainResult.error}</p>
            ) : (
              <div>
                <div className="flex items-center justify-between font-semibold text-[#191D23] border-b border-[#C5BAC4]/60 pb-2 mb-2">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#57707A]" />
                    <span>{retrainResult.message}</span>
                  </span>
                  <span className="font-mono bg-white text-[#191D23] px-2 py-0.5 rounded border border-[#C5BAC4]">
                    Deployed as {retrainResult.version} ({retrainResult.training_time_seconds}s)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
                  <div className="p-2 bg-white rounded-lg border border-[#C5BAC4]/50">
                    <span className="text-[10px] text-[#7E919F] uppercase font-semibold">Previous Acc</span>
                    <p className="text-xs font-bold text-[#57707A]">{retrainResult.metrics.before.accuracy}%</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#C5BAC4]/50">
                    <span className="text-[10px] text-[#7E919F] uppercase font-semibold">New Acc</span>
                    <p className="text-xs font-bold text-[#191D23]">{retrainResult.metrics.after.accuracy}%</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#C5BAC4]/50">
                    <span className="text-[10px] text-[#7E919F] uppercase font-semibold">New F1 Score</span>
                    <p className="text-xs font-bold text-[#191D23]">{retrainResult.metrics.after.f1_score}%</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#C5BAC4]/50">
                    <span className="text-[10px] text-[#7E919F] uppercase font-semibold">Corpus Size</span>
                    <p className="text-xs font-bold text-[#191D23]">{retrainResult.metrics.total_records} cases</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid: Architecture & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Architecture Spec */}
        <div className="clean-card p-5 space-y-3.5 border border-[#C5BAC4]/70">
          <div className="flex items-center space-x-2 border-b border-[#C5BAC4]/50 pb-2.5">
            <Cpu className="w-4 h-4 text-[#57707A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
              Model Architecture Specifications
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-[#57707A]">
            <div className="flex justify-between py-1 border-b border-[#C5BAC4]/40">
              <span className="text-[#57707A]">Algorithm</span>
              <span className="font-mono font-bold text-[#191D23]">{modelInfo?.algorithm || 'RandomForestClassifier'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#C5BAC4]/40">
              <span className="text-[#57707A]">Estimators (Trees)</span>
              <span className="font-mono font-bold text-[#191D23]">{modelInfo?.n_estimators || 120}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#C5BAC4]/40">
              <span className="text-[#57707A]">Class Weighting</span>
              <span className="font-mono font-bold text-[#191D23]">{modelInfo?.class_weight || 'balanced'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#C5BAC4]/40">
              <span className="text-[#57707A]">Feature Preprocessing</span>
              <span className="font-mono font-bold text-[#191D23]">ColumnTransformer + OneHot</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#C5BAC4]/40">
              <span className="text-[#57707A]">Training Split</span>
              <span className="font-mono font-bold text-[#191D23]">{modelInfo?.train_samples || 40} cases (80%)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#57707A]">Test Split (Stratified)</span>
              <span className="font-mono font-bold text-[#191D23]">{modelInfo?.test_samples || 10} cases (20%)</span>
            </div>
          </div>
        </div>

        {/* Validation Performance Metrics */}
        <div className="clean-card p-5 space-y-3.5 border border-[#C5BAC4]/70">
          <div className="flex items-center space-x-2 border-b border-[#C5BAC4]/50 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-[#57707A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
              Validation Performance Metrics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
              <span className="text-[10px] uppercase font-semibold text-[#57707A]">Test Accuracy</span>
              <p className="text-xl font-bold font-mono text-[#191D23] mt-0.5">
                {modelInfo?.accuracy}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
              <span className="text-[10px] uppercase font-semibold text-[#57707A]">Precision</span>
              <p className="text-xl font-bold font-mono text-[#191D23] mt-0.5">
                {modelInfo?.precision}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
              <span className="text-[10px] uppercase font-semibold text-[#57707A]">Recall</span>
              <p className="text-xl font-bold font-mono text-[#191D23] mt-0.5">
                {modelInfo?.recall}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
              <span className="text-[10px] uppercase font-semibold text-[#57707A]">F1-Score</span>
              <p className="text-xl font-bold font-mono text-[#191D23] mt-0.5">
                {modelInfo?.f1_score}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Global Feature Importance Chart */}
        <div className="lg:col-span-2 clean-card p-5 space-y-3.5 border border-[#C5BAC4]/70">
          <div className="flex items-center justify-between border-b border-[#C5BAC4]/50 pb-2.5">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#57707A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
                Global Feature Importance (%)
              </h3>
            </div>
            <span className="text-[11px] text-[#7E919F]">Gini Impurity Reduction</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportances}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DEDCDC" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#7E919F', fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fill: '#57707A', fontSize: 11 }} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#C5BAC4', borderRadius: '8px', fontSize: '11px', color: '#191D23' }}
                  formatter={(value) => [`${value}%`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#57707A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix & Threshold Settings */}
        <div className="clean-card p-5 space-y-5 border border-[#C5BAC4]/70">
          {/* Confusion Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23] mb-2.5">
              Confusion Matrix (Test Split)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
                <span className="text-[10px] text-[#7E919F] block uppercase font-semibold">True Neg (0)</span>
                <span className="text-base font-bold font-mono text-[#191D23]">{cm[0]?.[0] || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
                <span className="text-[10px] text-[#7E919F] block uppercase font-semibold">False Pos (1)</span>
                <span className="text-base font-bold font-mono text-rose-600">{cm[0]?.[1] || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
                <span className="text-[10px] text-[#7E919F] block uppercase font-semibold">False Neg (0)</span>
                <span className="text-base font-bold font-mono text-rose-600">{cm[1]?.[0] || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#DEDCDC]/30 border border-[#C5BAC4]/60">
                <span className="text-[10px] text-[#7E919F] block uppercase font-semibold">True Pos (1)</span>
                <span className="text-base font-bold font-mono text-[#191D23]">{cm[1]?.[1] || 0}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Risk Threshold Calibration */}
          <div className="border-t border-[#C5BAC4]/50 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23] mb-1 flex items-center space-x-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#57707A]" />
              <span>Calibrate Risk Cutoffs</span>
            </h3>
            <p className="text-[11px] text-[#57707A] mb-3">
              Modify thresholds for Low, Medium, and High classification
            </p>

            <form onSubmit={handleSaveThresholds} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#57707A] mb-1">
                  Low Risk Max: 0% to {lowMax}%
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="1"
                  value={lowMax}
                  onChange={(e) => setLowMax(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-[#191D23] text-xs font-mono font-medium focus:outline-none focus:border-[#57707A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#57707A] mb-1">
                  Medium Risk Max: {lowMax}% to {medMax}%
                </label>
                <input
                  type="number"
                  min="30"
                  max="90"
                  step="1"
                  value={medMax}
                  onChange={(e) => setMedMax(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-[#191D23] text-xs font-mono font-medium focus:outline-none focus:border-[#57707A]"
                />
              </div>

              {thresholdMsg && (
                <div className={`p-2 rounded text-xs ${
                  thresholdMsg.type === 'success' ? 'bg-[#DEDCDC] text-[#57707A] border border-[#C5BAC4]' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {thresholdMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={savingThresholds}
                className="btn-primary w-full"
              >
                {savingThresholds ? 'Updating...' : 'Save Cutoffs'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
