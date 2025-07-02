import { useEffect, useRef } from 'react';

interface TemperatureUpdate {
  groupName: string;
  temperature: number;
  timestamp: string;
}

const Index = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const updatesRef = useRef<TemperatureUpdate[]>([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket('ws://192.168.1.100:3000');
        
        wsRef.current.onopen = () => {
          console.log('Connected to WebSocket server');
          updateConnectionStatus(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received temperature update:', data);
            addTemperatureUpdate(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket connection closed');
          updateConnectionStatus(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          updateConnectionStatus(false);
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 3000);
      }
    };

    const updateConnectionStatus = (connected: boolean) => {
      const statusElement = document.getElementById('connection-status');
      if (statusElement) {
        statusElement.textContent = connected ? 'Connected' : 'Disconnected';
        statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
      }
    };

    const addTemperatureUpdate = (update: TemperatureUpdate) => {
      // Add timestamp if not provided
      const newUpdate = {
        ...update,
        timestamp: update.timestamp || new Date().toISOString()
      };

      updatesRef.current = [newUpdate, ...updatesRef.current];
      
      // Keep only the last 50 updates to prevent memory issues
      if (updatesRef.current.length > 50) {
        updatesRef.current = updatesRef.current.slice(0, 50);
      }

      renderUpdates();
    };

    const getGroupColor = (groupName: string): string => {
      const colors = [
        '#3B82F6', // blue
        '#10B981', // emerald
        '#F59E0B', // amber
        '#EF4444', // red
        '#8B5CF6', // violet
        '#06B6D4', // cyan
        '#84CC16', // lime
        '#F97316', // orange
      ];
      
      // Simple hash function to assign consistent colors to groups
      let hash = 0;
      for (let i = 0; i < groupName.length; i++) {
        hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    const formatTimestamp = (timestamp: string): string => {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        month: 'short',
        day: 'numeric'
      });
    };

    const renderUpdates = () => {
      const container = document.getElementById('updates-container');
      if (!container) return;

      container.innerHTML = updatesRef.current.map(update => `
        <div class="temperature-card" style="border-left-color: ${getGroupColor(update.groupName)}">
          <div class="card-header">
            <span class="group-badge" style="background-color: ${getGroupColor(update.groupName)}">
              ${update.groupName}
            </span>
            <span class="timestamp">${formatTimestamp(update.timestamp)}</span>
          </div>
          <div class="temperature-display">
            <span class="temperature-value">${update.temperature}°C</span>
            <span class="temperature-label">Temperature</span>
          </div>
        </div>
      `).join('');
    };

    // Initialize connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <>
      <div className="dashboard">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Live Temperature Monitor</h1>
          <div className="connection-indicator">
            <div className="status-dot"></div>
            <span id="connection-status" className="connection-status disconnected">Disconnected</span>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="updates-section">
            <h2 className="section-title">Recent Temperature Updates</h2>
            <div id="updates-container" className="updates-container">
              <div className="no-data">
                <div className="no-data-icon">📡</div>
                <p>Waiting for temperature data...</p>
                <p className="no-data-subtitle">Make sure your WebSocket server is running at ws://192.168.1.100:3000</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .dashboard-title {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #ef4444;
          animation: pulse 2s infinite;
        }

        .connection-status.connected + .status-dot,
        .connection-status.connected ~ .status-dot {
          background-color: #10b981;
        }

        .connection-status {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .connection-status.connected {
          color: #10b981;
        }

        .connection-status.disconnected {
          color: #ef4444;
        }

        .dashboard-main {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .updates-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .section-title {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
        }

        .updates-container {
          display: grid;
          gap: 1rem;
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .updates-container::-webkit-scrollbar {
          width: 6px;
        }

        .updates-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .updates-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .updates-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .temperature-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border-left: 4px solid #3b82f6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: slideIn 0.3s ease-out;
        }

        .temperature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .group-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .timestamp {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .temperature-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .temperature-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }

        .temperature-label {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 500;
        }

        .no-data {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        .no-data-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .no-data p {
          margin: 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 500;
        }

        .no-data-subtitle {
          font-size: 0.875rem !important;
          color: #9ca3af !important;
          font-weight: 400 !important;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1rem;
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .dashboard-title {
            font-size: 1.75rem;
          }

          .dashboard-main {
            padding: 1rem;
          }

          .updates-section {
            padding: 1.5rem;
          }

          .temperature-card {
            padding: 1rem;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .temperature-value {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .dashboard-title {
            font-size: 1.5rem;
          }

          .updates-section {
            padding: 1rem;
          }

          .temperature-value {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </>
  );
};

export default Index;
