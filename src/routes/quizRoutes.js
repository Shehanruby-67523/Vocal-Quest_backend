const express = require('express');
const router = express.Router();
const db = require('../config/db');
const pool = db.pool || db;

// GET /api/quiz/questions -> Queries Neon PostgreSQL and returns JSON
router.get('/questions', async (req, res) => {
    try {
        let result;
        try {
            result = await pool.query(
                'SELECT id, question_key AS "key", story_node AS "storyNode", question, option_a AS "optionA", option_b AS "optionB", option_c AS "optionC", option_d AS "optionD", correct_answer AS "correctAnswer", trigger_keywords AS "triggerKeywords" FROM quiz_questions1 ORDER BY id ASC'
            );
        } catch (e) {
            result = await pool.query(
                'SELECT id, question_key AS "key", story_node AS "storyNode", question, option_a AS "optionA", option_b AS "optionB", option_c AS "optionC", option_d AS "optionD", correct_answer AS "correctAnswer", trigger_keywords AS "triggerKeywords" FROM quiz_questions ORDER BY id ASC'
            );
        }
        res.json({ success: true, count: result.rows.length, questions: result.rows });
    } catch (err) {
        console.error('Neon PostgreSQL query error:', err.message);
        res.status(500).json({ success: false, error: 'Database query error' });
    }
});

module.exports = router;
