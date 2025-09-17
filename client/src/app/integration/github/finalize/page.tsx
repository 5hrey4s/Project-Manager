// client/src/app/integration/github/finalize/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';

export default function FinalizeGitHubIntegration() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
      const installationId = searchParams.get('installation_id');
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!token) {
        toast.error("Authentication error. Please log in again.");
        return router.push('/login');
      }
      if (!installationId) {
        toast.error('Installation ID not found in redirect.');
        return router.push('/dashboard');
      }

      try {
        // This is the secure, authenticated API call
        await axios.post(
          `${apiUrl}/api/integrations/github/save-installation`,
          { installationId },
          { headers: { 'x-auth-token': token } }
        );

        toast.success('GitHub App connected successfully!');
        router.push('/dashboard'); // All done, go to dashboard

      } catch (error) {
        toast.error('Could not finalize GitHub connection. Please try again.');
        router.push('/dashboard');
      }
    };

    finalize();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Finalizing your GitHub integration...</p>
      </div>
    </div>
  );
}