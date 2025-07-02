
import { useEffect, useRef } from 'react';

interface TemperatureUpdate {
  groupName: string;
  temperature: number;
  timestamp: string;
}

interface GroupData {
  [key: string]: TemperatureUpdate;
}

const Index = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const groupDataRef = useRef<GroupData>({});

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
            updateTemperatureData(data);
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

    const updateTemperatureData = (update: TemperatureUpdate) => {
      // Add timestamp if not provided
      const newUpdate = {
        ...update,
        timestamp: update.timestamp || new Date().toISOString()
      };

      // Update or add the group data
      groupDataRef.current[update.groupName] = newUpdate;
      renderUpdates();
    };

    const getGroupColor = (groupName: string): string => {
      const colors = [
        '#10B981', // emerald-500
        '#059669', // emerald-600
        '#047857', // emerald-700
        '#065F46', // emerald-800
        '#6EE7B7', // emerald-300
        '#A7F3D0', // emerald-200
        '#34D399', // emerald-400
        '#D1FAE5', // emerald-100
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

      const groupEntries = Object.entries(groupDataRef.current);
      
      if (groupEntries.length === 0) {
        container.innerHTML = `
          <div class="no-data">
            <div class="no-data-icon">🌡️</div>
            <h3>Waiting for temperature data...</h3>
            <p class="no-data-subtitle">Make sure your WebSocket server is running at ws://192.168.1.100:3000</p>
          </div>
        `;
        return;
      }

      container.innerHTML = groupEntries.map(([groupName, update]) => `
        <div class="temperature-card" style="--group-color: ${getGroupColor(groupName)}">
          <div class="card-background"></div>
          <div class="card-content">
            <div class="card-header">
              <div class="group-badge" style="background: linear-gradient(135deg, ${getGroupColor(groupName)}, ${getGroupColor(groupName)}dd)">
                <span class="badge-icon">📊</span>
                <span class="badge-text">${groupName}</span>
              </div>
              <div class="timestamp">
                <span class="timestamp-icon">🕐</span>
                <span>${formatTimestamp(update.timestamp)}</span>
              </div>
            </div>
            <div class="temperature-display">
              <div class="temperature-value">${update.temperature}°C</div>
              <div class="temperature-label">Current Temperature</div>
              <div class="temperature-indicator">
                <div class="temp-bar">
                  <div class="temp-fill" style="width: ${Math.min(100, Math.max(0, (update.temperature + 20) * 2))}%"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-glow"></div>
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
        <div class="background-pattern"></div>
        <header className="dashboard-header">
          <div class="header-content">
            <h1 className="dashboard-title">
              <span class="title-icon">🌡️</span>
              Live Temperature Monitor
              <span class="title-glow"></span>
            </h1>
            <div className="connection-indicator">
              <div className="status-dot"></div>
              <span id="connection-status" className="connection-status disconnected">Disconnected</span>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="updates-section">
            <div class="section-header">
              <h2 className="section-title">Live Temperature Groups</h2>
              <div class="section-decoration"></div>
            </div>
            <div id="updates-container" className="updates-container">
              <div className="no-data">
                <div className="no-data-icon">🌡️</div>
                <h3>Waiting for temperature data...</h3>
                <p className="no-data-subtitle">Make sure your WebSocket server is running at ws://192.168.1.100:3000</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #0f766e 75%, #10b981 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .background-pattern {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(4, 120, 87, 0.05) 0%, transparent 50%);
          animation: float 20s ease-in-out infinite;
          z-index: 0;
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 10;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-title {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }

        .title-icon {
          font-size: 3rem;
          animation: pulse 2s ease-in-out infinite;
        }

        .title-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(16, 185, 129, 0.2), transparent);
          animation: shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #ef4444;
          animation: pulse 2s infinite;
          box-shadow: 0 0 10px currentColor;
        }

        .connection-status.connected ~ .status-dot {
          background-color: #10b981;
        }

        .connection-status {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dashboard-main {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
        }

        .updates-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .section-decoration {
          width: 100px;
          height: 4px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          margin: 0 auto;
          border-radius: 2px;
          animation: glow 2s ease-in-out infinite alternate;
        }

        .updates-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          max-height: 70vh;
          overflow-y: auto;
          padding: 1rem;
        }

        .updates-container::-webkit-scrollbar {
          width: 8px;
        }

        .updates-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .updates-container::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #10b981, #059669);
          border-radius: 10px;
        }

        .temperature-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          animation: slideIn 0.5s ease-out;
        }

        .temperature-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 20px 40px rgba(var(--group-color), 0.3);
        }

        .card-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(10px);
        }

        .card-content {
          position: relative;
          z-index: 2;
          padding: 2rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .group-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .badge-icon {
          font-size: 1.2rem;
        }

        .timestamp {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 25px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .timestamp-icon {
          font-size: 1rem;
        }

        .temperature-display {
          text-align: center;
        }

        .temperature-value {
          font-size: 4rem;
          font-weight: 800;
          color: white;
          line-height: 1;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
          animation: numberGlow 2s ease-in-out infinite alternate;
        }

        .temperature-label {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .temperature-indicator {
          margin-top: 1.5rem;
        }

        .temp-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .temp-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
          border-radius: 4px;
          transition: width 0.5s ease;
          position: relative;
        }

        .temp-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        .card-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, var(--group-color), transparent, var(--group-color));
          border-radius: 22px;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .temperature-card:hover .card-glow {
          opacity: 0.3;
          animation: rotate 3s linear infinite;
        }

        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.8);
          grid-column: 1 / -1;
        }

        .no-data-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          animation: bounce 2s infinite;
        }

        .no-data h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          color: white;
        }

        .no-data-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px #10b981; }
          100% { box-shadow: 0 0 20px #10b981, 0 0 30px #10b981; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes numberGlow {
          0% { text-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
          100% { text-shadow: 0 0 30px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.3); }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .dashboard-title {
            font-size: 2rem;
          }

          .title-icon {
            font-size: 2.5rem;
          }

          .dashboard-main {
            padding: 1rem;
          }

          .updates-section {
            padding: 1.5rem;
          }

          .updates-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .temperature-value {
            font-size: 3rem;
          }

          .card-content {
            padding: 1.5rem;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }

        @media (max-width: 480px) {
          .dashboard-title {
            font-size: 1.75rem;
          }

          .updates-section {
            padding: 1rem;
          }

          .temperature-value {
            font-size: 2.5rem;
          }

          .card-content {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default Index;
