import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Store user data
    const navigate = useNavigate(); // Navigate hook to redirect if necessary

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId'); // Get userId from localStorage
        const token = localStorage.getItem('token'); // Get token from localStorage

        if (!storedUserId || !token) {
            navigate('/login'); // Redirect to login if no user or token is found
            return;
        }

        // Fetch user data based on storedUserId
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/users/${storedUserId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(response.data); // Set the fetched user data
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/login'); // Redirect to login in case of an error
            }
        };

        fetchUserData(); // Fetch user data when the component mounts
    }, [navigate]);

    return (
        <UserContext.Provider value={{ user }}>
            {children} {/* Provide user context to children */}
        </UserContext.Provider>
    );
};

// Custom hook to use user context
export const useUser = () => useContext(UserContext);
