'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import axios from 'axios'; // Import axios to check for its error type
import { inviteMember } from '../services/api';

interface Project {
  id: number;
  name: string;
}

interface ProjectHeaderProps {
  project: Project | null;
  onOpenAiModal: () => void;
}

export default function ProjectHeader({ project, onOpenAiModal }: ProjectHeaderProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;

    setIsInviting(true);
    setInviteMessage('');
    try {
      const response = await inviteMember(project.id, inviteEmail);
      setInviteMessage(response.data.msg);
      setInviteEmail('');
    // --- FIX: Type 'error' as 'unknown' and perform a type check ---
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setInviteMessage(error.response?.data.msg || 'Invitation failed.');
      } else {
        setInviteMessage('An unexpected error occurred.');
      }
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <Link href="/dashboard" className="text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold">{project ? project.name : 'Project Workspace'}</h1>
      </div>
      <div className="flex items-center gap-4 mt-4 sm:mt-0">
        <button
          onClick={onOpenAiModal}
          className="px-4 py-2 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center gap-2"
        >
          ✨ Generate with AI
        </button>
        <div>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-stretch gap-2 bg-white p-3 rounded-lg shadow-sm">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Invite user by email"
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button type="submit" disabled={isInviting} className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
              {isInviting ? 'Sending...' : 'Invite'}
            </button>
          </form>
          {inviteMessage && <p className="mt-2 text-center text-sm text-gray-600">{inviteMessage}</p>}
        </div>
      </div>
    </header>
  );
}