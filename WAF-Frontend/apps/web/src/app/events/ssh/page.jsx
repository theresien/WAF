"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/utils/api";

export default function SshEventsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch SSH events
  const { data: eventsData = { content: [] }, isLoading } = useQuery({
    queryKey: ["events", "SSH_FAILED_AUTH"],
    queryFn: () => api.getEventsByType("SSH_FAILED_AUTH", 0, 500),
  });

  const events = eventsData.content || [];

  // Filter events by search term
  const filteredEvents = events.filter(
    (event) => {
      const ip = event.sourceIp || event.deviceIp || "";
      const user = event.username || "";
      const rule = event.ruleName || "";
      return ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  // Build time series data (group by hour)
  const eventsByHour = {};
  events.forEach((e) => {
    const date = new Date(e.timestamp);
    const hour = date.getHours();
    const key = `${date.toISOString().split("T")[0]} ${hour}:00`;
    eventsByHour[key] = (eventsByHour[key] || 0) + 1;
  });
  const timeSeriesData = Object.keys(eventsByHour)
    .sort()
    .map((key) => ({
      time: key,
      count: eventsByHour[key],
    }));

  // Build top source IPs
  const ipCounts = {};
  events.forEach((e) => {
    const ip = e.sourceIp || e.deviceIp || "Unknown";
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  });
  const topIpsData = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({
      ip,
      count,
    }));

  // Calculate stats
  const uniqueIps = Object.keys(ipCounts).length;
  const avgAttemptsPerIp = events.length / (uniqueIps || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-2 transition-all hover:gap-3"
            >
              <span>←</span> Dashboard
            </Link>
            <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🔐 SSH Attack Events
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Real-time monitoring of SSH brute force and unauthorized access attempts
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total SSH Events" value={events.length} icon="🔐" color="from-red-500 to-red-600" />
          <StatCard title="Unique Source IPs" value={uniqueIps} icon="🌐" color="from-blue-500 to-blue-600" />
          <StatCard
            title="Avg Attempts per IP"
            value={avgAttemptsPerIp.toFixed(1)}
            icon="📊"
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Time Series */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              SSH Events Timeline
            </h2>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Loading...
              </div>
            ) : timeSeriesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Source IPs */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Top Attacking IPs
            </h2>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Loading...
              </div>
            ) : topIpsData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topIpsData}
                  layout="vertical"
                  margin={{ left: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="ip" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search Events
            </label>
            <input
              type="text"
              placeholder="Search by IP address, username, or rule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Events Table */}
          {isLoading ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              No events found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 border-b-2 border-indigo-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      Source IP
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      Username Attempted
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      Rule
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      Port
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, index) => (
                    <tr
                      key={event.id}
                      className={`border-b border-slate-100 dark:border-slate-700 ${index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-700/50"} hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-900 dark:text-white">
                        {event.sourceIp || event.deviceIp || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {event.username || "root"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs truncate max-w-xs">
                        {event.ruleName || "SSH Brute Force"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {event.port || "22"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results summary */}
          <div className="bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600 px-6 py-3 text-sm text-slate-600 dark:text-slate-300 mt-4">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/90 text-sm font-semibold">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-5xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}
