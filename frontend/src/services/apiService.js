const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8001";

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
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to regenerate itinerary");
        }
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
    },

    getDashboardContext: async (auth) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/ai/dashboard/context`, {
            headers
        });
        if (!response.ok) throw new Error("Failed to fetch dashboard context");
        return response.json();
    },

    // User Profile
    getProfile: async (auth) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/users/me`, {
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    updateProfile: async (auth, data) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/users/me`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return response.json();
    },

    sendTestNotification: async (auth) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/users/test-notify`, {
            method: 'POST',
            headers
        });
        if (!response.ok) throw new Error('Failed to send test notification');
        return response.json();
    },

    deleteAccount: async (auth) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/users/me`, {
            method: 'DELETE',
            headers
        });
        if (!response.ok) throw new Error('Failed to delete account');
        return response.json();
    },

    // 2FA Endpoints
    setup2FA: async (auth) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/users/2fa/setup`, {
            method: 'POST',
            headers
        });
        if (!response.ok) throw new Error('Failed to setup 2FA');
        return response.json();
    },

    verify2FA: async (auth, code) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/users/2fa/verify`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ code })
        });
        if (!response.ok) throw new Error('Failed to verify code');
        return response.json();
    },

    disable2FA: async (auth) => {
        const headers = await getHeaders(auth);
        const response = await fetch(`${BASE_URL}/users/2fa/disable`, {
            method: 'POST',
            headers
        });
        if (!response.ok) throw new Error('Failed to disable 2FA');
        return response.json();
    }
};
