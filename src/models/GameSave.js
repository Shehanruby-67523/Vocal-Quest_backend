const mongoose = require('mongoose');

const gameSaveSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest'
    },
    progressData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastSaved: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameSave', gameSaveSchema);
