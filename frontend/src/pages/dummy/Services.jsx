import React from 'react';
import { useNavigate } from 'react-router-dom';
// import AppLayout from '../../components/layout/AppLayout';
import { Bot, Map, Shield, Users, Compass, Globe, Zap, ArrowRight, Lock } from 'lucide-react';

const ServiceCard = ({ icon: Icon, title, desc, color, path, onAction }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (path) {
            navigate(path);
        } else if (onAction) {
            onAction();
        }
    };

    return (
        <div onClick={handleClick} className="group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <div className={`w-14 h-14 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mb-6 group-hover:bg-opacity-20`}>
                <Icon size={32} className={color.replace('bg-', 'text-')} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                {title}
                {!path && <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-400 px-2 py-1 rounded-full border border-gray-200 dark:border-slate-700">Soon</span>}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 min-h-[60px]">{desc}</p>
            <button className={`flex items-center gap-2 text-sm font-semibold  transition-colors ${color.replace('bg-', 'text-')}`}>
                {path ? 'Launch Tool' : 'Notify Me'} <ArrowRight size={16} className={!path ? 'opacity-50' : ''} />
            </button>
        </div>
    );
};

const Services = () => {
    const handleComingSoon = () => {
        alert("This feature is currently in development! Stay tuned for updates.");
    };

    const services = [
        {
            icon: Bot,
            title: "AI Trip Planner",
            desc: "Generate complete, personalized itineraries in seconds using our advanced Gemini AI engine.",
            color: "bg-emerald-600",
            path: "/dashboard" // Working Feature
        },
        {
            icon: Shield,
            title: "Safety Intelligence",
            desc: "Real-time safety scores, neighborhood analysis, and emergency alerts for any destination.",
            color: "bg-emerald-600",
            path: "/safety" // Working Feature
        },
        {
            icon: Map,
            title: "Smart Navigation",
            desc: "Interactive maps with curated points of interest, hidden gems, and optimized routes.",
            color: "bg-teal-600",
            path: "/my-trips" // Working Feature (Maps are inside itineraries)
        },
        {
            icon: Users,
            title: "Community Hub",
            desc: "Connect with verified travelers, share experiences, and get tips from locals.",
            color: "bg-purple-600",
            onAction: handleComingSoon
        },
        {
            icon: Globe,
            title: "Visa Assistant",
            desc: "Automated visa requirements check and document preparation assistance.",
            color: "bg-orange-500",
            onAction: handleComingSoon
        },
        {
            icon: Zap,
            title: "Instant Booking",
            desc: "Seamlessly book flights, hotels, and experiences directly from your itinerary.",
            color: "bg-pink-500",
            onAction: handleComingSoon // Booking logic not built yet
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto p-8 mb-20">
                <div className="text-center max-w-3xl mx-auto mb-16 pt-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
                        Everything you need for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">perfect trip</span>
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        Access our suite of AI-powered tools designed to make your journey safer, smarter, and more memorable.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <ServiceCard key={index} {...service} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Services;
