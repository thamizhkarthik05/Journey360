import React, { useState } from 'react';
// import AppLayout from '../../components/layout/AppLayout';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, ChevronDown, ChevronUp, CheckCircle, HelpCircle } from 'lucide-react';

const Contact = () => {
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSending(true);
        // Simulate API call
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setFormState({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setSent(false), 5000);
        }, 1500);
    };

    const handleChange = (e) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        });
    };

    const faqs = [
        {
            q: "How does the AI itinerary generation work?",
            a: "Our advanced AI analyzes your destination, budget, and interests to build a day-by-day plan. It checks real-time availability for hotels and attractions to ensure accuracy."
        },
        {
            q: "Can I modify a trip after it's generated?",
            a: "Absolutely! You can use the 'Regenerate' button to give specific instructions (e.g., 'Make it more relaxing' or 'Add fewer museums') and the AI will adjust the plan instantly."
        },
        {
            q: "Are the prices accurate?",
            a: "We use real-time data from global travel partners to estimate costs. However, prices for flights and hotels can fluctuate, so we recommend booking through the provided links to lock in rates."
        },
        {
            q: "Is Journey360 free to use?",
            a: "Yes! The core itinerary generation features are free. We also offer premium safety alerts and offline maps for frequent travelers."
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
            {/* Hero Section */}
            <div className="bg-blue-600 py-16 sm:py-24 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
                        We'd Love to Hear From You
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Whether you have a question about features, pricing, or need support planning your next adventure, our team is ready to help.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Card 1 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Chat Support</h3>
                            <p className="text-slate-500 text-sm mb-4">Our friendly team is here to help.</p>
                            <a href="mailto:support@journey360.ai" className="text-blue-600 font-bold text-sm hover:underline">support@journey360.ai</a>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                                <MapPin size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Visit Us</h3>
                            <p className="text-slate-500 text-sm mb-4">Come say hello at our HQ.</p>
                            <p className="text-slate-900 font-medium text-sm">100 Innovation Dr,<br />San Francisco, CA 94016</p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                                <Phone size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Call Us</h3>
                            <p className="text-slate-500 text-sm mb-4">Mon-Fri from 8am to 5pm.</p>
                            <p className="text-slate-900 font-bold text-sm">+1 (555) 000-0000</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-8 sm:p-10 flex-1">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Mail className="text-blue-600" /> Send us a message
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formState.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formState.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            required
                                            value={formState.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                        <textarea
                                            name="message"
                                            required
                                            rows="5"
                                            value={formState.message}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 resize-none"
                                            placeholder="Tell us about your trip plans..."
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={sending || sent}
                                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${sent ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                                            } ${sending ? 'opacity-80 cursor-wait' : ''}`}
                                    >
                                        {sending ? (
                                            <>Sending...</>
                                        ) : sent ? (
                                            <><CheckCircle size={20} /> Message Sent!</>
                                        ) : (
                                            <><Send size={20} /> Send Message</>
                                        )}
                                    </button>
                                </form>
                            </div>
                            <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
                                <p className="text-sm text-slate-500">
                                    We usually respond within <span className="font-bold text-slate-700">24 hours</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-blue-600 font-bold tracking-wider text-sm uppercase bg-blue-50 px-3 py-1 rounded-full">Support</span>
                        <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-4">Frequently Asked Questions</h2>
                        <p className="text-slate-600">Quick answers to common questions about Journey360.</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
                            >
                                <button
                                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                                    className="w-full text-left p-6 flex items-center justify-between"
                                >
                                    <span className="font-bold text-slate-900 flex items-center gap-3">
                                        <HelpCircle className="text-slate-400 w-5 h-5" />
                                        {faq.q}
                                    </span>
                                    {activeFaq === idx ? (
                                        <ChevronUp className="text-blue-600 w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="text-slate-400 w-5 h-5" />
                                    )}
                                </button>
                                <div
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-50">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
