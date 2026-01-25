import React, { useState, useEffect } from 'react';
import { X, Smartphone, Share2, Copy, ExternalLink, QrCode, Wifi } from 'lucide-react';
import QRCode from "react-qr-code";
import ARViewer from './ARViewer';
import { db } from '../../services/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const MobilePreviewModal = ({ destination, onClose }) => {
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'qr'
    const [sessionId, setSessionId] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('waiting'); // waiting, connected
    const [writeError, setWriteError] = useState(null);

    // Initialize Session
    useEffect(() => {
        // Generate a random 6-char session code
        const sid = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSessionId(sid);

        // Initial Write
        const sessionRef = doc(db, "ar_sessions", sid);
        setDoc(sessionRef, {
            active: true,
            destination: {
                name: destination.name,
                lat: destination.lat,
                lng: destination.lng
            },
            timestamp: Date.now(),
            status: 'waiting'
        }).catch(err => {
            console.error("Firestore Error:", err);
            setWriteError(err.message);
        });

        // Listen for mobile connection updates
        const unsub = onSnapshot(sessionRef, (doc) => {
            if (doc.exists() && doc.data().status === 'connected') {
                setConnectionStatus('connected');
            }
        }, (err) => {
            // Handle permission errors on the read side too
            if (err.code === 'permission-denied') {
                setWriteError("Permission Denied: Check Firestore Rules");
            }
        });

        return () => unsub();
    }, []); // Run once on mount to create ID

    // Update destination when prop changes
    useEffect(() => {
        if (!sessionId) return;
        const sessionRef = doc(db, "ar_sessions", sessionId);
        setDoc(sessionRef, {
            destination: {
                name: destination.name,
                lat: destination.lat,
                lng: destination.lng
            },
            timestamp: Date.now()
        }, { merge: true });
    }, [destination, sessionId]);


    // Dynamic URL points to a connection handler page, passing the session ID
    // Note: We need to create a route for /ar-connect or handle it in ARViewer
    const mobileUrl = sessionId
        ? `${window.location.origin}/ar-connect?session=${sessionId}`
        : "";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(mobileUrl);
        alert("Live Link copied! Send this to your phone.");
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-700/50">

                {/* Left Side: Controls & QR */}
                <div className="w-full md:w-96 bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col border-r border-slate-200 dark:border-slate-700/50">
                    <div className="mb-6">
                        {writeError && (
                            <div className="bg-red-100 text-red-600 p-3 rounded-lg text-xs font-bold mb-4 border border-red-200">
                                Error: {writeError}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {connectionStatus === 'connected' ? 'Device Connected' : 'Waiting for Device...'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Live AR Link</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Scan this dynamic code once. As you browse places on desktop, your phone will update automatically!
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 relative overflow-hidden">
                        {/* Scan Line Animation */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-full w-full animate-scan pointer-events-none"></div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 z-10">
                            {mobileUrl && (
                                <QRCode
                                    value={mobileUrl}
                                    size={180}
                                    viewBox={`0 0 256 256`}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                />
                            )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center flex items-center gap-2 z-10">
                            <Wifi size={14} />
                            Real-time Sync Active
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300 font-medium text-sm"
                        >
                            <Copy size={16} />
                            Copy Live Link
                        </button>
                    </div>
                </div>

                {/* Right Side: Phone Preview */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative flex items-center justify-center p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-500 hover:text-white transition-all z-10"
                    >
                        <X size={24} />
                    </button>

                    {/* iPhone Frame */}
                    <div className="relative w-[375px] h-[812px] bg-slate-900 rounded-[50px] shadow-[0_0_0_12px_#1e293b,0_0_0_14px_#475569,0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-8 border-slate-800 ring-1 ring-slate-900/50 transform scale-90 md:scale-100 transition-transform">

                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center">
                            <div className="w-16 h-1 bg-slate-800/50 rounded-full"></div>
                        </div>

                        {/* Status Bar Mock */}
                        <div className="h-12 w-full bg-black text-white flex justify-between items-center px-6 pt-2 text-[10px] font-bold z-20 relative">
                            <span>Live</span>
                            <div className="flex gap-1.5 ml-auto">
                                <Wifi size={10} />
                            </div>
                        </div>

                        {/* Content Area - AR Viewer */}
                        <div className="flex-1 relative bg-black">
                            <ARViewer
                                destination={destination}
                                onClose={onClose}
                                isEmbedded={true}
                            />
                        </div>

                        {/* Home Bar */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-30"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobilePreviewModal;
