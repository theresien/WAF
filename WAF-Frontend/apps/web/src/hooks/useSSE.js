import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export function useSSE(endpoint, onMessage) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}${endpoint}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('devices', (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {}
    });

    eventSource.addEventListener('events', (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {}
    });

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [endpoint]);

  return isConnected;
}
