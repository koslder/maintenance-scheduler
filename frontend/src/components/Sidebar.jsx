import React from 'react';
import '../Dashboard.css'; // Styles for the sidebar
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="side-bar-nav">
                <ul>
                    <li><Link to="/dashboard">Home</Link></li>
                    <li><Link to="/calendar">Calendar</Link></li>
                    <li><Link to="/ac">Aircons</Link></li>
                    <li><Link to="/maintenancehistory">Maintenance History</Link></li>
                    <li><Link to="/adminpanel">Panel</Link></li>
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
