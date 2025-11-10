'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Shield, Trash2, Plus, Search, AlertTriangle, Edit2 } from 'lucide-react';
import { getBlacklistedDomains, updateBlacklistedDomain, removeBlacklistedDomain, apiCall } from '../../utils/api';
import ThemeToggle from '../../components/ThemeToggle';

export default function BlacklistPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [severity, setSeverity] = useState(3);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [editSeverity, setEditSeverity] = useState(1);
  const queryClient = useQueryClient();

  const severityMap = { 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH', 4: 'CRITICAL', 5: 'EXTREME' };
  const getSeverityName = (sev) => severityMap[sev] || 'MEDIUM';

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['blacklistedDomains'],
    queryFn: getBlacklistedDomains,
    refetchInterval: 3000,
  });

  const addMutation = useMutation({
    mutationFn: ({ domain, severity }) => 
      apiCall('/blacklist/domains', {
        method: 'POST',
        body: JSON.stringify({ domain, severity }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['blacklistedDomains']);
      setNewDomain('');
      setSeverity(3);
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ domain, severity }) => updateBlacklistedDomain(domain, severity),
    onSuccess: () => {
      queryClient.invalidateQueries(['blacklistedDomains']);
      setEditingDomain(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeBlacklistedDomain,
    onSuccess: () => {
      queryClient.invalidateQueries(['blacklistedDomains']);
    },
  });

  const filteredDomains = domains.filter(domain =>
    domain.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (newDomain.trim()) {
      addMutation.mutate({ domain: newDomain.trim(), severity });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-2 transition-all hover:gap-3">
                  <span>←</span> Dashboard
                </Link>
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Domain Blacklist</h1>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm ml-2">Manage blocked domains</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition-transform shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Domain
              </button>
            </div>
          </div>
        </div>

        {/* Add Domain Form */}
        {showAddForm && (
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20 dark:border-slate-700 animate-fade-in">
            <form onSubmit={handleAddDomain} className="flex gap-4">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com or https://example.com"
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>🟢 Low</option>
                <option value={2}>🟡 Medium</option>
                <option value={3}>🟠 High</option>
                <option value={4}>🔴 Critical</option>
                <option value={5}>⚫ Extreme</option>
              </select>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
              >
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Total Blacklisted Domains</p>
              <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{domains.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Domains List */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
          ) : filteredDomains.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              {searchTerm ? 'No domains found' : 'No blacklisted domains'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredDomains.map((item) => (
                <div
                  key={item.id}
                  className="p-6 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <span className="text-slate-900 dark:text-white font-medium">{item.domain}</span>
                      <SeverityBadge severity={getSeverityName(item.severity)} />
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingDomain(item.domain);
                        setEditSeverity(item.severity || 1);
                      }}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => removeMutation.mutate(item.domain)}
                      disabled={removeMutation.isPending}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingDomain && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setEditingDomain(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Edit Severity</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4 font-mono text-sm">{editingDomain}</p>
              <select
                value={editSeverity}
                onChange={(e) => setEditSeverity(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              >
                <option value={1}>🟢 Low</option>
                <option value={2}>🟡 Medium</option>
                <option value={3}>🟠 High</option>
                <option value={4}>🔴 Critical</option>
                <option value={5}>⚫ Extreme</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => updateMutation.mutate({ domain: editingDomain, severity: editSeverity })}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => setEditingDomain(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    CRITICAL: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50',
    HIGH: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50',
    MEDIUM: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/50',
    LOW: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50',
    EXTREME: 'bg-gradient-to-r from-purple-600 to-black text-white shadow-lg shadow-purple-500/50',
  };
  return (
    <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[severity] || 'bg-gray-500 text-white'}`}>
      {severity}
    </span>
  );
}
