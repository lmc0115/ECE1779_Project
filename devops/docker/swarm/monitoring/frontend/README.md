# Monitoring Dashboard Frontend

A beautiful, modern monitoring dashboard for UniConn that displays real-time metrics from Prometheus.

## Features

- **Real-time Metrics**: Displays CPU usage, memory usage, network traffic, API latency, request rate, and error rate
- **Service Status**: Shows the health status of all monitoring services
- **Alert System**: Displays recent alerts and system notifications
- **Auto-refresh**: Automatically updates every 5 seconds
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Dark theme with smooth animations and transitions

## Usage

### Local Development

1. Make sure Prometheus is running on port 9090
2. Open `index.html` in a web browser
3. The dashboard will automatically connect to Prometheus and start displaying metrics

### Docker Deployment

The frontend is included in the monitoring stack. To deploy:

```bash
docker stack deploy -c monitoring-stack.yml monitoring
```

The dashboard will be available at `http://your-server:8080`

## Configuration

You can modify the Prometheus URL in `app.js`:

```javascript
const CONFIG = {
    prometheusUrl: 'http://your-prometheus-url:9090',
    refreshInterval: 5000, // milliseconds
    services: ['prometheus', 'grafana', 'node-exporter', 'traefik', 'api', 'postgres']
};
```

## Metrics Displayed

- **CPU Usage**: Average CPU usage across all nodes
- **Memory Usage**: Total memory consumption percentage
- **Network Traffic**: Bytes per second (receive + transmit)
- **API Latency**: Average API response time in milliseconds
- **Request Rate**: Requests per second
- **Error Rate**: 5xx errors per second

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

