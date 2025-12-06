# UniConn Monitoring Setup

## Requirements Checklist

### 1. DigitalOcean Built-in Monitoring (Provider Tools)
-  CPU usage monitoring
-  Memory usage monitoring  
-  Disk I/O monitoring
-  Network traffic monitoring

### 2. DigitalOcean Alerts (Configure in DO Console)
-  CPU > 70% for 5 min → Email notification
-  Memory > 80% for 5 min → Email notification
-  Droplet down / unreachable → Email notification

### 3. Self-Hosted Monitoring Stack (Prometheus + Grafana)

#### Prometheus Targets (All Healthy )
| Target | Status | Metrics |
|--------|--------|---------|
| node-exporter |  UP | CPU, Memory, Disk, Network |
| prometheus |  UP | Self-monitoring |
| traefik |  UP | HTTP requests, latency, errors |
| uniconn-api |  UP | Application metrics |

#### Grafana Dashboards
-  **UniConn System Overview** - http://143.198.39.167:3000/d/uniconn-overview
  - CPU Usage (current + over time)
  - Memory Usage (current + over time)
  - Disk Usage
  - HTTP Requests/sec
  - HTTP Request Rate by Status Code
  - API Response Time (p95)

### 4. Access URLs
| Service | URL | Credentials |
|---------|-----|-------------|
| **Main App** | http://143.198.39.167 | User login |
| **Grafana** | http://143.198.39.167:3000 | admin / admin |
| **Prometheus** | http://143.198.39.167:9090 | None |
| **Traefik Dashboard** | http://143.198.39.167:8080 | None |

### 5. Key Metrics Being Monitored

#### System Metrics (Node Exporter)
- `node_cpu_seconds_total` - CPU usage per core/mode
- `node_memory_MemAvailable_bytes` - Available memory
- `node_filesystem_avail_bytes` - Disk space
- `node_network_receive_bytes_total` - Network traffic

#### Application Metrics (UniConn API)
- `process_cpu_seconds_total` - API CPU usage
- `process_resident_memory_bytes` - API memory usage
- `http_request_duration_seconds` - Request latency

#### Traffic Metrics (Traefik)
- `traefik_entrypoint_requests_total` - Total HTTP requests
- `traefik_entrypoint_request_duration_seconds` - Request duration
- `traefik_service_requests_total` - Requests per service

### 6. Screenshots for Report
- [ ] DigitalOcean Monitoring Dashboard
- [ ] DigitalOcean Alerts Configuration
- [ ] Grafana UniConn System Overview Dashboard
- [ ] Prometheus Targets Page (all green)
- [ ] Traefik Dashboard showing traffic

---

## Quick Commands

```bash
# Check all Prometheus targets
curl -s http://143.198.39.167:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health}'

# Check API metrics
curl http://143.198.39.167/api/metrics | head -30

# Check service health
curl http://143.198.39.167/api/health
```
