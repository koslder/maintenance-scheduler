import React, { useRef, useState, useEffect, useMemo } from 'react';
import { fetchMaintenanceByAcID } from './../../../backend/Middleware/apiServices';
import { formatTimeToAMPM } from '../utils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import axios from 'axios';
import Modal from 'react-modal'; // Import react-modal
import '../Modal.css';

const TASK_LIST = [
    "General Cleaning",
    "Filter Replacement",
    "Coolant Refill",
    "Electrical Inspection",
    "Fan Check",
    "Duct Cleaning",
    "Compressor Inspection",
    "Thermostat Testing",
    "Leakage Check",
];

Modal.setAppElement('#root'); // Set the app root element for accessibility

export default function Calendar() {
    const textareaRef = useRef(null);
    const [historyMaintenance, setHistoryMaintenance] = useState('');
    const [summary, setSummary] = useState('');
    const [status, setStatus] = useState(false);
    const [error, setError] = useState(null); // State to track error messages
    const [success, setSuccess] = useState(null); // State to track success messages
    const [notifiedEvents, setNotifiedEvents] = useState([]); // Track notified events
    const [eventDetails, setEventDetails] = useState(null); // For event data
    const [history, setHistory] = useState(null); // For History data
    const [events, setEvents] = useState([]);
    const [acUnits, setAcUnits] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setDetailsOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        date: '',
        time: '',
        acID: '',
        location: '',
        assignedEmployees: [], // Change for multiple employee selection
        tasks: [],
    });



    const historyMaintenanceFetch = async (eventId) => {
        const eventResponse = await axios.get(`http://localhost:5000/api/maintenance/${eventId}`);
        const eventData = eventResponse.data;
        const eventAcidData = eventData.data.acID._id;
        const eventHistoryResponse = await axios.get(`http://localhost:5000/api/maintenance/by-ac/${eventAcidData}`)
        const historyData = eventHistoryResponse.data;
        setHistory(historyData);
    }

    const RoleBasedElement = React.memo(({ requiredRole, children }) => {
        const role = useMemo(() => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return null;

                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                return decodedToken.role || null;
            } catch (error) {
                console.error("Error decoding token:", error);
                return null;
            }
        }, []); // Calculate once.

        if (role !== requiredRole) {
            return null;
        }

        return <>{children}</>;
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const acResponse = await axios.get('http://localhost:5000/api/ac');
                setAcUnits(acResponse.data);

                const employeeResponse = await axios.get('http://localhost:5000/users');
                setEmployees(employeeResponse.data);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // Fetch Maintenance Events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch the events and AC units simultaneously
                const [eventResponse, acResponse, historyMaintenance] = await Promise.all([
                    axios.get('http://localhost:5000/api/maintenance'),
                    axios.get('http://localhost:5000/api/ac')
                ]);

                const acUnits = acResponse.data;  // Store AC units
                const today = new Date();
                today.setHours(0, 0, 0, 0);  // Reset today's date to 00:00:00 for comparison

                // Filter and map the events, adding AC name based on acID
                const fetchedEvents = eventResponse.data
                    .filter(event => {
                        const eventDate = new Date(event.date);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate >= today;  // Only future events
                    })
                    .map(event => {
                        // Find the AC unit based on the acID
                        const acUnit = acUnits.find(unit => unit._id === event.acID);

                        return {
                            id: event._id,
                            start: event.date,
                            title: acUnit ? acUnit.name : event.acID, // Use AC name if found, otherwise fall back to acID
                            extendedProps: {
                                ...event,
                                details: {
                                    ...event.details,
                                    timeStart: event.details.timeStart || "",
                                    timeEnd: event.details.timeEnd || "",
                                },
                            },
                        };
                    });

                setEvents(fetchedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        fetchEvents();
    }, []);  // Empty dependency array ensures this effect runs once on mount

    // notification
    useEffect(() => {
        const checkEvents = setInterval(() => {
            const now = new Date();
            const nowRounded = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                now.getHours(),
                now.getMinutes(),
                0
            );

            events.forEach(async (event) => {
                const eventDate = new Date(event.extendedProps.date);
                const eventDateRounded = new Date(
                    eventDate.getFullYear(),
                    eventDate.getMonth(),
                    eventDate.getDate(),
                    eventDate.getHours(),
                    eventDate.getMinutes(),
                    0
                );

                // Check if this event has already been notified or clicked
                if (
                    eventDateRounded.getTime() === nowRounded.getTime() &&
                    !notifiedEvents.includes(event.id) &&
                    !localStorage.getItem('notifiedEvent_' + event.id) // New condition to prevent re-triggering
                ) {
                    try {
                        // Fetch detailed maintenance event data by ID
                        const response = await axios.get(
                            `http://localhost:5000/api/maintenance/${event.id}`
                        );

                        // Ensure the response status is 200 OK
                        if (response.status !== 200) {
                            throw new Error(
                                response.data.message || 'Failed to fetch maintenance event'
                            );
                        }

                        const { acDetails, assignedEmployees } = response.data.data;
                        const notificationBody = `
                            Title: ${event.extendedProps.title || "No Title"}
                            Date: ${eventDate.toLocaleDateString()}
                            Aircon ID: ${response.data.data.acID.id || "No ID"}
                            Location: ${acDetails.location || "No Location"}
                            Time Start: ${event.extendedProps.details.timeStart}
                            Time End: ${event.extendedProps.details.timeEnd}
                            Assigned Employees: ${assignedEmployees.length > 0
                                ? assignedEmployees
                                    .map(emp => `${emp.firstname} ${emp.lastname}`)
                                    .join(", ")
                                : "No employees assigned"
                            }
                            Tasks: ${event.extendedProps.tasks?.length > 0
                                ? event.extendedProps.tasks.join(", ")
                                : "No Tasks"
                            }
                        `;

                        console.log("Notification Body:", notificationBody);

                        // Create the notification
                        const notification = new Notification("Upcoming Maintenance", {
                            body: notificationBody,
                        });

                        notification.onclick = () => {
                            console.log(`Notification clicked for event ID: ${event.id}`);

                            // Store the event ID in local storage to preserve the data across page reload
                            localStorage.setItem('eventIdToShow', event.id);

                            // Mark this event as notified in localStorage to avoid re-triggering
                            localStorage.setItem('notifiedEvent_' + event.id, true);

                            window.location.reload(); // Refresh the page to reflect the latest data
                        };

                        setNotifiedEvents((prev) => [...prev, event.id]);
                    } catch (error) {
                        console.error('Error fetching detailed event data:', error);
                    }
                }
            });
        }, 1000); // Check every 1000 milliseconds (1 second)

        return () => clearInterval(checkEvents);
    }, [events, notifiedEvents]);

    // Focus the textarea only when the modal is opened
    useEffect(() => {
        if (isModalOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isModalOpen]); // Only run when the modal open state changes

    useEffect(() => {
        const eventIdToShow = localStorage.getItem('eventIdToShow');

        if (eventIdToShow) {
            // Fetch event details using the event ID stored in localStorage
            axios
                .get(`http://localhost:5000/api/maintenance/${eventIdToShow}`)
                .then((response) => {
                    setEventDetails(response.data);
                    setDetailsOpen(true);  // Open the modal after fetching event data
                })
                .catch((error) => {
                    console.error("Error fetching event data:", error);
                });

            // Clear the stored eventId from localStorage after using it
            localStorage.removeItem('eventIdToShow');
        }
    }, []);

    // Handle AC selection
    const handleAcChange = (e) => {
        const selectedAcID = e.target.value;
        const selectedAc = acUnits.find(ac => ac.id === selectedAcID);
        setNewEvent((prev) => ({
            ...prev,
            acID: selectedAcID,
            location: selectedAc ? selectedAc.location : '',
        }));
    };

    // Add
    const handleAddEvent = async () => {
        try {
            const selectedAc = acUnits.find(ac => ac.id === newEvent.acID);
            const selectedAcID = selectedAc ? selectedAc._id : null;

            if (!selectedAcID) {
                console.error("AC unit not found or invalid selection");
                alert("Please select a valid AC unit.");
                return;
            }

            // Ensure timeStart and timeEnd are valid
            const validTimeStart = newEvent.timeStart && /^[0-9]{2}:[0-9]{2}$/.test(newEvent.timeStart);
            const validTimeEnd = newEvent.timeEnd && /^[0-9]{2}:[0-9]{2}$/.test(newEvent.timeEnd);

            if (!validTimeStart || !validTimeEnd) {
                console.error("Invalid time format");
                alert("Please provide valid times in HH:MM format.");
                return;
            }

            const formattedEvent = {
                title: newEvent.title || "Maintenance Event",
                acID: selectedAcID,
                date: new Date(newEvent.date).toISOString(),
                tasks: newEvent.tasks || [],
                details: {
                    acID: selectedAcID,
                    location: newEvent.location || "No location provided",
                    assignedEmployees: newEvent.assignedEmployees || [],
                    timeStart: newEvent.timeStart,
                    timeEnd: newEvent.timeEnd || "23:59", // Ensure a valid end time
                    status: false, // Set to true if completed
                    summary: newEvent.summary || "No summary provided",
                },
            };

            const response = await axios.post("http://localhost:5000/api/maintenance", formattedEvent);
            const createdEvent = response.data;

            setEvents(prevEvents => [
                ...prevEvents,
                {
                    id: createdEvent._id,
                    start: new Date(createdEvent.date).toISOString(),
                    extendedProps: createdEvent,
                },
            ]);

            setNewEvent({
                date: "",
                timeStart: "",
                timeEnd: "",
                acID: "",
                location: "",
                assignedEmployees: [],
                tasks: [],
            });

        } catch (error) {
            console.error("Error adding event:", error);
            alert("An error occurred. Please try again.");
        }
    };

    // Delete
    const handleDeleteEvent = async () => {
        if (window.confirm("Are you sure you want to delete this maintenance event?")) {
            try {
                console.log('Event Details:', eventDetails); // Debugging line

                // Check if eventDetails and _id are defined
                if (!eventDetails || !eventDetails.data._id) {
                    setError('Event details are missing or incomplete.');
                    return;
                }

                // Send DELETE request to backend with the event ID
                const response = await fetch(`http://localhost:5000/api/maintenance/${eventDetails.data._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    // Success: Reset event details, show success message, and close the modal
                    setSuccess(data.message);
                    setEventDetails(null); // Clear event details after successful deletion
                    setIsModalOpen(false); // Close the modal
                    window.location.reload(); // Refresh the page to reflect the changes
                } else {
                    // Handle error if deletion was unsuccessful
                    setError(data.message || "An error occurred.");
                }
            } catch (err) {
                // Handle any network or server errors
                setError('An error occurred while deleting the event.');
            }
        }
    };

    // Update summary and status handler
    const handleUpdate = async () => {
        try {
            // Preserve existing details by spreading them into the new object
            const updatedDetails = {
                ...eventDetails.data.details, // Spread existing details
                status,
                summary,
            };

            const response = await fetch(`http://localhost:5000/api/maintenance/${eventDetails.data._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ details: updatedDetails }), // Include the updated details object
            });

            if (response.ok) {
                alert("Maintenance updated successfully");
                const updatedEvent = await response.json();

                // Update the local state for event details
                setEventDetails(updatedEvent);
                setDetailsOpen(false);
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(`Failed to update: ${errorData.error}`);
            }
        } catch (err) {
            console.error("Error updating maintenance:", err);
            setError("An error occurred while updating the event.");
        }
    };


    return (
        <div>
            <RoleBasedElement requiredRole={'admin'}>
                <button className='addButton' onClick={() => setIsModalOpen(true)}>Add Event</button>
            </RoleBasedElement>
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel="Add Event Modal"
                style={{
                    content: {
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        right: '10%',
                        bottom: '20%',
                        margin: 'auto',
                        width: '80%',
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }
                }}
            >
                <h2>Add Maintenance Event</h2>

                <form className="input-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAddEvent();
                        setIsModalOpen(false);
                    }}
                >
                    <p>Date: </p>
                    <input
                        type="datetime-local"
                        placeholder="Date"
                        value={newEvent.date}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />

                    <div className='time-start-end'>
                        <div className="timeStart">
                            <p>Time Start: </p>
                            <input
                                className='time-start'
                                type="time"
                                placeholder="Time Start"
                                value={newEvent.timeStart}
                                onChange={(e) => setNewEvent({ ...newEvent, timeStart: e.target.value })}
                            />
                        </div>
                        <div className="timeEnd">
                            <p>Time End: </p>
                            <input
                                className='time-end'
                                type="time"
                                placeholder="Time End"
                                value={newEvent.timeEnd}
                                onChange={(e) => setNewEvent({ ...newEvent, timeEnd: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Ac */}
                    <p>Aircon Unit:</p>
                    <select className='select-ac' value={newEvent.acID} onChange={handleAcChange}>
                        <option value="" disabled>Select AC ID</option>
                        {acUnits.map((ac) => (
                            <option key={ac.id} value={ac.id}>
                                {ac.name} ({ac.id})
                            </option>
                        ))}
                    </select>
                    <p>Location: </p>
                    <input
                        type="text"
                        placeholder="Location"
                        value={newEvent.location}
                        readOnly
                    />

                    {/* Employee Selection - Checkboxes */}
                    <div className="task-employee">
                        <div>
                            <h4>Select Employees:</h4>
                            {employees.map((emp) => (
                                <label key={emp._id} style={{ display: 'flex', marginBottom: '5px', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        value={emp._id}
                                        checked={newEvent.assignedEmployees?.includes(emp._id)}
                                        onChange={(e) => {
                                            const selectedEmployees = newEvent.assignedEmployees || [];
                                            if (e.target.checked) {
                                                setNewEvent({
                                                    ...newEvent,
                                                    assignedEmployees: [...selectedEmployees, emp._id],
                                                });
                                            } else {
                                                setNewEvent({
                                                    ...newEvent,
                                                    assignedEmployees: selectedEmployees.filter(id => id !== emp._id),
                                                });
                                            }
                                        }}
                                    />
                                    <p>{emp.firstname} {emp.lastname}</p>
                                </label>
                            ))}
                        </div>

                        {/* Maintenance Tasks */}
                        <div>
                            <h4>Maintenance Tasks:</h4>
                            {TASK_LIST.map((task, index) => (
                                <label key={index} style={{ display: 'flex', marginBottom: '5px', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={newEvent.tasks.includes(task)}
                                        onChange={() => setNewEvent((prev) => ({
                                            ...prev,
                                            tasks: prev.tasks.includes(task)
                                                ? prev.tasks.filter((t) => t !== task)
                                                : [...prev.tasks, task],
                                        }))}
                                    />
                                    <p>{task}</p>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Form Buttons */}
                    <div className="form-buttons">
                        <button type="submit" className="addButton">Add Maintenance Event</button>
                        <button
                            type="button"
                            className="closeButton"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Event Details Modal */}
            <Modal
                isOpen={isDetailsOpen}
                onRequestClose={() => setDetailsOpen(false)}
                style={{
                    content: {
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        right: '10%',
                        bottom: '10%',
                        margin: 'auto',
                        width: '80%',
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }
                }}
            >
                <section className="details">
                    <div className="container">
                        {eventDetails && (
                            <div className='details-content'>
                                <div className="details-header">
                                    <h1>Maintenance Details: </h1>
                                    <p><strong>Event ID:</strong> {eventDetails.data._id || "N/A"}</p>
                                    <p><strong>Date:</strong> {eventDetails.data.date ? new Date(eventDetails.data.date).toLocaleString() : "N/A"}</p>
                                </div>

                                <div className="details-body">
                                    <div className="details-tasks">
                                        <h1>Current Tasks:</h1>
                                        {eventDetails.data.tasks.map((task, index) => (
                                            <p key={index}>
                                                {task}
                                            </p>
                                        ))}
                                    </div>
                                    <div className="details-time">
                                        <h1>Time: </h1>
                                        <p><strong>Start Time:</strong> {eventDetails.data.details.timeStart ? formatTimeToAMPM(eventDetails.data.details.timeStart) : "N/A"}</p>
                                        <p><strong>End Time:</strong> {eventDetails.data.details.timeEnd ? formatTimeToAMPM(eventDetails.data.details.timeEnd) : "N/A"}</p>
                                    </div>


                                    <div className="details-ac">
                                        <h2>AC Details:</h2>
                                        <p><strong>Name:</strong> {eventDetails.data.acDetails.name}</p>
                                        <p><strong>Location:</strong> {eventDetails.data.acDetails.location}</p>
                                        <p><strong>Watts:</strong> {eventDetails.data.acDetails.watts}</p>
                                    </div>

                                    <div className="details-employee">
                                        <h2>Assigned Employees:</h2>
                                        {eventDetails.data.assignedEmployee.map((employee) => (
                                            <p key={employee._id}>
                                                <strong>Employee:</strong> {employee.firstname} {employee.lastname}
                                            </p>
                                        ))}
                                    </div>

                                    <div className="details-history">
                                        <h2>Maintenance History:</h2>
                                        <div className="record-container">
                                            {history &&
                                                history
                                                    .filter((record) => {
                                                        const today = new Date().toLocaleDateString();
                                                        return record.details.status === true && new Date(record.date).toLocaleDateString() !== today;
                                                    })
                                                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent date
                                                    .slice(0, 3) // Show only the top 3 most recent entries
                                                    .map((record, index) => (
                                                        <div key={index} className="history-card">
                                                            <div className="history-card-header">
                                                                <p><strong>Status:</strong> {record.details.status ? "Completed" : "Pending"}</p>
                                                                <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="history-card-body">
                                                                <p><strong>Summary:</strong> {record.details.summary || "No summary provided"}</p>
                                                                <p><strong>Tasks:</strong></p>
                                                                <ul>
                                                                    {record.tasks?.length > 0 ? (
                                                                        record.tasks.map((task, i) => <li key={i}>{task}</li>)
                                                                    ) : (
                                                                        <li>No tasks recorded</li>
                                                                    )}
                                                                </ul>
                                                                <p><strong>Assigned Employees:</strong></p>
                                                                <ul>
                                                                    {record.assignedEmployee?.length > 0 ? (
                                                                        record.assignedEmployee.map((employee, index) => (
                                                                            <li key={index}>
                                                                                {employee.firstname} {employee.lastname}
                                                                            </li>
                                                                        ))
                                                                    ) : (
                                                                        <li>No employees assigned</li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    ))}
                                            {history &&
                                                history.filter((record) => {
                                                    const today = new Date().toLocaleDateString();
                                                    return record.details.status === true && new Date(record.date).toLocaleDateString() !== today;
                                                }).length === 0 && <p>No maintenance history available.</p>}
                                        </div>
                                    </div>

                                </div>
                                <div className="summary-container">
                                    {eventDetails.data.details.status !== false && (
                                        <>
                                            <h2>Summary of the day: </h2>
                                            <div className="summary-container">
                                                <p><strong>Summary:</strong> {eventDetails.data.details.summary || "No summary available"}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {isModalOpen && (
                                    <div className="modal-overlay">
                                        <div className="summary-container">
                                            <h2>Summary of the day:</h2>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    handleUpdate(summary, status);
                                                }}
                                            >
                                                <textarea
                                                    ref={textareaRef}
                                                    id="summary"
                                                    value={summary}
                                                    onChange={(e) => setSummary(e.target.value)}
                                                    placeholder="Enter maintenance summary"
                                                />
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={status}
                                                        onChange={(e) => setStatus(e.target.checked)}
                                                    />
                                                    Status (Completed)
                                                </label>
                                                <button onClick={handleUpdate} type="submit">Submit</button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                                <div className="details-button">
                                    {eventDetails.data.details.status !== true && (
                                        <>
                                            <button
                                                className='addButton'
                                                onClick={() => setIsModalOpen((prev) => !prev)} // Toggle the modal state
                                            >
                                                {isModalOpen ? "Close" : "Maintenance Done"} {/* Update button text dynamically */}
                                            </button>
                                        </>
                                    )}
                                    <RoleBasedElement requiredRole={'admin'}>
                                        <button
                                            onClick={() => {
                                                handleDeleteEvent(); // Call the delete event handler
                                                setIsModalOpen(false); // Close the modal after deleting the event
                                            }}
                                            className="closeButton"
                                        >
                                            Delete Event
                                        </button>
                                    </RoleBasedElement>
                                </div>

                            </div>
                        )}
                    </div>
                </section>
            </Modal>

            <div style={{ position: 'relative', zIndex: 0 }}>
                {events && events.length > 0 && (
                    < FullCalendar
                        key={JSON.stringify(events)}
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        eventClassNames={(event) => {
                            const isCompleted = event.event._def.extendedProps.details.status || false;
                            return isCompleted ? ['event-completed'] : ['event-pending'];
                        }}

                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                        }}
                        eventClick={(info) => {
                            const eventId = info.event.id;
                            historyMaintenanceFetch(eventId);
                            if (!eventId) {
                                console.log("Unable to find the ID");
                                return;
                            }
                            axios
                                .get(`http://localhost:5000/api/maintenance/${eventId}`)
                                .then((response) => {
                                    const eventData = response.data;
                                    setEventDetails(eventData);
                                    setDetailsOpen(true);
                                })
                                .catch((error) => {
                                    console.error("Error fetching maintenance event data:", error);
                                });
                        }}
                    />
                )}
            </div>
        </div>
    );
}