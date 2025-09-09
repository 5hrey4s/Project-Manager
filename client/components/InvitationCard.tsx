// client/components/InvitationCard.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { acceptInvitation, declineInvitation } from '../services/api';

// Define the structure of an invitation object
interface Invitation {
  id: number;
  project_name: string;
  inviter_name: string;
}

interface InvitationCardProps {
  invitation: Invitation;
  onAction: (invitationId: number) => void; // A function to remove the card from the list after an action
}

const InvitationCard: React.FC<InvitationCardProps> = ({ invitation, onAction }) => {
  const { user } = useAuth(); // Get the authenticated user's token

  const handleAccept = async () => {
    if (!user) return;
    try {
            await acceptInvitation(invitation.id);

      alert('Invitation accepted!');
      onAction(invitation.id); // Notify the parent component to remove this card
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation.');
    }
  };

  const handleDecline = async () => {
    if (!user) return;
    try {
            await declineInvitation(invitation.id);

      alert('Invitation declined.');
      onAction(invitation.id); // Notify the parent component to remove this card
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation.');
    }
  };

  return (
    <div className="p-3 border-b border-gray-200">
      <p className="text-sm">
        <span className="font-semibold">{invitation.inviter_name}</span> has invited you to join the project: <span className="font-semibold">{invitation.project_name}</span>
      </p>
      <div className="mt-2 flex gap-2">
        <Button onClick={handleAccept} size="sm">
          Accept
        </Button>
        <Button onClick={handleDecline} variant="outline" size="sm">
          Decline
        </Button>
      </div>
    </div>
  );
};

export default InvitationCard;