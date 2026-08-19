const mongoose = require('mongoose');

const choiceSchema = mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  nextNodeId: { type: String }
}, { _id: false });

const quizOptionSchema = mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  theme: { type: String, default: 'blue' }
}, { _id: false });

const quizSchema = mongoose.Schema({
  stage: { type: String },
  question: { type: String },
  points: { type: Number, default: 5 },
  hint: { type: String },
  options: [quizOptionSchema]
}, { _id: false });

const narrativeNodeSchema = mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    unique: true
  },
  nodeType: {
    type: String,
    enum: ['Narration', 'Quest', 'Quiz'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  choices: {
    type: [choiceSchema],
    default: []
  },
  voiceAvatar: {
    type: String,
    default: 'Orc Warrior #04'
  },
  quiz: {
    type: quizSchema
  }
}, { timestamps: true });

module.exports = mongoose.model('NarrativeNode', narrativeNodeSchema);
