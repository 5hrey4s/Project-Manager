'use client';

import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- shadcn/ui Imports ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


// --- Updated Types ---
interface User {
  id: number;
  username: string;
}
interface Project {
  id: number;
  name: string;
  completion_percentage: number; // For the progress bar
}
interface Task {
  id:number;
  title: string;
  status: string;
  project_name: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]); // New state for your tasks
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const axiosConfig = { headers: { 'x-auth-token': token } };

      try {
        // Fetch user, projects (with progress), and assigned tasks
        const [userResponse, projectsResponse, tasksResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/user`, axiosConfig),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, axiosConfig),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/tasks`, axiosConfig) // Fetch your tasks
        ]);
        setUser(userResponse.data);
        setProjects(projectsResponse.data);
        setMyTasks(tasksResponse.data); // Set your tasks
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

  const handleCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects`,
        { name: newProjectName },
        { headers: { 'x-auth-token': token } }
      );
      setProjects([response.data, ...projects]);
      setNewProjectName('');
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Loading Dashboard...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.username}!</p>
        </header>

        {/* Top section with "My Tasks" and "Create Project" */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* "My Tasks" Widget */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you across all projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTasks.length > 0 ? (
                    myTasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.project_name}</TableCell>
                        <TableCell>{task.status}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">You have no pending tasks. Great job!</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* "Create Project" Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Create a New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <Input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Your new project name"
                />
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* "All Projects" Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">All Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((project) => (
                <Link href={`/project/${project.id}`} key={project.id}>
                  <Card className="hover:border-indigo-500 transition-colors">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(project.completion_percentage)}%</span>
                      </div>
                      <Progress value={project.completion_percentage} />
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="col-span-full bg-white p-4 rounded-lg text-gray-500">You haven&apos;t created any projects yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}