const VoicePrint = require('../models/VoicePrint');

// Get Voice Print Biometrics for user
const getVoicePrint = async (req, res) => {
  try {
    let voicePrint = await VoicePrint.findOne({ userId: req.user._id });
    if (!voicePrint) {
      voicePrint = await VoicePrint.create({ userId: req.user._id });
    }

    res.json({
      success: true,
      message: 'Voice print retrieved successfully',
      data: voicePrint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update/Calibrate Voice Print
const updateVoicePrint = async (req, res) => {
  const { samplePhrase, accuracy, status } = req.body;

  try {
    let voicePrint = await VoicePrint.findOne({ userId: req.user._id });
    if (!voicePrint) {
      voicePrint = new VoicePrint({ userId: req.user._id });
    }

    if (samplePhrase) voicePrint.samplePhrase = samplePhrase;
    if (accuracy !== undefined) voicePrint.accuracy = Number(accuracy);
    if (status) voicePrint.status = status;

    await voicePrint.save();

    res.json({
      success: true,
      message: 'Voice print updated successfully',
      data: voicePrint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete Voice Print
const deleteVoicePrint = async (req, res) => {
  try {
    await VoicePrint.findOneAndDelete({ userId: req.user._id });

    res.json({
      success: true,
      message: 'Voice print deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getVoicePrint,
  updateVoicePrint,
  deleteVoicePrint
};
