import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Database, 
  Download, 
  CheckCircle2, 
  RefreshCw, 
  Code2, 
  ExternalLink, 
  FileJson, 
  Cpu, 
  Globe2, 
  ShieldCheck, 
  Terminal,
  Zap,
  Search,
  Mail,
  Send,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Copy,
  Check,
  Share2,
  MapPin,
  FileSpreadsheet,
  BadgeAlert,
  Server
} from 'lucide-react';
import { 
  syncPmGatiShakti, 
  checkBhoomiStatus, 
  getGeoJsonFeatures, 
  sendGovernmentEmail,
  sendGovernmentSms,
  getPredictionHistory
} from '../services/api';

export default function Integrations() {
  // Available Projects for Autocomplete / Quick Selection
  const [availableProjects, setAvailableProjects] = useState([]);
  
  // PM GatiShakti State
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);

  // Bhoomi Land Registry State
  const [bhoomiProjectId, setBhoomiProjectId] = useState('P1001');
  const [bhoomiResult, setBhoomiResult] = useState(null);
  const [checkingBhoomi, setCheckingBhoomi] = useState(false);
  const [copiedBhoomi, setCopiedBhoomi] = useState(false);

  // Dispatch Channel Mode: 'EMAIL' | 'SMS'
  const [dispatchMode, setDispatchMode] = useState('EMAIL');

  // Government Official Email Dispatch State
  const [emailForm, setEmailForm] = useState({
    recipient_role: 'District Collector',
    recipient_email: 'collector.pune@nic.in',
    project_id: 'P1001',
    escalation_level: 'CRITICAL_DELAY',
    subject: '[URGENT - Land Acquisition Escalation] Delay Risk Notice: P1001',
    custom_message: 'Immediate administrative review requested for pending statutory approvals and land mutation under Section 19 of the RFCTLARR Act 2013.',
    include_pdf_summary: true,
    include_gis_coordinates: true
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [emailError, setEmailError] = useState(null);

  // Government Official SMS Dispatch State
  const [smsForm, setSmsForm] = useState({
    recipient_role: 'District Collector',
    recipient_phone: '+91 98220 12345',
    project_id: 'P1001',
    escalation_level: 'CRITICAL_DELAY',
    custom_message: 'URGENT: Land acquisition delay escalation for Project P1001. Section 19 statutory deadline breach imminent. Immediate action required.'
  });
  const [sendingSms, setSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState(null);
  const [smsError, setSmsError] = useState(null);

  // Clipboard & UI Helpers
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(null);

  // Default Stakeholder Contacts
  const roleContacts = {
    'District Collector': { email: 'collector.pune@nic.in', phone: '+91 98220 12345' },
    'State Land Authority (SLAO)': { email: 'slao.maharashtra@gov.in', phone: '+91 94220 67890' },
    'NHAI Project Director': { email: 'pd.nhai.corridor@nhai.org', phone: '+91 98111 23456' },
    'Railways Land Officer': { email: 'land.officer@dfccil.gov.in', phone: '+91 99580 98765' },
    'Ministry of Road Transport (MoRTH)': { email: 'jointsecretary.infra@nic.in', phone: '+91 98681 45678' },
    'Chief Secretary / Cabinet Secretariat': { email: 'chiefsecy.infra@nic.in', phone: '+91 98710 11223' },
    'Custom Stakeholder': { email: '', phone: '' }
  };

  // Fetch real projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getPredictionHistory({ limit: 50 });
        if (data && data.items && data.items.length > 0) {
          const ids = data.items.map(p => p.project_id).filter(Boolean);
          const uniqueIds = Array.from(new Set(ids));
          setAvailableProjects(uniqueIds);
          if (uniqueIds.length > 0) {
            setBhoomiProjectId(uniqueIds[0]);
            setEmailForm(prev => ({
              ...prev,
              project_id: uniqueIds[0],
              subject: `[URGENT - ${prev.recipient_role}] Delay Risk Notice: ${uniqueIds[0]}`
            }));
            setSmsForm(prev => ({
              ...prev,
              project_id: uniqueIds[0],
              custom_message: `URGENT: Land acquisition delay escalation for Project ${uniqueIds[0]}. Section 19 statutory deadline breach imminent.`
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch project list for dropdowns:', err);
      }
    };
    fetchProjects();
  }, []);

  const handleRoleChange = (role) => {
    const defaultContact = roleContacts[role] || { email: '', phone: '' };
    setEmailForm(prev => ({
      ...prev,
      recipient_role: role,
      recipient_email: defaultContact.email || prev.recipient_email,
      subject: `[URGENT - ${role}] Land Acquisition Delay Notice: ${prev.project_id}`
    }));
    setSmsForm(prev => ({
      ...prev,
      recipient_role: role,
      recipient_phone: defaultContact.phone || prev.recipient_phone,
      custom_message: `URGENT (${role}): Land acquisition delay escalation for Project ${prev.project_id}. Immediate review required.`
    }));
  };

  const handleProjectIdChange = (newId) => {
    setEmailForm(prev => ({
      ...prev,
      project_id: newId,
      subject: `[URGENT - ${prev.recipient_role}] Delay Notice: ${newId}`
    }));
    setSmsForm(prev => ({
      ...prev,
      project_id: newId,
      custom_message: `URGENT (${smsForm.recipient_role}): Land acquisition delay escalation for Project ${newId}. Immediate review required.`
    }));
  };

  const handleSendEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailForm.recipient_email || !emailForm.project_id) {
      setEmailError('Please provide a valid recipient email address and Project ID.');
      return;
    }
    try {
      setSendingEmail(true);
      setEmailError(null);
      setEmailResult(null);
      const res = await sendGovernmentEmail(emailForm);
      setEmailResult(res);
    } catch (err) {
      console.error('Failed to send government email:', err);
      setEmailError(err.response?.data?.detail || 'Failed to dispatch official email via NIC gateway. Please verify backend connection.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSms = async (e) => {
    if (e) e.preventDefault();
    if (!smsForm.recipient_phone || !smsForm.project_id) {
      setSmsError('Please provide a valid phone number and Project ID.');
      return;
    }
    try {
      setSendingSms(true);
      setSmsError(null);
      setSmsResult(null);
      const res = await sendGovernmentSms(smsForm);
      setSmsResult(res);
    } catch (err) {
      console.error('Failed to send SMS notice:', err);
      setSmsError(err.response?.data?.detail || 'Failed to dispatch SMS alert. Please check mobile gateway status.');
    } finally {
      setSendingSms(false);
    }
  };

  const handleSyncGatiShakti = async () => {
    try {
      setSyncing(true);
      setSyncSuccessMsg(null);
      const res = await syncPmGatiShakti();
      setSyncStatus(res);
      setSyncSuccessMsg(`Successfully synchronized ${res.synced_projects_count} corridors across 4 inter-ministerial layers.`);
    } catch (err) {
      console.error('Failed to sync PM GatiShakti:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckBhoomi = async (e) => {
    if (e) e.preventDefault();
    if (!bhoomiProjectId) return;
    try {
      setCheckingBhoomi(true);
      const res = await checkBhoomiStatus(bhoomiProjectId);
      setBhoomiResult(res);
    } catch (err) {
      console.error('Failed to query Bhoomi:', err);
      setBhoomiResult({ error: `Could not fetch records for ${bhoomiProjectId}. Please ensure project exists.` });
    } finally {
      setCheckingBhoomi(false);
    }
  };

  const handleDownloadGeoJson = async () => {
    try {
      const data = await getGeoJsonFeatures();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pm_gatishakti_spatial_layer_${new Date().toISOString().split('T')[0]}.geojson`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Direct Web Mail Launchers
  const openWebGmail = () => {
    const to = encodeURIComponent(emailForm.recipient_email);
    const su = encodeURIComponent(emailForm.subject);
    const body = encodeURIComponent(
      `OFFICIAL GOVERNMENT ESCALATION NOTICE\n` +
      `====================================\n` +
      `Project ID: ${emailForm.project_id}\n` +
      `Escalation Level: ${emailForm.escalation_level}\n` +
      `Target Stakeholder: ${emailForm.recipient_role}\n\n` +
      `Notice Directives:\n${emailForm.custom_message}\n\n` +
      `Statutory Reference: Section 19 & 25, RFCTLARR Act 2013\n` +
      `Dispatched via: National Land Acquisition Delay Risk Decision System`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`, '_blank');
  };

  const openOutlookClient = () => {
    const to = encodeURIComponent(emailForm.recipient_email);
    const su = encodeURIComponent(emailForm.subject);
    const body = encodeURIComponent(
      `OFFICIAL GOVERNMENT ESCALATION NOTICE\n\n` +
      `Project ID: ${emailForm.project_id}\n` +
      `Escalation Level: ${emailForm.escalation_level}\n` +
      `Recipient: ${emailForm.recipient_role}\n\n` +
      `Notice Directives:\n${emailForm.custom_message}\n\n` +
      `Dispatched via: National Land Acquisition Delay Risk Decision System`
    );
    window.location.href = `mailto:${to}?subject=${su}&body=${body}`;
  };

  const copyNoticeBody = () => {
    const text = 
      `OFFICIAL GOVERNMENT ESCALATION MEMORANDUM\n` +
      `-----------------------------------------\n` +
      `Subject: ${emailForm.subject}\n` +
      `Project ID: ${emailForm.project_id}\n` +
      `Recipient: ${emailForm.recipient_email} (${emailForm.recipient_role})\n` +
      `Escalation Level: ${emailForm.escalation_level}\n\n` +
      `Directives:\n${emailForm.custom_message}\n\n` +
      `Transmitted via NIC Government Gateway (mail.nic.in)`;
    
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const copyBhoomiSummary = () => {
    if (!bhoomiResult) return;
    const text = 
      `STATE LAND REGISTRY (BHOOMI / RTC) VERIFICATION\n` +
      `-----------------------------------------------\n` +
      `Project ID: ${bhoomiResult.project_id}\n` +
      `Registry: ${bhoomiResult.state_registry}\n` +
      `District: ${bhoomiResult.district}\n` +
      `Survey Nos: ${bhoomiResult.survey_numbers_verified}\n` +
      `Mutation Status: ${bhoomiResult.mutation_status}\n` +
      `Encumbrance: ${bhoomiResult.encumbrance_certificate}\n` +
      `Verified Owners: ${bhoomiResult.total_owners_verified}\n` +
      `Disbursement: ${bhoomiResult.compensation_disbursement_channel}\n` +
      `Timestamp: ${bhoomiResult.last_synced}`;
    
    navigator.clipboard.writeText(text);
    setCopiedBhoomi(true);
    setTimeout(() => setCopiedBhoomi(false), 2500);
  };

  const copySnippet = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#C5BAC4]/50">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-[#DEDCDC] text-[#57707A] border border-[#C5BAC4] shadow-xs">
              <Globe2 className="w-5 h-5 text-[#191D23]" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
                Government Systems & Spatial Integration Hub
              </h1>
              <p className="text-xs sm:text-sm text-[#57707A]">
                Bi-directional connectors for PM GatiShakti National Master Plan (NMP), Bhoomi Land Records, and NIC Official Dispatch Gateway.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadGeoJson}
            className="btn-secondary text-xs"
            title="Download complete GeoJSON FeatureCollection of all land acquisition projects"
          >
            <FileJson className="w-3.5 h-3.5 text-[#57707A]" />
            <span>Export Spatial GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Grid: PM GatiShakti NMP & Bhoomi Land Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Module 1: PM GatiShakti NMP Connector */}
        <div className="clean-card p-5 space-y-4 flex flex-col justify-between border border-[#C5BAC4]/80 shadow-xs">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#C5BAC4]/50 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#191D23] text-white flex items-center justify-center font-mono font-bold text-xs">
                  NMP
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#191D23]">
                    PM GatiShakti National Master Plan (NMP)
                  </h3>
                  <span className="text-[11px] text-[#7E919F] font-mono">
                    Endpoint: https://gatishakti.nic.in/api/v2/land-parcels
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>

            <p className="text-xs text-[#57707A] leading-relaxed">
              Synchronizes high-risk land acquisition bottlenecks across GIS layers including National Highways Authority of India (NHAI), Dedicated Freight Corridors (DFCCIL), and Industrial Smart Cities (NICDC).
            </p>

            <div className="p-3.5 rounded-xl bg-[#DEDCDC]/30 border border-[#C5BAC4]/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#57707A]">Inter-Ministerial Sync Layers:</span>
                <span className="font-mono font-semibold text-[#191D23]">4 National Portals</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#57707A]">Coordinate Reference System:</span>
                <span className="font-mono text-[#191D23] font-medium">WGS 84 (EPSG:4326)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#57707A]">Data Exchange Standard:</span>
                <span className="font-mono text-[#191D23] font-medium">OGC GeoJSON / REST Webhook</span>
              </div>
            </div>

            {/* Sync Feedback Result */}
            {syncStatus && (
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1 animate-in fade-in">
                <div className="font-bold text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PM GatiShakti Synchronized: {syncStatus.sync_id}</span>
                </div>
                <div className="text-[11px] text-emerald-800/90 font-mono">
                  {syncStatus.synced_projects_count} corridors broadcasted • {syncStatus.critical_corridors_flagged} critical bottlenecks mapped.
                </div>
                <div className="pt-1 flex flex-wrap gap-1">
                  {syncStatus.layers_updated?.map((layer, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                      ✓ {layer}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSyncGatiShakti}
              disabled={syncing}
              className="btn-primary w-full justify-center py-2 text-xs font-semibold shadow-xs"
            >
              <Zap className={`w-4 h-4 ${syncing ? 'animate-bounce text-amber-300' : ''}`} />
              <span>{syncing ? 'Synchronizing with GatiShakti NMP...' : 'Trigger PM GatiShakti Sync'}</span>
            </button>
          </div>
        </div>

        {/* Module 2: State Land Records / Bhoomi Cadastral Query */}
        <div className="clean-card p-5 space-y-4 flex flex-col justify-between border border-[#C5BAC4]/80 shadow-xs">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#C5BAC4]/50 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#57707A] text-white flex items-center justify-center font-mono font-bold text-xs">
                  RTC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#191D23]">
                    State Land Registry (Bhoomi / Mahabhulekh)
                  </h3>
                  <span className="text-[11px] text-[#7E919F] font-mono">
                    Digitized Cadastral Records & Title Verification
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#DEDCDC] text-[#57707A] border border-[#C5BAC4]">
                LIVE QUERY
              </span>
            </div>

            <p className="text-xs text-[#57707A] leading-relaxed">
              Verify mutation certificates, title deed encumbrance status, survey numbers, and PAF ownership matrices directly from state land databases.
            </p>

            <form onSubmit={handleCheckBhoomi} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#191D23]">
                  Select or Enter Project ID
                </label>
                {availableProjects.length > 0 && (
                  <span className="text-[10px] text-[#57707A]">
                    {availableProjects.length} projects available
                  </span>
                )}
              </div>

              <div className="flex space-x-2">
                {availableProjects.length > 0 ? (
                  <select
                    value={bhoomiProjectId}
                    onChange={(e) => setBhoomiProjectId(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs font-mono font-medium text-[#191D23] focus:outline-none focus:border-[#57707A]"
                  >
                    {availableProjects.map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                    <option value="P1001">P1001 (Default)</option>
                    <option value="P0005">P0005</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={bhoomiProjectId}
                    onChange={(e) => setBhoomiProjectId(e.target.value)}
                    placeholder="e.g. P1001, P0005"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#C5BAC4] text-xs font-mono font-medium text-[#191D23] focus:outline-none focus:border-[#57707A]"
                  />
                )}

                <button
                  type="submit"
                  disabled={checkingBhoomi}
                  className="btn-dark px-4"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{checkingBhoomi ? 'Querying...' : 'Verify RTC'}</span>
                </button>
              </div>
            </form>

            {/* Bhoomi Verification Result Card */}
            {bhoomiResult && (
              <div className="p-3.5 rounded-xl bg-white border border-[#C5BAC4] text-xs space-y-1.5 font-mono shadow-2xs animate-in fade-in">
                {bhoomiResult.error ? (
                  <p className="text-rose-600 font-sans font-medium">{bhoomiResult.error}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-[#C5BAC4]/40 pb-1.5">
                      <div className="text-[#191D23] font-bold font-sans text-xs">
                        {bhoomiResult.state_registry}
                      </div>
                      <button
                        onClick={copyBhoomiSummary}
                        className="text-[10px] text-[#57707A] hover:text-[#191D23] flex items-center space-x-1 font-sans cursor-pointer"
                      >
                        {copiedBhoomi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBhoomi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1">
                      <div><span className="text-[#57707A]">District:</span> <strong className="text-[#191D23]">{bhoomiResult.district}</strong></div>
                      <div><span className="text-[#57707A]">Mutation:</span> <strong className="text-emerald-700">{bhoomiResult.mutation_status}</strong></div>
                      <div><span className="text-[#57707A]">Survey Nos:</span> <strong className="text-[#191D23]">{bhoomiResult.survey_numbers_verified}</strong></div>
                      <div><span className="text-[#57707A]">Encumbrance:</span> <strong className="text-amber-800">{bhoomiResult.encumbrance_certificate}</strong></div>
                      <div><span className="text-[#57707A]">Verified Owners:</span> <strong className="text-[#191D23]">{bhoomiResult.total_owners_verified} PAFs</strong></div>
                      <div><span className="text-[#57707A]">Payout:</span> <strong className="text-[#191D23]">{bhoomiResult.compensation_disbursement_channel}</strong></div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#7E919F] flex items-center justify-between border-t border-[#C5BAC4]/40 pt-2">
            <span>Direct Land Records Bridge</span>
            <span className="font-mono">e-Dharti / Bhulekh API v3.2</span>
          </div>
        </div>
      </div>

      {/* Module 3: Government Official Email & SMS Escalation Dispatch Gateway */}
      <div className="clean-card p-5 space-y-4 border border-[#C5BAC4]/80 bg-gradient-to-b from-white to-[#FAF9FB] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#C5BAC4]/50 pb-3 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#191D23] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#191D23]">
                Government Official Escalation & Dispatch Gateway
              </h3>
              <span className="text-[11px] text-[#7E919F] font-mono">
                Multi-Channel Relay: NIC Government Email (mail.nic.in) & C-DAC Mobile Seva (msdg.gov.in)
              </span>
            </div>
          </div>

          {/* Mode Switcher: Email vs SMS */}
          <div className="flex items-center bg-[#DEDCDC] p-0.5 rounded-lg border border-[#C5BAC4] self-start sm:self-auto">
            <button
              onClick={() => setDispatchMode('EMAIL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                dispatchMode === 'EMAIL'
                  ? 'bg-white text-[#191D23] shadow-xs'
                  : 'text-[#57707A] hover:text-[#191D23]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Official Email</span>
            </button>
            <button
              onClick={() => setDispatchMode('SMS')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                dispatchMode === 'SMS'
                  ? 'bg-white text-[#191D23] shadow-xs'
                  : 'text-[#57707A] hover:text-[#191D23]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>SMS Flash Alert</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-[#57707A] leading-relaxed">
          Instantly dispatch official land acquisition delay escalation memos, Section 19 statutory breach notices, and executive risk briefings directly to nodal authorities, District Collectors, or central ministries.
        </p>

        {/* EMAIL DISPATCH SECTION */}
        {dispatchMode === 'EMAIL' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Error Alert */}
            {emailError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            {/* Success Alert with Direct Tracking */}
            {emailResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/90 text-xs text-emerald-950 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{emailResult.message}</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-semibold">
                    {emailResult.tracking_id}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-emerald-800/90">
                  <div>Recipient: <strong className="text-emerald-950">{emailResult.dispatch_details?.recipient_email}</strong></div>
                  <div>Gateway: <strong className="text-emerald-950">NIC mail.nic.in</strong></div>
                  <div>Delivery: <strong className="text-emerald-950">SENT & RECORDED</strong></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Target Stakeholder Role */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Target Stakeholder / Authority
                  </label>
                  <select
                    value={emailForm.recipient_role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="form-select font-medium"
                  >
                    <option value="District Collector">District Collector / DM</option>
                    <option value="State Land Authority (SLAO)">State Land Authority (SLAO)</option>
                    <option value="NHAI Project Director">NHAI Project Director</option>
                    <option value="Railways Land Officer">Railways Land Acquisition Officer</option>
                    <option value="Ministry of Road Transport (MoRTH)">Ministry Nodal Officer (MoRTH)</option>
                    <option value="Chief Secretary / Cabinet Secretariat">Chief Secretary / Cabinet Secy</option>
                    <option value="Custom Stakeholder">Custom Stakeholder Email</option>
                  </select>
                </div>

                {/* Recipient Email Address */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailForm.recipient_email}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipient_email: e.target.value }))}
                    placeholder="e.g. collector.pune@nic.in"
                    className="form-input font-mono text-xs"
                  />
                </div>

                {/* Case Project ID with Dropdown Selector */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Related Project ID <span className="text-rose-500">*</span>
                  </label>
                  {availableProjects.length > 0 ? (
                    <select
                      value={emailForm.project_id}
                      onChange={(e) => handleProjectIdChange(e.target.value)}
                      className="form-select font-mono text-xs"
                    >
                      {availableProjects.map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                      <option value="P1001">P1001 (Default)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={emailForm.project_id}
                      onChange={(e) => handleProjectIdChange(e.target.value)}
                      placeholder="e.g. P1001, P1056"
                      className="form-input font-mono text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Notice / Escalation Type */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Escalation Notice Type
                  </label>
                  <select
                    value={emailForm.escalation_level}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, escalation_level: e.target.value }))}
                    className="form-select font-normal text-xs"
                  >
                    <option value="CRITICAL_DELAY">High Risk Delay Warning (Section 19 Breach)</option>
                    <option value="STAGE_BOTTLENECK">Stage Duration Bottleneck Escalation</option>
                    <option value="COMPENSATION_CLEARANCE">Pending Compensation Payout Acceleration</option>
                    <option value="GENERAL_NOTICE">General Land Acquisition Status Briefing</option>
                  </select>
                </div>

                {/* Email Subject Line */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Official Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Official Email Subject"
                    className="form-input text-xs"
                  />
                </div>
              </div>

              {/* Custom Message / Directives */}
              <div>
                <label className="form-label font-semibold text-[#191D23]">
                  Official Directive / Notice Body
                </label>
                <textarea
                  rows={2}
                  value={emailForm.custom_message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, custom_message: e.target.value }))}
                  placeholder="Enter official memorandum details, court deadline reminders, or statutory compliance directives..."
                  className="form-input text-xs leading-relaxed"
                />
              </div>

              {/* Attachments & Quick Launch Bar */}
              <div className="pt-2 border-t border-[#C5BAC4]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#57707A]">
                  <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emailForm.include_pdf_summary}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, include_pdf_summary: e.target.checked }))}
                      className="rounded text-[#57707A] focus:ring-0 cursor-pointer"
                    />
                    <span>Attach Executive Risk PDF Report</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emailForm.include_gis_coordinates}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, include_gis_coordinates: e.target.checked }))}
                      className="rounded text-[#57707A] focus:ring-0 cursor-pointer"
                    />
                    <span>Attach Spatial GeoJSON/KML</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={copyNoticeBody}
                    className="btn-secondary text-xs"
                    title="Copy official notice text to clipboard"
                  >
                    {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotice ? 'Copied' : 'Copy Notice'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openWebGmail}
                    className="btn-secondary text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                    title="Open pre-filled draft directly in Web Gmail"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Gmail</span>
                  </button>

                  <button
                    type="button"
                    onClick={openOutlookClient}
                    className="btn-secondary text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                    title="Open pre-filled draft in Outlook or default mail client"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Outlook</span>
                  </button>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="btn-primary text-xs"
                  >
                    <Send className={`w-3.5 h-3.5 ${sendingEmail ? 'animate-pulse' : ''}`} />
                    <span>{sendingEmail ? 'Transmitting via NIC...' : 'Send via NIC Gateway'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* SMS FLASH ALERT SECTION */}
        {dispatchMode === 'SMS' && (
          <div className="space-y-4 animate-in fade-in">
            {/* SMS Error Alert */}
            {smsError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{smsError}</span>
              </div>
            )}

            {/* SMS Success Alert */}
            {smsResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/90 text-xs text-emerald-950 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{smsResult.message}</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-semibold">
                    {smsResult.tracking_id}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-emerald-800/90">
                  <div>Recipient: <strong className="text-emerald-950">{smsResult.dispatch_details?.recipient_phone}</strong></div>
                  <div>Gateway: <strong className="text-emerald-950">C-DAC Mobile Seva</strong></div>
                  <div>Status: <strong className="text-emerald-950">DISPATCHED</strong></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSendSms} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Target Stakeholder Role */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Target Stakeholder / Authority
                  </label>
                  <select
                    value={smsForm.recipient_role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="form-select font-medium"
                  >
                    <option value="District Collector">District Collector / DM</option>
                    <option value="State Land Authority (SLAO)">State Land Authority (SLAO)</option>
                    <option value="NHAI Project Director">NHAI Project Director</option>
                    <option value="Railways Land Officer">Railways Land Acquisition Officer</option>
                    <option value="Ministry of Road Transport (MoRTH)">Ministry Nodal Officer (MoRTH)</option>
                    <option value="Chief Secretary / Cabinet Secretariat">Chief Secretary / Cabinet Secy</option>
                    <option value="Custom Stakeholder">Custom Stakeholder Phone</option>
                  </select>
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Stakeholder Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={smsForm.recipient_phone}
                    onChange={(e) => setSmsForm(prev => ({ ...prev, recipient_phone: e.target.value }))}
                    placeholder="e.g. +91 98220 12345"
                    className="form-input font-mono text-xs"
                  />
                </div>

                {/* Case Project ID */}
                <div>
                  <label className="form-label font-semibold text-[#191D23]">
                    Related Project ID <span className="text-rose-500">*</span>
                  </label>
                  {availableProjects.length > 0 ? (
                    <select
                      value={smsForm.project_id}
                      onChange={(e) => handleProjectIdChange(e.target.value)}
                      className="form-select font-mono text-xs"
                    >
                      {availableProjects.map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                      <option value="P1001">P1001 (Default)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={smsForm.project_id}
                      onChange={(e) => handleProjectIdChange(e.target.value)}
                      placeholder="e.g. P1001"
                      className="form-input font-mono text-xs"
                    />
                  )}
                </div>
              </div>

              {/* SMS Alert Body */}
              <div>
                <div className="flex items-center justify-between pb-1">
                  <label className="form-label font-semibold text-[#191D23] mb-0">
                    Flash SMS Alert Message (Max 160 Characters)
                  </label>
                  <span className={`text-[11px] font-mono ${smsForm.custom_message.length > 160 ? 'text-rose-600 font-bold' : 'text-[#7E919F]'}`}>
                    {smsForm.custom_message.length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={smsForm.custom_message}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, custom_message: e.target.value }))}
                  placeholder="Enter high-priority brief SMS text for instant mobile dispatch..."
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="pt-2 border-t border-[#C5BAC4]/40 flex items-center justify-end space-x-2">
                <button
                  type="submit"
                  disabled={sendingSms}
                  className="btn-primary text-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingSms ? 'animate-pulse' : ''}`} />
                  <span>{sendingSms ? 'Dispatching Flash SMS...' : 'Dispatch Flash SMS Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Module 4: REST API Quickstart & Spatial Integration Snippets */}
      <div className="clean-card p-5 space-y-4 border border-[#C5BAC4]/80 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#C5BAC4]/50 pb-2.5">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#57707A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
              Open Integration APIs & Inter-Governmental Endpoints
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#57707A]">REST / JSON & GeoJSON (EPSG:4326)</span>
        </div>

        <p className="text-xs text-[#57707A]">
          Integrate the Land Acquisition Delay Risk Decision Engine into external state portals, QGIS spatial maps, and project management dashboards:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Snippet 1: Run Delay Prediction */}
          <div className="p-3.5 rounded-xl bg-[#191D23] text-[#DEDCDC] font-mono text-xs space-y-2 border border-[#57707A]/40 relative">
            <div className="flex items-center justify-between">
              <span className="text-[#C5BAC4] font-semibold text-[11px]"># 1. Run Machine Learning Delay Prediction</span>
              <button
                onClick={() => copySnippet(`curl -X POST "http://127.0.0.1:8000/api/predict" -H "Content-Type: application/json" -d '{"project_type": "Highway", "land_area_acres": 150, "owners": 12, "disputes": 2, "objections": 3, "pending_documents": 1, "pending_approvals": 2, "compensation_pending": 5, "current_stage": "Valuation", "days_in_current_stage": 45, "total_days": 180, "previous_delays": 1, "land_record_complexity": "High", "state": "Maharashtra", "district": "Pune"}'`, 'c1')}
                className="text-[10px] text-[#C5BAC4] hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                {copiedCurl === 'c1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl === 'c1' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <div className="text-[#DEDCDC]/80 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
              curl -X POST "http://127.0.0.1:8000/api/predict" \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
              &nbsp;&nbsp;-d '&#123;"project_type": "Highway", "land_area_acres": 150, "owners": 12, "disputes": 2, "current_stage": "Valuation", "days_in_current_stage": 45&#125;'
            </div>
          </div>

          {/* Snippet 2: Fetch GeoJSON Layer */}
          <div className="p-3.5 rounded-xl bg-[#191D23] text-[#DEDCDC] font-mono text-xs space-y-2 border border-[#57707A]/40 relative">
            <div className="flex items-center justify-between">
              <span className="text-[#C5BAC4] font-semibold text-[11px]"># 2. Fetch Spatial GeoJSON Feature Layer</span>
              <button
                onClick={() => copySnippet(`curl -X GET "http://127.0.0.1:8000/api/integrations/geojson" -H "Accept: application/geo+json"`, 'c2')}
                className="text-[10px] text-[#C5BAC4] hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                {copiedCurl === 'c2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl === 'c2' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <div className="text-[#DEDCDC]/80 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
              curl -X GET "http://127.0.0.1:8000/api/integrations/geojson" \<br />
              &nbsp;&nbsp;-H "Accept: application/geo+json"
            </div>
            <div className="text-[#C5BAC4] font-semibold text-[11px] pt-1"># 3. Bhoomi Cadastral Query</div>
            <div className="text-[#DEDCDC]/80 text-[11px] leading-relaxed overflow-x-auto">
              curl -X GET "http://127.0.0.1:8000/api/integrations/bhoomi/status/P1001"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
