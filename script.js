/**
 * SOVIET_GPS_CORE_LOGIC
 * Version: 1.0.0
 * Status: Operational
 * Universal Orientation Support Enabled
 */

let target = { lat: null, lon: null };
let currentPos = { lat: null, lon: null };

// 1. Inisialisasi Jam Taktikal
setInterval(() => {
    const now = new Date();
    // Gunakan en-GB untuk format 24-jam yang lebih "military"
    document.getElementById('clock').innerText = now.toLocaleTimeString('en-GB');
}, 1000);

// 2. Fungsi Lock Koordinat
function setTarget() {
    const input = document.getElementById('target-input');
    const val = input.value;
    const parts = val.split(',');

    if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lon = parseFloat(parts[1].trim());

        if (!isNaN(lat) && !isNaN(lon)) {
            target.lat = lat;
            target.lon = lon;
            
            updateUIState("LOCKED", "TARGET_ACQUIRED: VECTOR_CALCULATING...");
            input.style.borderColor = "#00FF41"; // Success glow
            
            // Trigger pengiraan serta-merta jika GPS sudah ada
            if (currentPos.lat !== null) updateNavigation();
        } else {
            updateUIState("ERR", "INVALID_COORDS: CHECK_FORMAT");
            input.style.borderColor = "red";
        }
    } else {
        updateUIState("ERR", "PARSE_ERROR: USE_LAT_LON_FORMAT");
        input.style.borderColor = "red";
    }
}

// 3. Formula Bearing (Arah)
function calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    const brng = Math.atan2(y, x);
    return (brng * 180 / Math.PI + 360) % 360;
}

// 4. Formula Haversine (Jarak)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius Bumi dalam KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 5. Kemas Kini Navigasi & UI
function updateNavigation() {
    if (target.lat === null || currentPos.lat === null) return;

    const bearing = calculateBearing(currentPos.lat, currentPos.lon, target.lat, target.lon);
    const distance = calculateDistance(currentPos.lat, currentPos.lon, target.lat, target.lon);

    // Render Anak Panah (Rotation)
    const arrow = document.getElementById('arrow');
    if (arrow) {
        arrow.style.transform = `rotate(${bearing}deg)`;
    }

    // Output Data dengan format kemas
    document.getElementById('brg-out').innerText = Math.round(bearing).toString().padStart(3, '0');
    document.getElementById('dist-out').innerText = distance.toFixed(3);
    
    // Logik Kedekatan (Arrival Logic)
    if (distance < 0.05) { // Bawah 50 meter
        updateUIState("ARRIVED", "OBJECTIVE_REACHED: STANDBY");
    } else {
        updateUIState("LOCKED", "VECTOR_OPTIMAL: TRACKING...");
    }
}

function updateUIState(status, logMsg) {
    const statusEl = document.getElementById('status-out');
    const logEl = document.getElementById('log');
    if (statusEl) statusEl.innerText = status;
    if (logEl) logEl.innerText = `SYSTEM_LOG: ${logMsg}`;
}

// 6. GPS Watcher (High Accuracy)
if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition((pos) => {
        currentPos.lat = pos.coords.latitude;
        currentPos.lon = pos.coords.longitude;
        
        // Update Live Display Koordinat
        const coordsEl = document.getElementById('coords-live');
        if (coordsEl) {
            coordsEl.innerText = `LOC: ${currentPos.lat.toFixed(4)}N, ${currentPos.lon.toFixed(4)}E`;
        }
        
        // Speed Conversion (m/s to km/h)
        const speedVal = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : "0.0";
        const spdEl = document.getElementById('spd-out');
        if (spdEl) spdEl.innerText = speedVal;

        updateNavigation();

    }, (err) => {
        let errMsg = "GPS_SIGNAL_LOST";
        if (err.code === 1) errMsg = "PERMISSION_DENIED";
        updateUIState("OFFLINE", `ERROR: ${errMsg}`);
    }, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000 // Tingkatkan timeout sikit untuk peranti lama
    });
} else {
    updateUIState("INCOMPATIBLE", "HARDWARE_NOT_SUPPORTED");
}

// 7. PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW_READY'))
            .catch(err => console.log('SW_FAIL', err));
    });
}
