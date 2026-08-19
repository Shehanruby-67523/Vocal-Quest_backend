const mongoose = require('mongoose');

const voicePrintSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    voiceProfileId: { type: String, default: '' },
    accuracy: { type: Number, default: 85 },
    status: {
      type: String,
      enum: ['active', 'calibrating', 'inactive'],
      default: 'active'
    },
    samplePhrase: { type: String, default: 'Vocal Quest Start' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VoicePrint', voicePrintSchema);
