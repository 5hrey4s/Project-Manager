'use client'; // For App Router

import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Define Types for our data ---
interface User {
  id: number;
  username: string;
  email: string;
}
interface Project {
  id: number;
  name: string;
  description: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- Fetch initial data (user and projects) ---
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const axiosConfig = { headers: { 'x-auth-token': token } };

      try {
        // Fetch user and projects in parallel for efficiency
        const [userResponse, projectsResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, axiosConfig),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, axiosConfig),
        ]);
        setUser(userResponse.data);
        setProjects(projectsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // --- Handle New Project Form Submission ---
  const handleCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newProjectName.trim()) return; // Prevent empty project names

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects`,
        { name: newProjectName },
        { headers: { 'x-auth-token': token } }
      );
      // Add the new project to the top of the list
      setProjects([response.data, ...projects]);
      setNewProjectName(''); // Clear the input field
    } catch (error) {
      console.error('Failed to create project', error);
      alert('Error: Could not create the project.');
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Loading Dashboard...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.username}!</p>
        </header>

        {/* Create Project Section */}
        <section className="mb-10 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create a New Project</h2>
          <form onSubmit={handleCreateProject} className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Your new project name"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
          </form>
        </section>

        {/* Projects List Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
          <div className="space-y-4">
            {projects.length > 0 ? (
              projects.map((project) => (
                <Link href={`/project/${project.id}`} key={project.id}>
  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:bg-gray-50 cursor-pointer">
    <h3 className="font-bold text-lg">{project.name}</h3>
  </div>
</Link>
              ))
            ) : (
              <p className="bg-white p-4 rounded-lg shadow-sm text-gray-500">You haven&apos;t created any projects yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}