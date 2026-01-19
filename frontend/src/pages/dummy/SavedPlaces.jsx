import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Bookmark, MapPin } from 'lucide-react';

const SavedPlaces = () => {
    return (
        <AppLayout>
            <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Saved Places</h1>

                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <Bookmark size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved places yet</h3>
                    <p className="text-gray-500 max-w-sm text-center">
                        When you find interesting locations or hotels during your trip planning, save them here for quick access.
                    </p>
                    <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <MapPin size={18} />
                        Explore Destinations
                    </button>
                </div>
            </div>
        </AppLayout>
    );
};

export default SavedPlaces;
