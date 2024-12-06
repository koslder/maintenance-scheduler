import { useState } from 'react';
import '../login.css'; // Import the CSS file

function Login() {
    const [formData, setFormData] = useState({
        username: '', // Use either 'username' or 'email' depending on the user input
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        console.log('Sending data to backend:', formData); // Debugging log

        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            console.log('Response from backend:', result); // Debugging log

            if (response.ok) {
                alert('Login successful');

                // Store token and userId in localStorage
                localStorage.setItem('token', result.token);
                localStorage.setItem('userId', result.userId); // Store userId

                const decodedToken = JSON.parse(atob(result.token.split('.')[1]));
                console.log('Decoded Token:', decodedToken);

                // Redirect based on user role
                if (decodedToken.role === 'admin') {
                    window.location.href = '/adminpanel';
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                alert(result.error || 'Login failed');
            }
        } catch (err) {
            console.error('Error during login:', err);
            alert('An error occurred. Please try again.');
        }
    };


    return (
        <section className="form-login">
            <div className="container">
                <div className="form-container">
                    <div className="col-2">
                        <div className="col-2-title">
                            <h1>Sign In</h1>
                            <p>Please Enter your details.</p>

                            <div className="form-inputs">
                                <form onSubmit={handleLoginSubmit} className="form">
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Username"
                                        className="Userinput"
                                        required
                                    />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        className="Passwordinput"
                                        required
                                    />
                                    <button type="submit" className="login-button">Sign In</button>
                                </form>
                                <span>
                                    You don't have an account? <a href="/register" className="link">Register to an existing workspace</a>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Login;
