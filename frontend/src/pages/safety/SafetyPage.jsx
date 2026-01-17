import React, { useState, useEffect } from 'react';
import { Bell, Search, Loader2 } from 'lucide-react';
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
        if (auth.currentUser) fetchSafety();
        else {
            const unsub = auth.onAuthStateChanged(u => { if (u) fetchSafety(); });
            return unsub;
        }
    }, []);

    return (
        <AppLayout>
            <div className="bg-white font-sans text-slate-900 min-h-full">
                <main className="flex-1 p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Safety Monitoring: {location}</h2>
                            <p className="text-slate-500 text-sm">Real-time safety monitoring powered by Journey360 AI.</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search location..."
                                className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none w-full md:w-64"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchSafety()}
                            />
                            <button
                                onClick={() => fetchSafety()}
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
                                    level={assessment.status || assessment.risk_status}
                                    score={assessment.score || assessment.risk_score}
                                    maxScore={100}
                                    description={assessment.description}
                                />
                                <EmergencyCard
                                    number={assessment.emergency_number || "112"}
                                    label="Local Emergency"
                                />
                                <ActiveAlertsCard
                                    count={assessment.alerts?.length || 0}
                                    recentCount={assessment.alerts?.filter(a => a.type === 'critical').length || 0}
                                    description="Live alerts for your area."
                                />
                            </div>

                            <AlertList alerts={assessment.alerts || []} />

                            <div className="mt-12 bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                        <span className="font-bold">AI</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">Journey360 AI Insight</h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed max-w-3xl">
                                    {assessment.ai_insight || assessment.description}
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
