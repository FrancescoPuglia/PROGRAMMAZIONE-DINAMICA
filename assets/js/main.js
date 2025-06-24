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
        
        // Mostra capitolo corrente
        const activeChapter = document.querySelector('.chapter-content.active') || document.getElementById('prologo');
        if (activeChapter) {
            activeChapter.style.display = 'block';
        }
        
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

function startPractice(type) {
    showNotification(`🎯 Avvio pratica ${type}...`, 'info');
    // Qui andrebbe implementata la logica specifica per ogni tipo
}

// Esponi funzioni globalmente
window.loadChapter = loadChapter;
window.setMode = setMode;

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
    
    // Inizializza modalità learn di default
    setMode('learn');
    
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