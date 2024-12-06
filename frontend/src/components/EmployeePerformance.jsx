// src/components/EmployeePerformance.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EmployeePerformance = () => {
    const [performanceData, setPerformanceData] = useState([]);

    useEffect(() => {
        const fetchPerformanceData = async () => {
            const response = await axios.get('/api/ac'); // Adjust this to your endpoint for employee data
            const data = response.data;

            const performanceMap = {};

            data.forEach(ac => {
                ac.maintenanceHistory.forEach(entry => {
                    const employee = entry.employee;
                    performanceMap[employee] = (performanceMap[employee] || 0) + 1; // Count tasks
                });
            });

            setPerformanceData(Object.entries(performanceMap).map(([employee, count]) => ({ employee, count })));
        };

        fetchPerformanceData();
    }, []);

    return (
        <div>
            <h2>Employee Performance</h2>
            <ul>
                {performanceData.map((item, index) => (
                    <li key={index}>
                        {item.employee}: {item.count} tasks completed
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EmployeePerformance;