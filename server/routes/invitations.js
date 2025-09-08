const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const invitationController = require('../controllers/invitationController');

// @route   GET /api/invitations
// @desc    Get all pending invitations for the logged-in user
// @access  Private
router.get('/', authMiddleware, invitationController.getPendingInvitations);

// @route   POST /api/invitations/:invitationId/accept
// @desc    Accept a project invitation
// @access  Private (Invited user only)
router.post('/:invitationId/accept', authMiddleware, invitationController.acceptInvitation);

// @route   POST /api/invitations/:invitationId/decline
// @desc    Decline a project invitation
// @access  Private (Invited user only)
router.post('/:invitationId/decline', authMiddleware, invitationController.declineInvitation);

module.exports = router;