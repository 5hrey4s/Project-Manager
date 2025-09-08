const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const projectController = require('../controllers/invitationController');

// @route   GET /api/invitations
// @desc    Get all pending invitations for the logged-in user
// @access  Private
router.get('/', auth, projectController.getPendingInvitations);

// @route   POST /api/invitations/:invitationId/accept
// @desc    Accept a project invitation
// @access  Private (Invited user only)
router.post('/:invitationId/accept', auth, projectController.acceptInvitation);

// @route   POST /api/invitations/:invitationId/decline
// @desc    Decline a project invitation
// @access  Private (Invited user only)
router.post('/:invitationId/decline', auth, projectController.declineInvitation);

module.exports = router;