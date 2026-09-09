import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Search, 
  RefreshCw, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  Eye,
  Trash2,
  X
} from 'lucide-react';
import { 
  apiAdminGetUsers, 
  apiAdminUpdateUserStatus, 
  apiAdminUpdateUserRole, 
  apiAdminGetUserDetail, 
  apiAdminDeleteUser 
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminUserManagement() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pendingCount: 0, activeCount: 0, disabledCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionNotice, setActionNotice] = useState(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await apiAdminGetUsers(params);
      setUsers(res.users || []);
      setStats({
        total: res.total || 0,
        pendingCount: res.pendingCount || 0,
        activeCount: res.activeCount || 0,
        disabledCount: res.disabledCount || 0
      });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleStatusToggle = async (userId, targetStatus, userName) => {
    const actionName = targetStatus === 'ACTIVE' ? 'Activate' : 'Disable';
    if (!window.confirm(`Are you sure you want to ${actionName} account for ${userName}?`)) return;

    try {
      await apiAdminUpdateUserStatus(userId, targetStatus);
      setActionNotice({
        type: 'success',
        message: `Account for ${userName} is now ${targetStatus}.`
      });
      fetchUsers();
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.response?.data?.detail || `Failed to update status.`
      });
    }
  };

  const handleRoleToggle = async (userId, targetRole, userName) => {
    if (!window.confirm(`Are you sure you want to change role for ${userName} to ${targetRole}?`)) return;

    try {
      await apiAdminUpdateUserRole(userId, targetRole);
      setActionNotice({
        type: 'success',
        message: `Role for ${userName} updated to ${targetRole}.`
      });
      fetchUsers();
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.response?.data?.detail || `Failed to change role.`
      });
    }
  };

  const handleViewDetail = async (userId) => {
    try {
      setDetailLoading(true);
      const res = await apiAdminGetUserDetail(userId);
      setSelectedUserDetail(res);
    } catch (err) {
      console.error('Failed to get user details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`WARNING: Permanent deletion of ${userName}. Are you sure?`)) return;
    try {
      await apiAdminDeleteUser(userId);
      setActionNotice({
        type: 'success',
        message: `User ${userName} deleted permanently.`
      });
      fetchUsers();
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to delete user.'
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
            User Access & Identity Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#57707A] mt-0.5">
            Admin console for approving pending officers, managing role permissions, and reviewing identity audit trails.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Registry</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-[#C5BAC4]/70 shadow-2xs">
          <div className="text-[11px] font-medium text-[#7E919F] uppercase tracking-wider">Total Registered</div>
          <div className="text-2xl font-bold font-mono text-[#191D23] mt-1">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Approval</span>
            {stats.pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-1">{stats.pendingCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Active Officers</div>
          <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">{stats.activeCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Disabled Accounts</div>
          <div className="text-2xl font-bold font-mono text-rose-900 mt-1">{stats.disabledCount}</div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
          actionNotice.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs font-bold px-1">✕</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="clean-card p-3.5 border border-[#C5BAC4]/70 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <form onSubmit={handleSearch} className="lg:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Email, Employee ID, or Dept..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#C5BAC4] bg-white text-xs font-medium text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
            />
            <Search className="w-3.5 h-3.5 text-[#7E919F] absolute left-2.5 top-2.5" />
          </form>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#C5BAC4] bg-white text-xs font-medium text-[#191D23] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses (Pending & Active)</option>
              <option value="PENDING">Pending Approval Only</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DISABLED">Disabled Only</option>
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#C5BAC4] bg-white text-xs font-medium text-[#191D23] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="OFFICER">Government Officers</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="clean-card overflow-hidden border border-[#C5BAC4]/80 shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9FB] text-[#57707A] font-semibold border-b border-[#C5BAC4]/70">
                <th className="py-2.5 px-3">Officer Details</th>
                <th className="py-2.5 px-3">Department & Designation</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3">Registered On</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5BAC4]/40 text-[#191D23]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#7E919F] italic">
                    {loading ? 'Loading user registry...' : 'No users found matching current filters.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#DEDCDC]/20 transition-colors">
                      
                      {/* Name & ID */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#191D23] flex items-center space-x-1.5">
                          <span>{u.fullName}</span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-normal">You</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7E919F] font-mono flex items-center space-x-1 mt-0.5">
                          <span>ID: <strong>{u.employeeId}</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{u.email}</span>
                        </div>
                      </td>

                      {/* Dept & Designation */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-medium text-[#191D23] truncate">{u.department}</div>
                        <div className="text-[11px] text-[#7E919F] truncate">{u.designation}</div>
                      </td>

                      {/* Role */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          u.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                          'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-2.5 px-3 text-[11px] text-[#7E919F] whitespace-nowrap font-mono">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>

                      {/* Created At */}
                      <td className="py-2.5 px-3 text-[11px] text-[#7E919F] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1.5">
                        
                        {/* View Details */}
                        <button
                          onClick={() => handleViewDetail(u.id)}
                          className="p-1 rounded text-[#7E919F] hover:text-[#191D23] transition-colors"
                          title="View Audit Logs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Toggle Button */}
                        {u.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusToggle(u.id, 'ACTIVE', u.fullName)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        {u.status === 'ACTIVE' && !isSelf && (
                          <button
                            onClick={() => handleStatusToggle(u.id, 'DISABLED', u.fullName)}
                            className="px-2 py-1 rounded bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-colors"
                          >
                            Disable
                          </button>
                        )}

                        {u.status === 'DISABLED' && (
                          <button
                            onClick={() => handleStatusToggle(u.id, 'ACTIVE', u.fullName)}
                            className="px-2 py-1 rounded bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] transition-colors"
                          >
                            Reactivate
                          </button>
                        )}

                        {/* Role Change Button */}
                        {!isSelf && (
                          <button
                            onClick={() => handleRoleToggle(u.id, u.role === 'ADMIN' ? 'OFFICER' : 'ADMIN', u.fullName)}
                            className="px-2 py-1 rounded bg-[#DEDCDC]/40 hover:bg-[#DEDCDC] text-[#57707A] text-[11px] font-medium border border-[#C5BAC4] transition-colors"
                          >
                            {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                          </button>
                        )}

                        {/* Delete Button */}
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="p-1 rounded text-[#7E919F] hover:text-rose-600 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail & Audit Logs Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-[#191D23]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#C5BAC4] shadow-xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#191D23] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#DEDCDC]" />
                <h3 className="font-bold text-sm">
                  User Audit Profile: {selectedUserDetail.user.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1 rounded-lg text-[#979DAB] hover:text-white hover:bg-[#57707A]/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* User Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#FAF9FB] border border-[#C5BAC4]/70 text-xs">
                <div>
                  <span className="text-[#7E919F] block">Employee ID:</span>
                  <strong className="font-mono">{selectedUserDetail.user.employeeId}</strong>
                </div>
                <div>
                  <span className="text-[#7E919F] block">Official Email:</span>
                  <strong className="truncate block font-mono">{selectedUserDetail.user.email}</strong>
                </div>
                <div>
                  <span className="text-[#7E919F] block">Role / Status:</span>
                  <strong>{selectedUserDetail.user.role} ({selectedUserDetail.user.status})</strong>
                </div>
                <div>
                  <span className="text-[#7E919F] block">Registered On:</span>
                  <strong>{new Date(selectedUserDetail.user.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#191D23]">
                  Recent Security & Activity Trail ({selectedUserDetail.recentLogs?.length || 0})
                </h4>

                {selectedUserDetail.recentLogs?.length === 0 ? (
                  <p className="text-xs text-[#7E919F] italic py-3">No activity logs recorded for this account yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {selectedUserDetail.recentLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-lg bg-[#FAF9FB] border border-[#C5BAC4]/50 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#191D23] font-mono">{log.action}</span>
                          <div className="text-[11px] text-[#7E919F]">
                            By {log.actor_name || log.actor_email} ({log.actor_role})
                          </div>
                        </div>
                        <div className="text-[10px] text-[#7E919F] font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#FAF8F5] border-t border-[#C5BAC4]/50 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="btn-secondary text-xs"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
