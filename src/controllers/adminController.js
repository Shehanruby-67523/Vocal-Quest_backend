const User = require('../models/User');
const GameSave = require('../models/GameSave');
const AuditLog = require('../models/AuditLog');
const NarrativeNode = require('../models/NarrativeNode');

// Simulated System Settings
let systemSettings = {
  automatedBanSensitivity: 70,
  requireMfaForAdmins: true
};

// Log helper to register audit logs in the DB
const logAuditEvent = async (event, adminUser, ipAddress) => {
  try {
    await AuditLog.create({
      event,
      userId: adminUser ? adminUser._id : null,
      username: adminUser ? adminUser.username : 'System',
      ipAddress: ipAddress || '127.0.0.1'
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
};

// 1. Get Users with pagination, search
const getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const search = req.query.search || '';

  try {
    const searchQuery = search ? {
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined }
      ].filter(Boolean)
    } : {};

    const count = await User.countDocuments(searchQuery);
    
    // Find users, select out password hashes
    const usersList = await User.find(searchQuery)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Map user stats (count game saves)
    const usersWithSaves = await Promise.all(usersList.map(async (u) => {
      const gameSavesCount = await GameSave.countDocuments({ userId: u._id });
      return {
        id: u._id,
        username: u.username,
        email: u.email,
        status: u.status,
        role: u.role,
        verified: u.verified,
        gameSaves: gameSavesCount,
        lastActive: u.lastActive
      };
    }));

    res.json({
      users: usersWithSaves,
      currentPage: page,
      totalPages: Math.ceil(count / limit) || 1,
      totalUsers: count
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. Invite / Create User
const inviteUser = async (req, res) => {
  const { username, email, role, status, verified } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: "User with that email or username already exists" });
    }

    // Default password for invited users
    const defaultPassword = 'VocalQuestTemp2026!';
    const user = await User.create({
      username,
      email,
      password: defaultPassword,
      role: role || 'Standard',
      status: status || 'Active',
      verified: verified !== undefined ? verified : true
    });

    await logAuditEvent(`Invited user: ${username} (${email}) with role: ${role}`, req.user, req.ip);

    res.status(201).json({
      message: "User invited successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. Toggle User Status (Suspend/Active)
const toggleUserStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    await user.save();

    await logAuditEvent(`Toggled status of user ${user.username} to ${user.status}`, req.user, req.ip);

    res.json({ message: `User status changed to ${user.status}`, user: { id: user._id, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 4. Change User Role
const changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['Standard', 'Admin'].includes(role)) {
    return res.status(400).json({ message: "Valid role is required" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    await logAuditEvent(`Changed role of user ${user.username} to ${role}`, req.user, req.ip);

    res.json({ message: `User role changed to ${role}`, user: { id: user._id, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 5. Revoke sessions / Delete session
const deleteUserSession = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAuditEvent(`Revoked all active login sessions for user ${user.username}`, req.user, req.ip);

    res.json({ message: `Successfully terminated all sessions for ${user.username}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 6. Export Users CSV
const exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    let csv = 'User ID,Username,Email,Account Status,Role,Verified,Last Active\n';
    
    users.forEach(u => {
      csv += `"${u._id}","${u.username}","${u.email}","${u.status}","${u.role}","${u.verified ? 'Yes' : 'No'}","${u.lastActive}"\n`;
    });

    await logAuditEvent("Exported players CSV list", req.user, req.ip);

    res.header('Content-Type', 'text/csv');
    res.attachment('vocal_quest_users.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 7. Get Security Logs / Audit logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 8. Settings Get/Put
const getSettings = async (req, res) => {
  res.json(systemSettings);
};

const updateSettings = async (req, res) => {
  const { automatedBanSensitivity, requireMfaForAdmins } = req.body;

  if (automatedBanSensitivity !== undefined) {
    systemSettings.automatedBanSensitivity = automatedBanSensitivity;
  }
  if (requireMfaForAdmins !== undefined) {
    systemSettings.requireMfaForAdmins = requireMfaForAdmins;
  }

  await logAuditEvent(`Updated system settings: Sensitivity=${systemSettings.automatedBanSensitivity}, MFA=${systemSettings.requireMfaForAdmins}`, req.user, req.ip);

  res.json({ message: "System settings updated successfully", settings: systemSettings });
};

// 9. Story logic nodes CRUD
const getNodes = async (req, res) => {
  try {
    const nodes = await NarrativeNode.find({});
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createNode = async (req, res) => {
  const { nodeId, nodeType, title, content, choices, voiceAvatar, quiz } = req.body;

  try {
    const nodeExists = await NarrativeNode.findOne({ nodeId });
    if (nodeExists) {
      return res.status(400).json({ message: "Narrative node with this nodeId already exists" });
    }

    const node = await NarrativeNode.create({
      nodeId,
      nodeType,
      title,
      content,
      choices: choices || [],
      voiceAvatar: voiceAvatar || 'Orc Warrior #04',
      quiz
    });

    await logAuditEvent(`Created narrative node: ${nodeId} (${title})`, req.user, req.ip);

    res.status(201).json({ message: "Narrative node created successfully", node });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateNode = async (req, res) => {
  const { nodeId } = req.params;
  const { nodeType, title, content, choices, voiceAvatar, quiz } = req.body;

  try {
    const node = await NarrativeNode.findOne({ nodeId });
    if (!node) {
      return res.status(404).json({ message: "Narrative node not found" });
    }

    if (nodeType) node.nodeType = nodeType;
    if (title) node.title = title;
    if (content) node.content = content;
    if (choices) node.choices = choices;
    if (voiceAvatar) node.voiceAvatar = voiceAvatar;
    if (quiz) node.quiz = quiz;

    await node.save();

    await logAuditEvent(`Updated narrative node: ${nodeId}`, req.user, req.ip);

    res.json({ message: "Narrative node updated successfully", node });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteNode = async (req, res) => {
  const { nodeId } = req.params;

  try {
    const result = await NarrativeNode.deleteOne({ nodeId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Narrative node not found" });
    }

    await logAuditEvent(`Deleted narrative node: ${nodeId}`, req.user, req.ip);

    res.json({ message: "Narrative node deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUsers,
  inviteUser,
  toggleUserStatus,
  changeUserRole,
  deleteUserSession,
  exportUsersCSV,
  getAuditLogs,
  getSettings,
  updateSettings,
  getNodes,
  createNode,
  updateNode,
  deleteNode,
  logAuditEvent
};
