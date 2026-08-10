const mongoose = require('mongoose');

const answerSchema = mongoose.Schema({
  questionIndex: { type: Number, required: true },
  userAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  scoreEarned: { type: Number, default: 0 }
});

const gameSessionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      required: true
    },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    correctAnswersCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
    },
    answers: [answerSchema],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameSession', gameSessionSchema);
