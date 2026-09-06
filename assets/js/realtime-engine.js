/**
 * THRINETHRA Real-Time Intelligence & Fleet Telematics Engine
 * Dynamic live stream generator and state manager for fleet events,
 * safety hazard detections, 3D photogrammetric physical measurements,
 * and automated real-time solution dispatch.
 */

(function (global) {
  'use strict';

  class RealtimeDataEngine {
    constructor() {
      this.listeners = new Map();
      this.state = {
        activeBusesCount: 5,
        kmCoveredToday: 18420.4,
        hazardsToday: 0,
        incidentsToday: 0,
        fleetStatus: [
          {
            id: 'KA-05-AB-1147',
            route: '42B',
            routeName: 'MG Road → Indiranagar',
            model: 'Tata Starbus EV Ultra 12M',
            depot: 'Depot 04 (Central Majestic)',
            driver: { name: 'Ramesh Kumar', badge: 'DRV-4418', exp: '8 Years', license: 'DL-04-2016-88214', shift: 'Morning (06:00 - 14:00)', score: '98.6%', phone: '+91 98450 11470' },
            health: { batterySoc: 84, engineTempC: 68, tirePressurePsi: 118, brakeWearPct: 14, odoKm: 42180.5, transStatus: 'Nominal', coolantLvl: '98%' },
            sensors: {
              front: { name: 'Front Optical 4K AI', fps: 30, res: '3840x2160', fov: '140°', status: 'Optimal' },
              rear: { name: 'Rear Radar Vision + OCR', fps: 30, res: '1920x1080', fov: '120°', status: 'Optimal' },
              side: { name: 'Left Curb Blindspot IR', fps: 30, res: '1920x1080', fov: '160°', status: 'Optimal' },
              cabin: { name: 'Cabin Thermal Occupancy', fps: 30, res: '1280x720', fov: '180°', status: 'Optimal' }
            },
            speed: 38.5,
            altitudeM: 920.4,
            bearingDeg: 78,
            satellites: 18,
            lat: 12.9716,
            lng: 77.5946,
            location: 'MG Road Jn. (Corridor Km 3.2)',
            address: 'Mahatma Gandhi Rd, Ashok Nagar, Bengaluru, Karnataka 560001',
            cameras: [true, true, true, true],
            fps: 30,
            lastSync: Date.now()
          },
          {
            id: 'KA-03-CJ-8820',
            route: '17A',
            routeName: 'Indiranagar → Marathahalli',
            model: 'Ashok Leyland Oyster Wide 900',
            depot: 'Depot 07 (Indiranagar East)',
            driver: { name: 'Suresh Varma', badge: 'DRV-7219', exp: '11 Years', license: 'DL-07-2013-19920', shift: 'Morning (06:30 - 14:30)', score: '97.2%', phone: '+91 98452 88201' },
            health: { batterySoc: 76, engineTempC: 72, tirePressurePsi: 120, brakeWearPct: 19, odoKm: 68410.2, transStatus: 'Nominal', coolantLvl: '95%' },
            sensors: {
              front: { name: 'Front Optical 4K AI', fps: 30, res: '3840x2160', fov: '140°', status: 'Optimal' },
              rear: { name: 'Rear Radar Vision + OCR', fps: 29.8, res: '1920x1080', fov: '120°', status: 'Optimal' },
              side: { name: 'Left Curb Blindspot IR', fps: 30, res: '1920x1080', fov: '160°', status: 'Optimal' },
              cabin: { name: 'Cabin Thermal Occupancy', fps: 29.8, res: '1280x720', fov: '180°', status: 'Optimal' }
            },
            speed: 42.1,
            altitudeM: 914.8,
            bearingDeg: 104,
            satellites: 16,
            lat: 12.9784,
            lng: 77.6408,
            location: 'Indiranagar 100ft Rd',
            address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
            cameras: [true, true, true, true],
            fps: 29.8,
            lastSync: Date.now() - 2000
          },
          {
            id: 'KA-01-FL-3390',
            route: '9C',
            routeName: 'Shivajinagar → Majestic',
            model: 'Volvo 8400 Low Floor LE',
            depot: 'Depot 01 (Shivajinagar)',
            driver: { name: 'Anand Mohan', badge: 'DRV-1092', exp: '14 Years', license: 'DL-01-2010-33901', shift: 'Split Shift (07:00 - 15:00)', score: '99.1%', phone: '+91 98453 33902' },
            health: { batterySoc: 91, engineTempC: 70, tirePressurePsi: 119, brakeWearPct: 12, odoKm: 89312.0, transStatus: 'Nominal', coolantLvl: '99%' },
            sensors: {
              front: { name: 'Front Optical 4K AI', fps: 28.5, res: '3840x2160', fov: '140°', status: 'Optimal' },
              rear: { name: 'Rear Radar Vision + OCR', fps: 28.5, res: '1920x1080', fov: '120°', status: 'Optimal' },
              side: { name: 'Left Curb Blindspot IR', fps: 28.5, res: '1920x1080', fov: '160°', status: 'Optimal' },
              cabin: { name: 'Cabin Thermal Occupancy', fps: 28.5, res: '1280x720', fov: '180°', status: 'Optimal' }
            },
            speed: 28.5,
            altitudeM: 928.0,
            bearingDeg: 260,
            satellites: 17,
            lat: 12.9856,
            lng: 77.6057,
            location: 'Shivajinagar Bus Station',
            address: 'Shivajinagar Bus Terminal, Shivaji Nagar, Bengaluru, Karnataka 560051',
            cameras: [true, true, true, true],
            fps: 28.5,
            lastSync: Date.now() - 4000
          },
          {
            id: 'KA-41-BQ-0512',
            route: '52',
            routeName: 'Koramangala → Electronic City',
            model: 'Eicher Skyline Pro EV 3009',
            depot: 'Depot 12 (Koramangala South)',
            driver: { name: 'Prakash Narayana', badge: 'DRV-8804', exp: '6 Years', license: 'DL-41-2018-05129', shift: 'Evening (14:00 - 22:00)', score: '96.8%', phone: '+91 98454 05123' },
            health: { batterySoc: 68, engineTempC: 75, tirePressurePsi: 116, brakeWearPct: 22, odoKm: 34105.8, transStatus: 'Nominal', coolantLvl: '93%' },
            sensors: {
              front: { name: 'Front Optical 4K AI', fps: 30, res: '3840x2160', fov: '140°', status: 'Optimal' },
              rear: { name: 'Rear Radar Vision + OCR', fps: 30, res: '1920x1080', fov: '120°', status: 'Optimal' },
              side: { name: 'Left Curb Blindspot IR', fps: 30, res: '1920x1080', fov: '160°', status: 'Optimal' },
              cabin: { name: 'Cabin Thermal Occupancy', fps: 30, res: '1280x720', fov: '180°', status: 'Optimal' }
            },
            speed: 46.2,
            altitudeM: 902.5,
            bearingDeg: 145,
            satellites: 19,
            lat: 12.9279,
            lng: 77.6271,
            location: 'Silk Board Jn.',
            address: 'Central Silk Board Flyover, BTM 2nd Stage, Bengaluru, Karnataka 560068',
            cameras: [true, true, true, true],
            fps: 30,
            lastSync: Date.now() - 1000
          },
          {
            id: 'KA-09-DP-6119',
            route: '335E',
            routeName: 'Lalbagh → Whitefield',
            model: 'Tata Ultra Electric 9/9 AC',
            depot: 'Depot 09 (Lalbagh Gate)',
            driver: { name: 'Manjunath Gowda', badge: 'DRV-3310', exp: '10 Years', license: 'DL-09-2014-61190', shift: 'General (08:00 - 16:30)', score: '98.9%', phone: '+91 98455 61194' },
            health: { batterySoc: 88, engineTempC: 66, tirePressurePsi: 121, brakeWearPct: 15, odoKm: 51290.4, transStatus: 'Nominal', coolantLvl: '97%' },
            sensors: {
              front: { name: 'Front Optical 4K AI', fps: 29.4, res: '3840x2160', fov: '140°', status: 'Optimal' },
              rear: { name: 'Rear Radar Vision + OCR', fps: 29.4, res: '1920x1080', fov: '120°', status: 'Optimal' },
              side: { name: 'Left Curb Blindspot IR', fps: 29.4, res: '1920x1080', fov: '160°', status: 'Optimal' },
              cabin: { name: 'Cabin Thermal Occupancy', fps: 29.4, res: '1280x720', fov: '180°', status: 'Optimal' }
            },
            speed: 34.0,
            altitudeM: 935.1,
            bearingDeg: 42,
            satellites: 20,
            lat: 12.9463,
            lng: 77.5801,
            location: 'Lalbagh West Gate',
            address: 'Rashtriya Vidyalaya Rd, Mavalli, Bengaluru, Karnataka 560004',
            cameras: [true, true, true, true],
            fps: 29.4,
            lastSync: Date.now() - 3000
          }
        ],
        recentDetections: [],
        routes: [
          { route: '42B', name: 'MG Road → Indiranagar', delay: 4.2, baseline: 4.0, buses: 1, status: 'On time' },
          { route: '17A', name: 'Indiranagar → Marathahalli', delay: 6.4, baseline: 5.5, buses: 1, status: 'Delayed' },
          { route: '9C',  name: 'Shivajinagar → Majestic', delay: 8.8, baseline: 6.0, buses: 1, status: 'Severe' },
          { route: '52',  name: 'Koramangala → Electronic City', delay: 3.5, baseline: 4.0, buses: 1, status: 'On time' },
          { route: '335E', name: 'Lalbagh → Whitefield', delay: 5.1, baseline: 5.0, buses: 1, status: 'On time' }
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
      // 1-Second Live Bus Location & Telemetry Tracking Loop (Ticks Every Second)
      setInterval(() => {
        this.state.fleetStatus.forEach(bus => {
          // Precise 1-second dynamic kinematic physics update
          const speedDelta = (Math.random() * 1.6 - 0.8);
          bus.speed = Math.max(14.0, Math.min(65.0, +(bus.speed + speedDelta).toFixed(1)));
          
          // Realistic GPS coordinate drift along bearing vector
          const headingRad = (bus.bearingDeg || 45) * (Math.PI / 180);
          const distCoveredDeg = (bus.speed / 3600 / 111) * 0.00008;
          bus.lat = +(bus.lat + Math.cos(headingRad) * distCoveredDeg + (Math.random() - 0.5) * 0.00003).toFixed(6);
          bus.lng = +(bus.lng + Math.sin(headingRad) * distCoveredDeg + (Math.random() - 0.5) * 0.00003).toFixed(6);
          
          bus.bearingDeg = (bus.bearingDeg + Math.floor(Math.random() * 5 - 2) + 360) % 360;
          bus.altitudeM = +(bus.altitudeM + (Math.random() * 0.4 - 0.2)).toFixed(1);
          bus.lastSync = Date.now();
        });
        
        this.state.kmCoveredToday = +(this.state.kmCoveredToday + 0.015).toFixed(2);
        this.emit('telemetry:1s_tick', this.state.fleetStatus);
        this.emit('fleet:update', this.state.fleetStatus);
      }, 1000);

      // Automated Multi-Bus Physical Hazard & Solution Detection Pool
      const hazardTemplates = [
        {
          type: 'HAZARD',
          category: 'Pothole Sub-base Failure',
          title: 'Severe Asphalt Pothole Crater',
          problem: 'Sub-grade gravel washout causing road crater with sharp asphalt rim edge',
          dimensions: { widthMm: 680, lengthMm: 920, depthMm: 54, distanceM: 12.4 },
          solution: {
            action: 'Cold-mix polymer asphalt patch & 2-ton vibratory compaction',
            workOrder: 'WO-RD-8841',
            advisory: 'Downstream speed limit reduced to 20 km/h · Warning broadcasted',
            status: 'Work Order Dispatched'
          },
          severity: 3,
          busId: 'KA-05-AB-1147',
          location: 'MG Road Jn. (km 3.2)',
          lat: 12.9716, lng: 77.5946,
          cam: 'Front AI'
        },
        {
          type: 'INCIDENT',
          category: 'Tailgating Proximity',
          title: 'High-Speed Tailgating Vehicle',
          problem: 'Approaching vehicle following at critical 2.1m separation below safety braking distance',
          dimensions: { widthMm: 1780, lengthMm: 4200, depthMm: 0, distanceM: 2.1 },
          solution: {
            action: 'Automatic e-Challan citation issued with OCR plate timestamp & radar speed log',
            workOrder: 'CH-TR-10492',
            advisory: 'Rear strobe collision avoidance alert activated on bus tailgate',
            status: 'Citation Generated'
          },
          severity: 4,
          busId: 'KA-03-CJ-8820',
          location: 'Indiranagar 100ft Rd',
          lat: 12.9784, lng: 77.6408,
          cam: 'Rear OCR',
          plate: 'MH 02 EE ' + Math.floor(1000 + Math.random() * 9000)
        },
        {
          type: 'HAZARD',
          category: 'Waterlogging Puddle',
          title: 'Standing Stormwater Depression',
          problem: 'Blocked stormwater curb grate causing 110mm deep standing water pool across lane',
          dimensions: { widthMm: 1400, lengthMm: 2800, depthMm: 110, distanceM: 18.2 },
          solution: {
            action: 'Rapid drain pump suction and silt clearing team alerted for immediate clearance',
            workOrder: 'WO-SW-3319',
            advisory: 'Fleet lane detour advisory around curb pool enabled',
            status: 'Drain Crew Assigned'
          },
          severity: 3,
          busId: 'KA-01-FL-3390',
          location: 'Shivajinagar Bus Station',
          lat: 12.9856, lng: 77.6057,
          cam: 'Front AI'
        },
        {
          type: 'SAFETY',
          category: 'Blindspot Conflict',
          title: 'Two-Wheeler in Blindspot Zone',
          problem: 'Motorcyclist overtaking on left curb side within 0.45m of rear wheel axle',
          dimensions: { widthMm: 750, lengthMm: 1950, depthMm: 0, distanceM: 0.45 },
          solution: {
            action: 'Driver audio blindspot warning buzzer triggered & side LED illumination pulsed',
            workOrder: 'EV-BL-7712',
            advisory: 'Bus steering left-turn lockout engaged until cyclist clears zone',
            status: 'Lockout Active'
          },
          severity: 3,
          busId: 'KA-41-BQ-0512',
          location: 'Silk Board Jn.',
          lat: 12.9279, lng: 77.6271,
          cam: 'Side Blindspot'
        },
        {
          type: 'SAFETY',
          category: 'Cabin Density Surge',
          title: 'Passenger Overcrowding at Doorway',
          problem: 'Platform boarding surge blocking front egress stairwell and driver mirror sightline',
          dimensions: { widthMm: 950, lengthMm: 1600, depthMm: 0, distanceM: 3.2 },
          solution: {
            action: 'Automated passenger chime: "Please move inward" & trailing relief bus dispatched',
            workOrder: 'OPS-CB-5510',
            advisory: 'Relief Bus Route 335E assigned at next stop in 4 mins',
            status: 'Relief Dispatched'
          },
          severity: 2,
          busId: 'KA-09-DP-6119',
          location: 'Lalbagh West Gate',
          lat: 12.9463, lng: 77.5801,
          cam: 'Cabin Sensor'
        }
      ];

      setInterval(() => {
        const tmpl = hazardTemplates[Math.floor(Math.random() * hazardTemplates.length)];
        this.addDetection({
          type: tmpl.type,
          category: tmpl.category,
          title: tmpl.title,
          problem: tmpl.problem,
          dimensions: tmpl.dimensions,
          solution: tmpl.solution,
          location: tmpl.location,
          lat: +(tmpl.lat + (Math.random() - 0.5) * 0.0005).toFixed(5),
          lng: +(tmpl.lng + (Math.random() - 0.5) * 0.0005).toFixed(5),
          severity: tmpl.severity,
          busId: tmpl.busId,
          bus: `${tmpl.busId} (${tmpl.cam})`,
          plate: tmpl.plate || null,
          conf: +(93 + Math.random() * 6).toFixed(1)
        });
      }, 7000);
    }

    getBus(busId) {
      return this.state.fleetStatus.find(b => b.id === busId) || this.state.fleetStatus[0];
    }

    addDetection(det) {
      const d = new Date();
      const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');

      const dimensions = det.dimensions || {
        widthMm: Math.floor(450 + Math.random() * 500),
        lengthMm: Math.floor(600 + Math.random() * 800),
        depthMm: det.type === 'HAZARD' ? Math.floor(30 + Math.random() * 50) : 0,
        distanceM: +(8 + Math.random() * 14).toFixed(1)
      };

      const solution = det.solution || {
        action: det.type === 'HAZARD' ? 'Hot-mix bituminous compaction patching' : 'Automated safety advisory & citation audit',
        workOrder: 'WO-' + Math.floor(1000 + Math.random() * 9000),
        advisory: 'Speed reduction advisory (20 km/h) dispatched to trailing fleet',
        status: 'Dispatched'
      };

      const newDet = {
        id: det.id || 'DET-' + Math.floor(1000 + Math.random() * 9000),
        time: det.time || timeStr,
        type: det.type || 'HAZARD',
        category: det.category || 'Road Hazard',
        title: det.title || 'Road Anomaly Detected',
        problem: det.problem || 'Detected road surface irregularity or safety conflict',
        dimensions: dimensions,
        solution: solution,
        location: det.location || 'Fleet Corridor GPS Active',
        lat: det.lat || (12.9716 + (Math.random() - 0.5) * 0.02).toFixed(5),
        lng: det.lng || (77.5946 + (Math.random() - 0.5) * 0.02).toFixed(5),
        severity: det.severity || 3,
        busId: det.busId || 'KA-05-AB-1147',
        bus: det.bus || 'KA-05-AB-1147 (FRONT AI)',
        plate: det.plate || null,
        conf: det.conf || +(92 + Math.random() * 7).toFixed(1),
        status: 'Active',
        snapshot: det.snapshot || null
      };

      this.state.recentDetections.unshift(newDet);
      if (this.state.recentDetections.length > 40) {
        this.state.recentDetections.pop();
      }

      // Re-calculate dynamic KPIs purely from actual detection counts
      this.state.hazardsToday = this.state.recentDetections.filter(d => d.type === 'HAZARD').length;
      this.state.incidentsToday = this.state.recentDetections.filter(d => d.type === 'INCIDENT').length;

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

