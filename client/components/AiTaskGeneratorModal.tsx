'use client';

import { useState, FormEvent } from 'react';
import { createTask, generateAiTasks } from '../services/api';

// --- FIX: Define the Task type for type safety ---
interface Task {
  id: number;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  assignee_id: number | null;
  project_id: number;
}

interface AiTaskGeneratorModalProps {
  projectId: string;
  onClose: () => void;
  // --- FIX: Replace 'any[]' with the specific 'Task[]' type ---
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function AiTaskGeneratorModal({ projectId, onClose, setTasks }: AiTaskGeneratorModalProps) {
  const [aiGoal, setAiGoal] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleGenerateTasks = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setSuggestedTasks([]);
    setAiError('');
    try {
      const response = await generateAiTasks(projectId, aiGoal);
      setSuggestedTasks(response.data.suggestedTasks);
    } catch (error) {
      console.error(error);
      setAiError('Failed to generate tasks. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = async (taskTitle: string) => {
    try {
      const response = await createTask(projectId, taskTitle);
      setTasks(prevTasks => [...prevTasks, response.data]);
      setSuggestedTasks(prev => prev.filter(t => t !== taskTitle));
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };
  
  const handleClose = () => {
    setSuggestedTasks([]);
    setAiError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">AI Task Generator</h2>
        <form onSubmit={handleGenerateTasks}>
          <textarea
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value)}
            placeholder="Enter a high-level goal..."
            className="w-full p-2 border border-gray-300 rounded-md h-24"
            required
          />
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isGenerating} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-purple-400">
              {isGenerating ? 'Generating...' : 'Generate Tasks'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          {suggestedTasks.length > 0 && <h3 className="font-bold mb-2">Suggested Tasks:</h3>}
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {suggestedTasks.map((task, index) => (
              <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                <span>{task}</span>
                <button 
                  onClick={() => handleAddTask(task)} 
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  title="Add this task to the board"
                >
                  + Add
                </button>
              </li>
            ))}
          </ul>
          {aiError && <p className="text-red-500 mt-4">{aiError}</p>}
        </div>
      </div>
    </div>
  );
}