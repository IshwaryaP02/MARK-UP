import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Camera } from 'lucide-react';
import './login.css';

export const SignupPage: React.FC<{ onNavigateToLogin: () => void }> = ({ onNavigateToLogin }) => {
  const { addToast } = useApp();

  const [formData, setFormData] = useState({
    username: '', // RegNo or Employee ID
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Male',
    address: '',
    avatar: '',
    fatherName: '',
    motherName: '',
    parentPhone: '',
    programme: 'UG',
    year: 1,
    shift: 'First Shift',
    department_id: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<{id: string, code: string, name: string}[]>([]);

  React.useEffect(() => {
    const fetchDepts = async () => {
      try {
        const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
        const res = await fetch(`${API_BASE}/auth/departments`);
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, department_id: data[0].id }));
          }
        }
      } catch (e) {
        console.error("Failed to load departments", e);
      }
    };
    fetchDepts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      addToast('Error', 'Passwords do not match', 'danger');
      return;
    }
    
    setIsLoading(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to sign up');
      }
      
      addToast('Success', 'Signup successful! You can now log in.', 'success');
      onNavigateToLogin();
    } catch (err: any) {
      addToast('Signup Failed', err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ height: '100vh', overflowY: 'auto', padding: '2rem 0' }}>
      <section className="card" aria-labelledby="signup-title" style={{ maxWidth: '800px', margin: 'auto' }}>
        <div className="card__head">
          <div className="brand">
            <img src="/tn-emblem.png" alt="TN Emblem" style={{ width: 40, height: 40 }} />
            <span>MARKUP</span>
          </div>
          <h1 className="card__title" id="signup-title">Create your account</h1>
          <p className="card__desc">Complete your profile to access the academic suite.</p>
        </div>

        <form className="form" onSubmit={handleSignup} noValidate>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="field flex-1">
              <label className="label" htmlFor="username">Reg No / Employee ID :</label>
              <input
                className="control"
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field flex-1">
              <label className="label" htmlFor="email">Institutional Email :</label>
              <input
                className="control"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="field flex-1">
              <label className="label" htmlFor="name">Full Name :</label>
              <input
                className="control"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field flex-1">
              <label className="label" htmlFor="phone">Phone Number :</label>
              <input
                className="control"
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="field flex-1">
              <label className="label" htmlFor="dob">Date of Birth :</label>
              <input
                className="control"
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field flex-1">
              <label className="label" htmlFor="gender">Gender :</label>
              <select
                className="control"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="field mb-4">
            <label className="label" htmlFor="address">Residential Address :</label>
            <input
              className="control"
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field mb-4">
            <label className="label" htmlFor="avatar">Passport Photo URL (or Base64) :</label>
            <div className="input-wrap flex gap-2">
              <input
                className="control flex-1"
                type="text"
                id="avatar"
                name="avatar"
                placeholder="Paste photo URL or upload"
                value={formData.avatar}
                onChange={handleChange}
                required
              />
              <input
                id="profile-photo-signup"
                type="file"
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
                  reader.readAsDataURL(file);
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('profile-photo-signup')?.click()}
                className="btn"
                style={{ width: 'auto', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Camera size={16} /> Upload
              </button>
            </div>
          </div>

          {/* Student Specific Fields */}
          <fieldset className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl mb-4">
            <legend className="text-xs font-bold px-2 text-[#000000] dark:text-zinc-400">Student Only - Academic & Parent Details</legend>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="field flex-1">
                <label className="label" htmlFor="programme">Programme :</label>
                <select className="control" id="programme" name="programme" value={formData.programme} onChange={handleChange}>
                  <option value="UG">Undergraduate (UG)</option>
                  <option value="PG">Postgraduate (PG)</option>
                </select>
              </div>
              <div className="field flex-1">
                <label className="label" htmlFor="year">Year of Study :</label>
                <select className="control" id="year" name="year" value={formData.year} onChange={handleChange}>
                  <option value={1}>I Year</option>
                  <option value={2}>II Year</option>
                  <option value={3}>III Year</option>
                  <option value={4}>IV Year</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="field flex-1">
                <label className="label" htmlFor="shift">Shift :</label>
                <select className="control" id="shift" name="shift" value={formData.shift} onChange={handleChange}>
                  <option value="First Shift">Shift I (Regular)</option>
                  <option value="Second Shift">Shift II (Evening)</option>
                </select>
              </div>
              <div className="field flex-1">
                <label className="label" htmlFor="department_id">Department :</label>
                <select className="control" id="department_id" name="department_id" value={formData.department_id} onChange={handleChange}>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              <div className="field flex-1">
                <label className="label" htmlFor="fatherName">Father's Name :</label>
                <input
                  className="control"
                  type="text"
                  id="fatherName"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                />
              </div>
              <div className="field flex-1">
                <label className="label" htmlFor="motherName">Mother's Name :</label>
                <input
                  className="control"
                  type="text"
                  id="motherName"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="parentPhone">Parent / Guardian Phone :</label>
              <input
                className="control"
                type="text"
                id="parentPhone"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
              />
            </div>
          </fieldset>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="field flex-1">
              <label className="label" htmlFor="password">Password :</label>
              <input
                className="control"
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field flex-1">
              <label className="label" htmlFor="confirmPassword">Confirm Password :</label>
              <input
                className="control"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button className="btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <footer className="card__foot">
          <span className="pill">Already have an account? <button type="button" className="link" onClick={onNavigateToLogin}>Login here</button></span>
        </footer>
      </section>
    </div>
  );
};
