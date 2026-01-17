const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";

const getHeaders = async (auth) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const token = await user.getIdToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const apiService = {
    // Trip Endpoints
    createTrip: async (auth, tripData) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/trip/create`, {
            method: "POST",
            headers,
            body: JSON.stringify(tripData)
        });
        if (!response.ok) throw new Error("Failed to create trip");
        return response.json();
    },

    listTrips: async (auth) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/trips`, {
            headers
        });
        if (!response.ok) throw new Error("Failed to fetch trips");
        return response.json();
    },

    // AI Itinerary Endpoints
    generateItinerary: async (auth, tripId) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/ai/itinerary/generate?trip_id=${tripId}`, {
            method: "POST",
            headers
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to generate itinerary");
        }
        return response.json();
    },

    getItinerary: async (auth, tripId) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/trip/${tripId}/itinerary`, {
            headers
        });
        if (!response.ok) throw new Error("Failed to fetch itinerary");
        return response.json();
    },

    regenerateItinerary: async (auth, tripId, instruction, constraints = {}) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/ai/itinerary/regenerate`, {
            method: "POST",
            headers,
            body: JSON.stringify({ tripId, instruction, constraints })
        });
        if (!response.ok) throw new Error("Failed to regenerate itinerary");
        return response.json();
    },

    chat: async (auth, message, tripId = null) => {
        const headers = await getHeaders(auth);
        let url = `${BASE_URL}/ai/chat?message=${encodeURIComponent(message)}`;
        if (tripId) url += `&trip_id=${tripId}`;

        const response = await fetch(url, {
            method: "POST",
            headers
        });
        if (!response.ok) throw new Error("Failed to chat with AI");
        return response.json();
    },

    assessSafety: async (auth, location) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/ai/safety/assess?location=${encodeURIComponent(location)}`, {
            method: "POST",
            headers
        });
        if (!response.ok) throw new Error("Failed to assess safety");
        return response.json();
    }
};
