const AuditLog = require('../models/AuditLog');

/**
 * Log a critical user event into the AuditLog collection.
 * 
 * @param {string} defaultEvent - Fallback event name if X-Audit-Action header is not present
 * @param {Object} req - Express request object
 * @param {Object} [user] - User document or object (optional, defaults to req.user)
 */
const logAudit = async (defaultEvent, req, user = null) => {
  try {
    const targetUser = user || req.user;
    const userId = targetUser ? targetUser._id : null;
    const username = targetUser ? targetUser.username : (req.body ? (req.body.username || req.body.name) : 'Guest');
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    
    // Header priority: X-Audit-Action header > defaultEvent
    const event = req.headers['x-audit-action'] || defaultEvent || 'UNSPECIFIED_EVENT';

    await AuditLog.create({
      event,
      userId,
      username,
      ipAddress
    });
  } catch (error) {
    console.error('⚠️ AuditLog error:', error.message);
  }
};

module.exports = { logAudit };
