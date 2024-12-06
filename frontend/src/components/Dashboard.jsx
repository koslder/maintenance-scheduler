import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import '../Dashboard.css';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const [userId, setUserId] = useState(null);
    const [userData, setUserData] = useState(null);
    const [AllMaintenance, setAllMaintenance] = useState([]);
    const [MaintenanceOngoing, setMaintenanceOngoing] = useState([]);
    const [maintenanceCompleted, setmaintenanceCompleted] = useState([]);
    const [employeeStats, setEmployeeStats] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!storedUserId || !token) {
            navigate('/login');
            return;
        }

        setUserId(storedUserId);

        const fetchUserData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/users/${storedUserId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserData(response.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const fetchEmployeeStats = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/employee-statistics', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setEmployeeStats(response.data);
            } catch (error) {
                setError('Failed to fetch employee statistics.');
                console.error('Error fetching employee statistics:', error);
            } finally {
                setLoadingStats(false);
            }

            // Fetch all maintenance tasks
            try {
                const maintenanceResponse = await axios.get('http://localhost:5000/api/maintenance', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const maintenanceTasks = maintenanceResponse.data;

                // Filter tasks specific to the logged-in user
                const userTasks = maintenanceTasks.filter(task =>
                    task.assignedEmployee.includes(storedUserId)
                );

                setAllMaintenance(userTasks);

                // Separate tasks into ongoing and completed
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Reset time to midnight

                const ongoingTasks = userTasks.filter(task => {
                    const taskDate = new Date(task.createdAt);
                    taskDate.setHours(0, 0, 0, 0);
                    return task.details.status === false && now >= taskDate;
                });

                const completedTasks = userTasks.filter(task => task.details.status === true);

                setMaintenanceOngoing(ongoingTasks);
                setmaintenanceCompleted(completedTasks);
            } catch (error) {
                console.error('Error fetching maintenance tasks:', error);
            }
        };

        fetchUserData();
        fetchEmployeeStats();
    }, [navigate]);

    const chartData = useMemo(() => {
        const userStat = employeeStats.find((stat) => stat._id === userId);
        if (!userStat || !userStat.taskCounts) return null;

        const labels = Object.keys(userStat.taskCounts);
        const dataValues = Object.values(userStat.taskCounts);
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

        return {
            labels,
            datasets: [
                {
                    label: 'Task Breakdown',
                    data: dataValues,
                    backgroundColor: colors,
                    hoverOffset: 4,
                },
            ],
        };
    }, [employeeStats, userId]);

    return (
        <>
            <Header />
            <div className="dashboard">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="task-container">
                        <div className="col all">
                            <Link to="/dashboard" style={{ textDecoration: 'none', color: 'unset' }}>
                                <div>
                                    {AllMaintenance.length}
                                    <h6>All Maintenance</h6>
                                </div>
                            </Link>
                        </div>
                        <div className="col ongoing">
                            <Link to="/calendar" style={{ textDecoration: 'none', color: 'unset' }}>
                                <div>
                                    {MaintenanceOngoing.length}
                                    <h6>Ongoing Maintenance</h6>
                                </div>
                            </Link>
                        </div>
                        <div className="col completed">
                            <Link to="/calendar" style={{ textDecoration: 'none', color: 'unset' }}>
                                {maintenanceCompleted.length}
                                <h6>Completed Maintenance</h6>
                            </Link>
                        </div>
                    </div>

                    <div className="task-summary">
                        <h2>Task Summary</h2>
                        {loadingStats ? (
                            <p>Loading employee statistics...</p>
                        ) : error ? (
                            <p className="error">{error}</p>
                        ) : (
                            <>
                                {chartData ? (
                                    <Doughnut data={chartData} />
                                ) : (
                                    <p>No task data available for chart.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
