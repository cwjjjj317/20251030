// 全局變數定義
let quizTable; 
let questions = []; 
let currentQuestionIndex = 0;
let score = 0;
let quizState = 'loading'; 
let selectedOption = null;
let feedbackAnimationTimer = 0;
let fireworks = []; 
let currentOptionOrder = []; 

// --- 1. 資料載入 ---
function preload() {
  console.log("嘗試載入 questions.csv..."); 
  try {
    quizTable = loadTable('questions.csv', 'csv', 'header'); 
  } catch (e) {
    console.error("preload 錯誤，請檢查檔案名稱和伺服器:", e);
  }
}

// --- 2. 初始設定 (響應式畫布 + 隨機性設置) ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  if (quizTable && quizTable.getRowCount() > 0) {
      console.log("CSV 載入成功！總題數:", quizTable.getRowCount());
      processTable();
      quizState = 'question';
  } else {
      console.error("CSV 載入失敗或為空。");
      quizState = 'error';
  }
  
  noCursor(); 
  rectMode(CENTER); 
  textAlign(CENTER, CENTER); 
  frameRate(60);
}

// 監聽視窗大小變化，自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- 3. 處理 CSV 資料 ---
function processTable() {
  for (let r = 0; r < quizTable.getRowCount(); r++) {
    questions.push({
      text: quizTable.getString(r, 'QuestionText'), 
      options: {
        A: quizTable.getString(r, 'OptionA'),
        B: quizTable.getString(r, 'OptionB'),
        C: quizTable.getString(r, 'OptionC'),
      },
      correct: quizTable.getString(r, 'CorrectAnswer'),
    });
  }
}


// --- 4. 主要繪圖迴圈 (新增 drawCuteDots) ---
function draw() {
  background(20); 

  // 【新增功能】: 繪製可愛點點背景
  drawCuteDots();
  
  drawCustomCursor();

  switch (quizState) {
    case 'error':
        drawErrorScreen();
        break;
    case 'question':
      if (currentOptionOrder.length === 0) {
          shuffleOptions();
      }
      drawQuestion();
      break;
    case 'feedback':
      drawFeedback();
      break;
    case 'result':
      drawResult();
      break;
  }
}

// 【新增功能】: 繪製可愛點點背景函式
function drawCuteDots() {
    noStroke();
    // 繪製多個半透明的圓點
    for (let i = 0; i < 50; i++) { // 繪製 50 個點
        // 根據 frameCount 讓點點有些微動畫效果
        let dotAlpha = map(sin(frameCount * 0.02 + i * 0.5), -1, 1, 50, 150); // 透明度變化
        let dotSize = map(cos(frameCount * 0.03 + i * 0.7), -1, 1, width * 0.005, width * 0.02); // 大小變化

        fill(255, 255, 255, dotAlpha); // 白色點點，半透明
        
        // 讓點點散佈在畫布上，位置略微晃動
        let x = (noise(i * 0.1, frameCount * 0.005) * width) + sin(frameCount * 0.1 + i) * 5;
        let y = (noise(i * 0.1 + 1000, frameCount * 0.005) * height) + cos(frameCount * 0.1 + i) * 5;
        
        ellipse(x, y, dotSize);
    }
}


// 隨機打亂選項順序
function shuffleOptions() {
    currentOptionOrder = ['A', 'B', 'C'];
    currentOptionOrder = shuffle(currentOptionOrder);
    console.log("當前選項順序:", currentOptionOrder);
}

// --- 5. 游標與選項特效 ---
function drawCustomCursor() {
  noStroke();
  fill(255, 200, 0, 150); 
  ellipse(mouseX, mouseY, width * 0.015, width * 0.015); 

  if (mouseIsPressed) {
    fill(255, 0, 0, 100);
    ellipse(mouseX, mouseY, width * 0.03, width * 0.03);
  }
  
  if (quizState === 'question' && checkHover()) {
      cursor(HAND); 
  } else {
      cursor(null); 
  }
}

// --- 6. 繪製題目 (使用比例排版) ---
function drawQuestion() {
  let q = questions[currentQuestionIndex];
  
  textSize(width * 0.04); 
  fill(255); 
  textAlign(CENTER, TOP); 
  text(q.text, width / 2, height * 0.1, width * 0.8, height * 0.2); 

  let optionKeys = currentOptionOrder; 
  for (let i = 0; i < optionKeys.length; i++) {
    let key = optionKeys[i];
    let originalKey = currentOptionOrder[i]; 
    let optionText = `${originalKey}. ${q.options[originalKey]}`;
    
    let x = width / 2;
    let y = height * 0.4 + i * (height * 0.12); 
    let w = width * 0.4; 
    let h = height * 0.08; 
    
    let isHovering = mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - h / 2 && mouseY < y + h / 2;

    if (isHovering) {
      fill(80, 80, 255, 200); 
    } else {
      fill(60); 
    }
    
    stroke(255);
    strokeWeight(2);
    rect(x, y, w, h, 10); 

    fill(255);
    noStroke();
    textSize(width * 0.025); 
    textAlign(CENTER, CENTER);
    text(optionText, x, y);
  }
}

// --- 7. 檢查滑鼠是否懸停在任何按鈕上 ---
function checkHover() {
    let optionKeys = currentOptionOrder; 
    let w = width * 0.4; 
    let h = height * 0.08;
    
    for (let i = 0; i < optionKeys.length; i++) {
        let x = width / 2;
        let y = height * 0.4 + i * (height * 0.12); 
        
        if (mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - h / 2 && mouseY < y + h / 2) {
            return true;
        }
    }
    return false;
}

// --- 8. 互動處理 ---
function mouseClicked() {
  if (quizState === 'question') {
    let q = questions[currentQuestionIndex];
    let optionKeys = currentOptionOrder; 
    let w = width * 0.4;
    let h = height * 0.08;
    
    for (let i = 0; i < optionKeys.length; i++) {
      let key = optionKeys[i]; 
      let x = width / 2;
      let y = height * 0.4 + i * (height * 0.12);

      if (mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - h / 2 && mouseY < y + h / 2) {
        selectedOption = key; 
        quizState = 'feedback';
        feedbackAnimationTimer = frameCount; 
        
        let isCorrect = (selectedOption === q.correct);

        if (isCorrect) {
            score++; 
            fireworks.push(new Firework(width / 2, height / 2, color(0, 255, 0))); 
        } else {
             fireworks.push(new Firework(width / 2, height / 2, color(255, 50, 50))); 
        }
        
        currentOptionOrder = [];
        break; 
      }
    }
  } else if (quizState === 'feedback') {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      quizState = 'question';
      selectedOption = null;
      fireworks = []; 
    } else {
      quizState = 'result';
      fireworks = []; 
    }
  }
}

// --- 9. 成績動畫畫面 ---
function drawFeedback() {
  let q = questions[currentQuestionIndex];
  let isCorrect = (selectedOption === q.correct);
  
  textAlign(CENTER, CENTER);

  for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].show();
      if (fireworks[i].isFinished()) {
          fireworks.splice(i, 1);
      }
  }

  if (isCorrect) {
    textSize(width * 0.06 + sin(frameCount * 0.15) * 10); 
    fill(50, 255, 50);
    text("✅ 太棒了！答對了！", width / 2, height / 2);
  } else {
    let offsetX = sin(frameCount * 0.2) * 5;
    let colorVal = map(sin(frameCount * 0.05), -1, 1, 150, 255); 

    textSize(width * 0.045); 
    fill(255, colorVal, colorVal);
    text("❌ 答錯了... 正確答案是 " + q.correct, width / 2 + offsetX, height / 2 - height * 0.08);

    textSize(width * 0.035);
    fill(100, 150, 255);
    text("再接再厲！💪", width / 2, height / 2 + height * 0.08);
  }

  if (frameCount - feedbackAnimationTimer > 60) {
    textSize(width * 0.02);
    fill(200);
    text("點擊繼續下一題...", width / 2, height - height * 0.08);
  }
}

// --- 10. 結果畫面 ---
function drawResult() {
  let totalQuestions = questions.length;
  let percentage = (score / totalQuestions) * 100;

  if (percentage === 100 && frameCount % 30 === 0) {
      fireworks.push(new Firework(random(width/4, width*3/4), height, color(random(255), random(255), random(255))));
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].show();
      if (fireworks[i].isFinished()) {
          fireworks.splice(i, 1);
      }
  }
  
  textAlign(CENTER, CENTER);
  
  if (percentage === 100) {
    textSize(width * 0.06);
    fill(255, 200, 0);
    text("💯 恭喜！你獲得了滿分！ 🏆", width / 2, height / 2 - height * 0.15);
  } else if (percentage >= 60) {
    textSize(width * 0.05);
    fill(0, 255, 0);
    text("🎉 表現優良！", width / 2, height / 2 - height * 0.15);
  } else {
    textSize(width * 0.045);
    fill(255, 100, 100);
    text("加油！再多練習會更好的！", width / 2, height / 2 - height * 0.15);
  }

  textSize(width * 0.04);
  fill(255);
  text(`您的總分: ${score} / ${totalQuestions}`, width / 2, height / 2);
  text(`正確率: ${percentage.toFixed(1)}%`, width / 2, height / 2 + height * 0.08);
}

function drawErrorScreen() {
    textSize(width * 0.03);
    fill(255, 50, 50);
    text("系統錯誤：無法讀取題庫！ (404 Not Found)", width/2, height/2 - height * 0.1);
    textSize(width * 0.02);
    fill(200);
    text("請將 questions.csv 檔案放在根目錄，並使用 Live Server 運行。", width/2, height/2 + height * 0.05);
}


// --- 11. 粒子系統類別 (Firework & Particle) ---

class Firework {
    constructor(x, y, c) {
        this.particles = [];
        this.hu = c; 
        this.pos = createVector(x, y);
        this.isExploded = false;
        this.explode();
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            this.particles.push(new Particle(this.pos.x, this.pos.y, this.hu));
        }
        this.isExploded = true;
    }

    update() {
        if (this.isExploded) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].applyForce(createVector(0, 0.05)); 
                this.particles[i].update();
                if (this.particles[i].isFinished()) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    show() {
        if (this.isExploded) {
            for (let i = 0; i < this.particles.length; i++) {
                this.particles[i].show();
            }
        }
    }

    isFinished() {
        return this.isExploded && this.particles.length === 0;
    }
}

class Particle {
    constructor(x, y, c) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.vel.mult(random(1, 10)); 
        this.acc = createVector(0, 0);
        this.lifespan = 255;
        this.hu = c;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.lifespan -= 5; 
    }

    show() {
        colorMode(RGB);
        noStroke();
        let particleColor = this.hu;
        particleColor.setAlpha(this.lifespan);
        fill(particleColor);
        ellipse(this.pos.x, this.pos.y, 4);
    }

    isFinished() {
        return this.lifespan < 0;
    }
}