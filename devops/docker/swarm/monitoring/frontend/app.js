// Configuration
const CONFIG = {
    prometheusUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:9090'
        : `http://${window.location.hostname}:9090`,
    refreshInterval: 5000, // 5 seconds
    services: ['prometheus', 'grafana', 'node-exporter', 'traefik', 'api', 'postgres']
};

// State
let updateInterval = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    startAutoRefresh();
});

// Initialize dashboard components
function initializeDashboard() {
    updateStatus('Connecting...', 'connecting');
    fetchMetrics();
    updateLastUpdateTime();
}

// Start auto-refresh
function startAutoRefresh() {
    updateInterval = setInterval(() => {
        fetchMetrics();
        updateLastUpdateTime();
    }, CONFIG.refreshInterval);
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Update status indicator
function updateStatus(text, status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = text;
    statusDot.className = 'status-dot';
    
    if (status === 'connected') {
        statusDot.classList.add('connected');
    } else if (status === 'error') {
        statusDot.classList.add('error');
    }
}

// Fetch all metrics from Prometheus
async function fetchMetrics() {
    try {
        // Fetch multiple metrics in parallel
        const [
            cpuData,
            memoryData,
            networkData,
            latencyData,
            requestRateData,
            errorRateData
        ] = await Promise.all([
            fetchCPUUsage(),
            fetchMemoryUsage(),
            fetchNetworkTraffic(),
            fetchAPILatency(),
            fetchRequestRate(),
            fetchErrorRate()
        ]);

        // Update UI with fetched data
        updateCPUDisplay(cpuData);
        updateMemoryDisplay(memoryData);
        updateNetworkDisplay(networkData);
        updateLatencyDisplay(latencyData);
        updateRequestRateDisplay(requestRateData);
        updateErrorRateDisplay(errorRateData);
        
        // Update service status
        await updateServiceStatus();
        
        updateStatus('Connected', 'connected');
    } catch (error) {
        console.error('Error fetching metrics:', error);
        updateStatus('Connection Error', 'error');
        showError('Failed to fetch metrics from Prometheus');
    }
}

// Query Prometheus API
async function queryPrometheus(query) {
    const url = `${CONFIG.prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Prometheus API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'success' || !data.data.result || data.data.result.length === 0) {
        return null;
    }
    
    return data.data.result;
}

// Fetch CPU usage
async function fetchCPUUsage() {
    try {
        const query = '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)';
        const result = await queryPrometheus(query);
        
        if (result && result[0] && result[0].value) {
            return parseFloat(result[0].value[1]);
        }
        return null;
    } catch (error) {
        console.error('Error fetching CPU usage:', error);
        return null;
    }
}

// Fetch memory usage
async function fetchMemoryUsage() {
    try {
        const query = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100';
        const result = await queryPrometheus(query);
        
        if (result && result[0] && result[0].value) {
            return parseFloat(result[0].value[1]);
        }
        return null;
    } catch (error) {
        console.error('Error fetching memory usage:', error);
        return null;
    }
}

// Fetch network traffic
async function fetchNetworkTraffic() {
    try {
        const query = 'rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])';
        const result = await queryPrometheus(query);
        
        if (result && result[0] && result[0].value) {
            return parseFloat(result[0].value[1]);
        }
        return null;
    } catch (error) {
        console.error('Error fetching network traffic:', error);
        return null;
    }
}

// Fetch API latency
async function fetchAPILatency() {
    try {
        const query = 'avg(traefik_service_request_duration_seconds_sum / traefik_service_requests_total)';
        const result = await queryPrometheus(query);
        
        if (result && result[0] && result[0].value) {
            return parseFloat(result[0].value[1]) * 1000; // Convert to milliseconds
        }
        return null;
    } catch (error) {
        console.error('Error fetching API latency:', error);
        return null;
    }
}

// Fetch request rate
async function fetchRequestRate() {
    try {
        const query = 'sum(rate(traefik_service_requests_total[5m]))';
        const result = await queryPrometheus(query);
        
        if (result && result[0] && result[0].value) {
            return parseFloat(result[0].value[1]);
        }
        return null;
    } catch (error) {
        console.error('Error fetching request rate:', error);
        return null;
    }
}

// Fetch error rate
async function fetchErrorRate() {
    try {
        const query = 'sum(rate(traefik_service_requests_total{code=~"5.."}[5m]))';
        const result = await queryPrometheus(query);
        
        if (result && result[0] && result[0].value) {
            return parseFloat(result[0].value[1]);
        }
        return null;
    } catch (error) {
        console.error('Error fetching error rate:', error);
        return null;
    }
}

// Update CPU display
function updateCPUDisplay(value) {
    const cpuValue = document.getElementById('cpuValue');
    const cpuProgress = document.getElementById('cpuProgress');
    
    if (value !== null && !isNaN(value)) {
        const percentage = Math.min(100, Math.max(0, value));
        cpuValue.textContent = `${percentage.toFixed(1)}%`;
        cpuProgress.style.width = `${percentage}%`;
        
        cpuProgress.className = 'progress-bar';
        if (percentage > 80) {
            cpuProgress.classList.add('danger');
        } else if (percentage > 60) {
            cpuProgress.classList.add('warning');
        }
    } else {
        cpuValue.textContent = 'N/A';
        cpuProgress.style.width = '0%';
    }
}

// Update memory display
function updateMemoryDisplay(value) {
    const memoryValue = document.getElementById('memoryValue');
    const memoryProgress = document.getElementById('memoryProgress');
    
    if (value !== null && !isNaN(value)) {
        const percentage = Math.min(100, Math.max(0, value));
        memoryValue.textContent = `${percentage.toFixed(1)}%`;
        memoryProgress.style.width = `${percentage}%`;
        
        memoryProgress.className = 'progress-bar';
        if (percentage > 80) {
            memoryProgress.classList.add('danger');
        } else if (percentage > 60) {
            memoryProgress.classList.add('warning');
        }
    } else {
        memoryValue.textContent = 'N/A';
        memoryProgress.style.width = '0%';
    }
}

// Update network display
function updateNetworkDisplay(value) {
    const networkValue = document.getElementById('networkValue');
    
    if (value !== null && !isNaN(value)) {
        const formatted = formatBytes(value);
        networkValue.textContent = formatted;
    } else {
        networkValue.textContent = 'N/A';
    }
}

// Update latency display
function updateLatencyDisplay(value) {
    const latencyValue = document.getElementById('latencyValue');
    
    if (value !== null && !isNaN(value)) {
        latencyValue.textContent = `${value.toFixed(2)} ms`;
    } else {
        latencyValue.textContent = 'N/A';
    }
}

// Update request rate display
function updateRequestRateDisplay(value) {
    const requestRateValue = document.getElementById('requestRateValue');
    
    if (value !== null && !isNaN(value)) {
        requestRateValue.textContent = `${value.toFixed(2)} req/s`;
    } else {
        requestRateValue.textContent = 'N/A';
    }
}

// Update error rate display
function updateErrorRateDisplay(value) {
    const errorRateValue = document.getElementById('errorRateValue');
    
    if (value !== null && !isNaN(value)) {
        errorRateValue.textContent = `${value.toFixed(2)} err/s`;
        
        // Highlight if error rate is high
        if (value > 0.1) {
            errorRateValue.style.color = 'var(--danger-color)';
        } else {
            errorRateValue.style.color = 'var(--text-primary)';
        }
    } else {
        errorRateValue.textContent = 'N/A';
    }
}

// Update service status
async function updateServiceStatus() {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';
    
    for (const service of CONFIG.services) {
        const status = await checkServiceStatus(service);
        const serviceCard = createServiceCard(service, status);
        servicesGrid.appendChild(serviceCard);
    }
}

// Check service status
async function checkServiceStatus(serviceName) {
    try {
        // Try to query a metric related to the service
        let query;
        
        switch (serviceName) {
            case 'prometheus':
                query = 'up{job="prometheus"}';
                break;
            case 'node-exporter':
                query = 'up{job="node-exporter"}';
                break;
            case 'traefik':
                query = 'up{job="traefik"}';
                break;
            default:
                // For other services, try a generic up query
                query = `up{instance=~".*${serviceName}.*"}`;
        }
        
        const result = await queryPrometheus(query);
        
        if (result && result.length > 0) {
            const value = result[0].value[1];
            return value === '1' ? 'healthy' : 'error';
        }
        
        return 'warning';
    } catch (error) {
        console.error(`Error checking status for ${serviceName}:`, error);
        return 'warning';
    }
}

// Create service card
function createServiceCard(serviceName, status) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    const name = document.createElement('div');
    name.className = 'service-name';
    name.textContent = serviceName;
    
    const statusEl = document.createElement('div');
    statusEl.className = `service-status ${status}`;
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    
    card.appendChild(name);
    card.appendChild(statusEl);
    
    return card;
}

// Format bytes to human readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}/s`;
}

// Show error message
function showError(message) {
    const alertsList = document.getElementById('alertsList');
    const alertItem = document.createElement('div');
    alertItem.className = 'alert-item error';
    alertItem.innerHTML = `
        <span class="alert-icon">⚠️</span>
        <div class="alert-content">
            <div class="alert-title">${message}</div>
            <div class="alert-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    
    alertsList.insertBefore(alertItem, alertsList.firstChild);
    
    // Keep only last 5 alerts
    while (alertsList.children.length > 5) {
        alertsList.removeChild(alertsList.lastChild);
    }
}

