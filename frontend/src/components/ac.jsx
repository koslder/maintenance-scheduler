import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from 'react-modal';
import axios from 'axios';
import '../ac.css';

const Ac = () => {
    const [selectedAcId, setSelectedAcId] = useState(null); // Track the selected AC ID
    const [acs, setAC] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', id: '', location: '', watts: '' });
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState(null);
    const [isModalAddOpen, setIsModalAddOpen] = useState(false);
    const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
    const [historyModal, setHistoryModal] = useState(false);
    const [maintenanceData, setMaintenanceData] = useState([]); // State to store maintenance data
    const [history, setHistory] = useState({}); // For History data, store by acID

    // Fetch maintenance history by acID
    const historyFetch = async (acID) => {
        try {
            // Clear history for the previously selected AC before fetching new data
            setHistory((prevHistory) => ({ ...prevHistory, [selectedAcId]: [] }));

            const eventHistoryResponse = await axios.get(`http://localhost:5000/api/maintenance/by-ac/${acID}`);
            const historyData = eventHistoryResponse.data;

            setHistory((prevHistory) => ({ ...prevHistory, [acID]: historyData }));
        } catch (error) {
            console.error('Error fetching maintenance history:', error);
        }
    };

    // Fetch ACs on component load
    useEffect(() => {
        fetchACs();
    }, []);

    // Fetch all AC units
    const fetchACs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/ac/');
            if (!response.ok) throw new Error('Failed to fetch ACs');
            const data = await response.json();
            setAC(data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while fetching ACs.');
        }
    };

    // Handle form changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Add new AC
    const handleAddAC = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/ac', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Failed to add AC');
            await fetchACs(); // Refresh list
            setFormData({ name: '', id: '', location: '', watts: '' });
            setIsModalAddOpen(false); // Close Add Modal
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while adding the AC.');
        }
    };

    // Update AC
    const handleUpdateAC = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/ac/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Failed to update AC');
            await fetchACs(); // Refresh list
            setFormData({ name: '', id: '', location: '', watts: '' });
            setEditId(null); // Exit edit mode
            setIsModalUpdateOpen(false); // Close Update Modal
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while updating the AC.');
        }
    };

    // Handle Edit Mode
    const handleEdit = (ac) => {
        setFormData({ name: ac.name, id: ac.id, location: ac.location, watts: ac.watts });
        setEditId(ac._id);
        setIsModalUpdateOpen(true); // Open Update Modal
    };

    // Delete AC
    const handleDeleteAC = async (acId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/ac/${acId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete AC');
            await fetchACs(); // Refresh list
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while deleting the AC.');
        }
    };

    // Search filter
    const filteredACs = acs.filter((ac) =>
        ac.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleShowHistory = (acID) => {
        // Reset state before opening a new modal if it's different
        if (selectedAcId !== acID) {
            setHistory([]);
            setSelectedAcId(acID);
            historyFetch(acID);
        }
        setHistoryModal(true); // Open the modal after fetching new data
    };

    const closeModal = () => {
        setHistoryModal(false); // Close the modal
        setSelectedAcId(null);  // Reset the selected AC ID
    };


    return (
        <>
            <Header />
            <div className="dashboard">
                <Sidebar />
                <div className="dashboard-content">
                    <div>
                        <section className="aircons">
                            <h2>Air Conditioners</h2>

                            <div className="search-addbutton">
                                {/* Search */}
                                <input
                                    type="text"
                                    placeholder="Search AC by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <button className='addAc addButton' onClick={() => setIsModalAddOpen(true)}>Add AC</button>
                            </div>

                            {/* Add AC Modal */}
                            <Modal
                                isOpen={isModalAddOpen}
                                onRequestClose={() => setIsModalAddOpen(false)}
                                contentLabel='Add Aircon'
                                ariaHideApp={false}  // Ensure modal is handled properly with assistive technologies
                                inert={historyModal ? 'false' : 'true'}  // Use inert when modal is closed to prevent interaction
                                style={{
                                    content: {
                                        position: 'absolute',
                                        top: '10%',
                                        left: '10%',
                                        right: '10%',
                                        bottom: '10%',
                                        margin: 'auto',
                                        width: '40%',
                                        padding: '55px',
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    }
                                }}
                            >
                                {/* Add Form */}
                                <form onSubmit={handleAddAC} className="ac-form">
                                    <div className="ac-modal-header">
                                        <h1>Add Aircon Unit</h1>
                                    </div>
                                    <div className="ac-modal-body">
                                        <div className="ac-name">
                                            <p>Aircon Name: </p>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="AC Name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="ac-id">
                                            <p>Aircon ID: </p>
                                            <input
                                                type="text"
                                                name="id"
                                                placeholder="AC ID"
                                                value={formData.id}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="ac-location">
                                            <p>Location: </p>
                                            <input
                                                type="text"
                                                name="location"
                                                placeholder="Location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="ac-watts">
                                            <p>Watts: </p>
                                            <input
                                                type="number"
                                                name="watts"
                                                placeholder="Watts"
                                                value={formData.watts}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="add-button">
                                        <button className='addButton' type="submit">Add AC</button>
                                    </div>
                                </form>
                            </Modal>

                            {/* Update AC Modal */}
                            <Modal
                                isOpen={isModalUpdateOpen}
                                onRequestClose={() => setIsModalUpdateOpen(false)}
                                contentLabel='Update Aircon'
                                ariaHideApp={false}  // Ensure modal is handled properly with assistive technologies
                                inert={historyModal ? 'false' : 'true'}  // Use inert when modal is closed to prevent interaction
                                style={{
                                    content: {
                                        position: 'absolute',
                                        top: '10%',
                                        left: '10%',
                                        right: '10%',
                                        bottom: '10%',
                                        margin: 'auto',
                                        width: '40%',
                                        padding: '55px',
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    }
                                }}
                            >
                                {/* Update Form */}
                                <form onSubmit={handleUpdateAC} className="ac-form">
                                    <div className="ac-modal-header">
                                        <h1>Update Aircon Unit</h1>
                                    </div>
                                    <div className="ac-modal-body">
                                        <div className="ac-name">
                                            <p>Aircon Name: </p>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="AC Name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="ac-id">
                                            <p>Aircon ID: </p>
                                            <input
                                                type="text"
                                                name="id"
                                                placeholder="AC ID"
                                                value={formData.id}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="ac-location">
                                            <p>Location: </p>
                                            <input
                                                type="text"
                                                name="location"
                                                placeholder="Location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="ac-watts">
                                            <p>Watts: </p>
                                            <input
                                                type="number"
                                                name="watts"
                                                placeholder="Watts"
                                                value={formData.watts}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="add-button">
                                        <button className='addButton' type="submit">Update AC</button>
                                    </div>
                                </form>
                            </Modal>

                            {/* Error Message */}
                            {error && <p style={{ color: 'red' }}>{error}</p>}

                            {/* AC List */}
                            <div className="ac-list">
                                {filteredACs.map((ac) => (
                                    <div className="ac-item" key={ac._id}>
                                        <h3>{ac.name}</h3>
                                        <p>ID: {ac.id}</p>
                                        <p>Location: {ac.location}</p>
                                        <p>Watts: {ac.watts}</p>
                                        <button className="maintenace-modal addButton" onClick={() => { handleShowHistory(ac._id); console.log(ac._id) }}>
                                            Show Maintenance History
                                        </button>

                                        {/* Display maintenance history */}
                                        {history[ac._id] && (
                                            <div className="maintenance-history">
                                                <ul>
                                                    <Modal
                                                        isOpen={historyModal}
                                                        onRequestClose={closeModal}
                                                        contentLabel="History"
                                                        ariaHideApp={false}
                                                        style={{
                                                            content: {
                                                                position: 'absolute',
                                                                top: '10%',
                                                                left: '10%',
                                                                right: '10%',
                                                                bottom: '10%',
                                                                margin: 'auto',
                                                                width: '40%',
                                                                padding: '55px',
                                                                backgroundColor: 'white',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                            },
                                                        }}
                                                    >
                                                        <div className="details-history">
                                                            <h2>Maintenance History:</h2>
                                                            {history[selectedAcId]?.length > 0 ? (
                                                                <div className="record-container">
                                                                    {history[selectedAcId]
                                                                        .filter((event) => event.details.status === true) // Filter completed events
                                                                        .slice(0, 3) // Show up to 3 events
                                                                        .map((event) => (
                                                                            <div key={event._id} className="history-card">
                                                                                <div className="history-card-header">
                                                                                    <p>
                                                                                        <strong>Status:</strong>{' '}
                                                                                        {event.details.status ? 'Completed' : 'Pending'}
                                                                                    </p>
                                                                                    <p>
                                                                                        <strong>Date:</strong>{' '}
                                                                                        {new Date(event.date).toLocaleDateString()}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="history-card-body">
                                                                                    <p><strong>Summary:</strong> {event.details.summary}</p>
                                                                                    <p><strong>Tasks:</strong></p>
                                                                                    <ul>
                                                                                        {event.tasks.map((task, index) => (
                                                                                            <li key={index}>{task}</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                    <p><strong>Assigned Employees:</strong></p>
                                                                                    <ul>
                                                                                        {event.assignedEmployee.map((employee) => (
                                                                                            <li key={employee._id}>{`${employee.firstname} ${employee.lastname}`}</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            ) : (
                                                                <p>No completed maintenance history found for this AC unit.</p>
                                                            )}
                                                        </div>
                                                    </Modal>
                                                </ul>
                                            </div>
                                        )}

                                        <div className="ac-actions">
                                            <button className="addButton editButton" onClick={() => handleEdit(ac)}>Edit</button>
                                            <button className="deleteButton" onClick={() => handleDeleteAC(ac._id)}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Ac;
