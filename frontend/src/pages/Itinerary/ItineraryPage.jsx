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
import ARViewer from '../../components/navigation/ARViewer';
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
const AutoPopupMarker = ({ position, label, bookingUrl, timestamp, onLaunchAR }) => {
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
                    <div className="flex flex-col gap-2">
                        {bookingUrl && (
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                                <ExternalLink size={10} />
                                Book Now
                            </a>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLaunchAR && onLaunchAR({ name: label, lat: position[0], lng: position[1] });
                            }}
                            className="w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors"
                        >
                            <Sparkles size={10} />
                            Launch AR
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

// Currency Conversion Helper
const EXCHANGE_RATES = {
    'INR': { 'USD': 0.012, 'EUR': 0.011, 'INR': 1 },
    'USD': { 'INR': 83.5, 'EUR': 0.92, 'USD': 1 },
    'EUR': { 'INR': 90.5, 'USD': 1.09, 'EUR': 1 }
};

const getCurrencySymbol = (code) => {
    switch (code) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'INR': return '₹';
        default: return code;
    }
};

const PriceDisplay = ({ amount, sourceCode = 'INR', targetCode = 'INR', className }) => {
    // 1. Clean the amount string/number
    let numericVal = 0;
    if (typeof amount === 'number') {
        numericVal = amount;
    } else if (typeof amount === 'string') {
        // Remove known symbols and commas
        const clean = amount.replace(/[₹$€,]/g, '').trim();
        numericVal = parseFloat(clean) || 0;
    }

    // 2. Identify Source Code (if symbol passed in amount overrides prop)
    // Actually, we rely on sourceCode prop usually being the global itinerary currency code

    // 3. Convert
    // Default to 1:1 if rate unknown
    const rates = EXCHANGE_RATES[sourceCode] || {};
    const rate = rates[targetCode] || 1;

    // If source and target same, just format
    if (sourceCode === targetCode && rate === 1) {
        // keep original if possible or reformat? Reformat ensures consistency
    }

    const converted = numericVal * rate;
    // Check if result is valid
    if (isNaN(converted)) {
        return <span className={className}>{amount}</span>;
    }

    const finalVal = Math.round(converted).toLocaleString();
    const symbol = getCurrencySymbol(targetCode);

    return (
        <span className={className}>
            <span className="font-sans">{symbol}</span>
            <span>{finalVal}</span>
        </span>
    );
};

const TimelineEvent = ({ event, index, total, onLocate, onLaunchAR, sourceCurrencyCode, targetCurrencyCode }) => {
    const isHotel = event.category?.toLowerCase() === 'hotel';

    return (
        <div className="flex gap-6 relative group">
            {/* Connector Line */}
            {index !== total - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200 group-hover:bg-emerald-100 transition-colors"></div>
            )}

            {/* Number Badge */}
            <div className="relative z-10">
                <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm transition-all duration-300 ${isHotel ? 'bg-teal-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                    }`}>
                    {isHotel ? '🏨' : index + 1}
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 pb-8">
                <div
                    onClick={() => onLocate && onLocate(event)}
                    className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] group/card ${isHotel ? 'bg-teal-50/30 border-teal-100 hover:border-teal-300' : 'bg-white border-slate-100 hover:border-emerald-200'
                        }`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900">{event.timeSlot}</span>
                        <div className="flex gap-2">
                            {event.category && (
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${isHotel ? 'bg-teal-600 text-white' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {event.category}
                                </span>
                            )}
                        </div>
                    </div>

                    <h3 className={`text-lg font-bold mb-2 transition-colors ${isHotel ? 'text-teal-900 group-hover:text-teal-600' : 'text-slate-900 group-hover:text-emerald-600'
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
                                    <PriceDisplay
                                        amount={event.estimatedCost}
                                        sourceCode={sourceCurrencyCode}
                                        targetCode={targetCurrencyCode}
                                    />
                                </div>
                            )}
                            {event.duration && !isHotel && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{event.duration}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {isHotel ? (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const url = event.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(event.name + ' booking')}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                    >
                                        <ExternalLink size={12} />
                                        Book Now
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLocate && onLocate(event);
                                        }}
                                        className="text-xs font-bold text-teal-600 bg-white border border-teal-100 px-3 py-1.5 rounded-lg shadow-sm hover:bg-teal-50 transition-all flex items-center gap-1.5"
                                    >
                                        <MapIcon size={12} />
                                        Locate
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLocate && onLocate(event);
                                    }}
                                    className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                                >
                                    <MapIcon size={12} />
                                    Locate
                                </button>
                            )}
                        </div>
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

    // AR State
    const [activeAR, setActiveAR] = useState(null);

    // User Preference State
    const [targetCurrency, setTargetCurrency] = useState('INR');

    useEffect(() => {
        const fetchItineraryAndPrefs = async () => {
            if (!tripId) return;
            try {
                // 1. Fetch Itinerary
                const data = await apiService.getItinerary(auth, tripId);
                setItinerary(data);

                // 2. Fetch User Prefs
                if (auth.currentUser) {
                    try {
                        const profile = await apiService.getProfile(auth);
                        if (profile.preferences?.currency) {
                            setTargetCurrency(profile.preferences.currency);
                        }
                    } catch (err) {
                        console.warn("Failed to fetch user prefs:", err);
                    }
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                alert("Failed to load itinerary.");
            } finally {
                setLoading(false);
            }
        };

        if (auth.currentUser) {
            fetchItineraryAndPrefs();
        } else {
            const unsub = auth.onAuthStateChanged(user => {
                if (user) fetchItineraryAndPrefs();
            });
            return unsub;
        }
    }, [tripId]);

    // Auto-center map when day changes
    useEffect(() => {
        if (itinerary && itinerary.days) {
            const dayData = itinerary.days.find(d => d.dayNumber === activeDay) || itinerary.days[0];
            if (dayData && dayData.places && dayData.places.length > 0) {
                const firstPlace = dayData.places.find(p => p.lat && p.lng);
                if (firstPlace) {
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
            setMapZoom(17);
        } else {
            if (itinerary.topHotels?.[0]?.lat) {
                setMapCenter([itinerary.topHotels[0].lat, itinerary.topHotels[0].lng]);
                setMapZoom(13);
            }
        }
    };

    const handleLaunchAR = (place) => {
        if (place.lat && place.lng) {
            setActiveAR({
                name: place.name || place.label,
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lng)
            });
        } else {
            alert("This location does not have coordinates for AR navigation.");
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
                <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
        </AppLayout>
    );

    if (!itinerary) return (
        <AppLayout>
            <div className="flex items-center justify-center min-h-screen">
                <p>No itinerary found.</p>
            </div>
        </AppLayout>
    );

    const currentDayData = itinerary.days.find(d => d.dayNumber === activeDay) || itinerary.days[0];

    // Determine Source Currency from Itinerary (Default to INR if missing)
    const sourceCurrencyCode = itinerary.currencyCode || 'INR';

    return (
        <AppLayout>
            <div className="bg-slate-50 font-sans text-slate-900 min-h-full">
                <main className="max-w-[1600px] mx-auto p-6 md:p-8">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <Link to="/dashboard" className="hover:text-emerald-600 transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-900 font-medium">{itinerary.destination}</span>
                    </nav>

                    {/* Title Section */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{itinerary.destination} Adventure</h1>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                <span className="text-slate-600 flex items-center gap-1">
                                    AI Generated Optimized Route •
                                    <PriceDisplay amount={itinerary.budget} sourceCode={sourceCurrencyCode} targetCode={targetCurrency} />
                                    Budget
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-2 xl:pb-0">
                            {[
                                { label: "TOTAL COST", value: itinerary.costSummary.total },
                                { label: "FOOD", value: itinerary.costSummary.food },
                                { label: "STAY", value: itinerary.costSummary.stay }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm min-w-[130px]">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</div>
                                    <div className="text-xl font-bold text-slate-900">
                                        <PriceDisplay amount={stat.value} sourceCode={sourceCurrencyCode} targetCode={targetCurrency} />
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl border-2 border-emerald-100 hover:bg-emerald-100 transition-colors whitespace-nowrap disabled:opacity-50"
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
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
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
                                        <Calendar className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{currentDayData.date || `Day ${currentDayData.dayNumber}`}</span>
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
                                            onLaunchAR={handleLaunchAR}
                                            sourceCurrencyCode={sourceCurrencyCode}
                                            targetCurrencyCode={targetCurrency}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Map */}
                        <div className="xl:col-span-7 h-full relative group rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-emerald-50/20 min-h-[500px]">
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                scrollWheelZoom={true}
                                style={{ height: '100%', minHeight: '600px', width: '100%', zIndex: 0 }}
                                className="h-full w-full outline-none"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />
                                <ForceResize center={mapCenter} zoom={mapZoom} />

                                {currentDayData.places.map((place, idx) => (
                                    place.lat && place.lng && (
                                        <Marker
                                            key={`marker-${activeDay}-${idx}`}
                                            position={[place.lat, place.lng]}
                                        >
                                            <Popup>
                                                <div className="p-1 min-w-[120px]">
                                                    <p className="font-bold text-sm mb-1">{place.name}</p>
                                                    <p className="text-[10px] text-slate-500 mb-2">{place.timeSlot}</p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLaunchAR(place);
                                                        }}
                                                        className="w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <Sparkles size={10} />
                                                        Launch AR
                                                    </button>
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
                                        onLaunchAR={handleLaunchAR}
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
                                                        className="w-full bg-white p-3 rounded-2xl border border-slate-50 shadow-sm flex flex-col gap-3 hover:border-teal-200 hover:bg-slate-50/50 transition-all cursor-pointer group/hotel"
                                                    >
                                                        <div className="flex gap-3 items-center">
                                                            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 text-lg group-hover/hotel:scale-110 transition-transform">
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
                                                                <span className="text-xs font-black text-teal-600 mt-0.5 block">
                                                                    <PriceDisplay amount={hotel.price} sourceCode={sourceCurrencyCode} targetCode={targetCurrency} />
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 pt-2 border-t border-slate-50">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const url = hotel.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + itinerary.destination + ' booking')}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-teal-200"
                                                            >
                                                                <ExternalLink size={12} />
                                                                Book Now
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLocate(hotel);
                                                                }}
                                                                className="flex-1 bg-white border border-slate-100 hover:border-teal-200 text-slate-600 hover:text-teal-600 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
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

            {/* AR Overlay */}
            {activeAR && (
                <ARViewer
                    destination={activeAR}
                    onClose={() => setActiveAR(null)}
                />
            )}
        </AppLayout>
    );
};

export default ItineraryPage;
