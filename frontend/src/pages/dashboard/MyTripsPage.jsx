import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Calendar, ChevronRight, Search, Plus } from 'lucide-react';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';

const MyTripsPage = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const data = await apiService.listTrips(auth);
                setTrips(data);
            } catch (error) {
                console.error("Fetch Trips Error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (auth.currentUser) {
            fetchTrips();
        } else {
            const unsub = auth.onAuthStateChanged(u => {
                if (u) {
                    fetchTrips();
                } else {
                    setLoading(false); // Stop loading if no user found
                }
            });
            return unsub;
        }
    }, []);

    const filteredTrips = trips.filter(trip =>
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="bg-slate-50 min-h-full p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">My Adventures</h1>
                            <p className="text-slate-500">Manage and view all your planned trips.</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={20} />
                            Plan New Trip
                        </button>
                    </div>

                    {/* Search & Stats */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by destination..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-6 px-4 border-l border-slate-100 hidden md:flex">
                            <div className="text-center">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Trips</div>
                                <div className="text-xl font-bold text-slate-900">{trips.length}</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                            <p className="text-slate-500 font-medium">Retrieving your travel history...</p>
                        </div>
                    ) : filteredTrips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-4xl">🌎</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No trips found</h3>
                            <p className="text-slate-500 mb-8 max-w-xs text-center">Ready to start your next adventure? AI is here to help you plan everything.</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Create your first trip →
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTrips.map((trip) => (
                                <div
                                    key={trip.trip_id}
                                    onClick={() => navigate(`/itinerary?trip_id=${trip.trip_id}`)}
                                    className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer overflow-hidden flex flex-col"
                                >
                                    <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 flex items-start justify-between relative overflow-hidden">
                                        <MapPin size={60} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-white mb-1">{trip.destination}</h3>
                                            <p className="text-blue-100 text-xs font-medium uppercase tracking-widest">{trip.status}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Calendar size={18} className="text-slate-400" />
                                                <div className="text-sm">
                                                    <span className="font-medium">{trip.start_date || 'TBD'}</span>
                                                    <span className="mx-2 text-slate-300">→</span>
                                                    <span className="font-medium">{trip.end_date || 'TBD'}</span>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget</div>
                                                    <div className="text-lg font-bold text-slate-900">₹{trip.budget}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Days</div>
                                                    <div className="text-lg font-bold text-slate-900">{trip.days || 3}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default MyTripsPage;
