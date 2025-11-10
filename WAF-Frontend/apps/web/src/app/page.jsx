"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/utils/api";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

export default function Dashboard() {
  // Fetch devices
  const { data: devicesData = { content: [] }, isLoading: devicesLoading } =
    useQuery({
      queryKey: ["devices"],
      queryFn: () => api.getDevices(0, 100),
    });

  // Fetch events
  const { data: eventsData = { content: [] }, isLoading: eventsLoading } =
    useQuery({
      queryKey: ["events"],
      queryFn: () => api.getEvents(0, 100),
    });

  // Fetch policy stats
  const { data: statsData = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getPolicyStats(),
  });

  const devices = devicesData.content || [];
  const events = eventsData.content || [];

  // Calculate stats
  const totalDevices = devices.length;
  const allowedDevices = devices.filter((d) => d.status === "ALLOWED").length;
  const bannedDevices = devices.filter((d) => d.status === "BANNED").length;
  const monitoredDevices = devices.filter(
    (d) => d.status === "MONITORED",
  ).length;
  const totalEvents = events.length;
  const todayEvents = events.filter((e) => {
    const eventDate = new Date(e.timestamp).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  }).length;

  // Chart data - device status distribution
  const deviceStatusData = [
    { name: "Allowed", value: allowedDevices },
    { name: "Monitored", value: monitoredDevices },
    { name: "Banned", value: bannedDevices },
  ];

  // Chart data - events by hour
  const eventsByHour = {};
  events.forEach((e) => {
    const hour = new Date(e.timestamp).getHours();
    eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
  });
  const eventHourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: eventsByHour[i] || 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🛡️ WAF-AP Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Real-time Network Security Monitoring & Protection
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Devices" value={totalDevices} icon="📱" color="from-blue-500 to-blue-600" isLoading={devicesLoading} />
          <StatCard title="Events Today" value={todayEvents} icon="⚡" color="from-orange-500 to-orange-600" isLoading={eventsLoading} />
          <StatCard title="Banned Devices" value={bannedDevices} icon="🚫" color="from-red-500 to-red-600" isLoading={devicesLoading} />
          <StatCard title="Total Events" value={totalEvents} icon="📊" color="from-purple-500 to-purple-600" isLoading={eventsLoading} />
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <NavLink href="/devices" title="Devices" icon="📱" color="from-blue-500 to-blue-600" />
          <NavLink href="/events/http" title="HTTP Events" icon="🌐" color="from-purple-500 to-purple-600" />
          <NavLink href="/blacklist" title="Blacklist" icon="🛡️" color="from-orange-500 to-red-600" />
          <NavLink href="/threat-intel" title="Threat Intel" icon="🎯" color="from-cyan-500 to-blue-600" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Device Status Distribution */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Device Status
            </h2>
            {devicesLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Events by Hour */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Events by Hour
            </h2>
            {eventsLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventHourData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
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
        </div>

        {/* Recent Events */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-6 mt-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Recent Events
          </h2>
          {eventsLoading ? (
            <div className="text-slate-500 dark:text-slate-400">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 text-center py-8">
              No events found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 border-b-2 border-indigo-200 dark:border-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300 font-semibold">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300 font-semibold">
                      Source IP
                    </th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300 font-semibold">
                      Rule
                    </th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300 font-semibold">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 5).map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          {event.eventType}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-200">
                        {event.sourceIp}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400 text-xs">
                        {event.ruleName || "-"}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400 text-xs">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, isLoading }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/90 text-sm font-semibold">{title}</p>
          <p className="text-4xl font-bold mt-2">{isLoading ? "..." : value}</p>
        </div>
        <div className="text-5xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

function NavLink({ href, title, icon, color }) {
  return (
    <Link to={href} className={`bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 hover:shadow-2xl transform hover:scale-105 transition-all flex items-center gap-4 text-white font-bold`}>
      <div className="text-5xl">{icon}</div>
      <div className="text-xl">{title}</div>
    </Link>
  );
}
