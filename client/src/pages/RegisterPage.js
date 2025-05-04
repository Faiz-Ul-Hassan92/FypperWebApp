import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student', // Default role
        // Role specific fields (optional for initial registration)
        skills: '', // Comma-separated for students
        expertise: '', // Comma-separated for supervisors
        company: '', // For recruiters
    });
    const { register, loading, error, setError } = useAuth();
    const navigate = useNavigate();

    const { name, email, password, confirmPassword, role, skills, expertise, company } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
             setError('Password must be at least 6 characters long');
             return;
        }

        const userData = { name, email, password, role };

        // Add role-specific data, splitting comma-separated strings into arrays
        if (role === 'student' && skills) userData.skills = skills.split(',').map(s => s.trim()).filter(s => s);
        if (role === 'supervisor' && expertise) userData.expertise = expertise.split(',').map(e => e.trim()).filter(e => e);
        if (role === 'recruiter' && company) userData.company = company;

        try {
            await register(userData);
            navigate('/dashboard'); // Redirect to dashboard on successful registration
        } catch (err) {
             console.error("Registration failed on page:", err);
            // Error is set in the AuthContext
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                 {error && <p className="error-message">{error}</p>}
                <div>
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" name="name" value={name} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={email} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" value={password} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="role">Register As:</label>
                    <select id="role" name="role" value={role} onChange={onChange} required>
                        <option value="student">Student</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="recruiter">Recruiter</option>
                        {/* Admin role typically isn't self-registered */}
                    </select>
                </div>

                {/* Conditional fields based on role */} 
                {role === 'student' && (
                    <div>
                        <label htmlFor="skills">Skills (comma-separated, optional):</label>
                        <input type="text" id="skills" name="skills" value={skills} onChange={onChange} />
                    </div>
                )}
                {role === 'supervisor' && (
                    <div>
                        <label htmlFor="expertise">Areas of Expertise (comma-separated, optional):</label>
                        <input type="text" id="expertise" name="expertise" value={expertise} onChange={onChange} />
                    </div>
                )}
                {role === 'recruiter' && (
                     <div>
                        <label htmlFor="company">Company (optional):</label>
                        <input type="text" id="company" name="company" value={company} onChange={onChange} />
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}

export default RegisterPage; 