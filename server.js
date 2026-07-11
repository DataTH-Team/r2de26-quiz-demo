const express = require('express');
const fs = require('fs');
const path = require('path');
const { PubSub } = require('@google-cloud/pubsub');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Google Cloud Pub/Sub
const projectId = process.env.GCP_PROJECT_ID || 'workshop5-demo';
const topicName = process.env.PUBSUB_TOPIC || 'quiz-events';

let pubSubClient;
try {
  pubSubClient = new PubSub({ projectId });
  console.log(`Pub/Sub client initialized for project: ${projectId}`);
} catch (error) {
  console.error('Failed to initialize Pub/Sub client:', error);
}

// Serve static frontend files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));
app.get('/index.css', (req, res) => res.sendFile(path.join(__dirname, 'index.css')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// API: Get Questions
app.get('/api/questions', (req, res) => {
  const questionsPath = path.join(__dirname, 'questions.json');
  fs.readFile(questionsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading questions.json:', err);
      return res.status(500).json({ error: 'Failed to load questions' });
    }
    try {
      const questions = JSON.parse(data);
      // Remove answers from payload to prevent cheating on client side
      // but keep categories, questions, options, levels, and IDs
      const sanitizedQuestions = questions.map(q => ({
        id: q.id,
        level: q.level,
        category: q.category,
        question: q.question,
        options: q.options
      }));
      res.json(sanitizedQuestions);
    } catch (parseErr) {
      console.error('Error parsing questions.json:', parseErr);
      res.status(500).json({ error: 'Invalid questions configuration' });
    }
  });
});

// API: Submit Quiz Attempt
app.post('/api/submit', async (req, res) => {
  try {
    const { session_id, student_id, student_name, answers } = req.body;
    
    if (!student_id || !student_name || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required submission fields' });
    }

    // Read ground truth questions
    const questionsPath = path.join(__dirname, 'questions.json');
    const questionsData = fs.readFileSync(questionsPath, 'utf8');
    const questions = JSON.parse(questionsData);

    // Calculate score
    let score = 0;
    const total_questions = questions.length;
    const evaluatedAnswers = [];

    questions.forEach((q) => {
      const userAnswer = answers.find(a => a.id === q.id);
      const selected = userAnswer ? userAnswer.selected : null;
      const isCorrect = selected === q.answer;
      if (isCorrect) score++;

      evaluatedAnswers.push({
        question_id: q.id,
        category: q.category,
        selected: selected,
        correct_answer: q.answer,
        is_correct: isCorrect,
        explanation: q.explanation
      });
    });

    const percentage = parseFloat(((score / total_questions) * 100).toFixed(2));
    const submitted_at = new Date().toISOString();

    // Prepare GCP BigQuery-compatible structured payload
    // Columns: session_id, student_id, student_name, score, total_questions, percentage, submitted_at, answers_json
    const payload = {
      session_id: session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      student_id: String(student_id).trim(),
      student_name: String(student_name).trim(),
      score: parseInt(score),
      total_questions: parseInt(total_questions),
      percentage: parseFloat(percentage),
      submitted_at: submitted_at,
      answers_json: JSON.stringify(evaluatedAnswers)
    };

    console.log('Quiz Evaluation Result:', {
      student_name: payload.student_name,
      score: `${payload.score}/${payload.total_questions}`,
      percentage: `${payload.percentage}%`
    });

    // Publish to GCP Pub/Sub
    let messageId = null;
    if (pubSubClient) {
      try {
        const dataBuffer = Buffer.from(JSON.stringify(payload));
        messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
        console.log(`Successfully published message ${messageId} to topic ${topicName}`);
      } catch (pubsubError) {
        console.error('Failed to publish message to Pub/Sub:', pubsubError);
      }
    } else {
      console.warn('Pub/Sub client not initialized. Skipping cloud publish.');
    }

    // Return the detailed results back to client
    res.json({
      success: true,
      message_id: messageId,
      score,
      total_questions,
      percentage,
      evaluated_answers: evaluatedAnswers
    });

  } catch (error) {
    console.error('Error handling quiz submission:', error);
    res.status(500).json({ error: 'Internal Server Error during evaluation' });
  }
});

// API: Get Full Questions for Review (with answers & explanations)
app.get('/api/review-questions', (req, res) => {
  const questionsPath = path.join(__dirname, 'questions.json');
  fs.readFile(questionsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading questions.json:', err);
      return res.status(500).json({ error: 'Failed to load questions' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      res.status(500).json({ error: 'Invalid questions configuration' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
