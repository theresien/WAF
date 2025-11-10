"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/utils/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function DevicesPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notification, setNotification] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [newHostname, setNewHostname] = useState("");
  const queryClient = useQueryClient();

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const { data: devicesData = { content: [] }, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.getDevices(0, 200),
    refetchInterval: 5000,
  });

  const devices = devicesData.content || [];
  
  const isDeviceConnected = (device) => {
    return device.isConnected === true;
  };

  const filteredDevices =
    statusFilter === "ALL"
      ? devices
      : devices.filter((d) => d.status === statusFilter);

  const connectedDevices = devices.filter((d) => d.isConnected === true);

  const banMutation = useMutation({
    mutationFn: (mac) => api.banDevice(mac),
    onMutate: async (mac) => {
      await queryClient.cancelQueries(["devices"]);
      const previous = queryClient.getQueryData(["devices"]);
      queryClient.setQueryData(["devices"], (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((d) =>
            d.macAddress === mac ? { ...d, status: "BANNED" } : d
          ),
        };
      });
      return { previous };
    },
    onSuccess: (data, mac) => {
      showNotification(`Device ${mac} banned`, "success");
    },
    onError: async (error, mac, context) => {
      await queryClient.refetchQueries(["devices"]);
      const updated = queryClient.getQueryData(["devices"]);
      const device = updated?.content?.find(d => d.macAddress === mac);
      if (device?.status === "BANNED") {
        showNotification(`Device ${mac} banned`, "success");
      } else {
        queryClient.setQueryData(["devices"], context.previous);
        showNotification(`Failed to ban ${mac}`, "error");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(["devices"]);
    },
  });

  const allowMutation = useMutation({
    mutationFn: (mac) => api.allowDevice(mac),
    onMutate: async (mac) => {
      await queryClient.cancelQueries(["devices"]);
      const previous = queryClient.getQueryData(["devices"]);
      queryClient.setQueryData(["devices"], (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((d) =>
            d.macAddress === mac ? { ...d, status: "ALLOWED" } : d
          ),
        };
      });
      return { previous };
    },
    onSuccess: (data, mac) => {
      showNotification(`Device ${mac} allowed`, "success");
    },
    onError: async (error, mac, context) => {
      await queryClient.refetchQueries(["devices"]);
      const updated = queryClient.getQueryData(["devices"]);
      const device = updated?.content?.find(d => d.macAddress === mac);
      if (device?.status === "ALLOWED") {
        showNotification(`Device ${mac} allowed`, "success");
      } else {
        queryClient.setQueryData(["devices"], context.previous);
        showNotification(`Failed to allow ${mac}`, "error");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(["devices"]);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === "success" 
            ? "bg-green-500 text-white" 
            : "bg-red-500 text-white"
        }`}>
          {notification.message}
        </div>
      )}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-2 transition-all hover:gap-3">
                <span>←</span> Dashboard
              </Link>
              <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                📱 Devices
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Manage connected devices and access policies
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">🟢 Connected Devices</h2>
            <span className="text-sm text-slate-600 dark:text-slate-400">{connectedDevices.length} online</span>
          </div>
          {connectedDevices.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No devices currently connected</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedDevices.map((device) => (
                <div key={device.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-400 hover:shadow-lg transition-all bg-white dark:bg-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p 
                          className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 flex items-center gap-2"
                          onClick={() => {
                            setEditingDevice(device);
                            setNewHostname(device.hostname || '');
                          }}
                        >
                          {device.hostname || "Unknown Device"}
                          <span className="text-xs">✏️</span>
                        </p>
                        {device.isConnected && (
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      {device.vendor && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{device.vendor}</p>}
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{device.macAddress}</p>
                    </div>
                    <StatusBadge status={device.status} />
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium">IP:</span> <span className="font-mono">{device.ipAddress}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {device.status !== "ALLOWED" && (
                      <button onClick={() => allowMutation.mutate(device.macAddress)} disabled={allowMutation.isPending} className="flex-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition disabled:opacity-50">
                        Allow
                      </button>
                    )}
                    {device.status !== "BANNED" && (
                      <button onClick={() => banMutation.mutate(device.macAddress)} disabled={banMutation.isPending} className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition disabled:opacity-50">
                        Ban
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          {["ALL", "ALLOWED", "BANNED", "MONITORED"].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-6 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                statusFilter === status
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-indigo-400 shadow"
              }`}>
              {status}
            </button>
          ))}
        </div>

        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading devices...</div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No devices found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 border-b-2 border-indigo-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Device</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">MAC Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">IP Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Connection</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Last Seen</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device, index) => (
                    <tr key={device.id} className={`border-b border-slate-100 dark:border-slate-700 ${index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-700/50"} hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 transition-colors`}>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-slate-900 dark:text-white">{device.hostname || "Unknown"}</div>
                        {device.vendor && <div className="text-xs text-slate-500 dark:text-slate-400">{device.vendor}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">{device.macAddress}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">{device.ipAddress}</td>
                      <td className="px-6 py-4 text-sm"><StatusBadge status={device.status} /></td>
                      <td className="px-6 py-4 text-sm">
                        {isDeviceConnected(device) ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Offline</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {device.status !== "ALLOWED" && (
                            <button onClick={() => allowMutation.mutate(device.macAddress)} disabled={allowMutation.isPending} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition disabled:opacity-50">Allow</button>
                          )}
                          {device.status !== "BANNED" && (
                            <button onClick={() => banMutation.mutate(device.macAddress)} disabled={banMutation.isPending} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition disabled:opacity-50">Ban</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <SummaryCard title="Total Devices" value={devices.length} color="bg-blue-500" />
          <SummaryCard title="Banned Devices" value={devices.filter((d) => d.status === "BANNED").length} color="bg-red-500" />
          <SummaryCard title="Allowed Devices" value={devices.filter((d) => d.status === "ALLOWED").length} color="bg-green-500" />
        </div>

        {/* Edit Hostname Modal */}
        {editingDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingDevice(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Edit Device Hostname</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Device MAC</label>
                <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded">{editingDevice.macAddress}</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hostname</label>
                <input
                  type="text"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter hostname"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (newHostname && newHostname !== editingDevice.hostname) {
                      api.updateDeviceHostname(editingDevice.id, newHostname)
                        .then(() => {
                          queryClient.invalidateQueries(['devices']);
                          showNotification(`Hostname updated to ${newHostname}`, 'success');
                          setEditingDevice(null);
                        })
                        .catch(() => showNotification('Failed to update hostname', 'error'));
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-transform font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDevice(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    ALLOWED: "bg-green-100 text-green-700",
    BANNED: "bg-red-100 text-red-700",
    MONITORED: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/90 text-sm font-semibold">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
      </div>
    </div>
  );
}
