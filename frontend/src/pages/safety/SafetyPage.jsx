import React, { useState, useEffect } from 'react';
import { Bell, Search, Loader2, MapPin, ExternalLink } from 'lucide-react';
import RiskLevelCard from '../../components/safety/RiskLevelCard';
import EmergencyCard from '../../components/safety/EmergencyCard';
import ActiveAlertsCard from '../../components/safety/ActiveAlertsCard';
import AlertList from '../../components/safety/AlertList';
import AppLayout from '../../components/layout/AppLayout';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';

const SafetyPage = () => {
    const [location, setLocation] = useState("Paris, France");
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTrip, setActiveTrip] = useState(null);

    const fetchTripsAndDetermineLocation = async () => {
        try {
            const trips = await apiService.listTrips(auth);
            if (trips && trips.length > 0) {
                const today = new Date();

                // Find active trip (current date between start and end)
                const currentTrip = trips.find(t => {
                    if (!t.start_date || !t.end_date) return false;
                    const start = new Date(t.start_date);
                    const end = new Date(t.end_date);
                    return today >= start && today <= end;
                });

                // Find upcoming trip (closest future start date)
                const upcomingTrip = trips
                    .filter(t => t.start_date && new Date(t.start_date) > today)
                    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];

                const targetTrip = currentTrip || upcomingTrip;

                if (targetTrip) {
                    setActiveTrip(targetTrip);
                    setLocation(targetTrip.destination);
                    fetchSafety(targetTrip.destination);
                } else {
                    // Fallback to default or just fetch default
                    fetchSafety("Paris, France");
                }
            } else {
                fetchSafety("Paris, France");
            }
        } catch (error) {
            console.error("Error fetching trips:", error);
            fetchSafety("Paris, France"); // Fallback
        }
    };

    const fetchSafety = async (loc) => {
        setLoading(true);
        try {
            const data = await apiService.assessSafety(auth, loc || location);
            setAssessment(data);
        } catch (error) {
            console.error("Safety Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth.currentUser) {
            fetchTripsAndDetermineLocation();
        } else {
            const unsub = auth.onAuthStateChanged(u => {
                if (u) fetchTripsAndDetermineLocation();
            });
            return unsub;
        }
    }, []);

    return (
        <AppLayout>
            <div className="bg-white font-sans text-slate-900 min-h-full">
                <main className="flex-1 p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-slate-900">Safety Monitoring: {location}</h2>
                                {activeTrip && activeTrip.destination === location && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                        <MapPin size={12} /> Active Trip
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 text-sm mt-1">Real-time safety monitoring powered by Journey360 AI.</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search location..."
                                className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none w-full md:w-64"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchSafety(location)}
                            />
                            <button
                                onClick={() => fetchSafety(location)}
                                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={48} />
                        </div>
                    ) : assessment ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                <RiskLevelCard
                                    level={assessment.risk?.level || "Unknown"}
                                    score={assessment.risk?.score || 0}
                                    maxScore={100}
                                    description={assessment.risk?.reason || assessment.advice}
                                />

                                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xs font-bold text-blue-600 tracking-wider uppercase">EMERGENCY NUMBER</h3>
                                        <div className="text-blue-500">
                                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-bold text-slate-900 mb-1">
                                            {assessment.emergency?.primary?.number || "112"}
                                        </div>
                                        <p className="text-blue-600 text-sm font-medium">
                                            {assessment.emergency?.primary?.label || "Local Emergency"}
                                        </p>
                                    </div>
                                    {assessment.emergency?.primary?.callable && (
                                        <a
                                            href={assessment.emergency.primary.tel}
                                            className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
                                        >
                                            Call now &rarr;
                                        </a>
                                    )}
                                </div>

                                <ActiveAlertsCard
                                    count={assessment.alerts?.length || 0}
                                    recentCount={assessment.news?.filter(n => n.severity === "High").length || 0}
                                    description="Active safety alerts & high severity news."
                                />
                            </div>

                            {/* News Section */}
                            {assessment.news && assessment.news.length > 0 && (
                                <div className="mb-10">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Bell size={20} className="text-blue-600" />
                                        Real-time Local Alerts
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {assessment.news.map((item, idx) => {
                                            // Severity Badge Color
                                            let badgeColor = "bg-green-100 text-green-700";
                                            if (item.severity === "Medium") badgeColor = "bg-orange-100 text-orange-700";
                                            if (item.severity === "High") badgeColor = "bg-red-100 text-red-700";

                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all flex items-start gap-4"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${badgeColor}`}>
                                                        {item.severity === "High" ? (
                                                            <Bell size={18} />
                                                        ) : (
                                                            <div className="font-bold text-xs">{item.severity ? item.severity[0] : 'N'}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                                                                {item.title}
                                                            </h4>
                                                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                                {item.published || item.published_at}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xs text-slate-500 font-medium">{item.source}</span>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                                                {item.severity} Risk
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <AlertList alerts={assessment.alerts || []} />

                            <div className="mt-10 bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                        <span className="font-bold">AI</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">Journey360 AI Insight</h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed max-w-4xl">
                                    {assessment.ai_insight || assessment.description || assessment.advice}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            Search for a location to see safety insights.
                        </div>
                    )}

                </main>
            </div>
        </AppLayout>
    );
};

export default SafetyPage;
