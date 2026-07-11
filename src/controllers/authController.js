const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    await createAuditLog({
      userId: user._id,
      action: 'USER_REGISTERED',
      details: { email: user.email },
      req,
    });

    res.status(201).json({
      token,
      user: user.toSafeObject(),
      message: 'Registration successful',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      await createAuditLog({
        action: 'USER_LOGIN_FAILED',
        details: { email: email.toLowerCase(), reason: 'Invalid credentials' },
        req,
      });

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      await createAuditLog({
        userId: user._id,
        action: 'USER_LOGIN_FAILED',
        details: { email: user.email, reason: 'Account deactivated' },
        req,
      });

      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    await createAuditLog({
      userId: user._id,
      action: 'USER_LOGIN',
      details: { email: user.email },
      req,
    });

    res.json({
      token,
      user: user.toSafeObject(),
      message: 'Login successful',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
      await user.save();

      await createAuditLog({
        userId: user._id,
        action: 'PASSWORD_RESET_REQUESTED',
        details: { email: user.email },
        req,
      });

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          message: 'Password reset token generated',
          resetToken,
        });
      }
    }

    res.json({
      message: 'If an account exists for that email, a reset link has been sent',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Reset token and new password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await createAuditLog({
      userId: user._id,
      action: 'PASSWORD_RESET',
      details: { email: user.email },
      req,
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

const logoutUser = async (req, res) => {
  await createAuditLog({
    userId: req.user._id,
    action: 'USER_LOGOUT',
    details: { email: req.user.email },
    req,
  });

  res.json({ message: 'Logout successful' });
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  logoutUser,
};
