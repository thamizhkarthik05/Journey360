import React, { useState, useEffect, useRef } from 'react';
import {
    Search, MapPin, Calendar, MoreHorizontal, Plus, Minus,
    Utensils, Flag, Star, Clock, Info, ChevronRight,
    Shield, Share, Save, Loader2, Navigation, ExternalLink, Map as MapIcon, Sparkles
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';
import AppLayout from '../../components/layout/AppLayout';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet - Use CDNs for maximum reliability in Vite
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Sub-component to handle map centering and rendering fixes
const ForceResize = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        // Standard Leaflet fix for 'grey box' or tiles not loading correctly in dynamic layouts
        // We trigger it multiple times to catch any layout shifts or tab animations
        const refresh = () => {
            map.invalidateSize();
            if (center) map.setView(center, zoom);
        };

        refresh(); // Immediate
        const t1 = setTimeout(refresh, 100);
        const t2 = setTimeout(refresh, 500);
        const t3 = setTimeout(refresh, 1000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [center, zoom, map, center?.lat, center?.lng]);

    return null;
};

// Component to automatically open popup when position/label changes
const AutoPopupMarker = ({ position, label, bookingUrl, timestamp }) => {
    const markerRef = useRef(null);
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [position, label, timestamp]);

    return (
        <Marker position={position} ref={markerRef}>
            <Popup>
                <div className="p-1 min-w-[150px]">
                    <h4 className="font-bold text-sm mb-1">{label}</h4>
                    {bookingUrl && (
                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <ExternalLink size={10} />
                            Book Now
                        </a>
                    )}
                </div>
            </Popup>
        </Marker>
    );
};

const TimelineEvent = ({ event, index, total, onLocate, currency = '₹' }) => {
    const isHotel = event.category?.toLowerCase() === 'hotel';

    return (
        <div className="flex gap-6 relative group">
            {/* Connector Line */}
            {index !== total - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200 group-hover:bg-blue-100 transition-colors"></div>
            )}

            {/* Number Badge */}
            <div className="relative z-10">
                <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm transition-all duration-300 ${isHotel ? 'bg-indigo-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                    }`}>
                    {isHotel ? '🏨' : index + 1}
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 pb-8">
                <div
                    onClick={() => onLocate && onLocate(event)}
                    className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] group/card ${isHotel ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-300' : 'bg-white border-slate-100 hover:border-blue-200'
                        }`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900">{event.timeSlot}</span>
                        <div className="flex gap-2">
                            {event.category && (
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${isHotel ? 'bg-indigo-600 text-white' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {event.category}
                                </span>
                            )}
                        </div>
                    </div>

                    <h3 className={`text-lg font-bold mb-2 transition-colors ${isHotel ? 'text-indigo-900 group-hover:text-indigo-600' : 'text-slate-900 group-hover:text-blue-600'
                        }`}>
                        {event.name}
                    </h3>

                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                        {event.description || "Explore this amazing location suggested by AI."}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                            {event.estimatedCost !== undefined && (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-sans">{currency}</span>
                                    <span>{event.estimatedCost}</span>
                                </div>
                            )}
                            {event.duration && !isHotel && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{event.duration}</span>
                                </div>
                            )}
                        </div>

                        {isHotel && (
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const url = event.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(event.name + ' booking')}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <ExternalLink size={12} />
                                    Book Now
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLocate && onLocate(event);
                                    }}
                                    className="text-xs font-bold text-indigo-600 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-1.5"
                                >
                                    <MapIcon size={12} />
                                    Locate
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ItineraryPage = () => {
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('trip_id');
    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(1);
    const [regenerating, setRegenerating] = useState(false);
    const [mapMarker, setMapMarker] = useState(null);
    const [mapCenter, setMapCenter] = useState([20, 0]);
    const [mapZoom, setMapZoom] = useState(2);
    const [showHotels, setShowHotels] = useState(true);

    useEffect(() => {
        const fetchItinerary = async () => {
            if (!tripId) return;
            try {
                const data = await apiService.getItinerary(auth, tripId);
                setItinerary(data);
            } catch (error) {
                console.error("Fetch Error:", error);
                // If not found, try to generate it? Or just error
                alert("Failed to load itinerary. Ensure it's generated.");
            } finally {
                setLoading(false);
            }
        };

        if (auth.currentUser) {
            fetchItinerary();
        } else {
            const unsub = auth.onAuthStateChanged(user => {
                if (user) fetchItinerary();
            });
            return unsub;
        }
    }, [tripId]);

    // Auto-center map when day changes
    useEffect(() => {
        if (itinerary && itinerary.days) {
            const dayData = itinerary.days.find(d => d.dayNumber === activeDay) || itinerary.days[0];
            if (dayData && dayData.places && dayData.places.length > 0) {
                // Find first valid coordinate
                const firstPlace = dayData.places.find(p => p.lat && p.lng);
                if (firstPlace) {
                    console.log(`[MAP] Centering on ${firstPlace.name}: ${firstPlace.lat}, ${firstPlace.lng}`);
                    setMapCenter([parseFloat(firstPlace.lat), parseFloat(firstPlace.lng)]);
                    setMapZoom(13);
                }
            }
        }
    }, [activeDay, itinerary]);

    const handleLocate = (place) => {
        if (place.lat && place.lng) {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lng);
            setMapMarker({
                lat: lat,
                lng: lng,
                label: place.name,
                bookingUrl: place.bookingUrl || place.link,
                timestamp: Date.now()
            });
            setMapCenter([lat, lng]);
            setMapZoom(17); // Deeper zoom for "locate"
        } else {
            console.warn("Location coordinates missing for:", place.name);
            if (itinerary.topHotels?.[0]?.lat) {
                setMapCenter([itinerary.topHotels[0].lat, itinerary.topHotels[0].lng]);
                setMapZoom(13);
            }
        }
    };

    const handleRegenerate = async () => {
        const instruction = prompt("How would you like to modify your itinerary?");
        if (!instruction) return;

        setRegenerating(true);
        try {
            const res = await apiService.regenerateItinerary(auth, tripId, instruction);
            setItinerary(res.updatedItinerary);
        } catch (error) {
            alert("Regeneration failed: " + error.message);
        } finally {
            setRegenerating(false);
        }
    };

    if (loading) return (
        <AppLayout>
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        </AppLayout>
    );

    if (!itinerary) return (
        <AppLayout>
            <div className="flex items-center justify-center min-h-screen">
                <p>No itinerary found for this trip.</p>
            </div>
        </AppLayout>
    );

    const currentDayData = itinerary.days.find(d => d.dayNumber === activeDay) || itinerary.days[0];
    const currency = itinerary.currencySymbol || '₹';

    return (
        <AppLayout>
            <div className="bg-slate-50 font-sans text-slate-900 min-h-full">
                <main className="max-w-[1600px] mx-auto p-6 md:p-8">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-900 font-medium">{itinerary.destination}</span>
                    </nav>

                    {/* Title Section */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{itinerary.destination} Adventure</h1>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                <span className="text-slate-600">AI Generated Optimized Route • {currency}{itinerary.budget} Budget</span>
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-2 xl:pb-0">
                            {[
                                { label: "TOTAL COST", value: `${currency}${itinerary.costSummary.total}` },
                                { label: "FOOD", value: `${currency}${itinerary.costSummary.food}` },
                                { label: "STAY", value: `${currency}${itinerary.costSummary.stay}` }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm min-w-[130px]">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</div>
                                    <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                                </div>
                            ))}

                            <button
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                                {regenerating ? <Loader2 className="animate-spin" size={20} /> : <span className="text-lg">✨</span>}
                                {regenerating ? 'Updating...' : 'Regenerate with AI'}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-280px)] min-h-[600px]">

                        {/* Left: Itinerary List */}
                        <div className="xl:col-span-5 h-full overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900">Itinerary Details</h2>
                                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar max-w-[200px] sm:max-w-[400px] lg:max-w-full pb-2">
                                    {itinerary.days.map(day => (
                                        <button
                                            key={day.dayNumber}
                                            onClick={() => setActiveDay(day.dayNumber)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeDay === day.dayNumber
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            Day {day.dayNumber}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{currentDayData.date}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{currentDayData.weatherNote}</h3>
                                </div>

                                <div className="pl-2">
                                    {currentDayData.places.map((place, index) => (
                                        <TimelineEvent
                                            key={index}
                                            event={place}
                                            index={index}
                                            total={currentDayData.places.length}
                                            onLocate={handleLocate}
                                            currency={currency}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Map */}
                        <div className="xl:col-span-7 h-full relative group rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-blue-50/20 min-h-[500px]">
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                scrollWheelZoom={true}
                                style={{ height: '600px', width: '100%', zIndex: 1, position: 'relative' }}
                                className="h-full w-full z-10 overflow-hidden rounded-3xl"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <ForceResize center={mapCenter} zoom={mapZoom} />

                                {currentDayData.places.map((place, idx) => (
                                    place.lat && place.lng && (
                                        <Marker
                                            key={`marker-${activeDay}-${idx}`}
                                            position={[place.lat, place.lng]}
                                        >
                                            <Popup>
                                                <div className="p-1">
                                                    <p className="font-bold text-xs">{place.name}</p>
                                                    <p className="text-[10px] text-slate-500">{place.timeSlot}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                ))}

                                {mapMarker && mapMarker.lat && (
                                    <AutoPopupMarker
                                        position={[mapMarker.lat, mapMarker.lng]}
                                        label={mapMarker.label}
                                        bookingUrl={mapMarker.bookingUrl}
                                        timestamp={mapMarker.timestamp}
                                    />
                                )}
                            </MapContainer>

                            {/* Top Hotels Section */}
                            {itinerary.topHotels && itinerary.topHotels.length > 0 && (
                                <div className={`absolute top-4 left-4 z-20 transition-all duration-300 ${showHotels ? 'w-80' : 'w-12'}`}>
                                    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                                        <div className="flex items-center justify-between p-4 border-b border-slate-100/50">
                                            {showHotels ? (
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    <h3 className="text-sm font-bold text-slate-900">Recommended Stays</h3>
                                                </div>
                                            ) : (
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                            )}
                                            <button
                                                onClick={() => setShowHotels(!showHotels)}
                                                className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                                            >
                                                {showHotels ? <ChevronRight className="rotate-180 w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {showHotels && (
                                            <div className="p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto no-scrollbar">
                                                {itinerary.topHotels?.slice(0, 6).map((hotel, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleLocate(hotel)}
                                                        className="w-full bg-white p-3 rounded-2xl border border-slate-50 shadow-sm flex flex-col gap-3 hover:border-indigo-200 hover:bg-slate-50/50 transition-all cursor-pointer group/hotel"
                                                    >
                                                        <div className="flex gap-3 items-center">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg group-hover/hotel:scale-110 transition-transform">
                                                                🏨
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="text-xs font-bold text-slate-900 truncate">{hotel.name}</h4>
                                                                    <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                                                        <Star className="w-2 h-2 text-amber-500 fill-amber-500" />
                                                                        <span className="text-[8px] font-bold text-amber-700">{hotel.rating}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 truncate">{hotel.vibe || hotel.description}</p>
                                                                <span className="text-xs font-black text-indigo-600 mt-0.5 block">{hotel.price}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 pt-2 border-t border-slate-50">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const url = hotel.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + itinerary.destination + ' booking')}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200"
                                                            >
                                                                <ExternalLink size={12} />
                                                                Book Now
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLocate(hotel);
                                                                }}
                                                                className="flex-1 bg-white border border-slate-100 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                                                            >
                                                                <MapIcon size={12} />
                                                                Locate
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default ItineraryPage;
