"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/utils/api";

export default function HttpEventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const { data: eventsData = { content: [] }, isLoading } = useQuery({
    queryKey: ["events", "HTTP_ATTACK"],
    queryFn: () => api.getEventsByType("HTTP_ATTACK", 0, 500),
    refetchInterval: 5000,
  });

  const events = eventsData.content || [];
  const severityMap = { 1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "CRITICAL" };
  
  const getSeverity = (sev) => {
    if (sev === null || sev === undefined) return "MEDIUM";
    return severityMap[sev] || "MEDIUM";
  };

  const filteredEvents = events.filter((event) => {
    const ip = event.sourceIp || event.deviceIp || "";
    const rule = event.ruleName || "";
    const msg = event.messageJson || "";
    const matchesSearch =
      ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.toLowerCase().includes(searchTerm.toLowerCase());

    const severity = getSeverity(event.severity);
    const matchesSeverity =
      severityFilter === "ALL" || severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const severityCount = {};
  events.forEach((e) => {
    const severity = getSeverity(e.severity);
    severityCount[severity] = (severityCount[severity] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2 transition-all hover:gap-3">
              <span>←</span> Dashboard
            </Link>
            <div className="h-8 w-px bg-slate-300"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🛡️ HTTP Security Events
            </h1>
          </div>
          <p className="text-slate-600 text-sm">Real-time monitoring of HTTP attacks</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by IP, rule name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "CRITICAL", color: "from-red-500 to-red-600", icon: "🔴" },
              { name: "HIGH", color: "from-orange-500 to-orange-600", icon: "🟠" },
              { name: "MEDIUM", color: "from-yellow-500 to-yellow-600", icon: "🟡" },
              { name: "LOW", color: "from-green-500 to-green-600", icon: "🟢" }
            ].map((severity) => (
              <div key={severity.name} className={`bg-gradient-to-br ${severity.color} p-4 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold opacity-90">{severity.name}</p>
                  <span className="text-lg">{severity.icon}</span>
                </div>
                <p className="text-3xl font-bold">{severityCount[severity.name] || 0}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No events found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Source IP</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Rule</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Method</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">URI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, index) => (
                    <tr key={event.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/50 transition-colors`}>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(event.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-900">{event.sourceIp || event.deviceIp || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-xs">{event.ruleName || "-"}</td>
                      <td className="px-6 py-4 text-sm"><SeverityBadge severity={getSeverity(event.severity)} /></td>
                      <td className="px-6 py-4 text-sm text-slate-600">{event.method || "GET"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                        <div className="truncate font-mono text-xs">{event.uri || event.requestUri || "-"}</div>
                        {event.domain && <div className="text-xs text-red-600 mt-1">🚫 {event.domain}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-sm text-slate-600">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </div>
      </main>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    CRITICAL: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
    HIGH: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg",
    MEDIUM: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg",
    LOW: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg",
  };
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${styles[severity] || "bg-gray-500 text-white"}`}>
      {severity}
    </span>
  );
}
