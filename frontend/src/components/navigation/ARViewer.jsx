import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Navigation, Compass, MapPin, AlertCircle } from 'lucide-react';

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMxNDEzYzM1ZjFkNzQzODRhYzBlYzJjMGZhMTVmODJhIiwiaCI6Im11cm11cjY0In0=";
const WAYPOINT_THRESHOLD = 15; // meters

const ARViewer = ({ destination, onClose }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [info, setInfo] = useState("Initializing navigation...");
  const [error, setError] = useState(null);
  const [distanceText, setDistanceText] = useState("");
  const [turnDirection, setTurnDirection] = useState("STRAIGHT");

  // State for logic refs to avoid re-renders during animation
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    arrow: null,
    directionLine: null,
    userLat: null,
    userLng: null,
    phoneHeading: 0,
    routePoints: [],
    currentIndex: 0,
    animationId: null,
    watchId: null
  });

  useEffect(() => {
    const init = async () => {
      try {
        await startCamera();
        initThree();
        setupGeolocation();
        setupCompass();
        animate();
      } catch (err) {
        console.error("AR Initialization Error:", err);
        setError(err.message || "Failed to start AR");
      }
    };

    init();

    return () => {
      // Cleanup
      if (stateRef.current.animationId) cancelAnimationFrame(stateRef.current.animationId);
      if (stateRef.current.watchId) navigator.geolocation.clearWatch(stateRef.current.watchId);
      if (stateRef.current.renderer) {
        stateRef.current.renderer.dispose();
        if (containerRef.current) containerRef.current.removeChild(stateRef.current.renderer.domElement);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('resize', handleResize);
    };
  }, [destination]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      throw new Error("Camera permission denied or not available.");
    }
  };

  const setupGeolocation = () => {
    stateRef.current.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        stateRef.current.userLat = latitude;
        stateRef.current.userLng = longitude;

        if (stateRef.current.routePoints.length === 0) {
          try {
            const points = await getRoute(latitude, longitude);
            stateRef.current.routePoints = points;
            setInfo("Route loaded. Follow the arrow.");
          } catch (err) {
            console.error("Route Fetch Error:", err);
            setInfo("Error loading route.");
          }
        }
      },
      (err) => {
        setError("Please enable GPS for AR navigation.");
      },
      { enableHighAccuracy: true }
    );
  };

  const setupCompass = () => {
    // Check if permission is needed for iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }
  };

  const handleOrientation = (e) => {
    if (e.alpha !== null) {
      // Correct for absolute heading
      const heading = e.webkitCompassHeading || (360 - e.alpha);
      stateRef.current.phoneHeading = heading;
    }
  };

  const getRoute = async (startLat, startLng) => {
    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
      {
        method: "POST",
        headers: {
          "Authorization": ORS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          coordinates: [
            [startLng, startLat],
            [destination.lng, destination.lat]
          ]
        })
      }
    );

    if (!res.ok) throw new Error("Failed to fetch route");
    const data = await res.json();
    return data.features[0].geometry.coordinates;
  };

  const initThree = () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (containerRef.current) containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(2, 5, 2);
    scene.add(directionalLight);

    // --- STYLIZED ARROW ---
    const arrowGroup = new THREE.Group();

    // Arrow Head
    const headGeo = new THREE.ConeGeometry(0.2, 0.5, 32);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1e40af,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.x = Math.PI / 2;
    arrowGroup.add(head);

    // Arrow Body (Subtle Glow)
    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.z = -0.4;
    body.rotation.x = Math.PI / 2;
    arrowGroup.add(body);

    arrowGroup.position.set(0, -0.6, -5);
    scene.add(arrowGroup);

    // --- ROUTE RIBBON (Dynamic segments) ---
    const ribbonGroup = new THREE.Group();
    scene.add(ribbonGroup);

    // --- TARGET MARKER ---
    const targetGeo = new THREE.TorusGeometry(0.5, 0.05, 16, 100);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 1.0
    });
    const targetMarker = new THREE.Mesh(targetGeo, targetMat);
    targetMarker.rotation.x = Math.PI / 2;
    targetMarker.visible = false;
    scene.add(targetMarker);

    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.arrow = arrowGroup;
    stateRef.current.targetMarker = targetMarker;
    stateRef.current.ribbonGroup = ribbonGroup;

    window.addEventListener('resize', handleResize);
  };

  const handleResize = () => {
    if (!stateRef.current.camera || !stateRef.current.renderer) return;
    stateRef.current.camera.aspect = window.innerWidth / window.innerHeight;
    stateRef.current.camera.updateProjectionMatrix();
    stateRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const toRad = d => d * Math.PI / 180;

  const bearing = (lat1, lon1, lat2, lon2) => {
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  const distance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const animate = () => {
    stateRef.current.animationId = requestAnimationFrame(animate);
    const state = stateRef.current;
    const time = Date.now() * 0.001;

    if (state.routePoints.length && state.userLat !== null) {
      const next = state.routePoints[state.currentIndex];
      const d = distance(state.userLat, state.userLng, next[1], next[0]);

      if (d < WAYPOINT_THRESHOLD && state.currentIndex < state.routePoints.length - 1) {
        state.currentIndex++;
      }

      const b = bearing(state.userLat, state.userLng, next[1], next[0]);

      let diff = b - state.phoneHeading;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      // Rotate arrow
      if (state.arrow) {
        state.arrow.rotation.y = toRad(diff);
        // Subtle floating animation
        state.arrow.position.y = -0.6 + Math.sin(time * 2) * 0.05;
      }

      // Update Route Ribbon (Visual path to next point)
      if (state.ribbonGroup) {
        state.ribbonGroup.clear();
        const ribbonGeo = new THREE.PlaneGeometry(0.4, 10);
        const ribbonMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.3 + Math.sin(time * 3) * 0.1,
          side: THREE.DoubleSide
        });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.rotation.x = Math.PI / 2;
        ribbon.rotation.z = toRad(diff);
        ribbon.position.set(0, -1.2, -7);
        state.ribbonGroup.add(ribbon);
      }

      // Final Destination Marker
      if (state.targetMarker) {
        const totalDist = distance(state.userLat, state.userLng, destination.lat, destination.lng);
        if (totalDist < 50) {
          state.targetMarker.visible = true;
          const targetB = bearing(state.userLat, state.userLng, destination.lat, destination.lng);
          let targetDiff = targetB - state.phoneHeading;
          if (targetDiff > 180) targetDiff -= 360;
          if (targetDiff < -180) targetDiff += 360;

          const distScale = Math.min(10, totalDist / 5);
          state.targetMarker.position.set(
            Math.sin(toRad(targetDiff)) * distScale,
            -1,
            -Math.cos(toRad(targetDiff)) * distScale
          );
          state.targetMarker.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
        } else {
          state.targetMarker.visible = false;
        }
      }

      const distStr = d > 1000 ? (d / 1000).toFixed(2) + " km" : Math.round(d) + " m";
      if (distStr !== distanceText) setDistanceText(distStr);

      let turn = "STRAIGHT";
      if (diff > 25) turn = "RIGHT";
      if (diff < -25) turn = "LEFT";
      if (turn !== turnDirection) setTurnDirection(turn);
    }

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none">
      {/* Background Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* Main Overlay UI */}
      <div className="relative z-20 flex flex-col h-full pointer-events-none">

        {/* Top Header */}
        <div className="p-6 flex justify-between items-start">
          <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 text-white shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Navigation size={16} fill="white" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight truncate max-w-[200px]">{destination.name}</h2>
                <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Active AR Navigation
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-4 bg-white/10 hover:bg-white/20 active:scale-90 backdrop-blur-xl rounded-full text-white border border-white/10 transition-all pointer-events-auto shadow-2xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* The 3D AR Layer (Arrows/Lines) */}
        <div ref={containerRef} className="absolute inset-0 z-10" />

        {/* Bottom Navigation HUD */}
        <div className="mt-auto p-6 pb-12">
          <div className="bg-slate-900/90 backdrop-blur-2xl p-6 rounded-[40px] text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 flex items-center gap-6 animate-in slide-in-from-bottom duration-700 pointer-events-auto">

            {/* Direction Icon */}
            <div className={`w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-4xl shadow-lg shadow-blue-500/30 transition-all duration-500 ${turnDirection !== 'STRAIGHT' ? 'scale-110' : ''}`}>
              {turnDirection === 'LEFT' ? '⬅️' : turnDirection === 'RIGHT' ? '➡️' : '⬆️'}
            </div>

            {/* Instruction Context */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 italic">
                {turnDirection === 'STRAIGHT' ? 'Go Straight For' : `Turn ${turnDirection} In`}
              </div>
              <div className="text-4xl font-black tracking-tight">{distanceText}</div>
              <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs font-medium bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
                <MapPin size={12} className="text-blue-500" />
                <span className="truncate">{info}</span>
              </div>
            </div>

            {/* Compass Mini-Widget */}
            <div className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative shadow-inner">
              <Compass className="text-blue-500/40" size={24} />
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
                style={{ transform: `rotate(${-stateRef.current.phoneHeading}deg)` }}
              >
                <div className="w-1 h-6 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Overlay (Subtle Gradient) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-15 pointer-events-none" />

      {/* Initialization/Error State Overlay */}
      {error && (
        <div className="absolute inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-10 text-center text-white">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
            <AlertCircle className="text-red-500" size={48} />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">AR Unavailable</h2>
          <p className="text-slate-400 mb-10 max-w-sm leading-relaxed">
            {error}
          </p>
          <button
            onClick={onClose}
            className="w-full max-w-[240px] py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 active:scale-95 transition-all shadow-xl"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default ARViewer;
