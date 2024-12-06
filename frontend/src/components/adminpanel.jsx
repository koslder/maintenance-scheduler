import React, { useState, useEffect } from 'react';
import UpdateUserModal from '../modal/UpdateUserModal';
import Header from './Header';
import Sidebar from './Sidebar';
import axios from 'axios';
import '../userPanel.css';

const adminpanel = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [employeeStats, setEmployeeStats] = useState(null);
    const [error, setError] = useState(null);

    // Fetch all users and employee stats
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const getUsers = await axios.get('http://localhost:5000/users');
                console.log(getUsers.data)
                setUsers(getUsers.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        const fetchEmployeeStats = async () => {
            try {
                const token = localStorage.getItem('token');  // Get token from localStorage
                if (!token) {
                    throw new Error('Token not found');
                }

                const response = await axios.get('http://localhost:5000/api/employee-statistics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployeeStats(response.data);
                console.log(response);
            } catch (error) {
                setError('Failed to fetch employee statistics.');
                console.error('Error fetching employee statistics:', error);
            }
        };

        fetchEmployeeStats();
        fetchUsers();
    }, []);

    // userUpdate button
    const handleUpdate = (userId) => {
        const user = users.find((user) => user._id === userId);
        setSelectedUser(user);  // Set the selected user
        setShowModal(true);     // Show the modal
    };

    // userDelete button
    const handleDelete = async (userId) => {
        // Ask for confirmation before deleting
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                // Send delete request to server
                const response = await axios.delete(`http://localhost:5000/users/${userId}`);
                console.log('User deleted:', response.data);

                // Remove the deleted user from the state to update the UI
                setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    // Function to get all unique task names
    const getTaskNames = (stats) => {
        const taskNames = [];
        stats.forEach((employee) => {
            Object.keys(employee.taskCounts).forEach((task) => {
                if (!taskNames.includes(task)) {
                    taskNames.push(task);
                }
            });
        });
        return taskNames;
    };

    const taskNames = employeeStats ? getTaskNames(employeeStats) : [];

    return (
        <>
            <Header />
            <div className="dashboard">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="user-data">
                        <h3>Employees</h3>
                        {users.length > 0 ? (
                            <table className='users-table'>
                                <thead className='table-head'>
                                    <tr className='table-row'>
                                        <th className='table-name'>Name</th>
                                        <th className='table-user'>Username</th>
                                        <th className='table-age'>Age</th>
                                        <th className='table-email'>Email</th>
                                        <th className='table-address'>Address</th>
                                        <th className='table-role'>Role</th>
                                        <th className='table-actions'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='table-body'>
                                    {users.map((user) => (
                                        <tr key={user._id} className='table-row'>
                                            <td className='table-name'>{user.firstname} {user.lastname}</td>
                                            <td className='table-user'>{user.username}</td>
                                            <td className='table-age'>{user.age}</td>
                                            <td className='table-email'>{user.email}</td>
                                            <td className="table-address">
                                                {user.address?.street && user.address?.city && user.address?.state && user.address?.zip
                                                    ? `${user.address?.street} ${user.address?.city}, ${user.address?.state} ${user.address?.zip}`
                                                    : 'N/A'}
                                            </td>
                                            <td className='table-role'>{user.role}</td>
                                            <td className='table-actions'>
                                                <div className="table-buttons">
                                                    {/* Update Button */}
                                                    <button className='updateButton' onClick={() => handleUpdate(user._id)} >Update</button>

                                                    {/* Delete Button */}
                                                    <button className='deleteButton' onClick={() => handleDelete(user._id)} >Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No data found</p>
                        )}
                    </div>

                    <div className="employee-stats">
                        {employeeStats ? (
                            <div>
                                <h3>Employee Statistics</h3>
                                <table className="stats-table">
                                    <thead>
                                        <tr>
                                            <th>Employee Name</th>
                                            {taskNames.map((task) => (
                                                <th key={task}>{task}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employeeStats.map((employee) => (
                                            <tr key={employee._id}>
                                                <td>{employee.name}</td>
                                                {taskNames.map((task) => (
                                                    <td key={task}>{employee.taskCounts[task] || 0}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>{error || 'Loading employee statistics...'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Update User Modal */}
            {showModal && (
                <UpdateUserModal
                    showModal={showModal}
                    setShowModal={setShowModal}
                    user={selectedUser}
                    setUsers={setUsers}
                />
            )}
        </>
    );
};

export default adminpanel;
