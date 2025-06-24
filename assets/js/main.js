// 🚀 Main.js - Funzionalità essenziali per la piattaforma DP
// Sostituisce Pyodide con Skulpt (più leggero) e implementa tutte le interazioni mancanti

// ===== 1. RUNNER PYTHON CON SKULPT =====
document.addEventListener("click", async (e) => {
    if (!e.target.matches(".run-btn")) return;
    
    const codeId = e.target.dataset.code;
    const outId = e.target.dataset.out;
    const codeElement = document.getElementById(codeId);
    const outElement = document.getElementById(outId);
    
    if (!codeElement || !outElement) {
        console.error("Elementi code/output non trovati:", codeId, outId);
        return;
    }
    
    const code = codeElement.textContent;
    outElement.textContent = "🔄 Esecuzione in corso...";
    
    Sk.configure({ 
        output: (txt) => {
            if (outElement.textContent === "🔄 Esecuzione in corso...") {
                outElement.textContent = "";
            }
            outElement.textContent += txt;
        }
    });
    
    try {
        await Sk.misceval.asyncToPromise(() =>
            Sk.importMainWithBody("<stdin>", false, code, true)
        );
    } catch (err) {
        outElement.textContent = "❌ Errore: " + err.toString();
    }
});

// ===== 2. QUIZ INTERATTIVI =====
document.addEventListener("click", (e) => {
    if (!e.target.matches(".check-btn")) return;
    
    const quiz = e.target.closest(".quiz");
    if (!quiz) return;
    
    const questionId = quiz.dataset.question;
    const correctAnswer = quiz.dataset.correct;
    const chosen = quiz.querySelector(`input[name="${questionId}"]:checked`);
    const result = quiz.querySelector(".result");
    
    if (!result) {
        // Crea elemento risultato se non esiste
        const newResult = document.createElement("span");
        newResult.className = "result";
        quiz.appendChild(newResult);
        result = newResult;
    }
    
    if (!chosen) {
        result.textContent = "⚠️ Seleziona una risposta!";
        result.style.color = "#f59e0b";
        return;
    }
    
    const isCorrect = chosen.value === correctAnswer;
    result.textContent = isCorrect ? "✅ Corretto!" : "❌ Errato, riprova!";
    result.style.color = isCorrect ? "#10b981" : "#ef4444";
    
    // Salva stato in localStorage
    localStorage.setItem(questionId, chosen.value);
    
    // Aggiorna barra progresso
    updateProgress();
});

// ===== 3. BARRA PROGRESSO CAPITOLI =====
function updateProgress() {
    const quizzes = [...document.querySelectorAll(".quiz")];
    const correctCount = quizzes.filter((q) => {
        const answer = localStorage.getItem(q.dataset.question);
        return answer === q.dataset.correct;
    }).length;
    
    const percentage = quizzes.length > 0 ? Math.round((correctCount / quizzes.length) * 100) : 0;
    
    // Aggiorna tutte le barre progresso nella pagina
    document.querySelectorAll(".progress-bar").forEach(bar => {
        bar.style.width = percentage + "%";
    });
    
    document.querySelectorAll(".progress-label").forEach(label => {
        label.textContent = percentage + "%";
    });
    
    // Mostra notifica per traguardi
    if (percentage === 100 && !localStorage.getItem("completed")) {
        localStorage.setItem("completed", "true");
        showNotification("🎉 Complimenti! Hai completato tutti i quiz!", "success");
    }
}

// ===== 4. FIX NAVIGAZIONE CAPITOLI =====
// Aggiungi smooth scroll e offset per header sticky
document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    if (!link) return;
    
    e.preventDefault();
    const targetId = link.getAttribute("href").slice(1);
    const target = document.getElementById(targetId);
    
    if (target) {
        const headerHeight = 80; // Altezza header sticky
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: "smooth"
        });
    }
});

// ===== 5. MODAL SCORCIATOIE DA TASTIERA =====
function initializeKeyboardModal() {
    // Crea il modal se non esiste
    if (!document.getElementById("keys-modal")) {
        const modalHTML = `
            <dialog id="keys-modal" class="keyboard-modal">
                <div class="modal-content">
                    <h2>⌨️ Scorciatoie da Tastiera</h2>
                    <ul>
                        <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> - Esegui codice</li>
                        <li><kbd>Ctrl</kbd> + <kbd>K</kbd> - Apri/chiudi quiz</li>
                        <li><kbd>Ctrl</kbd> + <kbd>D</kbd> - Toggle dark mode</li>
                        <li><kbd>Esc</kbd> - Chiudi modal</li>
                    </ul>
                    <button id="close-keys" class="btn btn-primary">Chiudi</button>
                </div>
            </dialog>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
    }
    
    const dialog = document.getElementById("keys-modal");
    const openBtn = document.querySelector("[onclick*='showShortcuts']");
    const closeBtn = document.getElementById("close-keys");
    
    if (openBtn) {
        openBtn.onclick = (e) => {
            e.preventDefault();
            dialog.showModal();
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => dialog.close();
    }
    
    // Implementa le scorciatoie
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "Enter") {
            // Esegui codice nell'editor attivo
            const activeRunBtn = document.querySelector(".run-btn:hover");
            if (activeRunBtn) activeRunBtn.click();
        }
        
        if (e.ctrlKey && e.key === "k") {
            e.preventDefault();
            // Toggle tutti i quiz
            document.querySelectorAll(".quiz").forEach(quiz => {
                quiz.style.display = quiz.style.display === "none" ? "block" : "none";
            });
        }
        
        if (e.ctrlKey && e.key === "d") {
            e.preventDefault();
            toggleTheme();
        }
    });
}

// ===== 6. DARK MODE FUNZIONANTE =====
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Aggiorna icona
    const themeIcon = document.getElementById("themeIcon");
    if (themeIcon) {
        themeIcon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
}

// Applica tema salvato al caricamento
function applyStoredTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    const themeIcon = document.getElementById("themeIcon");
    if (themeIcon) {
        themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
}

// ===== 7. LAZY LOADING IMMAGINI =====
function enableLazyLoading() {
    document.querySelectorAll("img:not([loading])").forEach(img => {
        img.loading = "lazy";
    });
}

// ===== 8. FIX SPLASH SCREEN CON TIMEOUT =====
function handleLoadingScreen() {
    const loader = document.getElementById("loadingOverlay");
    if (!loader) return;
    
    // Nascondi dopo 3 secondi se Skulpt è caricato
    setTimeout(() => {
        if (window.Sk) {
            loader.style.display = "none";
            console.log("✅ Skulpt caricato con successo");
        } else {
            // Mostra messaggio di errore
            const loadingContent = loader.querySelector(".loading-content");
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b;"></i>
                        <h3>⚠️ Impossibile inizializzare l'ambiente Python</h3>
                        <p>Ricarica la pagina o controlla la connessione</p>
                        <button onclick="location.reload()" class="btn btn-warning">
                            <i class="fas fa-redo"></i> Ricarica
                        </button>
                    </div>
                `;
            }
        }
    }, 3000);
}

// ===== UTILITY: NOTIFICHE =====
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animazione entrata
    setTimeout(() => notification.classList.add("show"), 10);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== 9. NAVIGAZIONE CAPITOLI E MODALITÀ =====
// Gestione completa navigazione capitoli
function loadChapter(chapterId) {
    console.log(`🔄 Caricamento capitolo: ${chapterId}`);
    
    // Nascondi tutti i capitoli
    document.querySelectorAll('.chapter-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Mostra il capitolo selezionato
    const targetChapter = document.getElementById(chapterId);
    if (targetChapter) {
        targetChapter.style.display = 'block';
        targetChapter.classList.add('active');
        console.log(`✅ Capitolo ${chapterId} visualizzato`);
    } else {
        console.error(`❌ Capitolo non trovato: ${chapterId}`);
    }
    
    // Aggiorna navigazione sidebar
    document.querySelectorAll('.chapter-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.chapter === chapterId) {
            link.classList.add('active');
        }
    });
    
    // Scroll in alto
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Salva capitolo corrente nel localStorage
    localStorage.setItem('currentChapter', chapterId);
}

// Gestione modalità Apprendi/Pratica/Ripasso
function setMode(mode, clickedElement = null) {
    console.log(`🔄 Cambio modalità: ${mode}`);
    
    // Aggiorna pulsanti modalità
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        const targetBtn = document.querySelector(`[onclick*="${mode}"]`);
        if (targetBtn) targetBtn.classList.add('active');
    }
    
    const contentArea = document.querySelector('.content-area');
    const heroHeader = document.getElementById('heroHeader');
    
    if (mode === 'learn') {
        // Modalità Apprendi - mostra contenuti normali
        if (heroHeader) heroHeader.style.display = 'block';
        
        // Nascondi modalità speciali
        hideSpecialModes();
        
        // Ripristina capitolo salvato o mostra prologo
        const savedChapter = localStorage.getItem('currentChapter') || 'prologo';
        loadChapter(savedChapter);
        
    } else if (mode === 'practice') {
        // Modalità Pratica
        if (heroHeader) heroHeader.style.display = 'none';
        hideSpecialModes();
        showPracticeMode();
        
    } else if (mode === 'review') {
        // Modalità Ripasso
        if (heroHeader) heroHeader.style.display = 'none';
        hideSpecialModes();
        showReviewMode();
    }
    
    console.log(`✅ Modalità ${mode} attivata`);
}

function hideSpecialModes() {
    // Nascondi tutti i contenuti capitoli
    document.querySelectorAll('.chapter-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Rimuovi modalità practice/review se esistenti
    const practiceMode = document.getElementById('practiceMode');
    const reviewMode = document.getElementById('reviewMode');
    if (practiceMode) practiceMode.remove();
    if (reviewMode) reviewMode.remove();
}

function showPracticeMode() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    const practiceHTML = `
        <div id="practiceMode" class="mode-content">
            <div style="padding: 40px; text-align: center;">
                <h2>🏋️ Modalità Pratica</h2>
                <p>Esercizi interattivi di Programmazione Dinamica</p>
                
                <div class="practice-mode-selector" style="margin-top: 30px;">
                    <h3>Scegli il tipo di pratica:</h3>
                    <div class="practice-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                        
                        <div class="practice-option" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease;" onclick="startPractice('mixed')">
                            <h4>🔀 Pratica Mista</h4>
                            <p>Problemi di diversi capitoli mescolati</p>
                        </div>
                        
                        <div class="practice-option" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease;" onclick="startPractice('focused')">
                            <h4>🎯 Pratica Focalizzata</h4>
                            <p>Concentrati su un argomento specifico</p>
                        </div>
                        
                        <div class="practice-option" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease;" onclick="startPractice('adaptive')">
                            <h4>🧠 Pratica Adattiva</h4>
                            <p>Difficoltà basata sulle tue performance</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = practiceHTML;
}

function showReviewMode() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    const reviewHTML = `
        <div id="reviewMode" class="mode-content">
            <div style="padding: 40px;">
                <h2>📊 Modalità Ripasso</h2>
                <p>Dashboard metacognitivo e spaced repetition</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px;">
                    
                    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3>📈 Progresso Generale</h3>
                        <div style="background: #f3f4f6; border-radius: 8px; height: 20px; margin: 10px 0;">
                            <div class="progress-bar" style="height: 100%; border-radius: 8px; background: #10b981;"></div>
                        </div>
                        <p>Quiz completati: <span class="progress-label">0%</span></p>
                    </div>
                    
                    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3>🎯 Aree di Miglioramento</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin: 10px 0;">• Fibonacci avanzato</li>
                            <li style="margin: 10px 0;">• Ottimizzazione spazio</li>
                            <li style="margin: 10px 0;">• Pattern recognition</li>
                        </ul>
                    </div>
                    
                    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3>⏰ Tempo di Studio</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #3b82f6;">25 min</p>
                        <p>Sessione corrente</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = reviewHTML;
}

// ===== 12. SISTEMA ESERCIZI COMPLETO =====

let exercisesData = null;
let currentExercise = null;
let exerciseProgress = JSON.parse(localStorage.getItem('exerciseProgress') || '{}');

// Carica esercizi da JSON
async function loadExercises() {
    try {
        const response = await fetch('assets/data/exercises.json');
        exercisesData = await response.json();
        console.log('✅ Esercizi caricati:', exercisesData);
    } catch (error) {
        console.error('❌ Errore caricamento esercizi:', error);
        // Fallback: carica esercizi hardcoded
        exercisesData = getHardcodedExercises();
    }
}

// Esercizi hardcoded come fallback
function getHardcodedExercises() {
    return {
        "cap1": {
            "title": "La Nascita dell'Idea",
            "exercises": [
                {
                    "id": "cap1_ex1",
                    "title": "Fibonacci Base",
                    "difficulty": 1,
                    "statement": "Implementa la funzione fibonacci(n) che ritorna l'n-esimo numero di Fibonacci.",
                    "template": "def fibonacci(n):\n    # Il tuo codice qui\n    pass",
                    "tests": [
                        {"input": "5", "expected": "5"},
                        {"input": "10", "expected": "55"}
                    ]
                }
            ]
        }
    };
}

function startPractice(type) {
    showNotification(`🎯 Avvio pratica ${type}...`, 'info');
    
    // Assicura che gli esercizi siano caricati
    if (!exercisesData) {
        loadExercises().then(() => showPracticeExercises(type));
    } else {
        showPracticeExercises(type);
    }
}

function showPracticeExercises(type) {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    // Raccogli esercizi in base al tipo
    let exercises = [];
    
    if (type === 'mixed') {
        // Tutti gli esercizi mescolati
        Object.values(exercisesData).forEach(chapter => {
            exercises = exercises.concat(chapter.exercises || []);
        });
        // Mescola casualmente
        exercises.sort(() => Math.random() - 0.5);
        
    } else if (type === 'focused') {
        // Solo capitolo corrente
        const activeChapter = document.querySelector('.chapter-content.active');
        const chapterId = activeChapter ? activeChapter.id : 'cap1';
        if (exercisesData[chapterId]) {
            exercises = exercisesData[chapterId].exercises || [];
        }
        
    } else if (type === 'adaptive') {
        // Esercizi basati su performance
        Object.values(exercisesData).forEach(chapter => {
            const chapterExercises = chapter.exercises || [];
            // Priorità a esercizi falliti o mai tentati
            const adaptive = chapterExercises.filter(ex => {
                const progress = exerciseProgress[ex.id];
                return !progress || progress.attempts > 2 || !progress.completed;
            });
            exercises = exercises.concat(adaptive);
        });
    }
    
    // Mostra interfaccia esercizi
    const exerciseHTML = `
        <div id="practiceMode" class="mode-content">
            <div class="exercise-container" style="padding: 40px;">
                <div class="exercise-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2>🏋️ Modalità Pratica - ${type === 'mixed' ? 'Mista' : type === 'focused' ? 'Focalizzata' : 'Adattiva'}</h2>
                    <button class="btn btn-secondary" onclick="setMode('learn')">
                        <i class="fas fa-arrow-left"></i> Torna ad Apprendi
                    </button>
                </div>
                
                <div class="exercise-list" style="display: grid; gap: 20px;">
                    ${exercises.map((ex, index) => `
                        <div class="exercise-card" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease;"
                             onclick="openExercise('${ex.id}')"
                             onmouseover="this.style.borderColor='#3b82f6'" 
                             onmouseout="this.style.borderColor='#e5e7eb'">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3>${ex.title}</h3>
                                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                                        <span class="difficulty-badge" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${ex.difficulty === 1 ? '#10b981' : ex.difficulty === 2 ? '#f59e0b' : '#ef4444'}; color: white;">
                                            ${ex.difficulty === 1 ? 'Facile' : ex.difficulty === 2 ? 'Medio' : 'Difficile'}
                                        </span>
                                        ${exerciseProgress[ex.id]?.completed ? 
                                            '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Completato</span>' : 
                                            '<span style="color: #6b7280;"><i class="fas fa-circle"></i> Da fare</span>'
                                        }
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: #6b7280;"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${exercises.length === 0 ? '<p style="text-align: center; color: #6b7280; margin-top: 50px;">Nessun esercizio disponibile per questa modalità</p>' : ''}
            </div>
        </div>
    `;
    
    contentArea.innerHTML = exerciseHTML;
}

// Apri esercizio specifico
function openExercise(exerciseId) {
    // Trova esercizio
    let exercise = null;
    Object.values(exercisesData).forEach(chapter => {
        const found = chapter.exercises?.find(ex => ex.id === exerciseId);
        if (found) exercise = found;
    });
    
    if (!exercise) {
        showNotification('❌ Esercizio non trovato', 'error');
        return;
    }
    
    currentExercise = exercise;
    
    const contentArea = document.querySelector('.content-area');
    const exerciseHTML = `
        <div id="exerciseMode" class="mode-content">
            <div class="exercise-workspace" style="padding: 40px;">
                <div class="exercise-header" style="margin-bottom: 30px;">
                    <button class="btn btn-secondary" onclick="showPracticeExercises('mixed')" style="margin-bottom: 20px;">
                        <i class="fas fa-arrow-left"></i> Torna alla lista
                    </button>
                    <h2>${exercise.title}</h2>
                    <span class="difficulty-badge" style="padding: 6px 12px; border-radius: 6px; background: ${exercise.difficulty === 1 ? '#10b981' : exercise.difficulty === 2 ? '#f59e0b' : '#ef4444'}; color: white;">
                        ${exercise.difficulty === 1 ? 'Facile' : exercise.difficulty === 2 ? 'Medio' : 'Difficile'}
                    </span>
                </div>
                
                <div class="exercise-statement" style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4>📋 Problema:</h4>
                    <p>${exercise.statement}</p>
                    ${exercise.hint ? `<p style="margin-top: 10px; color: #6b7280;"><i class="fas fa-lightbulb"></i> Suggerimento: ${exercise.hint}</p>` : ''}
                </div>
                
                <div class="exercise-editor" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4>💻 Il tuo codice:</h4>
                        <textarea id="exercise-code" class="code-editor" style="width: 100%; height: 300px; font-family: monospace; font-size: 14px; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">${exercise.template}</textarea>
                        <div style="margin-top: 10px; display: flex; gap: 10px;">
                            <button class="btn btn-primary run-btn" data-code="exercise-code" data-out="exercise-output">
                                <i class="fas fa-play"></i> Esegui Test
                            </button>
                            <button class="btn btn-warning" onclick="resetExercise()">
                                <i class="fas fa-undo"></i> Reset
                            </button>
                            <button class="btn btn-info" onclick="showSolution()">
                                <i class="fas fa-lightbulb"></i> Mostra Soluzione
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h4>📊 Output e Test:</h4>
                        <div id="exercise-output" class="output" style="height: 300px; overflow-y: auto;">
                            Clicca "Esegui Test" per vedere i risultati...
                        </div>
                    </div>
                </div>
                
                <div id="test-results" style="margin-top: 20px;"></div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = exerciseHTML;
    
    // Override del click handler per eseguire test specifici
    setupExerciseRunner();
}

// Setup runner per esercizi con test
function setupExerciseRunner() {
    const runBtn = document.querySelector('.exercise-workspace .run-btn');
    if (!runBtn) return;
    
    runBtn.onclick = async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('exercise-code').value;
        const output = document.getElementById('exercise-output');
        const testResults = document.getElementById('test-results');
        
        output.textContent = '🔄 Esecuzione test in corso...\n\n';
        testResults.innerHTML = '';
        
        let allTestsPassed = true;
        const results = [];
        
        // Esegui ogni test
        for (let i = 0; i < currentExercise.tests.length; i++) {
            const test = currentExercise.tests[i];
            const testCode = `
${code}

# Test ${i + 1}
try:
    result = ${currentExercise.id.includes('ex1') ? 'fibonacci' : currentExercise.id.includes('ex2') ? 'fibonacci_memo' : 'solve'}(${test.input})
    print(f"Test ${i + 1}: Input=${test.input} → Output={result}")
except Exception as e:
    print(f"Test ${i + 1}: ERRORE - {e}")
    result = None
`;
            
            let testOutput = '';
            Sk.configure({ 
                output: (txt) => {
                    testOutput += txt;
                    output.textContent += txt;
                }
            });
            
            try {
                await Sk.misceval.asyncToPromise(() =>
                    Sk.importMainWithBody("<stdin>", false, testCode, true)
                );
                
                // Controlla risultato
                const expectedStr = test.expected.toString();
                const passed = testOutput.includes(`Output=${expectedStr}`) || 
                               (test.check_type === 'performance' && testOutput.includes('Output='));
                
                results.push({
                    test: i + 1,
                    input: test.input,
                    expected: test.expected,
                    passed: passed,
                    output: testOutput
                });
                
                if (!passed) allTestsPassed = false;
                
            } catch (err) {
                output.textContent += `\n❌ Errore nel test ${i + 1}: ${err}\n`;
                results.push({
                    test: i + 1,
                    input: test.input,
                    expected: test.expected,
                    passed: false,
                    error: err.toString()
                });
                allTestsPassed = false;
            }
        }
        
        // Mostra risultati
        testResults.innerHTML = `
            <div style="border: 2px solid ${allTestsPassed ? '#10b981' : '#ef4444'}; border-radius: 8px; padding: 20px;">
                <h4>${allTestsPassed ? '✅ Tutti i test passati!' : '❌ Alcuni test falliti'}</h4>
                <div style="margin-top: 10px;">
                    ${results.map(r => `
                        <div style="margin: 5px 0; color: ${r.passed ? '#10b981' : '#ef4444'};">
                            ${r.passed ? '✅' : '❌'} Test ${r.test}: Input=${r.input} ${r.passed ? 'PASSATO' : 'FALLITO'}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Salva progresso
        if (!exerciseProgress[currentExercise.id]) {
            exerciseProgress[currentExercise.id] = {
                attempts: 0,
                completed: false,
                lastAttempt: null
            };
        }
        
        exerciseProgress[currentExercise.id].attempts++;
        exerciseProgress[currentExercise.id].lastAttempt = new Date().toISOString();
        
        if (allTestsPassed) {
            exerciseProgress[currentExercise.id].completed = true;
            showNotification('🎉 Esercizio completato con successo!', 'success');
            updateProgress(); // Aggiorna barra progresso
        }
        
        localStorage.setItem('exerciseProgress', JSON.stringify(exerciseProgress));
    };
}

// Reset esercizio
function resetExercise() {
    if (currentExercise) {
        document.getElementById('exercise-code').value = currentExercise.template;
        document.getElementById('exercise-output').textContent = 'Clicca "Esegui Test" per vedere i risultati...';
        document.getElementById('test-results').innerHTML = '';
        showNotification('🔄 Codice resettato', 'info');
    }
}

// Mostra soluzione
function showSolution() {
    if (currentExercise && currentExercise.solution) {
        const confirmShow = confirm('Sei sicuro di voler vedere la soluzione? Prova ancora prima di arrenderti!');
        if (confirmShow) {
            document.getElementById('exercise-code').value = currentExercise.solution;
            showNotification('💡 Soluzione mostrata - studia il codice!', 'warning');
        }
    }
}

window.openExercise = openExercise;
window.resetExercise = resetExercise;
window.showSolution = showSolution;

// ===== 13. FUNZIONI INTERATTIVE AGGIUNTIVE =====

// Check state design exercise
function checkStateDesign() {
    const input1 = document.getElementById('state-design-1')?.value || '';
    const input2 = document.getElementById('state-design-2')?.value || '';
    const feedback = document.getElementById('state-design-feedback');
    
    if (!feedback) return;
    
    feedback.style.display = 'block';
    
    let score = 0;
    let feedbackText = '<h4>Feedback:</h4>';
    
    // Check primo problema
    if (input1.toLowerCase().includes('indice') || input1.toLowerCase().includes('posizione')) {
        score++;
        feedbackText += '<p>✅ Problema 1: Corretto! Lo stato deve contenere l\'indice/posizione corrente.</p>';
    } else {
        feedbackText += '<p>❌ Problema 1: Pensa a cosa devi sapere per decidere se includere un elemento...</p>';
    }
    
    // Check secondo problema
    if (input2.toLowerCase().includes('riga') && input2.toLowerCase().includes('colonna')) {
        score++;
        feedbackText += '<p>✅ Problema 2: Perfetto! Servono sia riga che colonna per identificare la posizione.</p>';
    } else {
        feedbackText += '<p>❌ Problema 2: In una griglia 2D, quali coordinate servono?</p>';
    }
    
    feedback.innerHTML = feedbackText + `<p><strong>Punteggio: ${score}/2</strong></p>`;
    
    if (score === 2) {
        showNotification('🎉 Ottimo lavoro! Hai capito come progettare gli stati!', 'success');
    }
}

// Check SPAZIO method
function checkSPAZIO() {
    const feedback = document.getElementById('spazio-feedback');
    if (!feedback) return;
    
    const inputs = {
        s: document.getElementById('spazio-s')?.value || '',
        p: document.getElementById('spazio-p')?.value || '',
        a: document.getElementById('spazio-a')?.value || '',
        z: document.getElementById('spazio-z')?.value || '',
        i: document.getElementById('spazio-i')?.value || '',
        o: document.getElementById('spazio-o')?.value || ''
    };
    
    let score = 0;
    let feedbackText = '<h4>Verifica SPAZIO:</h4>';
    
    // Verifica ogni componente
    if (inputs.s.toLowerCase().includes('cella') || inputs.s.toLowerCase().includes('[i][j]')) {
        score++;
        feedbackText += '<p>✅ S (Stati): Corretto!</p>';
    }
    
    if (inputs.p.toLowerCase().includes('percorsi') || inputs.p.toLowerCase().includes('numero')) {
        score++;
        feedbackText += '<p>✅ P (Problemi): Giusto!</p>';
    }
    
    if (inputs.z.toLowerCase().includes('0,0') || inputs.z.toLowerCase().includes('1')) {
        score++;
        feedbackText += '<p>✅ Z (Zero/Base): Perfetto!</p>';
    }
    
    feedback.style.display = 'block';
    feedback.innerHTML = feedbackText + `<p><strong>Punteggio: ${score}/6</strong></p>`;
}

// Show DP ingredient explanation
function showDPIngredient(ingredient) {
    const display = document.getElementById('dpAnatomyDisplay');
    if (!display) return;
    
    const explanations = {
        'stati': {
            title: '🧪 Stati: Il DNA del Problema',
            content: `
                <h4>Cosa sono gli Stati?</h4>
                <p>Gli stati rappresentano le "configurazioni" uniche del problema. Come in un gioco di scacchi, ogni stato è una "fotografia" della situazione.</p>
                
                <div class="example-box" style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h5>Esempio Fibonacci:</h5>
                    <p>Stato = "quale numero di Fibonacci sto calcolando?"</p>
                    <p>F(5) è uno stato diverso da F(4)</p>
                </div>
                
                <div class="tip-box" style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                    <p><strong>💡 Trucco:</strong> Se puoi dire "sono qui", hai identificato uno stato!</p>
                </div>
            `
        },
        'transizioni': {
            title: '🔄 Transizioni: Le Strade tra Stati',
            content: `
                <h4>Le Regole del Gioco</h4>
                <p>Le transizioni definiscono come passi da uno stato all'altro. Sono le "mosse legali" del tuo problema.</p>
                
                <div class="example-box" style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h5>Esempio Griglia:</h5>
                    <p>Da (i,j) puoi andare a:</p>
                    <ul>
                        <li>→ (i, j+1) - muovi a destra</li>
                        <li>↓ (i+1, j) - muovi in basso</li>
                    </ul>
                </div>
            `
        },
        'base': {
            title: '⚓ Casi Base: Gli Ancoraggi',
            content: `
                <h4>Dove Tutto Inizia</h4>
                <p>I casi base sono gli stati "atomici" che conosci già. Senza di loro, la ricorsione girerebbe all'infinito!</p>
                
                <div class="example-box" style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h5>Esempi Classici:</h5>
                    <ul>
                        <li>Fibonacci: F(0)=0, F(1)=1</li>
                        <li>Griglia: Prima riga/colonna = 1</li>
                        <li>Zaino vuoto: valore = 0</li>
                    </ul>
                </div>
            `
        },
        'ordine': {
            title: '📊 Ordine: La Sequenza Magica',
            content: `
                <h4>L'Ordine di Risoluzione</h4>
                <p>Devi risolvere i sottoproblemi nell'ordine giusto: prima quelli piccoli, poi quelli grandi.</p>
                
                <div class="tip-box" style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                    <p><strong>🎯 Regola d'Oro:</strong> Se A dipende da B, calcola prima B!</p>
                </div>
            `
        }
    };
    
    const exp = explanations[ingredient];
    if (exp) {
        display.innerHTML = `
            <div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3>${exp.title}</h3>
                ${exp.content}
            </div>
        `;
    }
}

window.checkStateDesign = checkStateDesign;
window.checkSPAZIO = checkSPAZIO;
window.showDPIngredient = showDPIngredient;

// ===== 10. VISUALIZZAZIONI INTERATTIVE D3.JS =====

// Tracciatore di chiamate Fibonacci
function trackFibonacciCalls() {
    const canvas = document.getElementById('callChart');
    if (!canvas) {
        console.error('Canvas callChart non trovato');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Dati di esempio per fibonacci(6)
    const callData = {
        'F(0)': 8,
        'F(1)': 13,
        'F(2)': 8,
        'F(3)': 5,
        'F(4)': 3,
        'F(5)': 2,
        'F(6)': 1
    };
    
    // Crea grafico con Chart.js
    if (window.fibChart) {
        window.fibChart.destroy();
    }
    
    window.fibChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(callData),
            datasets: [{
                label: 'Numero di chiamate',
                data: Object.values(callData),
                backgroundColor: [
                    '#ef4444', '#f97316', '#eab308', '#84cc16', 
                    '#22c55e', '#06b6d4', '#3b82f6'
                ],
                borderWidth: 2,
                borderColor: '#1f2937'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '🔄 Chiamate ripetute in Fibonacci Ricorsivo',
                    font: { size: 16 }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Numero di chiamate'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Valore calcolato'
                    }
                }
            },
            animation: {
                onComplete: function() {
                    showNotification('📊 Nota come F(2) viene calcolato 8 volte!', 'warning');
                }
            }
        }
    });
}

// Visualizzazione Fibonacci con D3.js
function startFibVisualization() {
    const canvas = document.getElementById('fibCanvas');
    if (!canvas) {
        console.error('Canvas fibCanvas non trovato');
        return;
    }
    
    canvas.innerHTML = ''; // Clear
    
    const width = 600;
    const height = 400;
    
    const svg = d3.select('#fibCanvas')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Costruisci albero fibonacci
    const treeData = buildFibTree(5);
    
    // Layout albero
    const treeLayout = d3.tree()
        .size([width - 40, height - 40]);
    
    const root = d3.hierarchy(treeData);
    treeLayout(root);
    
    // Aggiungi gruppo per trasformazioni
    const g = svg.append('g')
        .attr('transform', 'translate(20, 20)');
    
    // Disegna collegamenti
    g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1);
    
    // Disegna nodi
    const nodes = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    
    // Cerchi per i nodi
    nodes.append('circle')
        .attr('r', 20)
        .attr('fill', d => d.data.duplicate ? '#ef4444' : '#3b82f6')
        .style('opacity', 0)
        .transition()
        .delay((d, i) => i * 100)
        .duration(500)
        .style('opacity', 1);
    
    // Testo nei nodi
    nodes.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('fill', 'white')
        .text(d => d.data.name)
        .style('opacity', 0)
        .transition()
        .delay((d, i) => i * 100)
        .duration(500)
        .style('opacity', 1);
    
    showNotification('🌳 Albero Fibonacci generato! I nodi rossi sono calcoli ripetuti', 'info');
}

// Costruisci struttura albero fibonacci
function buildFibTree(n, seen = new Set()) {
    if (n <= 1) {
        return { name: `F(${n})`, value: n, duplicate: false };
    }
    
    const key = `F(${n})`;
    const duplicate = seen.has(key);
    seen.add(key);
    
    return {
        name: key,
        duplicate: duplicate,
        children: [
            buildFibTree(n - 1, seen),
            buildFibTree(n - 2, seen)
        ]
    };
}

// Reset visualizzazione
function resetFibVisualization() {
    const canvas = document.getElementById('fibCanvas');
    if (canvas) {
        canvas.innerHTML = '';
    }
    showNotification('🔄 Visualizzazione resettata', 'info');
}

// Esponi funzioni globalmente
window.loadChapter = loadChapter;
window.setMode = setMode;
window.trackFibonacciCalls = trackFibonacciCalls;
window.startFibVisualization = startFibVisualization;
window.resetFibVisualization = resetFibVisualization;
window.startPractice = startPractice;

// ===== 11. STEP-BY-STEP REVEAL SYSTEM =====

// Sistema di sblocco progressivo per esempi guidati
const stepProgress = JSON.parse(localStorage.getItem('stepProgress') || '{}');

function revealStep(element) {
    // Trova l'ID dello step
    const stepContainer = element.closest('.example-step');
    if (!stepContainer) return;
    
    // Ottieni indice dello step
    const allSteps = Array.from(stepContainer.parentElement.querySelectorAll('.example-step'));
    const currentIndex = allSteps.indexOf(stepContainer);
    
    // Rivela lo step corrente
    stepContainer.classList.remove('step-hidden');
    
    // Nascondi il pulsante "Clicca per rivelare"
    const revealBtn = stepContainer.querySelector('.step-reveal');
    if (revealBtn) {
        revealBtn.style.display = 'none';
    }
    
    // Anima l'apparizione
    stepContainer.style.opacity = '0';
    stepContainer.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
        stepContainer.style.transition = 'all 0.5s ease';
        stepContainer.style.opacity = '1';
        stepContainer.style.transform = 'translateY(0)';
    });
    
    // Salva progresso
    const chapterId = document.querySelector('.chapter-content.active')?.id || 'unknown';
    if (!stepProgress[chapterId]) stepProgress[chapterId] = [];
    stepProgress[chapterId][currentIndex] = true;
    localStorage.setItem('stepProgress', JSON.stringify(stepProgress));
    
    // Sblocca lo step successivo dopo 1 secondo
    setTimeout(() => {
        if (currentIndex + 1 < allSteps.length) {
            const nextStep = allSteps[currentIndex + 1];
            nextStep.style.filter = 'none';
            nextStep.style.pointerEvents = 'auto';
            showNotification('✅ Step completato! Il prossimo è ora disponibile', 'success');
        }
    }, 1000);
}

// Applica stato salvato agli step
function applyStepProgress() {
    const activeChapter = document.querySelector('.chapter-content.active');
    if (!activeChapter) return;
    
    const chapterId = activeChapter.id;
    const savedProgress = stepProgress[chapterId] || [];
    
    const steps = activeChapter.querySelectorAll('.example-step');
    steps.forEach((step, index) => {
        if (savedProgress[index]) {
            step.classList.remove('step-hidden');
            const revealBtn = step.querySelector('.step-reveal');
            if (revealBtn) revealBtn.style.display = 'none';
        }
        
        // Applica blur agli step successivi non sbloccati
        if (index > 0 && !savedProgress[index - 1]) {
            step.style.filter = 'blur(3px)';
            step.style.pointerEvents = 'none';
        }
    });
}

window.revealStep = revealStep;

// ===== INIZIALIZZAZIONE AL CARICAMENTO =====
window.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inizializzazione piattaforma DP...");
    
    // Applica tema salvato
    applyStoredTheme();
    
    // Inizializza modal keyboard
    initializeKeyboardModal();
    
    // Abilita lazy loading
    enableLazyLoading();
    
    // Gestisci loading screen
    handleLoadingScreen();
    
    // Aggiorna progresso iniziale
    updateProgress();
    
    // Carica esercizi
    loadExercises();
    
    // Inizializza modalità learn di default
    setMode('learn');
    
    // Applica progresso step salvato
    applyStepProgress();
    
    // Aggiungi CSS per scroll margin
    if (!document.getElementById("scroll-fix-style")) {
        const style = document.createElement("style");
        style.id = "scroll-fix-style";
        style.textContent = `
            section[id], .chapter-content[id] { 
                scroll-margin-top: 90px; 
            }
            html { 
                scroll-behavior: smooth; 
            }
            
            /* Stili per notifiche */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                background: #3b82f6;
                color: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(400px);
                transition: transform 0.3s ease;
                z-index: 9999;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success { background: #10b981; }
            .notification-warning { background: #f59e0b; }
            .notification-error { background: #ef4444; }
            
            /* Stili per modal */
            .keyboard-modal {
                padding: 0;
                border: none;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .keyboard-modal .modal-content {
                padding: 30px;
                min-width: 400px;
            }
            .keyboard-modal kbd {
                background: #f3f4f6;
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid #d1d5db;
                font-family: monospace;
            }
            
            /* Output Python */
            .output {
                background: #1e293b;
                color: #f1f5f9;
                padding: 15px;
                border-radius: 8px;
                font-family: 'Consolas', 'Monaco', monospace;
                white-space: pre-wrap;
                margin-top: 10px;
                min-height: 50px;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log("✅ Piattaforma DP pronta!");
});

// Esponi toggleTheme globalmente
window.toggleTheme = toggleTheme;