// Data Engineer Quest Frontend Application Logic

// Game State Variables
let questions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let sessionId = '';
let studentName = '';
let studentId = '';

// DOM Elements
const characterCreationScreen = document.getElementById('character-creation-screen');
const gameplayScreen = document.getElementById('gameplay-screen');
const victoryScreen = document.getElementById('victory-screen');
const reviewScreen = document.getElementById('review-screen');

const startGameForm = document.getElementById('start-game-form');
const inputStudentName = document.getElementById('student-name');
const inputStudentId = document.getElementById('student-id');

const rabbitAvatar = document.getElementById('rabbit-avatar');
const rabbitDialogue = document.getElementById('rabbit-dialogue');
const rabbitClass = document.getElementById('rabbit-class');
const charLevel = document.getElementById('char-level');
const expText = document.getElementById('exp-text');
const expBar = document.getElementById('exp-bar');

const questHeaderTitle = document.getElementById('quest-header-title');
const questCategory = document.getElementById('quest-category');
const questQuestion = document.getElementById('quest-question');
const questOptions = document.getElementById('quest-options');
const questTracker = document.getElementById('quest-tracker');
const nextQuestBtn = document.getElementById('next-quest-btn');

const finalRabbitAvatar = document.getElementById('final-rabbit-avatar');
const finalRabbitClass = document.getElementById('final-rabbit-class');
const summaryName = document.getElementById('summary-name');
const summaryId = document.getElementById('summary-id');
const summaryScore = document.getElementById('summary-score');
const summaryPercentage = document.getElementById('summary-percentage');
const syncText = document.getElementById('sync-text');
const cloudSyncStatus = document.querySelector('.cloud-sync-status');

const reviewList = document.getElementById('review-list');
const reviewLogsBtn = document.getElementById('review-logs-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const closeReviewBtn = document.getElementById('close-review-btn');

// Rabbit Evolution Classes & Dialogues based on Level
const RPG_STAGES = [
  {
    maxLevel: 2,
    class: 'Novice Database Seeker',
    image: 'assets/rabbit_rpg_1.jpg',
    dialogues: [
      '"A database? Is that like a chest full of golden carrots?"',
      '"Let\'s write our first SELECT query! I hope we don\'t break anything..."',
      '"SQL queries are like magic spells. I\'m still reading the beginner scrolls."'
    ]
  },
  {
    maxLevel: 4,
    class: 'SQL Warrior',
    image: 'assets/rabbit_rpg_2.jpg',
    dialogues: [
      '"FEEL THE MIGHT OF MY PRIMARY KEY SHIELD!"',
      '"JOINing tables to defeat the messy data anomalies!"',
      '"A database index! Our query speed has increased by 10x!"'
    ]
  },
  {
    maxLevel: 6,
    class: 'ETL Ranger',
    image: 'assets/rabbit_rpg_3.jpg',
    dialogues: [
      '"Extracting data from the wilderness at high velocity!"',
      '"No NULL values or dirty duplicates can escape my dual-daggers!"',
      '"Transforming the raw CSV scroll into structured Parquet armor!"'
    ]
  },
  {
    maxLevel: 8,
    class: 'Pipeline Alchemist',
    image: 'assets/rabbit_rpg_4.jpg',
    dialogues: [
      '"Mixing Kafka streams and Spark queries in my glowing cauldron!"',
      '"We are processing millions of events per second! Keep the pipes steady!"',
      '"Adding partition keys to speed up the analytical transformation!"'
    ]
  },
  {
    maxLevel: 10,
    class: 'Legendary Data Architect',
    image: 'assets/rabbit_rpg_5.jpg',
    dialogues: [
      '"I control the cloud clusters and real-time streaming pipelines!"',
      '"The data warehouse is fully scaled and optimized! Behold its glory!"',
      '"We have achieved Level 10 MAX! Let\'s build the ultimate cloud architecture!"'
    ]
  }
];

// Initialize Game
async function init() {
  sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
  
  // Event Listeners
  startGameForm.addEventListener('submit', handleStartGame);
  nextQuestBtn.addEventListener('click', handleNextQuest);
  playAgainBtn.addEventListener('click', resetGame);
  reviewLogsBtn.addEventListener('click', showReviewScreen);
  closeReviewBtn.addEventListener('click', hideReviewScreen);
}

// Handle Form Submission - Start Game
async function handleStartGame(e) {
  e.preventDefault();
  
  studentName = inputStudentName.value.trim();
  studentId = inputStudentId.value.trim();
  
  // Load questions
  try {
    const res = await fetch('/api/questions');
    questions = await res.json();
    
    if (questions.length === 0) {
      alert('Error: No questions found on the server!');
      return;
    }
    
    // Switch Screen
    characterCreationScreen.classList.remove('active');
    gameplayScreen.classList.add('active');
    
    // Start Gameplay
    currentQuestionIndex = 0;
    userAnswers = [];
    renderQuest();
    updateRabbitStatus();
    
  } catch (err) {
    console.error('Failed to start game:', err);
    alert('Failed to connect to the game server. Please try again.');
  }
}

// Render the Active Quiz Question
function renderQuest() {
  const q = questions[currentQuestionIndex];
  const levelNum = currentQuestionIndex + 1;
  
  questHeaderTitle.textContent = `ACTIVE QUEST: LEVEL ${levelNum}`;
  questCategory.textContent = q.category;
  questQuestion.textContent = q.question;
  questTracker.textContent = `Quest ${levelNum} of ${questions.length}`;
  
  // Clear previous options
  questOptions.innerHTML = '';
  
  // Disable next button until option is chosen
  nextQuestBtn.disabled = true;
  nextQuestBtn.classList.add('disabled');
  nextQuestBtn.textContent = "Select an Answer";
  
  // Populate options
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => selectOption(btn, opt));
    questOptions.appendChild(btn);
  });
}

// Select an option
let selectedAnswer = null;
function selectOption(selectedBtn, optionText) {
  // Clear other selections
  const buttons = questOptions.querySelectorAll('.option-btn');
  buttons.forEach(btn => btn.classList.remove('selected'));
  
  // Add selected style
  selectedBtn.classList.add('selected');
  selectedAnswer = optionText;
  
  // Enable Next button
  nextQuestBtn.disabled = false;
  nextQuestBtn.classList.remove('disabled');
  nextQuestBtn.textContent = currentQuestionIndex === questions.length - 1 ? "Finish Quest" : "Submit Answer";
}

// Handle Next Quest Button Click
function handleNextQuest() {
  if (!selectedAnswer) return;
  
  // Save user response
  const currentQuestion = questions[currentQuestionIndex];
  userAnswers.push({
    id: currentQuestion.id,
    selected: selectedAnswer
  });
  
  // Next step
  currentQuestionIndex++;
  selectedAnswer = null;
  
  if (currentQuestionIndex < questions.length) {
    renderQuest();
    updateRabbitStatus();
  } else {
    // End of quiz, go to victory screen
    submitResults();
  }
}

// Update Rabbit Image, Class and Dialogues Based on Level
function updateRabbitStatus() {
  const currentLevel = currentQuestionIndex + 1;
  
  // Find current RPG stage
  const stage = RPG_STAGES.find(s => currentLevel <= s.maxLevel) || RPG_STAGES[RPG_STAGES.length - 1];
  
  // Update UI Elements
  rabbitAvatar.src = stage.image;
  rabbitClass.textContent = stage.class;
  charLevel.textContent = currentLevel < 10 ? `0${currentLevel}` : currentLevel;
  
  // EXP details (1 exp per quest answered)
  const expVal = currentQuestionIndex;
  expText.textContent = `${expVal}/${questions.length}`;
  
  const percentage = (expVal / questions.length) * 100;
  expBar.style.width = `${percentage}%`;
  
  // Set random dialogue from stage
  const randomDialogue = stage.dialogues[Math.floor(Math.random() * stage.dialogues.length)];
  rabbitDialogue.querySelector('p').textContent = randomDialogue;
}

// Submit results to backend and trigger Cloud Pub/Sub
async function submitResults() {
  gameplayScreen.classList.remove('active');
  victoryScreen.classList.add('active');
  
  // Show Loading status for Pub/Sub
  cloudSyncStatus.className = 'cloud-sync-status';
  syncText.textContent = 'Publishing results to Google Cloud Pub/Sub topic...';
  
  summaryName.textContent = studentName;
  summaryId.textContent = studentId;
  
  const payload = {
    session_id: sessionId,
    student_id: studentId,
    student_name: studentName,
    answers: userAnswers
  };
  
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    
    if (result.success) {
      summaryScore.textContent = `${result.score} / ${result.total_questions}`;
      summaryPercentage.textContent = `${result.percentage}%`;
      
      // Determine final rabbit stage based on final level/accuracy
      // If score is perfect/high, show max level 10
      const finalScoreLevel = Math.max(1, Math.min(10, Math.round((result.score / result.total_questions) * 10)));
      const finalStage = RPG_STAGES.find(s => finalScoreLevel <= s.maxLevel) || RPG_STAGES[RPG_STAGES.length - 1];
      
      finalRabbitAvatar.src = finalStage.image;
      finalRabbitClass.textContent = finalStage.class;
      document.querySelector('.level-indicator').textContent = `Level ${finalScoreLevel} (Score-based)`;
      
      // Set pubsub sync text
      cloudSyncStatus.classList.add('success');
      syncText.textContent = `Data published successfully to Cloud Pub/Sub! (MsgID: ${result.message_id || 'Mocked'})`;
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Submission failed:', error);
    cloudSyncStatus.classList.add('error');
    syncText.textContent = `Failed to publish to Cloud Pub/Sub. Ingestion offline.`;
  }
}

// Load and Show Question Review Screen
async function showReviewScreen() {
  victoryScreen.classList.remove('active');
  reviewScreen.classList.add('active');
  
  reviewList.innerHTML = '<p class="review-instructions">Loading scroll logs...</p>';
  
  try {
    const res = await fetch('/api/review-questions');
    const fullQuestions = await res.json();
    
    reviewList.innerHTML = '';
    
    fullQuestions.forEach((q, idx) => {
      const userAns = userAnswers.find(ua => ua.id === q.id);
      const isCorrect = userAns && userAns.selected === q.answer;
      
      const itemCard = document.createElement('div');
      itemCard.className = `review-item-card ${isCorrect ? 'correct' : 'incorrect'}`;
      
      itemCard.innerHTML = `
        <div class="review-item-header">
          <h4>LEVEL ${q.level} • ${q.category}</h4>
          <span class="badge ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? 'QUEST CLEARED (+10 EXP)' : 'QUEST FAILED (+0 EXP)'}
          </span>
        </div>
        <p class="review-item-question">${q.question}</p>
        
        <div class="review-selections">
          <div class="selection-box">
            <strong>Your Selection</strong>
            ${userAns ? userAns.selected : 'No Answer Selected'}
          </div>
          <div class="selection-box">
            <strong>Correct Answer</strong>
            ${q.answer}
          </div>
        </div>
        
        <div class="review-explanation">
          <strong>Scroll of Wisdom:</strong> ${q.explanation}
        </div>
      `;
      
      reviewList.appendChild(itemCard);
    });
    
  } catch (err) {
    console.error('Failed to load review logs:', err);
    reviewList.innerHTML = '<p class="review-instructions" style="color: var(--neon-red)">Error: Could not retrieve scroll logs.</p>';
  }
}

function hideReviewScreen() {
  reviewScreen.classList.remove('active');
  victoryScreen.classList.add('active');
}

// Reset Game
function resetGame() {
  victoryScreen.classList.remove('active');
  characterCreationScreen.classList.add('active');
  
  // Re-generate Session ID
  sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
  
  // Clear inputs
  inputStudentName.value = '';
  inputStudentId.value = '';
}

// Run on page load
window.addEventListener('DOMContentLoaded', init);
