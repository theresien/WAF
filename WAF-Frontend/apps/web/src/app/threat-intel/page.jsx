'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Shield, RefreshCw, TrendingUp, AlertCircle, Database, Clock } from 'lucide-react';
import { getThreatIntelStats, updateThreatIntel } from '../../utils/api';

export default function ThreatIntelPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['threatIntelStats'],
    queryFn: getThreatIntelStats,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: updateThreatIntel,
    onSuccess: () => {
      queryClient.invalidateQueries(['threatIntelStats']);
    },
  });

  const handleUpdate = () => {
    updateMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2 transition-all hover:gap-3">
                  <span>←</span> Dashboard
                </Link>
                <div className="h-6 w-px bg-slate-300"></div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Threat Intelligence</h1>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm ml-2">Monitor and update threat data</p>
            </div>
            <button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${updateMutation.isPending ? 'animate-spin' : ''}`} />
              {updateMutation.isPending ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center text-slate-600">
            Loading statistics...
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl shadow-xl p-8 border border-red-200 text-center">
            <p className="text-red-700 font-semibold mb-2">Error loading threat intelligence</p>
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Threats */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Threats</p>
                    <p className="text-4xl font-bold text-slate-900 mt-2">{stats.totalThreats || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Active Threats */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Active Threats</p>
                    <p className="text-4xl font-bold text-slate-900 mt-2">{stats.activeThreats || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Database Size */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Database Entries</p>
                    <p className="text-4xl font-bold text-slate-900 mt-2">{stats.databaseSize || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Last Update Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Last Updated</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            {stats.sources && stats.sources.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mt-8 border border-white/20">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Threat Sources</h2>
                <div className="space-y-3">
                  {stats.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <span className="text-slate-900 font-medium">{source.name}</span>
                      <span className="text-slate-600">{source.count} threats</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center text-slate-500">
            No threat intelligence data available
          </div>
        )}

        {/* Update Status */}
        {updateMutation.isSuccess && (
          <div className="bg-green-50 rounded-2xl shadow-xl p-4 mt-8 border border-green-200">
            <p className="text-green-700 text-center">✓ Threat intelligence updated successfully</p>
          </div>
        )}

        {updateMutation.isError && (
          <div className="bg-red-50 rounded-2xl shadow-xl p-4 mt-8 border border-red-200">
            <p className="text-red-700 text-center">✗ Failed to update threat intelligence</p>
          </div>
        )}
      </div>
    </div>
  );
}
