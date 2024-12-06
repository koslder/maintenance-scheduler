import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import '../maintenanceHistory.css'; // Optional CSS for styling

const MaintenanceHistory = () => {
    const [maintenanceData, setMaintenanceData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [acUnits, setAcUnits] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch maintenance data
                const maintenanceResponse = await axios.get('http://localhost:5000/api/maintenance');
                const sortedData = maintenanceResponse.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setMaintenanceData(sortedData);
                setFilteredData(sortedData);

                // Fetch employee data
                const employeeResponse = await axios.get('http://localhost:5000/users');
                setEmployees(employeeResponse.data);

                // Fetch AC unit data
                const acResponse = await axios.get('http://localhost:5000/api/ac');
                setAcUnits(acResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // Handle search term change
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        const filtered = maintenanceData.filter((item) => {
            // Get the related AC unit
            const ac = acUnits.find((unit) => unit._id === item.acID);

            // Check for matches in maintenance ID, AC name, or other fields
            return (
                item._id.toLowerCase().includes(term) || // Search by maintenance ID
                (ac && ac.name.toLowerCase().includes(term)) || // Search by AC name
                Object.values(item).some((val) =>
                    String(val).toLowerCase().includes(term)
                )
            );
        });

        setFilteredData(filtered);
    };

    // Helper function to get employee names from IDs
    const getEmployeeNames = (employeeIds) => {
        return employeeIds
            .map((id) => {
                const employee = employees.find((emp) => emp._id === id);
                return employee ? `${employee.firstname} ${employee.lastname}` : 'Unknown Employee';
            })
            .join(', ');
    };

    // Helper function to get AC details from acID
    const getAcDetails = (acID) => {
        const ac = acUnits.find((unit) => unit._id === acID);
        return ac
            ? `${ac.name} (Watts: ${ac.watts}, Location: ${ac.location})`
            : 'Unknown AC Unit';
    };

    return (
        <>
            <Header />
            <div className="dashboard">
                <Sidebar />
                <div className="dashboard-content">
                    <h1>Maintenance History</h1>
                    <input
                        type="text"
                        placeholder="Search by Maintenance ID or AC Name..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="search-bar"
                    />
                    <div className="card-container">
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <div className="card" key={item._id}>
                                    <h3>{item.title}</h3>
                                    <p><strong>Date:</strong> {new Date(item.date).toLocaleString()}</p>
                                    <p><strong>Time:</strong> {item.details.timeStart} - {item.details.timeEnd}</p>
                                    <p><strong>Status:</strong> {item.details.status ? 'Completed' : 'Pending'}</p>
                                    <p><strong>Summary:</strong> {item.details.summary}</p>
                                    <p><strong>AC Details:</strong> {getAcDetails(item.acID)}</p>
                                    <p><strong>Tasks:</strong> {item.tasks.join(', ')}</p>
                                    <p>
                                        <strong>Assigned Employees:</strong>{' '}
                                        {item.assignedEmployee.length > 0
                                            ? getEmployeeNames(item.assignedEmployee)
                                            : 'None'}
                                    </p>
                                    <p><strong>Created At:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                                    <p><strong>Updated At:</strong> {new Date(item.updatedAt).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p>No maintenance records found.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MaintenanceHistory;
