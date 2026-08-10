const AuditLog = require('../models/AuditLog');

const getClientMeta = (req) => ({
  ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
  userAgent: req?.headers?.['user-agent'] || null,
});

const createAuditLog = async ({ userId = null, action, details = {}, req }) => {
  try {
    const meta = getClientMeta(req);

    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = { createAuditLog, getClientMeta };
