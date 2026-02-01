import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.APP_BASE_URL || 'http://localhost:3000',
    timeout: 10000,
});

export async function fetchEvent(eventId: string) {
    try {
        const response = await apiClient.get(`/api/events/${eventId}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch event ${eventId}:`, error);
        throw error;
    }
}

export async function closeEvent(eventId: string) {
    try {
        const response = await apiClient.post(`/api/events/${eventId}/close`);
        return response.data;
    } catch (error) {
        console.error(`Failed to close event ${eventId}:`, error);
        throw error;
    }
}
