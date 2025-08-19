'use client'; // For App Router

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { isAxiosError } from 'axios';

// If using Next.js Pages Router, you might use `useRouter` for redirection
// import { useRouter } from 'next/router'; 

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const router = useRouter(); // Uncomment for redirection

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, formData);
      
      // *** IMPORTANT: Store the token ***
      localStorage.setItem('token', response.data.token);

      setMessage('Login successful! Redirecting...');
      // Redirect to a dashboard page after successful login
      // window.location.href = '/dashboard'; // Simple redirect
      router.push('/dashboard'); // Better, Next.js way

    } catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      setMessage(error.response.data.msg || 'Login failed. Please check your credentials.');
    } else {
      setMessage('An unexpected error occurred. Please try again later.');
      console.error(error); // Log the full error for debugging
    }
  }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Log In to Your Account</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Log In
            </button>
          </div>
        </form>
        {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
      </div>
    </div>
  );
}