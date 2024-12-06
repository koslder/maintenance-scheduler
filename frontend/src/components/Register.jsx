import { useState } from 'react';
import '../login.css'; // Import the CSS file

function Register() {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        age: '',
        birthdate: '', // Added birthdate field
        email: '',
        username: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch('http://localhost:5000/users', {  // Use '/users' here
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (response.ok) {
            alert('Registration successful');
            window.location.href = '/login'; // Redirect to login page
        } else {
            alert(result.error || 'Registration failed');
        }
    };

    return (
        <section className="form-login">
            <div className="container">
                <div className="form-container">
                    <div className="col-2">
                        <div className="col-2-title">
                            <h1>Register Account</h1>
                            <p>Please Enter your details.</p>
                            <div className="form-inputs">
                                <form onSubmit={handleRegisterSubmit} className="form">
                                    <input
                                        type="text"
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        placeholder="First Name"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleChange}
                                        placeholder="Last Name"
                                        required
                                    />
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="Age"
                                        required
                                    />
                                    <input
                                        type="date" // Input type for date selection
                                        name="birthdate"
                                        value={formData.birthdate}
                                        onChange={handleChange}
                                        placeholder="Birth Date"
                                        required
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Username"
                                        required
                                    />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        required
                                    />
                                    <button className='register-button' type="submit">Register</button>
                                </form>
                                <span>
                                    Already have an account? <a href="/login" className="link">Login to an existing workspace</a>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Register;
