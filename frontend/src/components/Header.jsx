import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Modal.css'; // Styles for the modal

const Header = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('Dark (beta)');
    const [userName, setUserName] = useState(''); // State for user name
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch user details from local storage or API
        const fetchUserName = async () => {
            try {
                // Simulate a fetch from local storage or an API
                const user = JSON.parse(localStorage.getItem('user')) || {
                    firstname: 'John',
                    lastname: 'Doe',
                }; // Replace with API call if necessary

                setUserName(`${user.firstname} ${user.lastname}`);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserName('Guest User');
            }
        };

        fetchUserName();
    }, []);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Remove user data if stored
        navigate('/login');
    };

    const handleThemeChange = (event) => {
        setSelectedTheme(event.target.value);
    };

    return (
        <div className="header" style={{ zIndex: 5, position: "relative" }}>
            <div className="profile-logo">
                <div className="logo">LOGO</div>
                <div className="profile" onClick={toggleModal}>
                    <img
                        src="https://via.placeholder.com/40"
                        alt="Profile"
                        className="profile-pic"
                    />
                </div>
            </div>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-profile">
                            <div className="modal-image">
                                <img
                                    src="https://via.placeholder.com/40"
                                    alt="Profile"
                                    className="profile-pic"
                                />
                            </div>
                            <div className="modal-fullname">
                                <p>{userName}</p> {/* Display user name */}
                            </div>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={logout}>Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Header;
