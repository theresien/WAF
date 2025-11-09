'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Shield, Trash2, Plus, Search, AlertTriangle } from 'lucide-react';
import { getBlacklistedDomains, addBlacklistedDomain, removeBlacklistedDomain } from '../../utils/api';

export default function BlacklistPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['blacklistedDomains'],
    queryFn: getBlacklistedDomains,
  });

  const addMutation = useMutation({
    mutationFn: addBlacklistedDomain,
    onSuccess: () => {
      queryClient.invalidateQueries(['blacklistedDomains']);
      setNewDomain('');
      setShowAddForm(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeBlacklistedDomain,
    onSuccess: () => {
      queryClient.invalidateQueries(['blacklistedDomains']);
    },
  });

  const filteredDomains = domains.filter(domain =>
    domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (newDomain.trim()) {
      addMutation.mutate(newDomain.trim());
    }
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
                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Domain Blacklist</h1>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm ml-2">Manage blocked domains</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Domain
            </button>
          </div>
        </div>

        {/* Add Domain Form */}
        {showAddForm && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20 animate-fade-in">
            <form onSubmit={handleAddDomain} className="flex gap-4">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total Blacklisted Domains</p>
              <p className="text-4xl font-bold text-slate-900 mt-1">{domains.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Domains List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-600">Loading...</div>
          ) : filteredDomains.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm ? 'No domains found' : 'No blacklisted domains'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredDomains.map((domain, index) => (
                <div
                  key={index}
                  className="p-6 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-slate-900 font-medium">{domain}</span>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(domain)}
                    disabled={removeMutation.isPending}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
