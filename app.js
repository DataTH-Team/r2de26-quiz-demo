// Data Engineer Quest Frontend Application Logic (Gamified & Localized)

// Game State Variables
let questions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let sessionId = '';
let studentName = '';
let studentId = '';

// RPG Stats
let playerHpVal = 100;
let playerMpVal = 100;
let bossHpVal = 100;

// Audio Context for retro sound synthesis
let audioCtx = null;

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

// HP / MP / Boss HP Fills
const playerHpBar = document.getElementById('player-hp');
const playerHpText = document.getElementById('player-hp-text');
const playerMpBar = document.getElementById('player-mp');
const playerMpText = document.getElementById('player-mp-text');
const bossHpBar = document.getElementById('boss-hp');
const bossHpText = document.getElementById('boss-hp-text');
const battleLogContent = document.getElementById('battle-log-content');

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

// Rabbit Evolution Classes & Dialogues based on Level (Thai Localized)
const RPG_STAGES = [
  {
    maxLevel: 2,
    class: 'Novice Database Seeker (กระต่ายน้อยตามหาคลังข้อมูล)',
    image: 'assets/rabbit_rpg_1.jpg',
    dialogues: [
      '"ฐานข้อมูลคืออะไรเหรอครับ? มันเหมือนกล่องใส่แครอทไหมนะ?"',
      '"มาลองเขียนคำสั่ง SELECT แรกกันเถอะ! หวังว่าเซิร์ฟเวอร์จะไม่ระเบิดนะ..."',
      '"SQL เหมือนคาถาเวทมนตร์เลย ตอนนี้ผมกำลังหัดอ่านม้วนคัมภีร์เริ่มต้นอยู่ครับ"'
    ]
  },
  {
    maxLevel: 4,
    class: 'SQL Warrior (นักรบคิวรี)',
    image: 'assets/rabbit_rpg_2.jpg',
    dialogues: [
      '"จงรับพลังโล่ Primary Key ของผมซะ!"',
      '"เราจะ JOIN ตารางเข้าด้วยกันเพื่อปราบปีศาจข้อมูลที่ซ้ำซ้อน!"',
      '"เย้! ดัชนีฐานข้อมูล (Database Index) ทำให้เราโจมตีเร็วขึ้นสิบเท่าแล้ว!"'
    ]
  },
  {
    maxLevel: 6,
    class: 'ETL Ranger (นายพรานไปป์ไลน์ข้อมูล)',
    image: 'assets/rabbit_rpg_3.jpg',
    dialogues: [
      '"ดึงข้อมูลดิบออกจากป่าทึบด้วยความเร็วสูง!"',
      '"ไม่มีค่าว่าง (NULL) หรือข้อบกพร่องใดๆ หลุดรอดลูกธนูพรานของผมไปได้!"',
      '"ทำการแปลงข้อมูล (Transform) ม้วนตำราดิบๆ ให้เป็นเกราะป้องกันอันแข็งแกร่ง!"'
    ]
  },
  {
    maxLevel: 8,
    class: 'Pipeline Alchemist (นักเล่นแร่แปรธาตุข้อมูล)',
    image: 'assets/rabbit_rpg_4.jpg',
    dialogues: [
      '"กำลังต้มน้ำเวทมนตร์ Kafka และ Spark ในหม้อปรุงสูตรสำเร็จ!"',
      '"ประมวลผลข้อมูลหลายล้านข้อความต่อวินาที! รักษาเสถียรภาพท่อให้ดี!"',
      '"เพิ่ม Partition Keys ลงไปเพื่อลดความหน่วงในหม้อปรุงต้มข้อมูล!"'
    ]
  },
  {
    maxLevel: 10,
    class: 'Legendary Data Engineer',
    image: 'assets/rabbit_rpg_5.jpg',
    dialogues: [
      '"ข้าคือผู้ควบคุมกลุ่มเมฆคลาวด์และท่อประมวลผลแบบเรียลไทม์ทั้งหมด!"',
      '"ระบบ Data Warehouse ของเราสเกลเสร็จสมบูรณ์เรียบร้อย! จงดูความอลังการนี้!"',
      '"พวกเราเลเวล 10 MAX แล้ว! มาสร้างระบบคลาวด์ระดับประวัติศาสตร์กันต่อเถอะ!"'
    ]
  }
];

// Sound Synthesizer helpers
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Sound 1: Correct Answer chirp
function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn('Audio Synthesis not supported or allowed by browser autoplay policy.');
  }
}

// Sound 2: Incorrect Answer damage buzz
function playIncorrectSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn(e);
  }
}

// Sound 3: Level Up fanfare
function playLevelUpSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio
    
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.15);
    });
  } catch (e) {
    console.warn(e);
  }
}

// Write to Battle Log
function writeLog(message, type = 'system') {
  const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = document.createElement('p');
  
  let typeClass = 'log-system';
  if (type === 'dmg') typeClass = 'log-dmg';
  if (type === 'hurt') typeClass = 'log-hurt';
  
  p.innerHTML = `<span class="log-time">[${time}]</span> <span class="${typeClass}">${message}</span>`;
  battleLogContent.appendChild(p);
  
  // Auto scroll to bottom
  battleLogContent.scrollTop = battleLogContent.scrollHeight;
}

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
  
  // Initialize audio on user interaction to satisfy browser policies
  getAudioContext();
  
  // Load questions
  try {
    const res = await fetch('/api/questions');
    questions = await res.json();
    
    if (questions.length === 0) {
      alert('Error: ไม่พบข้อมูลคำถามในเซิร์ฟเวอร์!');
      return;
    }
    
    // Reset Stats
    playerHpVal = 100;
    playerMpVal = 100;
    bossHpVal = 100;
    
    playerHpBar.style.width = '100%';
    playerHpText.textContent = '100/100';
    playerMpBar.style.width = '100%';
    playerMpText.textContent = '100/100';
    bossHpBar.style.width = '100%';
    bossHpText.textContent = 'HP: 100/100';
    
    // Switch Screen
    characterCreationScreen.classList.remove('active');
    gameplayScreen.classList.add('active');
    
    // Clear log
    battleLogContent.innerHTML = '';
    writeLog(`ผู้กล้า ${studentName} ได้ทำการเข้าสู่ดันเจี้ยนข้อมูลดิบ!`, 'system');
    writeLog(`มอนสเตอร์ "ข้อมูลดิบที่ยุ่งเหยิง" ปรากฏตัวขึ้นแล้ว!`, 'hurt');
    
    // Start Gameplay
    currentQuestionIndex = 0;
    userAnswers = [];
    renderQuest();
    updateRabbitStatus(true); // silent first update
    
  } catch (err) {
    console.error('Failed to start game:', err);
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
  }
}

// Render the Active Quiz Question
function renderQuest() {
  const q = questions[currentQuestionIndex];
  const levelNum = currentQuestionIndex + 1;
  
  questHeaderTitle.textContent = `เควสป้องกัน: เลเวล ${levelNum}`;
  questCategory.textContent = q.category;
  questQuestion.textContent = q.question;
  questTracker.textContent = `คำถามที่ ${levelNum} จาก ${questions.length}`;
  
  // Clear previous options
  questOptions.innerHTML = '';
  
  // Disable next button until option is chosen
  nextQuestBtn.disabled = true;
  nextQuestBtn.classList.add('disabled');
  nextQuestBtn.textContent = "เลือกคำตอบเวทมนตร์";
  
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
  nextQuestBtn.textContent = currentQuestionIndex === questions.length - 1 ? "พิชิตมอนสเตอร์ดิบ!" : "โจมตีด้วยคำตอบ!";
}

// Handle Next Quest Button Click (Evaluates local correctness to update HP/MP and triggers animations)
async function handleNextQuest() {
  if (!selectedAnswer) return;
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Local validation to trigger sounds and logs instantly
  // We will get the ground truth from review questions to see if answer is correct
  try {
    const res = await fetch('/api/review-questions');
    const fullQuestions = await res.json();
    const correctQ = fullQuestions.find(q => q.id === currentQuestion.id);
    const isCorrect = selectedAnswer === correctQ.answer;
    
    // Apply RPG logic
    if (isCorrect) {
      playCorrectSound();
      bossHpVal -= 10;
      bossHpVal = Math.max(0, bossHpVal);
      bossHpBar.style.width = `${bossHpVal}%`;
      bossHpText.textContent = `HP: ${bossHpVal}/100`;
      
      // Flash card green
      const questPanel = document.querySelector('.quest-panel');
      questPanel.classList.add('flash-correct');
      setTimeout(() => questPanel.classList.remove('flash-correct'), 500);
      
      writeLog(`คุณคิวรีคีย์ตอบถูกต้อง! โจมตีและลดค่าความยุ่งเหยิงของมอนสเตอร์ลง 10 HP! (เหลือ ${bossHpVal}/100)`, 'dmg');
    } else {
      playIncorrectSound();
      playerHpVal -= 10;
      playerHpVal = Math.max(0, playerHpVal);
      playerHpBar.style.width = `${playerHpVal}%`;
      playerHpText.textContent = `${playerHpVal}/100`;
      
      // Shake screen
      const gameplayContainer = document.querySelector('.gameplay-layout');
      gameplayContainer.classList.add('shake');
      setTimeout(() => gameplayContainer.classList.remove('shake'), 500);
      
      writeLog(`คำตอบผิดพลาด! ดาต้าไปป์ไลน์ขัดข้อง ได้รับแรงย้อนกลับ (Data Inconsistency) เสียพลังชีวิต 10 HP! (เหลือ ${playerHpVal}/100)`, 'hurt');
    }
    
    // Deduct Mana per query spell casted
    playerMpVal -= 10;
    playerMpVal = Math.max(0, playerMpVal);
    playerMpBar.style.width = `${playerMpVal}%`;
    playerMpText.textContent = `${playerMpVal}/100`;
    
  } catch (err) {
    console.error('Validation fetch error:', err);
  }

  // Save user response
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
function updateRabbitStatus(silent = false) {
  const currentLevel = currentQuestionIndex + 1;
  const previousLevel = currentQuestionIndex;
  
  // Find current RPG stage
  const stage = RPG_STAGES.find(s => currentLevel <= s.maxLevel) || RPG_STAGES[RPG_STAGES.length - 1];
  
  // Check if class has evolved compared to previous level to play Fanfare
  const prevStage = RPG_STAGES.find(s => previousLevel <= s.maxLevel) || RPG_STAGES[RPG_STAGES.length - 1];
  if (!silent && stage.class !== prevStage.class) {
    playLevelUpSound();
    writeLog(`ยินดีด้วย! เจ้ากระต่ายได้วิวัฒนาการสายอาชีพเป็น: [${stage.class}]!`, 'system');
  } else if (!silent) {
    playLevelUpSound();
  }

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
  
  if (!silent) {
    writeLog(`อัพเลเวลตัวละครแล้ว! ขึ้นเป็น Level ${currentLevel}!`, 'system');
  }
}

// Submit results to backend and trigger Cloud Pub/Sub
async function submitResults() {
  gameplayScreen.classList.remove('active');
  victoryScreen.classList.add('active');
  
  // Show Loading status for Pub/Sub
  cloudSyncStatus.className = 'cloud-sync-status';
  syncText.textContent = 'กำลังอัปโหลดบันทึกการเคลียร์ดันเจี้ยนขึ้นสู่ Cloud Pub/Sub...';
  
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
      const finalScoreLevel = Math.max(1, Math.min(10, Math.round((result.score / result.total_questions) * 10)));
      const finalStage = RPG_STAGES.find(s => finalScoreLevel <= s.maxLevel) || RPG_STAGES[RPG_STAGES.length - 1];
      
      finalRabbitAvatar.src = finalStage.image;
      finalRabbitClass.textContent = finalStage.class;
      document.querySelector('.level-indicator').textContent = `เลเวล ${finalScoreLevel} (คำนวณตามคะแนน)`;
      
      // Set pubsub sync text
      cloudSyncStatus.classList.add('success');
      syncText.textContent = `ข้อมูลถูกเผยแพร่ไปยัง Cloud Pub/Sub สำเร็จ! (หมายเลขข้อความ: ${result.message_id || 'สร้างขึ้นแบบจำลอง'})`;
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Submission failed:', error);
    cloudSyncStatus.classList.add('error');
    syncText.textContent = `การเชื่อมต่อคลาวด์ล้มเหลว (เก็บข้อมูลไว้ในระดับเซิร์ฟเวอร์ชั่วคราว)`;
  }
}

// Load and Show Question Review Screen
async function showReviewScreen() {
  victoryScreen.classList.remove('active');
  reviewScreen.classList.add('active');
  
  reviewList.innerHTML = '<p class="review-instructions">กำลังเปิดดูตำราคาถาเฉลยเควส...</p>';
  
  try {
    const res = await fetch('/api/review-questions');
    const fullQuestions = await res.json();
    
    reviewList.innerHTML = '';
    
    fullQuestions.forEach((q) => {
      const userAns = userAnswers.find(ua => ua.id === q.id);
      const isCorrect = userAns && userAns.selected === q.answer;
      
      const itemCard = document.createElement('div');
      itemCard.className = `review-item-card ${isCorrect ? 'correct' : 'incorrect'}`;
      
      itemCard.innerHTML = `
        <div class="review-item-header">
          <h4>เลเวล ${q.level} • ${q.category}</h4>
          <span class="badge ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? 'เคลียร์เควสสำเร็จ (+10 EXP)' : 'เควสล้มเหลว (+0 EXP)'}
          </span>
        </div>
        <p class="review-item-question">${q.question}</p>
        
        <div class="review-selections">
          <div class="selection-box">
            <strong>คำตอบของคุณ (Your Selection)</strong>
            ${userAns ? userAns.selected : 'ไม่ได้เลือกคำตอบ'}
          </div>
          <div class="selection-box">
            <strong>คำตอบที่ถูกต้อง (Correct Answer)</strong>
            ${q.answer}
          </div>
        </div>
        
        <div class="review-explanation">
          <strong>ม้วนหนังสือแห่งปัญญา (Scroll of Wisdom):</strong> ${q.explanation}
        </div>
      `;
      
      reviewList.appendChild(itemCard);
    });
    
  } catch (err) {
    console.error('Failed to load review logs:', err);
    reviewList.innerHTML = '<p class="review-instructions" style="color: var(--neon-red)">เกิดข้อผิดพลาดในการโหลดตำราเฉลย</p>';
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
