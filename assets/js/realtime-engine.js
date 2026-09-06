/**
 * THRINETHRA Real-Time Intelligence & Fleet Telematics Engine
 * Dynamic live stream generator and state manager for fleet events,
 * safety hazard detections, and command center telemetry.
 */

(function (global) {
  'use strict';

  class RealtimeDataEngine {
    constructor() {
      this.listeners = new Map();
      this.state = {
        activeBusesCount: 142,
        kmCoveredToday: 18420.4,
        hazardsToday: 89,
        incidentsToday: 14,
        fleetStatus: [
          { id: 'KA-05-AB-1147', route: '42B', speed: 18.5, lat: 12.9716, lng: 77.5946, location: 'MG Road Jn.', cameras: [true, true, true, true], fps: 30, lastSync: Date.now() },
          { id: 'KA-03-CJ-8820', route: '17A', speed: 24.2, lat: 12.9611, lng: 77.6412, location: 'Indiranagar 100ft Rd', cameras: [true, true, true, true], fps: 29.8, lastSync: Date.now() - 2000 },
          { id: 'KA-01-FL-3390', route: '9C', speed: 14.8, lat: 12.9784, lng: 77.6033, location: 'Shivajinagar Bus Station', cameras: [true, false, true, true], fps: 28.5, lastSync: Date.now() - 4000 },
          { id: 'KA-41-BQ-0512', route: '52', speed: 32.1, lat: 12.9327, lng: 77.6244, location: 'Koramangala 80ft Rd', cameras: [true, true, true, true], fps: 30, lastSync: Date.now() - 1000 },
          { id: 'KA-09-DP-6119', route: '335E', speed: 21.0, lat: 12.9502, lng: 77.5810, location: 'Lalbagh West Gate', cameras: [true, true, false, true], fps: 29.4, lastSync: Date.now() - 3000 }
        ],
        recentDetections: [
          { id: 'DET-9921', time: this._formatTime(0), type: 'HAZARD', category: 'Pothole', title: 'Pothole detected', location: 'MG Road km 3.2', severity: 3, bus: '42B (Front Cam)', conf: 96.4, status: 'Active' },
          { id: 'DET-9920', time: this._formatTime(-40), type: 'TRAFFIC', category: 'Congestion', title: 'Density spike 84%', location: 'Signal 7 Backlog, Indiranagar', severity: 4, bus: '17A (Front Cam)', conf: 91.2, status: 'Active' },
          { id: 'DET-9919', time: this._formatTime(-90), type: 'INCIDENT', category: 'Rash Overtake', title: 'Rash overtake & lane cut', location: 'Hosur Main Rd', severity: 4, plate: 'KA 05 AB 4412', conf: 94.8, bus: '42B (Rear Cam)', status: 'Acknowledged' },
          { id: 'DET-9918', time: this._formatTime(-150), type: 'SAFETY', category: 'Pedestrian Crossing', title: 'Crowded school crossing', location: 'Residency Rd Jn.', severity: 2, count: 6, bus: '9C (Front Cam)', conf: 98.1, status: 'Active' },
          { id: 'DET-9917', time: this._formatTime(-220), type: 'HAZARD', category: 'Signboard Damage', title: 'Missing direction signage', location: 'Jn. 12 Outer Ring Rd', severity: 2, bus: '52 (Side Cam)', conf: 89.5, status: 'Active' }
        ],
        routes: [
          { route: '42B', name: 'Whitefield → Majestic', delay: 9.2, baseline: 9.0, buses: 18, status: 'Severe' },
          { route: '17A', name: 'HSR Layout → Silk Board', delay: 6.4, baseline: 6.5, buses: 14, status: 'Delayed' },
          { route: '9C',  name: 'Yeshwanthpur → Shivajinagar', delay: 2.7, baseline: 2.8, buses: 12, status: 'On time' },
          { route: '52',  name: 'Electronic City → Jayanagar', delay: 4.5, baseline: 4.6, buses: 16, status: 'On time' },
          { route: '335E', name: 'Kadugodi → Kempegowda Bus Station', delay: 8.1, baseline: 7.5, buses: 20, status: 'Delayed' }
        ]
      };

      this._startTelemetryLoop();
    }

    _formatTime(offsetSeconds = 0) {
      const d = new Date(Date.now() + offsetSeconds * 1000);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }

    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
      return () => {
        const arr = this.listeners.get(event) || [];
        this.listeners.set(event, arr.filter(cb => cb !== callback));
      };
    }

    emit(event, data) {
      const arr = this.listeners.get(event);
      if (arr) {
        arr.forEach(cb => {
          try { cb(data); } catch (e) { console.error('Realtime callback error:', e); }
        });
      }
    }

    _startTelemetryLoop() {
      // Periodic fleet speed and GPS jitter
      setInterval(() => {
        this.state.fleetStatus.forEach(bus => {
          bus.speed = Math.max(8, +(bus.speed + (Math.random() * 4 - 2)).toFixed(1));
          bus.lat += (Math.random() - 0.5) * 0.0003;
          bus.lng += (Math.random() - 0.5) * 0.0003;
          bus.lastSync = Date.now();
        });
        this.state.kmCoveredToday = +(this.state.kmCoveredToday + 0.12).toFixed(1);
        this.emit('fleet:update', this.state.fleetStatus);
      }, 2500);

      // Multi-Bus Real-Time Road & Surroundings Detections Pool
      const mockPool = [
        { type: 'HAZARD', category: 'Pothole', title: 'Road Pothole Cluster (depth 45mm)', location: 'MG Road km 3.2', severity: 3, busId: 'KA-05-AB-1147', route: '42B', cam: 'Front Cam' },
        { type: 'INCIDENT', category: 'Tailgating OCR', title: 'Tailgating Vehicle (2.1m separation)', location: 'Indiranagar 100ft Rd', severity: 4, busId: 'KA-03-CJ-8820', route: '17A', cam: 'Rear OCR', plate: 'KA 03 MN ' + Math.floor(1000 + Math.random() * 9000) },
        { type: 'HAZARD', category: 'Waterlogging', title: 'Waterlogging Zone (depth 12cm)', location: 'Shivajinagar Bus Station', severity: 3, busId: 'KA-01-FL-3390', route: '9C', cam: 'Front Cam' },
        { type: 'TRAFFIC', category: 'Double Parking', title: 'Illegal double parking blocking bus lane', location: 'Koramangala 80ft Rd', severity: 3, busId: 'KA-41-BQ-0512', route: '52', cam: 'Side Cam', plate: 'KA 51 Z ' + Math.floor(1000 + Math.random() * 9000) },
        { type: 'SAFETY', category: 'Crowded Stop', title: 'Platform density spike (42 waiting passengers)', location: 'Lalbagh West Gate', severity: 2, busId: 'KA-09-DP-6119', route: '335E', cam: 'Side Cam' },
        { type: 'INCIDENT', category: 'Signal Jump', title: 'Motorcycle red light cut-across', location: 'Trinity Circle', severity: 4, busId: 'KA-05-AB-1147', route: '42B', cam: 'Front Cam', plate: 'MH 02 EE ' + Math.floor(1000 + Math.random() * 9000) },
        { type: 'SAFETY', category: 'Pedestrian Crossing', title: 'School crosswalk pedestrian alert', location: 'Old Airport Rd', severity: 2, busId: 'KA-03-CJ-8820', route: '17A', cam: 'Front Cam' },
        { type: 'HAZARD', category: 'Missing Signage', title: 'Damaged route marker signage', location: 'Outer Ring Rd Jn. 12', severity: 2, busId: 'KA-09-DP-6119', route: '335E', cam: 'Side Cam' }
      ];

      setInterval(() => {
        const tmpl = mockPool[Math.floor(Math.random() * mockPool.length)];
        const newDet = {
          id: 'DET-' + Math.floor(1000 + Math.random() * 9000),
          time: this._formatTime(0),
          type: tmpl.type,
          category: tmpl.category,
          title: tmpl.title,
          location: tmpl.location,
          severity: tmpl.severity,
          busId: tmpl.busId,
          route: tmpl.route,
          bus: `Bus ${tmpl.route} (${tmpl.cam})`,
          plate: tmpl.plate || null,
          conf: +(91 + Math.random() * 8).toFixed(1),
          status: 'Active'
        };

        this.state.recentDetections.unshift(newDet);
        if (this.state.recentDetections.length > 30) {
          this.state.recentDetections.pop();
        }

        if (tmpl.type === 'HAZARD') this.state.hazardsToday++;
        if (tmpl.type === 'INCIDENT') this.state.incidentsToday++;

        this.emit('detection:new', newDet);
        this.emit('detections:list', this.state.recentDetections);
      }, 5000);
    }

    getBus(busId) {
      return this.state.fleetStatus.find(b => b.id === busId) || this.state.fleetStatus[0];
    }

    acknowledgeDetection(detId) {
      const item = this.state.recentDetections.find(d => d.id === detId);
      if (item) {
        item.status = 'Acknowledged';
        this.emit('detection:updated', item);
        this.emit('detections:list', this.state.recentDetections);
        return true;
      }
      return false;
    }

    resolveDetection(detId) {
      const item = this.state.recentDetections.find(d => d.id === detId);
      if (item) {
        item.status = 'Resolved';
        this.emit('detection:updated', item);
        this.emit('detections:list', this.state.recentDetections);
        return true;
      }
      return false;
    }

    addDetection(det) {
      const newDet = {
        id: det.id || 'DET-' + Math.floor(1000 + Math.random() * 9000),
        time: det.time || this._formatTime(0),
        type: det.type || 'HAZARD',
        category: det.category || 'Road Anomaly',
        title: det.title || 'Detected Hazard',
        location: det.location || 'Fleet Route 42B GPS',
        severity: det.severity || 3,
        bus: det.bus || 'Live AI Dashcam',
        plate: det.plate || null,
        conf: det.conf || +(90 + Math.random() * 9).toFixed(1),
        status: 'Active',
        snapshot: det.snapshot || null
      };

      this.state.recentDetections.unshift(newDet);
      if (this.state.recentDetections.length > 30) {
        this.state.recentDetections.pop();
      }

      if (newDet.type === 'HAZARD') this.state.hazardsToday++;
      if (newDet.type === 'INCIDENT') this.state.incidentsToday++;

      this.emit('detection:new', newDet);
      this.emit('detections:list', this.state.recentDetections);
      return newDet;
    }

    getState() {
      return this.state;
    }
  }

  global.ThrinethraRealtimeEngine = new RealtimeDataEngine();

})(typeof window !== 'undefined' ? window : this);
