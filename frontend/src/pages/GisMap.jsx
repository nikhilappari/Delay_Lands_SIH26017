import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Layers, 
  Filter, 
  Download, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getGeoJsonFeatures, seedDataset } from '../services/api';

// Fix for default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Pin Generator
const createRiskIcon = (riskLevel, riskScore) => {
  const color = riskLevel === 'HIGH' ? '#e11d48' : riskLevel === 'MEDIUM' ? '#d97706' : '#57707A';
  const html = `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(25,29,35,0.25); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 10px; font-family: monospace;">
        ${Math.round(riskScore)}
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

export default function GisMap({ onSelectProject, setActiveTab }) {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [seeding, setSeeding] = useState(false);
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await getGeoJsonFeatures();
      setGeoData(res);
    } catch (err) {
      console.error('Failed to load GIS GeoJSON features:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on India
      const map = L.map(mapContainerRef.current, {
        center: [21.7679, 78.8718],
        zoom: 5,
        zoomControl: true,
      });

      // OpenStreetMap Standard Carto Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when Data or Filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !geoData?.features) return;

    markersLayerRef.current.clearLayers();

    const filtered = geoData.features.filter(f => {
      const p = f.properties;
      if (stateFilter !== 'ALL' && p.state !== stateFilter) return false;
      if (riskFilter !== 'ALL' && p.risk_level !== riskFilter) return false;
      if (typeFilter !== 'ALL' && p.project_type !== typeFilter) return false;
      return true;
    });

    const bounds = [];

    filtered.forEach(f => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties;
      bounds.push([lat, lng]);

      const marker = L.marker([lat, lng], {
        icon: createRiskIcon(p.risk_level, p.risk_score)
      });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #C5BAC4; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="font-size: 13px; font-family: monospace; color: #191D23;">${p.project_id}</strong>
            <span style="font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: ${p.risk_level === 'HIGH' ? '#ffe4e6' : p.risk_level === 'MEDIUM' ? '#fef3c7' : '#DEDCDC'}; color: ${p.risk_level === 'HIGH' ? '#be123c' : p.risk_level === 'MEDIUM' ? '#b45309' : '#57707A'}; border: 1px solid #C5BAC4;">
              ${p.risk_level} (${Math.round(p.risk_score)}%)
            </span>
          </div>
          <div style="font-size: 11px; color: #57707A; line-height: 1.4; margin-bottom: 8px;">
            <div><strong>Type:</strong> ${p.project_type}</div>
            <div><strong>Location:</strong> ${p.district}, ${p.state}</div>
            <div><strong>Stage:</strong> ${p.current_stage}</div>
            <div><strong>Area:</strong> ${p.land_area_acres} Acres</div>
            <div><strong>Disputes:</strong> ${p.disputes} active</div>
          </div>
          <button id="btn-${p.id}" style="width: 100%; background: #57707A; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            Open Case Details
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${p.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectProject) onSelectProject(p);
          };
        }
      });

      markersLayerRef.current.addLayer(marker);
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [geoData, stateFilter, riskFilter, typeFilter]);

  const handleExportGeoJson = () => {
    if (!geoData) return;
    const blob = new Blob([JSON.stringify(geoData, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delay_lands_spatial_layer_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const features = geoData?.features || [];
  const states = Array.from(new Set(features.map(f => f.properties.state).filter(Boolean))).sort();
  const highRiskCount = features.filter(f => f.properties.risk_level === 'HIGH').length;
  const medRiskCount = features.filter(f => f.properties.risk_level === 'MEDIUM').length;
  const lowRiskCount = features.filter(f => f.properties.risk_level === 'LOW').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#DEDCDC] text-[#57707A] border border-[#C5BAC4]">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
                GIS Digital Map & Spatial Hotspots
              </h1>
              <p className="text-xs sm:text-sm text-[#57707A]">
                Geospatial delay risk intelligence across Indian States, Districts, and Infrastructure Corridors.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchFeatures}
            className="p-2 rounded-lg bg-white border border-[#C5BAC4] text-[#57707A] hover:text-[#191D23] shadow-xs transition-colors"
            title="Refresh GIS Map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportGeoJson}
            disabled={features.length === 0}
            className="btn-secondary"
          >
            <Download className="w-3.5 h-3.5 text-[#57707A]" />
            <span>Export GeoJSON (QGIS / PM GatiShakti)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="clean-card p-3.5 border border-[#C5BAC4]/70">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#57707A] uppercase tracking-wider mb-1">Indian State Filter</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:border-[#57707A] font-medium"
            >
              <option value="ALL">All States ({states.length})</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#57707A] uppercase tracking-wider mb-1">Delay Risk Tier</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:border-[#57707A] font-medium"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="HIGH">High Risk ({highRiskCount})</option>
              <option value="MEDIUM">Medium Risk ({medRiskCount})</option>
              <option value="LOW">Low Risk ({lowRiskCount})</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#57707A] uppercase tracking-wider mb-1">Infrastructure Sector</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:border-[#57707A] font-medium"
            >
              <option value="ALL">All Project Types</option>
              <option value="Highway">Highway</option>
              <option value="Railway">Railway</option>
              <option value="Dam">Dam</option>
              <option value="Airport">Airport</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#DEDCDC]/40 border border-[#C5BAC4] text-xs">
              <span className="text-[#57707A] font-medium">Mapped Projects:</span>
              <span className="font-mono font-bold text-[#191D23]">{features.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Container & Hotspot Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Map View */}
        <div className="lg:col-span-3 clean-card overflow-hidden flex flex-col border border-[#C5BAC4]/70">
          <div className="px-4 py-2 bg-white border-b border-[#C5BAC4]/50 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-[#57707A] font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>High Risk (&gt;70%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[#57707A] font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Medium Risk (30-70%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[#57707A] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#57707A]" />
                <span>Low Risk (&lt;30%)</span>
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#7E919F]">EPSG:4326 • OpenStreetMap</span>
          </div>

          <div 
            ref={mapContainerRef} 
            className="w-full h-[540px] bg-[#DEDCDC]/20 z-10"
          />
        </div>

        {/* Right Hotspots & Summary Panel */}
        <div className="space-y-4">
          <div className="clean-card p-4 space-y-3 border border-[#C5BAC4]/70">
            <div className="flex items-center space-x-1.5 pb-2 border-b border-[#C5BAC4]/50">
              <AlertTriangle className="w-3.5 h-3.5 text-[#57707A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
                Critical State Hotspots
              </h3>
            </div>

            <div className="space-y-2">
              {states.slice(0, 5).map((st) => {
                const stProjects = features.filter(f => f.properties.state === st);
                const stHigh = stProjects.filter(f => f.properties.risk_level === 'HIGH').length;
                const avgRisk = Math.round(stProjects.reduce((acc, f) => acc + f.properties.risk_score, 0) / (stProjects.length || 1));
                
                return (
                  <div 
                    key={st}
                    onClick={() => setStateFilter(st)}
                    className="p-2.5 rounded-lg bg-[#DEDCDC]/30 hover:bg-[#DEDCDC]/70 border border-[#C5BAC4]/60 cursor-pointer transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#191D23]">{st}</span>
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        avgRisk >= 70 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        avgRisk >= 40 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-[#DEDCDC] text-[#57707A] border border-[#C5BAC4]'
                      }`}>
                        {avgRisk}% avg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#57707A]">
                      <span>{stProjects.length} projects</span>
                      <span className="text-rose-600 font-medium">{stHigh} critical</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="clean-card p-4 space-y-2 border border-[#C5BAC4]/70">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#57707A] mb-2">
              Spatial Actions
            </h4>
            <button
              onClick={() => setActiveTab('predict')}
              className="btn-primary w-full"
            >
              <Sparkles className="w-3 h-3" />
              <span>Map New Project Case</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className="btn-secondary w-full"
            >
              <AlertTriangle className="w-3 h-3 text-[#57707A]" />
              <span>View Escalation Alerts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
