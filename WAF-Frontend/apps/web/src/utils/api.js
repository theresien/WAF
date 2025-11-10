// API client for WAF-AP Manager backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function apiCall(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`API Call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
      const error = new Error(
        `API Error: ${response.status} ${response.statusText}`,
      );
      error.status = response.status;
      error.details = errorText;
      throw error;
    }

    const data = await response.json();
    console.log(`API Success: ${options.method || 'GET'} ${url}`, data);
    
    // Check if response has status field indicating error
    if (data.status === "error") {
      const error = new Error(data.message || "Operation failed");
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`API Call Failed: ${url}`, error);
    throw error;
  }
}

export const api = {
  // Devices
  getDevices: (page = 0, size = 20) =>
    apiCall(`/devices?page=${page}&size=${size}`),
  getDeviceById: (id) => apiCall(`/devices/${id}`),
  getDevicesByMac: (mac) => apiCall(`/devices/mac/${mac}`),
  getDevicesByIp: (ip) => apiCall(`/devices/ip/${ip}`),
  getDevicesByStatus: (status) => apiCall(`/devices/status/${status}`),
  getActiveDevices: (hours = 1) => apiCall(`/devices/active?hours=${hours}`),

  // Events
  getEvents: (page = 0, size = 20) =>
    apiCall(`/events?page=${page}&size=${size}`),
  getEventsByType: (type, page = 0, size = 20) =>
    apiCall(`/events/type/${type}?page=${page}&size=${size}`),
  getEventsByDevice: (deviceId, page = 0, size = 20) =>
    apiCall(`/events/device/${deviceId}?page=${page}&size=${size}`),
  getEventById: (id) => apiCall(`/events/${id}`),

  // Policy
  banDevice: (macAddress, reason = "Banned from dashboard") =>
    apiCall(`/policy/devices/${macAddress}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  allowDevice: (macAddress) =>
    apiCall(`/policy/devices/${macAddress}/allow`, {
      method: "POST",
      body: JSON.stringify({ reason: "Allowed from dashboard" }),
    }),
  getPolicyStats: () => apiCall("/policy/stats"),
  
  // Ban IP
  banIpAddress: (ip) =>
    apiCall(`/policy/ip/${ip}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason: "Banned from threat intel" }),
    }),
  
  // Update device hostname
  updateDeviceHostname: (deviceId, hostname) =>
    apiCall(`/devices/${deviceId}/hostname`, {
      method: "PATCH",
      body: JSON.stringify({ hostname }),
    }),
};

// Blacklist
export const getBlacklistedDomains = () => apiCall("/blacklist/domains");
export const addBlacklistedDomain = (domain) =>
  apiCall("/blacklist/domains", {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
export const updateBlacklistedDomain = (domain, severity) =>
  apiCall(`/blacklist/domains/${encodeURIComponent(domain)}`, {
    method: "PUT",
    body: JSON.stringify({ severity }),
  });
export const removeBlacklistedDomain = (domain) =>
  apiCall(`/blacklist/domains/${encodeURIComponent(domain)}`, {
    method: "DELETE",
  });


