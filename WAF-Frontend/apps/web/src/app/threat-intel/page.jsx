'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Shield, Trash2, Plus, Search, AlertTriangle, Ban } from 'lucide-react';
import { api } from '@/utils/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function ThreatIntelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newIp, setNewIp] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedIp, setSelectedIp] = useState(null);
  const queryClient = useQueryClient();

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch all events to extract malicious IPs
  const { data: eventsData = { content: [] }, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.getEvents(0, 500),
  });

  const events = eventsData.content || [];

  // Extract unique malicious IPs with attack counts
  const ipStats = {};
  events.forEach((event) => {
    const ip = event.sourceIp || event.deviceIp;
    if (ip) {
      if (!ipStats[ip]) {
        ipStats[ip] = {
          ip,
          count: 0,
          lastSeen: event.timestamp,
          types: new Set(),
        };
      }
      ipStats[ip].count++;
      ipStats[ip].types.add(event.eventType);
      if (new Date(event.timestamp) > new Date(ipStats[ip].lastSeen)) {
        ipStats[ip].lastSeen = event.timestamp;
      }
    }
  });

  const maliciousIps = Object.values(ipStats)
    .map(stat => ({ ...stat, types: Array.from(stat.types) }))
    .sort((a, b) => b.count - a.count);

  const filteredIps = maliciousIps.filter(item =>
    item.ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const banMutation = useMutation({
    mutationFn: (ip) => api.banIpAddress(ip),
    onSuccess: (data, ip) => {
      showNotification(`IP ${ip} banned successfully`, 'success');
      queryClient.invalidateQueries(['devices']);
    },
    onError: (error, ip) => {
      showNotification(`Failed to ban ${ip}`, 'error');
    },
  });

  const handleBanIp = (ip) => {
    if (confirm(`Ban IP ${ip}?`)) {
      banMutation.mutate(ip);
    }
  };

  const getIpHistory = (ip) => {
    return events.filter(e => (e.sourceIp || e.deviceIp) === ip)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
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
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Threat Intel</h1>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm ml-2">Detected attacking IP addresses</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Unique Malicious IPs</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{maliciousIps.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Total Attack Events</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{events.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Avg Attacks per IP</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">
                  {maliciousIps.length > 0 ? (events.length / maliciousIps.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Ban className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search IP addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* IPs List */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
          ) : filteredIps.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              {searchTerm ? 'No IPs found' : 'No malicious IPs detected'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 border-b-2 border-indigo-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">IP Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Attack Count</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Attack Types</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Last Seen</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIps.map((item, index) => (
                    <tr
                      key={item.ip}
                      className={`border-b border-slate-100 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/50'} hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-white font-semibold">
                        <button
                          onClick={() => setSelectedIp(item.ip)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        >
                          {item.ip}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.count > 50 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          item.count > 20 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {item.count} attacks
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-1 flex-wrap">
                          {item.types.map((type, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(item.lastSeen).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleBanIp(item.ip)}
                          disabled={banMutation.isPending}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition disabled:opacity-50 flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Ban IP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal historique */}
        {selectedIp && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIp(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Attack History: {selectedIp}</h2>
                  <button onClick={() => setSelectedIp(null)} className="text-white hover:text-gray-200 text-2xl">
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {getIpHistory(selectedIp).length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">No events found</p>
                ) : (
                  <div className="space-y-3">
                    {getIpHistory(selectedIp).map((event, idx) => (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <div className="flex items-start justify-between mb-2">
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                            {event.eventType}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {event.ruleName && (
                            <p className="text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">Rule:</span> {event.ruleName}
                            </p>
                          )}
                          {(event.uri || event.requestUri) && (
                            <p className="text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">URL:</span> <span className="font-mono text-xs break-all">{event.uri || event.requestUri}</span>
                            </p>
                          )}
                          {event.domain && (
                            <p className="text-red-700 dark:text-red-400">
                              <span className="font-semibold">🚫 Blacklisted Domain:</span> <span className="font-mono text-xs">{event.domain}</span>
                            </p>
                          )}
                          {event.method && (
                            <p className="text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">Method:</span> {event.method}
                            </p>
                          )}
                          {event.username && (
                            <p className="text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">Username:</span> {event.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
