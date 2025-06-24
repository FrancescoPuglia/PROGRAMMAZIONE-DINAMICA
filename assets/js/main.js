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
    
    console.log("🔄 Nascondo immediatamente loading screen...");
    
    // FIX DEFINITIVO: Nascondi immediatamente per evitare blocchi
    loader.style.display = "none";
    
    // Controlla se Skulpt si carica in background
    setTimeout(() => {
        if (window.Sk) {
            console.log("✅ Skulpt caricato con successo");
            showNotification("✅ Ambiente Python caricato", "success");
        } else {
            console.log("⚠️ Skulpt non caricato - funzionalità Python limitate");
            showNotification("⚠️ Ambiente Python non disponibile - alcune funzionalità saranno limitate", "warning");
        }
    }, 3000);
}

// Funzione per saltare forzatamente il loading
function forceSkipLoading() {
    console.log("🚀 Utente ha forzato il skip del loading");
    const loader = document.getElementById("loadingOverlay");
    if (loader) {
        loader.style.display = "none";
        showNotification("✅ Piattaforma caricata manualmente", "success");
    }
}

// Esponi la funzione globalmente
window.forceSkipLoading = forceSkipLoading;

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
        
    } else if (mode === 'professional') {
        // Modalità Professionale
        if (heroHeader) heroHeader.style.display = 'none';
        hideSpecialModes();
        showProfessionalMode();
    }
    
    console.log(`✅ Modalità ${mode} attivata`);
}

function hideSpecialModes() {
    // Nascondi tutti i contenuti capitoli
    document.querySelectorAll('.chapter-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Nascondi tutte le modalità
    document.querySelectorAll('.mode-content').forEach(mode => {
        mode.style.display = 'none';
    });
    
    // Rimuovi modalità dinamiche se esistenti
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

function showProfessionalMode() {
    console.log('🏆 Attivando modalità professionale...');
    
    // Mostra la modalità professionale
    const professionalMode = document.getElementById('professionalMode');
    if (professionalMode) {
        professionalMode.style.display = 'block';
        
        // Mostra il menu dei pattern se è stato nascosto
        const patternMenu = document.getElementById('professional-pattern-menu');
        if (patternMenu) {
            patternMenu.style.display = 'block';
        }
    }
    
    console.log('✅ Modalità professionale attiva');
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

// Carica esercizi professionali da JSON
async function loadExercises() {
    try {
        const response = await fetch('assets/data/professional_exercises.json');
        exercisesData = await response.json();
        console.log('✅ Esercizi professionali caricati:', exercisesData);
    } catch (error) {
        console.error('❌ Errore caricamento esercizi professionali:', error);
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

// ===== 12.1 PROFESSIONAL EXERCISES =====
let professionalExercises = {};
let currentProfessionalExercise = null;

// Carica esercizi professionali
async function loadProfessionalExercises() {
    try {
        const response = await fetch('assets/data/professional_exercises.json');
        professionalExercises = await response.json();
        console.log('✅ Esercizi professionali caricati:', Object.keys(professionalExercises).length, 'pattern');
        
        // Genera menu pattern professionali
        generateProfessionalPatternMenu();
    } catch (error) {
        console.error('❌ Errore caricamento esercizi professionali:', error);
        showNotification('⚠️ Errore nel caricamento degli esercizi professionali', 'error');
    }
}

// Genera menu pattern professionali
function generateProfessionalPatternMenu() {
    const menu = document.getElementById('professional-pattern-menu');
    if (!menu) return;
    
    let menuHTML = '<h3>🏆 Pattern Professionali</h3><div class="pattern-grid">';
    
    Object.entries(professionalExercises).forEach(([patternId, pattern], index) => {
        const difficultyColors = {1: '#10b981', 2: '#f59e0b', 3: '#ef4444'};
        const avgDifficulty = Math.round(
            pattern.exercises.reduce((sum, ex) => sum + ex.difficulty, 0) / pattern.exercises.length
        );
        
        menuHTML += `
            <div class="pattern-card" style="border-left: 4px solid ${difficultyColors[avgDifficulty]};">
                <h4>${pattern.title}</h4>
                <p class="pattern-description">${pattern.description}</p>
                <div class="pattern-stats">
                    <span class="exercise-count">${pattern.exercises.length} esercizi</span>
                    <span class="difficulty-badge" style="background: ${difficultyColors[avgDifficulty]};">
                        ${avgDifficulty === 1 ? 'Facile' : avgDifficulty === 2 ? 'Medio' : 'Difficile'}
                    </span>
                </div>
                <div class="pattern-actions">
                    <button onclick="openProfessionalPattern('${patternId}')" class="btn-exercises">🏋️ Esercizi</button>
                    ${addVisualizationButton(patternId)}
                </div>
            </div>
        `;
    });
    
    menuHTML += '</div>';
    menu.innerHTML = menuHTML;
}

// Apri pattern professionale
function openProfessionalPattern(patternId) {
    const pattern = professionalExercises[patternId];
    if (!pattern) return;
    
    const modal = document.getElementById('professional-exercise-modal');
    if (!modal) return;
    
    let modalHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeProfessionalModal()">&times;</span>
            <h2>${pattern.title}</h2>
            <p class="pattern-description">${pattern.description}</p>
            
            <div class="exercises-list">
    `;
    
    pattern.exercises.forEach((exercise, index) => {
        const difficultyColor = {1: '#10b981', 2: '#f59e0b', 3: '#ef4444'}[exercise.difficulty];
        modalHTML += `
            <div class="exercise-item" onclick="openProfessionalExercise('${patternId}', ${index})">
                <div class="exercise-header">
                    <h4>${exercise.title}</h4>
                    <span class="difficulty" style="background: ${difficultyColor};">
                        Livello ${exercise.difficulty}
                    </span>
                </div>
                <p>${exercise.statement}</p>
                <div class="exercise-meta">
                    <span>🧪 ${exercise.tests.length} test</span>
                    <span>⏱️ ${exercise.time_complexity}</span>
                    <span>💾 ${exercise.space_complexity}</span>
                </div>
            </div>
        `;
    });
    
    modalHTML += `
            </div>
        </div>
    `;
    
    modal.innerHTML = modalHTML;
    modal.style.display = 'block';
}

// Apri esercizio professionale
function openProfessionalExercise(patternId, exerciseIndex) {
    const exercise = professionalExercises[patternId].exercises[exerciseIndex];
    if (!exercise) return;
    
    currentProfessionalExercise = exercise;
    
    // Chiudi modal pattern
    closeProfessionalModal();
    
    // Apri modal esercizio
    const modal = document.getElementById('professional-code-modal');
    if (!modal) return;
    
    const modalHTML = `
        <div class="modal-content professional-modal">
            <span class="close" onclick="closeProfessionalCodeModal()">&times;</span>
            
            <div class="exercise-header">
                <h2>${exercise.title}</h2>
                <div class="exercise-badges">
                    <span class="difficulty-badge diff-${exercise.difficulty}">Livello ${exercise.difficulty}</span>
                    <span class="complexity-badge">⏱️ ${exercise.time_complexity}</span>
                    <span class="complexity-badge">💾 ${exercise.space_complexity}</span>
                </div>
            </div>
            
            <div class="exercise-content">
                <div class="problem-section">
                    <h3>📋 Problema</h3>
                    <p>${exercise.statement}</p>
                    
                    <h4>💡 Spiegazione</h4>
                    <p class="explanation">${exercise.explanation}</p>
                    
                    <h4>🔍 Hint</h4>
                    <p class="hint">${exercise.hint}</p>
                </div>
                
                <div class="code-section">
                    <div class="code-controls">
                        <button onclick="runProfessionalTests()" class="btn-primary">🧪 Esegui Test</button>
                        <button onclick="resetProfessionalCode()" class="btn-secondary">🔄 Reset</button>
                        <button onclick="showProfessionalSolution()" class="btn-warning">💡 Soluzione</button>
                        <button onclick="showOptimizedSolution()" class="btn-info">⚡ Soluzione Ottimizzata</button>
                    </div>
                    
                    <div class="code-editor">
                        <textarea id="professional-code" placeholder="Il tuo codice qui...">${exercise.template}</textarea>
                    </div>
                    
                    <div class="output-section">
                        <h4>📊 Risultati Test</h4>
                        <div id="professional-test-results">Clicca "Esegui Test" per vedere i risultati...</div>
                        <div id="professional-score" class="score-display"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalHTML;
    modal.style.display = 'block';
}

// Esegui test professionali
async function runProfessionalTests() {
    if (!currentProfessionalExercise) return;
    
    const code = document.getElementById('professional-code').value;
    const resultsDiv = document.getElementById('professional-test-results');
    const scoreDiv = document.getElementById('professional-score');
    
    if (!code.trim()) {
        resultsDiv.innerHTML = '⚠️ Inserisci del codice prima di eseguire i test!';
        return;
    }
    
    resultsDiv.innerHTML = '🔄 Esecuzione test in corso...';
    
    let passedTests = 0;
    let totalTests = currentProfessionalExercise.tests.length;
    let testResults = [];
    
    for (const [index, test] of currentProfessionalExercise.tests.entries()) {
        try {
            // Crea codice di test
            const testCode = `
${code}

# Test ${index + 1}
try:
    result = eval('${currentProfessionalExercise.id.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('')}(${test.input})')
    print(f"Test ${index + 1}: {result}")
except Exception as e:
    print(f"Test ${index + 1} ERRORE: {e}")
`;
            
            // Esegui con Skulpt
            const output = await runSkulptCode(testCode);
            const resultLine = output.split('\n').find(line => line.includes(`Test ${index + 1}:`));
            
            if (resultLine) {
                const actualResult = resultLine.split(': ')[1];
                const expected = test.expected;
                const passed = actualResult === expected;
                
                if (passed) passedTests++;
                
                testResults.push({
                    index: index + 1,
                    input: test.input,
                    expected: expected,
                    actual: actualResult,
                    passed: passed,
                    explanation: test.explanation
                });
            }
        } catch (error) {
            testResults.push({
                index: index + 1,
                input: test.input,
                expected: test.expected,
                actual: 'ERRORE',
                passed: false,
                explanation: test.explanation,
                error: error.toString()
            });
        }
    }
    
    // Calcola percentuale
    const percentage = Math.round((passedTests / totalTests) * 100);
    
    // Mostra risultati
    let resultsHTML = '<div class="test-results">';
    
    testResults.forEach(result => {
        const statusIcon = result.passed ? '✅' : '❌';
        const statusClass = result.passed ? 'test-passed' : 'test-failed';
        
        resultsHTML += `
            <div class="test-result ${statusClass}">
                <div class="test-header">
                    ${statusIcon} <strong>Test ${result.index}</strong>
                    <span class="test-explanation">${result.explanation}</span>
                </div>
                <div class="test-details">
                    <div><strong>Input:</strong> <code>${result.input}</code></div>
                    <div><strong>Atteso:</strong> <code>${result.expected}</code></div>
                    <div><strong>Risultato:</strong> <code>${result.actual}</code></div>
                    ${result.error ? `<div class="error"><strong>Errore:</strong> ${result.error}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    resultsHTML += '</div>';
    resultsDiv.innerHTML = resultsHTML;
    
    // Mostra score
    const scoreClass = percentage >= 80 ? 'score-excellent' : percentage >= 60 ? 'score-good' : percentage >= 40 ? 'score-fair' : 'score-poor';
    scoreDiv.innerHTML = `
        <div class="score-badge ${scoreClass}">
            <span class="score-percentage">${percentage}%</span>
            <span class="score-text">${passedTests}/${totalTests} test superati</span>
        </div>
    `;
    
    // Mostra notifica
    if (percentage === 100) {
        showNotification('🎉 Perfetto! Tutti i test superati!', 'success');
    } else if (percentage >= 80) {
        showNotification('👍 Ottimo lavoro! Quasi tutti i test superati!', 'success');
    } else if (percentage >= 60) {
        showNotification('📈 Buon lavoro! Continua così!', 'warning');
    } else {
        showNotification('💪 Continua a provare! Studia gli errori!', 'warning');
    }
}

// Helper per eseguire codice Skulpt
function runSkulptCode(code) {
    return new Promise((resolve, reject) => {
        let output = '';
        
        Sk.configure({ 
            output: (txt) => {
                output += txt;
            }
        });
        
        Sk.misceval.asyncToPromise(() =>
            Sk.importMainWithBody("<stdin>", false, code, true)
        ).then(() => {
            resolve(output);
        }).catch(err => {
            reject(err);
        });
    });
}

// Reset codice professionale
function resetProfessionalCode() {
    if (currentProfessionalExercise) {
        document.getElementById('professional-code').value = currentProfessionalExercise.template;
        document.getElementById('professional-test-results').innerHTML = 'Clicca "Esegui Test" per vedere i risultati...';
        document.getElementById('professional-score').innerHTML = '';
        showNotification('🔄 Codice resettato', 'info');
    }
}

// Mostra soluzione professionale
function showProfessionalSolution() {
    if (currentProfessionalExercise && currentProfessionalExercise.solution) {
        const confirmShow = confirm('Sei sicuro di voler vedere la soluzione? Prova ancora prima!');
        if (confirmShow) {
            document.getElementById('professional-code').value = currentProfessionalExercise.solution;
            showNotification('💡 Soluzione base mostrata', 'warning');
        }
    }
}

// Mostra soluzione ottimizzata
function showOptimizedSolution() {
    if (currentProfessionalExercise && currentProfessionalExercise.optimized_solution) {
        const confirmShow = confirm('Vuoi vedere la versione ottimizzata? È consigliabile prima risolvere il problema base!');
        if (confirmShow) {
            document.getElementById('professional-code').value = currentProfessionalExercise.optimized_solution;
            showNotification('⚡ Soluzione ottimizzata mostrata', 'info');
        }
    }
}

// Chiudi modal pattern
function closeProfessionalModal() {
    const modal = document.getElementById('professional-exercise-modal');
    if (modal) modal.style.display = 'none';
}

// Chiudi modal codice
function closeProfessionalCodeModal() {
    const modal = document.getElementById('professional-code-modal');
    if (modal) modal.style.display = 'none';
    currentProfessionalExercise = null;
}

// Funzioni globali
window.openProfessionalPattern = openProfessionalPattern;
window.openProfessionalExercise = openProfessionalExercise;
window.runProfessionalTests = runProfessionalTests;
window.resetProfessionalCode = resetProfessionalCode;
window.showProfessionalSolution = showProfessionalSolution;
window.showOptimizedSolution = showOptimizedSolution;
window.closeProfessionalModal = closeProfessionalModal;
window.closeProfessionalCodeModal = closeProfessionalCodeModal;

// ===== 12.2 ADVANCED PATTERN VISUALIZATIONS =====

// Mappa delle visualizzazioni per ogni pattern
const patternVisualizations = {
    "fibonacci_pattern": {
        title: "🔢 Pattern Fibonacci Visualizzato",
        explanation: `
            <h3>🧠 Logica Profonda del Pattern Fibonacci</h3>
            <p><strong>Principio Fondamentale:</strong> Ogni stato dipende esattamente dai due stati precedenti.</p>
            
            <div class="concept-box">
                <h4>💡 Perché Funziona?</h4>
                <p>Il pattern Fibonacci cattura l'essenza della <em>sovrapposizione di sottoproblemi</em>:</p>
                <ul>
                    <li><strong>Stato:</strong> F(n) = "risultato per il problema di dimensione n"</li>
                    <li><strong>Relazione:</strong> F(n) = F(n-1) + F(n-2)</li>
                    <li><strong>Ottimizzazione:</strong> Da O(2^n) a O(n) eliminando calcoli ripetuti</li>
                </ul>
            </div>
            
            <div class="insight-box">
                <h4>🎯 Quando Usarlo?</h4>
                <p>Riconosci questo pattern quando:</p>
                <ul>
                    <li>Il problema può essere scomposto in due sottoproblemi più piccoli</li>
                    <li>La soluzione combina linearmente i risultati precedenti</li>
                    <li>Esempi: scale, percorsi, sequenze di decisioni binarie</li>
                </ul>
            </div>
        `,
        interactive: true
    },
    
    "kadane_algorithm": {
        title: "🎯 Kadane's Algorithm Visualizzato",
        explanation: `
            <h3>🧠 La Genialità di Kadane</h3>
            <p><strong>Insight Chiave:</strong> In ogni posizione, decidi se "iniziare da capo" o "continuare la sequenza".</p>
            
            <div class="concept-box">
                <h4>💡 Perché È Così Elegante?</h4>
                <p>Kadane trasforma un problema O(n²) in O(n) con una semplice osservazione:</p>
                <ul>
                    <li><strong>Stato:</strong> max_ending_here = "migliore somma terminante qui"</li>
                    <li><strong>Decisione:</strong> Estendere subarray esistente VS iniziare nuovo</li>
                    <li><strong>Invariante:</strong> Mantieni sempre il massimo globale visto finora</li>
                </ul>
            </div>
            
            <div class="insight-box">
                <h4>🔍 Intuizione Profonda</h4>
                <p>L'algoritmo "dimentica" automaticamente i prefissi negativi:</p>
                <ul>
                    <li>Se max_ending_here < 0, ripartire è sempre migliore</li>
                    <li>Questo elimina la necessità di considerare tutti i possibili start/end</li>
                    <li>Risultato: una scansione lineare risolve completamente il problema</li>
                </ul>
            </div>
        `,
        interactive: true
    },

    "knapsack_pattern": {
        title: "🎒 0/1 Knapsack Visualizzato", 
        explanation: `
            <h3>🧠 La Strategia del Knapsack</h3>
            <p><strong>Decisione Binaria:</strong> Per ogni oggetto, hai esattamente due scelte: prenderlo o lasciarlo.</p>
            
            <div class="concept-box">
                <h4>💡 Perché Funziona la Tabella DP?</h4>
                <p>dp[i][w] codifica la risposta al sottoproblema perfettamente definito:</p>
                <ul>
                    <li><strong>Stato:</strong> "Migliore valore con primi i oggetti e capacità w"</li>
                    <li><strong>Transizione:</strong> max(prendi oggetto i, non prenderlo)</li>
                    <li><strong>Dimensionalità:</strong> 2D perché servono due parametri per definire il sottoproblema</li>
                </ul>
            </div>
            
            <div class="insight-box">
                <h4>🎯 Ottimizzazioni Avanzate</h4>
                <ul>
                    <li><strong>Spazio O(W):</strong> Serve solo la riga precedente</li>
                    <li><strong>Backward iteration:</strong> Evita sovrascritture premature</li>
                    <li><strong>Pruning:</strong> Se peso > capacità, skippa</li>
                </ul>
            </div>
        `,
        interactive: true
    },

    "unbounded_knapsack": {
        title: "🔄 Unbounded Knapsack Visualizzato",
        explanation: `
            <h3>🧠 Infinita Disponibilità</h3>
            <p><strong>Differenza Chiave:</strong> Puoi usare ogni oggetto infinite volte!</p>
            
            <div class="concept-box">
                <h4>💡 Come Cambia la Logica?</h4>
                <ul>
                    <li><strong>0/1 Knapsack:</strong> dp[i][w] = considera oggetti 1..i</li>
                    <li><strong>Unbounded:</strong> dp[w] = migliore valore per capacità w</li>
                    <li><strong>Transizione:</strong> Per ogni oggetto, prova ad aggiungerlo se possibile</li>
                </ul>
            </div>
            
            <div class="insight-box">
                <h4>🔍 Esempi di Applicazione</h4>
                <ul>
                    <li><strong>Coin Change:</strong> Infinite monete di ogni tipo</li>
                    <li><strong>Perfect Squares:</strong> Infinite copie di ogni quadrato perfetto</li>
                    <li><strong>Rod Cutting:</strong> Tagli infiniti della stessa lunghezza</li>
                </ul>
            </div>
        `,
        interactive: true
    },

    "lcs_pattern": {
        title: "📝 Longest Common Subsequence Visualizzato",
        explanation: `
            <h3>🧠 L'Arte dell'Allineamento</h3>
            <p><strong>Principio:</strong> Allinea due sequenze trovando la migliore corrispondenza di elementi.</p>
            
            <div class="concept-box">
                <h4>💡 Perché 2D?</h4>
                <p>Servono due "puntatori" per tracciare il progresso in entrambe le stringhe:</p>
                <ul>
                    <li><strong>dp[i][j]:</strong> LCS di str1[0..i-1] e str2[0..j-1]</li>
                    <li><strong>Match:</strong> Se caratteri uguali, estendi LCS precedente</li>
                    <li><strong>Mismatch:</strong> Prendi il meglio saltando un carattere</li>
                </ul>
            </div>
            
            <div class="insight-box">
                <h4>🎯 Varianti Potenti</h4>
                <ul>
                    <li><strong>Edit Distance:</strong> Conta operazioni anziché lunghezza</li>
                    <li><strong>Longest Palindromic Subsequence:</strong> LCS(s, reverse(s))</li>
                    <li><strong>Shortest Common Supersequence:</strong> Combina invece di trovare comune</li>
                </ul>
            </div>
        `,
        interactive: true
    }
};

// Visualizza pattern DP con spiegazione approfondita
function visualizePattern(patternId) {
    const pattern = patternVisualizations[patternId];
    if (!pattern) {
        console.warn('Pattern visualization not found:', patternId);
        return;
    }
    
    // Crea modal per visualizzazione
    const modal = document.createElement('div');
    modal.className = 'modal pattern-visualization-modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content pattern-viz-content">
            <span class="close" onclick="closePatternVisualization()">&times;</span>
            
            <div class="pattern-header">
                <h2>${pattern.title}</h2>
            </div>
            
            <div class="pattern-content">
                <div class="explanation-section">
                    ${pattern.explanation}
                </div>
                
                <div class="visualization-section">
                    <div id="pattern-visualization-${patternId}" class="pattern-viz-container">
                        <!-- La visualizzazione interattiva verrà inserita qui -->
                    </div>
                    
                    <div class="controls-section">
                        <button onclick="startPatternAnimation('${patternId}')" class="btn-primary">
                            ▶️ Avvia Animazione
                        </button>
                        <button onclick="stepPatternAnimation('${patternId}')" class="btn-secondary">
                            ⏭️ Step by Step
                        </button>
                        <button onclick="resetPatternAnimation('${patternId}')" class="btn-warning">
                            🔄 Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Inizializza la visualizzazione specifica
    setTimeout(() => initializePatternVisualization(patternId), 100);
}

// Inizializza visualizzazione per pattern specifico
function initializePatternVisualization(patternId) {
    const container = document.getElementById(`pattern-visualization-${patternId}`);
    if (!container) return;
    
    switch(patternId) {
        case 'fibonacci_pattern':
            createFibonacciVisualization(container);
            break;
        case 'kadane_algorithm':
            createKadaneVisualization(container);
            break;
        case 'knapsack_pattern':
            createKnapsackVisualization(container);
            break;
        case 'unbounded_knapsack':
            createUnboundedKnapsackVisualization(container);
            break;
        case 'lcs_pattern':
            createLCSVisualization(container);
            break;
        default:
            container.innerHTML = '<p>Visualizzazione in sviluppo per questo pattern...</p>';
    }
}

// Visualizzazione Knapsack 0/1
function createKnapsackVisualization(container) {
    container.innerHTML = `
        <div class="knapsack-viz">
            <h3>🎒 Knapsack 0/1 Interattivo</h3>
            <div class="input-section">
                <div class="input-group">
                    <label>Pesi: </label>
                    <input type="text" id="knapsack-weights" value="2,1,3,2" placeholder="es: 2,1,3,2">
                </div>
                <div class="input-group">
                    <label>Valori: </label>
                    <input type="text" id="knapsack-values" value="12,10,20,15" placeholder="es: 12,10,20,15">
                </div>
                <div class="input-group">
                    <label>Capacità: </label>
                    <input type="number" id="knapsack-capacity" value="5" min="1" max="20">
                </div>
                <button onclick="updateKnapsackVisualization()">Risolvi</button>
            </div>
            <div class="knapsack-display">
                <div class="items-section">
                    <h4>📦 Oggetti Disponibili</h4>
                    <div id="knapsack-items"></div>
                </div>
                <div class="dp-table-section">
                    <h4>📊 Tabella DP</h4>
                    <div id="knapsack-dp-table"></div>
                </div>
                <div class="solution-section">
                    <h4>🎯 Soluzione Ottimale</h4>
                    <div id="knapsack-solution"></div>
                </div>
            </div>
        </div>
    `;
    
    updateKnapsackVisualization();
}

function updateKnapsackVisualization() {
    const weights = document.getElementById('knapsack-weights').value.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const values = document.getElementById('knapsack-values').value.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const capacity = parseInt(document.getElementById('knapsack-capacity').value) || 5;
    
    if (weights.length !== values.length || weights.length === 0) {
        document.getElementById('knapsack-items').innerHTML = '<p class="error">⚠️ Pesi e valori devono avere la stessa lunghezza!</p>';
        return;
    }
    
    const n = weights.length;
    
    // Mostra oggetti
    const itemsDiv = document.getElementById('knapsack-items');
    itemsDiv.innerHTML = weights.map((w, i) => `
        <div class="knapsack-item">
            <div class="item-header">Oggetto ${i + 1}</div>
            <div class="item-details">
                <span class="weight">Peso: ${w}</span>
                <span class="value">Valore: ${values[i]}</span>
                <span class="ratio">Ratio: ${(values[i]/w).toFixed(2)}</span>
            </div>
        </div>
    `).join('');
    
    // Risolvi con DP
    const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= capacity; w++) {
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(
                    dp[i-1][w], // non prende oggetto
                    dp[i-1][w-weights[i-1]] + values[i-1] // prende oggetto
                );
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }
    
    // Visualizza tabella DP
    const tableDiv = document.getElementById('knapsack-dp-table');
    let tableHTML = '<table class="dp-table"><thead><tr><th>i\\w</th>';
    for (let w = 0; w <= capacity; w++) {
        tableHTML += `<th>${w}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';
    
    for (let i = 0; i <= n; i++) {
        tableHTML += `<tr><th>${i}</th>`;
        for (let w = 0; w <= capacity; w++) {
            const cellClass = i > 0 && weights[i-1] <= w ? 'decision-cell' : 'base-cell';
            tableHTML += `<td class="${cellClass}">${dp[i][w]}</td>`;
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    tableDiv.innerHTML = tableHTML;
    
    // Traccia soluzione
    const solution = [];
    let i = n, w = capacity;
    while (i > 0 && w > 0) {
        if (dp[i][w] !== dp[i-1][w]) {
            solution.push(i-1);
            w -= weights[i-1];
        }
        i--;
    }
    
    const solutionDiv = document.getElementById('knapsack-solution');
    const totalWeight = solution.reduce((sum, idx) => sum + weights[idx], 0);
    const totalValue = solution.reduce((sum, idx) => sum + values[idx], 0);
    
    solutionDiv.innerHTML = `
        <div class="solution-summary">
            <p><strong>Valore Massimo:</strong> ${totalValue}</p>
            <p><strong>Peso Totale:</strong> ${totalWeight}/${capacity}</p>
        </div>
        <div class="selected-items">
            <h5>Oggetti Selezionati:</h5>
            ${solution.length > 0 ? 
                solution.map(idx => `
                    <div class="selected-item">
                        Oggetto ${idx + 1}: Peso=${weights[idx]}, Valore=${values[idx]}
                    </div>
                `).join('') : 
                '<p>Nessun oggetto selezionato</p>'
            }
        </div>
    `;
}

// Visualizzazione Unbounded Knapsack
function createUnboundedKnapsackVisualization(container) {
    container.innerHTML = `
        <div class="unbounded-knapsack-viz">
            <h3>🔄 Unbounded Knapsack Interattivo</h3>
            <div class="input-section">
                <div class="input-group">
                    <label>Pesi: </label>
                    <input type="text" id="unbound-weights" value="1,3,4" placeholder="es: 1,3,4">
                </div>
                <div class="input-group">
                    <label>Valori: </label>
                    <input type="text" id="unbound-values" value="1,4,5" placeholder="es: 1,4,5">
                </div>
                <div class="input-group">
                    <label>Capacità: </label>
                    <input type="number" id="unbound-capacity" value="7" min="1" max="15">
                </div>
                <button onclick="updateUnboundedKnapsackVisualization()">Risolvi</button>
            </div>
            <div class="comparison-view">
                <div class="bounded-column">
                    <h4>🎒 0/1 Knapsack (limitato)</h4>
                    <div id="bounded-result"></div>
                </div>
                <div class="unbounded-column">
                    <h4>🔄 Unbounded (illimitato)</h4>
                    <div id="unbounded-result"></div>
                </div>
            </div>
            <div class="algorithm-steps">
                <h4>⚙️ Passi dell'Algoritmo</h4>
                <div id="algorithm-steps"></div>
            </div>
        </div>
    `;
    
    updateUnboundedKnapsackVisualization();
}

function updateUnboundedKnapsackVisualization() {
    const weights = document.getElementById('unbound-weights').value.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const values = document.getElementById('unbound-values').value.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const capacity = parseInt(document.getElementById('unbound-capacity').value) || 7;
    
    if (weights.length !== values.length || weights.length === 0) return;
    
    // Risolvi bounded
    const dpBounded = Array(capacity + 1).fill(0);
    for (let i = 0; i < weights.length; i++) {
        for (let w = capacity; w >= weights[i]; w--) {
            dpBounded[w] = Math.max(dpBounded[w], dpBounded[w - weights[i]] + values[i]);
        }
    }
    
    // Risolvi unbounded
    const dpUnbounded = Array(capacity + 1).fill(0);
    const steps = [];
    
    for (let w = 1; w <= capacity; w++) {
        let best = 0;
        let bestItem = -1;
        
        for (let i = 0; i < weights.length; i++) {
            if (weights[i] <= w) {
                const value = dpUnbounded[w - weights[i]] + values[i];
                if (value > best) {
                    best = value;
                    bestItem = i;
                }
            }
        }
        
        dpUnbounded[w] = best;
        if (bestItem !== -1) {
            steps.push({
                capacity: w,
                chosenItem: bestItem,
                value: best,
                calculation: `dp[${w}] = dp[${w - weights[bestItem]}] + ${values[bestItem]} = ${dpUnbounded[w - weights[bestItem]]} + ${values[bestItem]} = ${best}`
            });
        }
    }
    
    // Mostra risultati
    document.getElementById('bounded-result').innerHTML = `
        <div class="result-value">Valore Massimo: ${dpBounded[capacity]}</div>
        <div class="result-note">Ogni oggetto può essere usato al massimo una volta</div>
    `;
    
    document.getElementById('unbounded-result').innerHTML = `
        <div class="result-value">Valore Massimo: ${dpUnbounded[capacity]}</div>
        <div class="result-note">Ogni oggetto può essere usato infinite volte</div>
    `;
    
    // Mostra passi
    const stepsDiv = document.getElementById('algorithm-steps');
    stepsDiv.innerHTML = steps.slice(-Math.min(steps.length, 8)).map(step => `
        <div class="algorithm-step">
            <strong>Capacità ${step.capacity}:</strong> 
            Scegli oggetto ${step.chosenItem + 1} (peso=${weights[step.chosenItem]}, valore=${values[step.chosenItem]})
            <br>
            <code>${step.calculation}</code>
        </div>
    `).join('');
}

// Visualizzazione LCS
function createLCSVisualization(container) {
    container.innerHTML = `
        <div class="lcs-viz">
            <h3>📝 Longest Common Subsequence</h3>
            <div class="input-section">
                <div class="input-group">
                    <label>Stringa 1: </label>
                    <input type="text" id="lcs-string1" value="ABCDGH" placeholder="es: ABCDGH">
                </div>
                <div class="input-group">
                    <label>Stringa 2: </label>
                    <input type="text" id="lcs-string2" value="AEDFHR" placeholder="es: AEDFHR">
                </div>
                <button onclick="updateLCSVisualization()">Calcola LCS</button>
            </div>
            <div class="lcs-display">
                <div class="strings-display">
                    <div id="strings-comparison"></div>
                </div>
                <div class="lcs-table-container">
                    <h4>📊 Tabella DP</h4>
                    <div id="lcs-dp-table"></div>
                </div>
                <div class="lcs-result">
                    <h4>🎯 Risultato</h4>
                    <div id="lcs-output"></div>
                </div>
            </div>
        </div>
    `;
    
    updateLCSVisualization();
}

function updateLCSVisualization() {
    const str1 = document.getElementById('lcs-string1').value || 'ABCDGH';
    const str2 = document.getElementById('lcs-string2').value || 'AEDFHR';
    
    const m = str1.length;
    const n = str2.length;
    
    // Crea tabella DP
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i-1] === str2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    // Visualizza stringhe
    const stringsDiv = document.getElementById('strings-comparison');
    stringsDiv.innerHTML = `
        <div class="string-display">
            <span class="string-label">Stringa 1:</span>
            <span class="string-chars">${str1.split('').map((c, i) => `<span class="char" data-str="1" data-pos="${i}">${c}</span>`).join('')}</span>
        </div>
        <div class="string-display">
            <span class="string-label">Stringa 2:</span>
            <span class="string-chars">${str2.split('').map((c, i) => `<span class="char" data-str="2" data-pos="${i}">${c}</span>`).join('')}</span>
        </div>
    `;
    
    // Visualizza tabella DP
    const tableDiv = document.getElementById('lcs-dp-table');
    let tableHTML = '<table class="lcs-table"><thead><tr><th></th><th></th>';
    for (let j = 0; j < n; j++) {
        tableHTML += `<th>${str2[j]}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';
    
    for (let i = 0; i <= m; i++) {
        tableHTML += '<tr>';
        if (i === 0) {
            tableHTML += '<th></th>';
        } else {
            tableHTML += `<th>${str1[i-1]}</th>`;
        }
        
        for (let j = 0; j <= n; j++) {
            const cellClass = i > 0 && j > 0 && str1[i-1] === str2[j-1] ? 'match-cell' : 'normal-cell';
            tableHTML += `<td class="${cellClass}">${dp[i][j]}</td>`;
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    tableDiv.innerHTML = tableHTML;
    
    // Ricostruisci LCS
    let lcs = '';
    let i = m, j = n;
    const path = [];
    
    while (i > 0 && j > 0) {
        if (str1[i-1] === str2[j-1]) {
            lcs = str1[i-1] + lcs;
            path.push({i: i-1, j: j-1, char: str1[i-1]});
            i--; j--;
        } else if (dp[i-1][j] > dp[i][j-1]) {
            i--;
        } else {
            j--;
        }
    }
    
    // Mostra risultato
    const outputDiv = document.getElementById('lcs-output');
    outputDiv.innerHTML = `
        <div class="lcs-length">
            <strong>Lunghezza LCS:</strong> ${dp[m][n]}
        </div>
        <div class="lcs-sequence">
            <strong>Sequenza:</strong> "${lcs}"
        </div>
        <div class="lcs-path">
            <strong>Caratteri corrispondenti:</strong>
            ${path.reverse().map(p => `<span class="match-highlight">${p.char} (${p.i+1},${p.j+1})</span>`).join(' → ')}
        </div>
    `;
    }
}

// Visualizzazione Fibonacci interattiva
function createFibonacciVisualization(container) {
    container.innerHTML = `
        <div class="fibonacci-viz">
            <h3>🔢 Albero delle Chiamate Ricorsive</h3>
            <div class="input-section">
                <label>Calcola F(n): </label>
                <input type="number" id="fib-input" value="5" min="0" max="10">
                <button onclick="updateFibonacciVisualization()">Visualizza</button>
            </div>
            <div class="comparison-container">
                <div class="recursive-tree">
                    <h4>❌ Ricorsione Ingenua</h4>
                    <div id="fib-recursive-tree"></div>
                    <div class="complexity-info">
                        <p>⏱️ Complessità: <strong>O(2^n)</strong></p>
                        <p>📊 Chiamate: <span id="recursive-calls">0</span></p>
                    </div>
                </div>
                <div class="dp-table">
                    <h4>✅ Dynamic Programming</h4>
                    <div id="fib-dp-table"></div>
                    <div class="complexity-info">
                        <p>⏱️ Complessità: <strong>O(n)</strong></p>
                        <p>📊 Calcoli: <span id="dp-calculations">0</span></p>
                    </div>
                </div>
            </div>
            <div class="optimization-steps">
                <h4>🚀 Ottimizzazione Spazio</h4>
                <div id="space-optimization"></div>
            </div>
        </div>
    `;
    
    updateFibonacciVisualization();
}

// Aggiorna visualizzazione Fibonacci
function updateFibonacciVisualization() {
    const n = parseInt(document.getElementById('fib-input').value) || 5;
    
    // Visualizza albero ricorsivo
    const recursiveTree = document.getElementById('fib-recursive-tree');
    recursiveTree.innerHTML = generateFibonacciTree(n);
    
    // Conta chiamate ricorsive
    const recursiveCalls = Math.pow(2, n) - 1;
    document.getElementById('recursive-calls').textContent = recursiveCalls;
    
    // Visualizza tabella DP
    const dpTable = document.getElementById('fib-dp-table');
    dpTable.innerHTML = generateFibonacciDPTable(n);
    document.getElementById('dp-calculations').textContent = n + 1;
    
    // Ottimizzazione spazio
    const spaceOpt = document.getElementById('space-optimization');
    spaceOpt.innerHTML = generateFibonacciSpaceOptimization(n);
}

// Genera albero ricorsivo Fibonacci
function generateFibonacciTree(n, depth = 0) {
    if (n <= 1) {
        return `<div class="fib-node leaf" style="margin-left: ${depth * 20}px">F(${n}) = ${n}</div>`;
    }
    
    return `
        <div class="fib-node" style="margin-left: ${depth * 20}px">
            F(${n})
            ${generateFibonacciTree(n - 1, depth + 1)}
            ${generateFibonacciTree(n - 2, depth + 1)}
        </div>
    `;
}

// Genera tabella DP Fibonacci
function generateFibonacciDPTable(n) {
    let html = '<div class="dp-array">';
    const fib = [0, 1];
    
    for (let i = 2; i <= n; i++) {
        fib[i] = fib[i-1] + fib[i-2];
    }
    
    for (let i = 0; i <= n; i++) {
        html += `
            <div class="dp-cell" data-index="${i}">
                <div class="cell-index">i=${i}</div>
                <div class="cell-value">F(${i})=${fib[i] || 0}</div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Genera ottimizzazione spazio Fibonacci
function generateFibonacciSpaceOptimization(n) {
    let html = `
        <div class="space-opt-explanation">
            <p>💡 <strong>Insight:</strong> Servono solo gli ultimi 2 valori!</p>
        </div>
        <div class="space-opt-demo">
    `;
    
    let prev2 = 0, prev1 = 1;
    html += `<div class="space-step">
        <span class="var">prev2=${prev2}</span>
        <span class="var">prev1=${prev1}</span>
        <span class="result">F(0)=${prev2}, F(1)=${prev1}</span>
    </div>`;
    
    for (let i = 2; i <= Math.min(n, 6); i++) {
        const current = prev1 + prev2;
        html += `<div class="space-step">
            <span class="var">current=${prev2}+${prev1}=${current}</span>
            <span class="var">prev2=${prev1}</span>
            <span class="var">prev1=${current}</span>
            <span class="result">F(${i})=${current}</span>
        </div>`;
        prev2 = prev1;
        prev1 = current;
    }
    
    html += '</div>';
    return html;
}

// Visualizzazione Kadane
function createKadaneVisualization(container) {
    container.innerHTML = `
        <div class="kadane-viz">
            <h3>🎯 Kadane's Algorithm in Azione</h3>
            <div class="input-section">
                <label>Array: </label>
                <input type="text" id="kadane-input" value="-2,1,-3,4,-1,2,1,-5,4" placeholder="es: -2,1,-3,4,-1,2,1,-5,4">
                <button onclick="updateKadaneVisualization()">Visualizza</button>
            </div>
            <div class="kadane-animation">
                <div id="kadane-array-display"></div>
                <div id="kadane-variables"></div>
                <div id="kadane-decision-tree"></div>
            </div>
            <div class="kadane-insight">
                <h4>🧠 Insight Chiave</h4>
                <p>Ad ogni step, Kadane fa una <strong>decisione locale ottimale</strong>:</p>
                <ul>
                    <li><strong>Estendi:</strong> max_ending_here + nums[i]</li>
                    <li><strong>Riparti:</strong> nums[i]</li>
                </ul>
                <p>La scelta è sempre: <code>max(extend, restart)</code></p>
            </div>
        </div>
    `;
    
    updateKadaneVisualization();
}

// Aggiorna visualizzazione Kadane
function updateKadaneVisualization() {
    const input = document.getElementById('kadane-input').value;
    const arr = input.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    
    if (arr.length === 0) return;
    
    // Visualizza array
    const arrayDisplay = document.getElementById('kadane-array-display');
    arrayDisplay.innerHTML = '<div class="array-container">' + 
        arr.map((val, i) => `<div class="array-element" data-index="${i}">${val}</div>`).join('') +
        '</div>';
    
    // Simula algoritmo
    let maxSoFar = arr[0];
    let maxEndingHere = arr[0];
    let steps = [];
    
    for (let i = 1; i < arr.length; i++) {
        const extend = maxEndingHere + arr[i];
        const restart = arr[i];
        const decision = extend >= restart ? 'extend' : 'restart';
        
        maxEndingHere = Math.max(extend, restart);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
        
        steps.push({
            index: i,
            value: arr[i],
            extend: extend,
            restart: restart,
            decision: decision,
            maxEndingHere: maxEndingHere,
            maxSoFar: maxSoFar
        });
    }
    
    // Visualizza variabili
    const variablesDiv = document.getElementById('kadane-variables');
    variablesDiv.innerHTML = `
        <div class="variables-header">
            <h4>📊 Tracciamento Variabili</h4>
        </div>
        <div class="variables-table">
            <div class="var-row header">
                <div>i</div><div>nums[i]</div><div>extend</div><div>restart</div><div>decisione</div><div>max_ending_here</div><div>max_so_far</div>
            </div>
            <div class="var-row">
                <div>0</div><div>${arr[0]}</div><div>-</div><div>-</div><div>init</div><div>${arr[0]}</div><div>${arr[0]}</div>
            </div>
            ${steps.map(step => `
                <div class="var-row ${step.decision}">
                    <div>${step.index}</div>
                    <div>${step.value}</div>
                    <div>${step.extend}</div>
                    <div>${step.restart}</div>
                    <div class="decision-${step.decision}">${step.decision}</div>
                    <div>${step.maxEndingHere}</div>
                    <div class="max-highlight">${step.maxSoFar}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Chiudi modal visualizzazione pattern
function closePatternVisualization() {
    const modal = document.querySelector('.pattern-visualization-modal');
    if (modal) {
        modal.remove();
    }
}

// Funzioni per animazioni
function startPatternAnimation(patternId) {
    showNotification('🎬 Animazione avviata per ' + patternId, 'info');
}

function stepPatternAnimation(patternId) {
    showNotification('⏭️ Step successivo per ' + patternId, 'info');
}

function resetPatternAnimation(patternId) {
    // Reinizializza la visualizzazione
    initializePatternVisualization(patternId);
    showNotification('🔄 Visualizzazione resettata', 'info');
}

// Aggiungi pulsante visualizzazione ai pattern professionali
function addVisualizationButton(patternId) {
    if (patternVisualizations[patternId]) {
        return `<button onclick="visualizePattern('${patternId}')" class="btn-visualization">🎨 Visualizza Pattern</button>`;
    }
    return '';
}

// Esponi funzioni globalmente
window.visualizePattern = visualizePattern;
window.closePatternVisualization = closePatternVisualization;
window.startPatternAnimation = startPatternAnimation;
window.stepPatternAnimation = stepPatternAnimation;
window.resetPatternAnimation = resetPatternAnimation;
window.updateFibonacciVisualization = updateFibonacciVisualization;
window.updateKadaneVisualization = updateKadaneVisualization;
window.updateKnapsackVisualization = updateKnapsackVisualization;
window.updateUnboundedKnapsackVisualization = updateUnboundedKnapsackVisualization;
window.updateLCSVisualization = updateLCSVisualization;

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
    
    // Gestisci loading screen immediatamente
    handleLoadingScreen();
    
    // Applica tema salvato
    applyStoredTheme();
    
    // Inizializza modal keyboard
    initializeKeyboardModal();
    
    // Abilita lazy loading
    enableLazyLoading();
    
    // Aggiorna progresso iniziale
    updateProgress();
    
    // Carica esercizi
    loadExercises();
    
    // Carica esercizi professionali
    loadProfessionalExercises();
    
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