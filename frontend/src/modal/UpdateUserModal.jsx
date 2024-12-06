import React, { useState } from 'react';
import axios from 'axios';

const UpdateUserModal = ({ showModal, setShowModal, user, setUsers }) => {
    const [updatedUser, setUpdatedUser] = useState({
        firstname: user.firstname,
        lastname: user.lastname,
        age: user.age,
        email: user.email,
        username: user.username,
        address: user.address,
        role: user.role
    });

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUpdatedUser((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(
                `http://localhost:5000/users/${user._id}`,
                updatedUser
            );
            console.log('User updated:', response.data);

            // Update the users list in the parent component
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u._id === user._id ? { ...u, ...updatedUser } : u
                )
            );

            // Close the modal
            setShowModal(false);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    // Close the modal
    const closeModal = () => {
        setShowModal(false);
    };

    if (!showModal) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Update User Information</h2>
                <form onSubmit={handleSubmit}>
                    <label>First Name</label>
                    <input
                        type="text"
                        name="firstname"
                        value={updatedUser.firstname}
                        onChange={handleChange}
                    />

                    <label>Last Name</label>
                    <input
                        type="text"
                        name="lastname"
                        value={updatedUser.lastname}
                        onChange={handleChange}
                    />

                    <label>Age</label>
                    <input
                        type="number"
                        name="age"
                        value={updatedUser.age}
                        onChange={handleChange}
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={updatedUser.email}
                        onChange={handleChange}
                    />

                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={updatedUser.username}
                        onChange={handleChange}
                    />

                    <label>Role</label>
                    <input
                        type="text"
                        name="role"
                        value={updatedUser.role}
                        onChange={handleChange}
                    />

                    <label>Address</label>
                    <input
                        type="text"
                        name="street"
                        value={updatedUser.address?.street}
                        onChange={handleChange}
                        placeholder="Street"
                    />
                    <input
                        type="text"
                        name="city"
                        value={updatedUser.address?.city}
                        onChange={handleChange}
                        placeholder="City"
                    />
                    <input
                        type="text"
                        name="state"
                        value={updatedUser.address?.state}
                        onChange={handleChange}
                        placeholder="State"
                    />
                    <input
                        type="text"
                        name="zip"
                        value={updatedUser.address?.zip}
                        onChange={handleChange}
                        placeholder="Zip"
                    />

                    <div className="modal-actions">
                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={closeModal}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateUserModal;
