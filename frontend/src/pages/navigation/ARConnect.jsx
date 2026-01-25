import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../services/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import ARViewer from '../../components/navigation/ARViewer';
import { Loader2, Wifi, WifiOff } from 'lucide-react';

const ARConnect = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');

    const [destination, setDestination] = useState(null);
    const [status, setStatus] = useState('connecting'); // connecting, connected, disconnected
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionId) {
            setError("No session ID provided.");
            setStatus('disconnected');
            return;
        }

        const sessionRef = doc(db, "ar_sessions", sessionId);

        // 1. Mark as connected
        updateDoc(sessionRef, { status: 'connected' }).catch(err => console.warn("Failed to update status", err));

        // 2. Listen for updates
        const unsub = onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setDestination(data.destination);
                setStatus('connected');
            } else {
                setError("Invalid Session");
                setStatus('disconnected');
            }
        }, (err) => {
            console.error(err);
            setError("Connection Lost");
            setStatus('disconnected');
        });

        return () => unsub();
    }, [sessionId]);

    if (error) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
                <WifiOff size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Connection Options</h1>
                <p className="text-slate-400">{error}</p>
            </div>
        );
    }

    if (!destination) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
                <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
                <h1 className="text-xl font-bold mb-2">Syncing with Desktop...</h1>
                <p className="text-slate-400 text-sm">Please select a location on your computer to start.</p>
            </div>
        );
    }

    // Render AR View with "Live" badge
    return (
        <div className="relative h-screen w-screen overflow-hidden">
            <ARViewer
                destination={destination}
                onClose={() => {
                    // Maybe disconnect? For now just reload
                    window.location.reload();
                }}
            />

            {/* Live Indicator Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg pointer-events-none">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Sync</span>
            </div>
        </div>
    );
};

export default ARConnect;
