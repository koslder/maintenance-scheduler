import axios from 'axios';

const API_BASE_URL = '/api'; // Update this to match your backend's base URL

export const fetchMaintenanceByAcID = async (acID) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/maintenance/by-ac/${acID}`);
        return response.data; // Return the maintenance events
    } catch (error) {
        console.error('Error fetching maintenance by acID:', error);
        throw error; // Re-throw the error to handle it in the component
    }
};
