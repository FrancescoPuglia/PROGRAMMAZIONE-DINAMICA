// Global State Management
const appState = {
    currentChapter: 'prologo',
    currentMode: 'learn',
    completedChapters: new Set(),
    completedExercises: new Set(),
    spacedRepetitionData: {},
    annotations: {},
    mistakes: [],
    userLevel: 1,
    pythonReady: false,
    pyodide: null,
    theme: localStorage.getItem('theme') || 'light',
    focusMode: false,
    adaptiveDifficulty: 1,
    sessionStartTime: Date.now(),
    exerciseStats: {
        attempted: 0,
        solved: 0,
        totalTime: 0
    },
    // Pomodoro Timer State
    pomodoro: {
        isActive: false,
        isPaused: false,
        currentSession: 'work', // 'work', 'shortBreak', 'longBreak'
        timeRemaining: 25 * 60, // 25 minutes in seconds
        sessionsCompleted: 0,
        dailySessions: 0,
        totalFocusTime: 0,
        settings: {
            workDuration: 25 * 60,    // 25 minutes
            shortBreakDuration: 5 * 60,  // 5 minutes
            longBreakDuration: 15 * 60,  // 15 minutes
            sessionsUntilLongBreak: 4,
            autoStartBreaks: true,
            autoStartWork: false,
            soundEnabled: true
        },
        stats: {
            today: 0,
            thisWeek: 0,
            total: 0,
            streak: 0
        }
    }
};

// Initialize Pyodide with comprehensive package setup
async function initializePython() {
    try {
        console.log('🐍 Inizializzazione ambiente Python...');
        
        // Load Pyodide core
        appState.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });
        
        console.log('📦 Caricamento pacchetti Python...');
        
        // Load essential packages for DP exercises
        const packages = [
            'numpy',           // Numerical computations
            'matplotlib',      // Plotting and visualization
            'networkx',        // Graph algorithms
            'scipy'            // Scientific computing
        ];
        
        await appState.pyodide.loadPackage(packages);
        
        // Set up Python environment with DP utilities
        await appState.pyodide.runPython(`
            import sys
            import time
            import numpy as np
            import matplotlib.pyplot as plt
            from io import StringIO
            import functools
            
            # Utility functions for DP learning
            def time_function(func):
                """Decorator to measure function execution time"""
                @functools.wraps(func)
                def wrapper(*args, **kwargs):
                    start = time.time()
                    result = func(*args, **kwargs)
                    end = time.time()
                    print(f"⏱️ {func.__name__} eseguita in {end-start:.6f} secondi")
                    return result
                return wrapper
            
            def count_calls(func):
                """Decorator to count function calls"""
                @functools.wraps(func)
                def wrapper(*args, **kwargs):
                    if not hasattr(wrapper, 'call_count'):
                        wrapper.call_count = 0
                    wrapper.call_count += 1
                    result = func(*args, **kwargs)
                    print(f"📞 {func.__name__} chiamata {wrapper.call_count} volte")
                    return result
                return wrapper
            
            def visualize_call_tree(func_name, calls_data):
                """Visualize function call tree"""
                print(f"🌳 Albero delle chiamate per {func_name}:")
                for call, count in calls_data.items():
                    print(f"  {call}: {count} chiamate {'🔴' if count > 1 else '🟢'}")
            
            # Set up clean execution environment
            def reset_environment():
                """Reset Python environment for clean execution"""
                sys.stdout = StringIO()
                sys.stderr = StringIO()
                # Clear any user-defined variables except built-ins
                for name in list(globals().keys()):
                    if not name.startswith('_') and name not in ['sys', 'time', 'np', 'plt', 'StringIO', 'functools', 'time_function', 'count_calls', 'visualize_call_tree', 'reset_environment']:
                        try:
                            del globals()[name]
                        except:
                            pass
            
            print("🚀 Ambiente Python per Programmazione Dinamica pronto!")
            print("📚 Pacchetti disponibili: numpy, matplotlib, networkx, scipy")
            print("🛠️ Utility: @time_function, @count_calls, visualize_call_tree()")
        `);
        
        appState.pythonReady = true;
        hideLoading();
        
        console.log('✅ Python environment ready');
        showNotification('🐍 Ambiente Python caricato con successo!', 'success');
        
        // Run a quick test
        const testResult = await appState.pyodide.runPython(`
            # Test basic functionality
            def fibonacci_test(n):
                if n <= 1:
                    return n
                return fibonacci_test(n-1) + fibonacci_test(n-2)
            
            result = fibonacci_test(5)
            f"Test completato: F(5) = {result}"
        `);
        
        console.log('🧪 Test Python:', testResult);
        
    } catch (error) {
        console.error('❌ Failed to load Pyodide:', error);
        hideLoading();
        
        let errorMsg = 'Inizializzazione Python fallita. ';
        if (error.message.includes('fetch')) {
            errorMsg += 'Problema di connessione - verifica la connessione internet.';
        } else if (error.message.includes('package')) {
            errorMsg += 'Errore nel caricamento dei pacchetti.';
        } else {
            errorMsg += 'Errore sconosciuto.';
        }
        
        showNotification(errorMsg, 'error');
        
        // Fallback: basic Pyodide without packages
        try {
            console.log('🔄 Tentativo fallback senza pacchetti...');
            appState.pyodide = await loadPyodide();
            appState.pythonReady = true;
            showNotification('⚠️ Python caricato in modalità base (senza pacchetti extra)', 'warning');
        } catch (fallbackError) {
            console.error('❌ Fallback failed:', fallbackError);
            showNotification('❌ Impossibile caricare Python. Controlla la connessione.', 'error');
        }
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    // Load saved state
    loadState();
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', appState.theme);
    updateThemeIcon();
    
    // Initialize Python
    await initializePython();
    
    // Initialize visualizations
    initializeVisualizations();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initialize spaced repetition
    initializeSpacedRepetition();
    
    // Initialize Pomodoro timer
    initializePomodoroTimer();
    
    // Update UI
    updateProgressDisplay();
    
    // Show welcome message for new users
    if (appState.completedChapters.size === 0) {
        setTimeout(() => {
            showNotification('👋 Benvenuto! Inizia dal PROLOGO per scoprire la magia della DP!', 'info');
        }, 1000);
    }
});

// Chapter Management
function loadChapter(chapterId) {
    // Update state
    appState.currentChapter = chapterId;
    
    // Update UI
    document.querySelectorAll('.chapter-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(chapterId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.chapter-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.chapter === chapterId) {
            link.classList.add('active');
        }
    });
    
    // Mark as completed after reading time
    setTimeout(() => {
        if (!appState.completedChapters.has(chapterId)) {
            appState.completedChapters.add(chapterId);
            document.querySelector(`[data-chapter="${chapterId}"]`).classList.add('completed');
            updateProgressDisplay();
            saveState();
            
            // Add to spaced repetition
            addToSpacedRepetition(chapterId, 'chapter');
            
            // Achievement check
            checkAchievements();
        }
    }, 30000); // 30 seconds reading time
    
    // Save state
    saveState();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mode Management
function setMode(mode) {
    appState.currentMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide content
    document.querySelectorAll('.mode-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`${mode}Mode`).style.display = 'block';
    
    // Mode-specific initialization
    if (mode === 'practice') {
        initializePracticeMode();
    } else if (mode === 'review') {
        initializeReviewMode();
    }
    
    // Update hero visibility
    document.getElementById('heroHeader').style.display = mode === 'learn' ? 'block' : 'none';
}

// Python Code Execution with Educational Features
async function runPythonCode(editorId) {
    // Use the enhanced version for better functionality
    return await runPythonCodeEnhanced(editorId);
}

// Demo function to showcase Pyodide utilities
async function runEducationalDemo() {
    if (!appState.pythonReady) {
        showNotification('⏳ Ambiente Python non ancora pronto', 'warning');
        return;
    }
    
    try {
        const demoOutput = await appState.pyodide.runPython(`
            import sys
            from io import StringIO
            sys.stdout = StringIO()
            
            print("🎓 DEMO: Strumenti Educativi per la Programmazione Dinamica")
            print("=" * 60)
            
            # Esempio 1: Timing function decorator
            print("\\n📊 1. Misurazione Tempi di Esecuzione:")
            
            @time_function
            def fibonacci_ricorsivo(n):
                if n <= 1:
                    return n
                return fibonacci_ricorsivo(n-1) + fibonacci_ricorsivo(n-2)
            
            @time_function  
            def fibonacci_iterativo(n):
                if n <= 1:
                    return n
                a, b = 0, 1
                for _ in range(2, n + 1):
                    a, b = b, a + b
                return b
            
            print("Confronto F(25):")
            result1 = fibonacci_ricorsivo(25)
            result2 = fibonacci_iterativo(25)
            
            # Esempio 2: Counting calls
            print("\\n📞 2. Conteggio Chiamate:")
            
            @count_calls
            def fib_with_count(n):
                if n <= 1:
                    return n
                return fib_with_count(n-1) + fib_with_count(n-2)
            
            print("Calcolo F(8) con conteggio:")
            result = fib_with_count(8)
            print(f"Risultato: {result}")
            
            # Esempio 3: Available packages
            print("\\n📦 3. Pacchetti Disponibili:")
            import numpy as np
            arr = np.array([1, 1, 2, 3, 5, 8, 13])
            print(f"NumPy array: {arr}")
            print(f"Media: {np.mean(arr):.2f}")
            
            print("\\n✅ Demo completata! Tutti gli strumenti funzionano correttamente.")
            
            sys.stdout.getvalue()
        `);
        
        // Display demo output
        const demoDiv = document.createElement('div');
        demoDiv.className = 'python-editor-advanced';
        demoDiv.innerHTML = `
            <div class="editor-header">
                <div class="editor-title">
                    <i class="fas fa-graduation-cap"></i>
                    Demo Strumenti Educativi Pyodide
                </div>
            </div>
            <div class="test-results">
                <pre style="color: #e2e8f0;">${demoOutput}</pre>
            </div>
        `;
        
        document.querySelector('.content-area').appendChild(demoDiv);
        showNotification('🎓 Demo educativa completata!', 'success');
        
    } catch (error) {
        console.error('Demo failed:', error);
        showNotification('❌ Errore nella demo educativa', 'error');
    }
}

// Test Runner
async function runTests(editorId) {
    const code = document.getElementById(`${editorId}-code`).value;
    const outputElement = document.getElementById(`${editorId}-output`);
    
    // Define tests based on exercise
    const tests = getTestsForExercise(editorId);
    
    outputElement.innerHTML = '<div style="color: #3b82f6;">Running tests...</div>';
    
    let results = [];
    
    for (let test of tests) {
        try {
            // Run test
            const result = await runSingleTest(code, test);
            results.push(result);
        } catch (error) {
            results.push({
                name: test.name,
                passed: false,
                error: error.toString()
            });
        }
    }
    
    // Display results
    displayTestResults(outputElement, results);
    
    // Check if all passed
    const allPassed = results.every(r => r.passed);
    if (allPassed) {
        showNotification('🎉 Tutti i test sono passati!', 'success');
        appState.exerciseStats.solved++;
        
        // Adaptive difficulty
        adjustDifficulty(true);
    } else {
        adjustDifficulty(false);
    }
}

// Solution Viewer with Diff
function showSolution(editorId) {
    const userCode = document.getElementById(`${editorId}-code`).value;
    const solution = getSolutionForExercise(editorId);
    
    // Create diff view
    const diffHtml = createCodeDiff(userCode, solution);
    
    // Show in modal or inline
    const outputElement = document.getElementById(`${editorId}-output`);
    outputElement.innerHTML = `
        <div style="margin-bottom: 15px;">
            <strong style="color: #f59e0b;">📝 Confronto con la Soluzione:</strong>
        </div>
        <div class="diff-viewer">${diffHtml}</div>
        <div style="margin-top: 15px;">
            <button class="btn btn-info" onclick="copySolution('${editorId}')">
                <i class="fas fa-copy"></i> Copia Soluzione
            </button>
        </div>
    `;
}

// Visualization Functions
function startFibVisualization() {
    const canvas = document.getElementById('fibCanvas');
    canvas.innerHTML = ''; // Clear previous
    
    // Create D3 visualization
    const width = 600;
    const height = 400;
    
    const svg = d3.select('#fibCanvas')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Animate fibonacci tree
    animateFibonacciTree(svg, 5);
}

function animateFibonacciTree(svg, n) {
    // Tree data structure
    const treeData = buildFibTree(n);
    
    // Create tree layout
    const treeLayout = d3.tree()
        .size([580, 360]);
    
    const root = d3.hierarchy(treeData);
    treeLayout(root);
    
    // Draw links
    svg.selectAll('.link')
        .data(root.links())
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('x1', d => d.source.x + 10)
        .attr('y1', d => d.source.y + 20)
        .attr('x2', d => d.target.x + 10)
        .attr('y2', d => d.target.y + 20)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1);
    
    // Draw nodes
    const nodes = svg.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x + 10}, ${d.y + 20})`);
    
    nodes.append('circle')
        .attr('r', 25)
        .attr('fill', d => d.data.duplicate ? '#ef4444' : '#4f46e5')
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .style('opacity', 1);
    
    nodes.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', 'white')
        .style('font-weight', 'bold')
        .text(d => `F(${d.data.n})`)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .style('opacity', 1);
    
    // Highlight duplicates
    setTimeout(() => {
        nodes.filter(d => d.data.duplicate)
            .select('circle')
            .transition()
            .duration(500)
            .attr('r', 30)
            .transition()
            .duration(500)
            .attr('r', 25);
    }, 2000);
}

function buildFibTree(n, seen = new Set()) {
    const key = `F(${n})`;
    const duplicate = seen.has(key);
    seen.add(key);
    
    if (n <= 1) {
        return { n, duplicate, children: [] };
    }
    
    return {
        n,
        duplicate,
        children: [
            buildFibTree(n - 1, seen),
            buildFibTree(n - 2, seen)
        ]
    };
}

// Active Recall Verification
function checkRecall(topic) {
    const input = document.getElementById(`recall-${topic}`).value;
    const feedback = document.getElementById(`recall-${topic}-feedback`);
    
    if (input.trim().length < 50) {
        feedback.innerHTML = '<div style="color: #f59e0b;">📝 Prova a scrivere una spiegazione più dettagliata (almeno 50 caratteri)</div>';
        feedback.style.display = 'block';
        return;
    }
    
    // Simple keyword analysis
    const keywords = getKeywordsForTopic(topic);
    const matchedKeywords = keywords.filter(kw => 
        input.toLowerCase().includes(kw.toLowerCase())
    );
    
    const score = matchedKeywords.length / keywords.length;
    
    if (score >= 0.7) {
        feedback.innerHTML = `
            <div style="color: #10b981;">
                ✅ Ottima spiegazione! Hai menzionato concetti chiave come: 
                ${matchedKeywords.join(', ')}
            </div>
        `;
    } else if (score >= 0.4) {
        feedback.innerHTML = `
            <div style="color: #f59e0b;">
                📝 Buon inizio! Considera anche di menzionare: 
                ${keywords.filter(kw => !matchedKeywords.includes(kw)).slice(0, 2).join(', ')}
            </div>
        `;
    } else {
        feedback.innerHTML = `
            <div style="color: #ef4444;">
                ❌ Riprova includendo concetti come: 
                ${keywords.slice(0, 3).join(', ')}
            </div>
        `;
    }
    
    feedback.style.display = 'block';
    
    // Save explanation
    saveExplanation(topic, input);
}

function getKeywordsForTopic(topic) {
    const keywords = {
        'fib': ['ripetizione', 'sottoproblemi', 'calcolo', 'inefficiente', 'ridondante'],
        'memo': ['cache', 'memorizzare', 'riutilizzare', 'veloce', 'ottimizzazione']
    };
    return keywords[topic] || [];
}

// =============================================
// ANKI SM-2 SPACED REPETITION SYSTEM
// =============================================

// Initialize Spaced Repetition with SM-2 Algorithm
function initializeSpacedRepetition() {
    // Load saved data
    const saved = localStorage.getItem('spacedRepetitionData');
    if (saved) {
        appState.spacedRepetitionData = JSON.parse(saved);
    }
    
    // Convert old format to SM-2 format if needed
    migrateToSM2Format();
    
    // Update UI
    updateSpacedRepetitionDisplay();
    
    console.log('📚 Sistema Anki SM-2 inizializzato');
}

// Migrate existing data to SM-2 format
function migrateToSM2Format() {
    Object.keys(appState.spacedRepetitionData).forEach(itemId => {
        const item = appState.spacedRepetitionData[itemId];
        if (!item.hasOwnProperty('quality')) {
            // Convert to SM-2 format
            item.quality = 3; // Default "Good" rating
            item.easeFactor = item.easeFactor || 2.5;
            item.interval = item.interval || 1;
            item.repetitions = item.repetitions || 0;
            item.lastReview = item.lastReview || Date.now();
            item.nextReview = item.nextReview || Date.now() + 24 * 60 * 60 * 1000;
            item.reviewHistory = item.reviewHistory || [];
        }
    });
}

// Add item to spaced repetition using SM-2
function addToSpacedRepetition(itemId, type, content = '') {
    const now = Date.now();
    const item = {
        id: itemId,
        type: type,
        content: content,
        created: now,
        lastReview: null,
        nextReview: now, // Available immediately for first review
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        quality: null,
        reviewHistory: [],
        totalReviews: 0,
        averageQuality: 0,
        isLearning: true // True until graduated (interval >= 21 days)
    };
    
    appState.spacedRepetitionData[itemId] = item;
    saveSpacedRepetitionData();
    updateSpacedRepetitionDisplay();
    
    console.log(`📝 Aggiunto al sistema SM-2: ${itemId}`);
}

// SM-2 Algorithm Implementation
function calculateSM2Interval(item, quality) {
    // Quality scale: 0=Again, 1=Hard, 2=Hard, 3=Good, 4=Easy, 5=Easy
    // SM-2 expects 0-5 where 3+ is passing
    
    let newInterval = item.interval;
    let newEaseFactor = item.easeFactor;
    let newRepetitions = item.repetitions;
    
    if (quality >= 3) {
        // Successful recall
        if (newRepetitions === 0) {
            newInterval = 1; // 1 day
        } else if (newRepetitions === 1) {
            newInterval = 6; // 6 days
        } else {
            newInterval = Math.round(item.interval * newEaseFactor);
        }
        newRepetitions++;
    } else {
        // Failed recall - restart learning
        newRepetitions = 0;
        newInterval = 1;
    }
    
    // Update ease factor
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Ease factor bounds
    if (newEaseFactor < 1.3) {
        newEaseFactor = 1.3;
    }
    
    return {
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions,
        isGraduated: newInterval >= 21 // Graduated when interval is 3+ weeks
    };
}

// Review item with quality rating
function reviewSpacedRepetitionItem(itemId, quality) {
    const item = appState.spacedRepetitionData[itemId];
    if (!item) return;
    
    const now = Date.now();
    
    // Calculate new parameters using SM-2
    const sm2Result = calculateSM2Interval(item, quality);
    
    // Update item
    item.lastReview = now;
    item.interval = sm2Result.interval;
    item.easeFactor = sm2Result.easeFactor;
    item.repetitions = sm2Result.repetitions;
    item.quality = quality;
    item.nextReview = now + (sm2Result.interval * 24 * 60 * 60 * 1000);
    item.isLearning = !sm2Result.isGraduated;
    item.totalReviews++;
    
    // Add to history
    item.reviewHistory.push({
        date: now,
        quality: quality,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor
    });
    
    // Calculate average quality
    const totalQuality = item.reviewHistory.reduce((sum, review) => sum + review.quality, 0);
    item.averageQuality = totalQuality / item.reviewHistory.length;
    
    // Limit history to last 20 reviews
    if (item.reviewHistory.length > 20) {
        item.reviewHistory = item.reviewHistory.slice(-20);
    }
    
    saveSpacedRepetitionData();
    updateSpacedRepetitionDisplay();
    
    // Show feedback
    const qualityLabels = ['Completamente dimenticato', 'Difficile', 'Difficile', 'Buono', 'Facile', 'Perfetto'];
    const nextReviewDays = sm2Result.interval;
    
    showNotification(
        `📊 Valutazione: ${qualityLabels[quality]} | Prossimo ripasso: ${nextReviewDays} ${nextReviewDays === 1 ? 'giorno' : 'giorni'}`,
        quality >= 3 ? 'success' : 'warning'
    );
    
    return sm2Result;
}

// Get items due for review
function getItemsDueForReview() {
    const now = Date.now();
    return Object.values(appState.spacedRepetitionData)
        .filter(item => item.nextReview <= now)
        .sort((a, b) => a.nextReview - b.nextReview);
}

// Get learning statistics
function getSpacedRepetitionStats() {
    const items = Object.values(appState.spacedRepetitionData);
    const now = Date.now();
    
    return {
        total: items.length,
        due: items.filter(item => item.nextReview <= now).length,
        learning: items.filter(item => item.isLearning).length,
        graduated: items.filter(item => !item.isLearning).length,
        averageEase: items.length > 0 ? 
            items.reduce((sum, item) => sum + item.easeFactor, 0) / items.length : 2.5,
        totalReviews: items.reduce((sum, item) => sum + item.totalReviews, 0),
        averageQuality: items.length > 0 ?
            items.reduce((sum, item) => sum + (item.averageQuality || 0), 0) / items.length : 0
    };
}

// Create enhanced review interface
function createReviewInterface() {
    const dueItems = getItemsDueForReview();
    if (dueItems.length === 0) {
        return '<p style="color: #94a3b8; text-align: center;">🎉 Nessun ripasso dovuto! Ottimo lavoro!</p>';
    }
    
    const item = dueItems[0]; // Get first due item
    const stats = getSpacedRepetitionStats();
    
    return `
        <div class="review-interface">
            <div class="review-header">
                <h4>📚 Ripasso Programmato (${stats.due} dovuti)</h4>
                <div class="review-progress">
                    ${stats.due - dueItems.length + 1} / ${stats.due}
                </div>
            </div>
            
            <div class="review-card" id="reviewCard-${item.id}">
                <div class="review-item-info">
                    <div class="review-type">${getItemTypeIcon(item.type)} ${item.type}</div>
                    <div class="review-item-title">${item.id}</div>
                </div>
                
                <div class="review-content">
                    ${getReviewContent(item)}
                </div>
                
                <div class="review-actions">
                    <button class="btn review-btn again" onclick="reviewItem('${item.id}', 0)">
                        <i class="fas fa-times"></i>
                        <span>Di nuovo</span>
                        <small>&lt;1 giorno</small>
                    </button>
                    <button class="btn review-btn hard" onclick="reviewItem('${item.id}', 2)">
                        <i class="fas fa-minus"></i>
                        <span>Difficile</span>
                        <small>&lt;6 giorni</small>
                    </button>
                    <button class="btn review-btn good" onclick="reviewItem('${item.id}', 3)">
                        <i class="fas fa-check"></i>
                        <span>Buono</span>
                        <small>${calculatePreviewInterval(item, 3)} giorni</small>
                    </button>
                    <button class="btn review-btn easy" onclick="reviewItem('${item.id}', 4)">
                        <i class="fas fa-star"></i>
                        <span>Facile</span>
                        <small>${calculatePreviewInterval(item, 4)} giorni</small>
                    </button>
                </div>
                
                <div class="review-stats">
                    <small>
                        Ease: ${item.easeFactor.toFixed(1)} | 
                        Ripetizioni: ${item.repetitions} | 
                        Ultima qualità: ${item.quality ? getQualityLabel(item.quality) : 'N/A'}
                    </small>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for review interface
function getItemTypeIcon(type) {
    const icons = {
        'chapter': '📖',
        'exercise': '💻',
        'concept': '🧠',
        'formula': '🔢',
        'pattern': '🎯'
    };
    return icons[type] || '📝';
}

function getReviewContent(item) {
    // Generate review question based on item type
    switch (item.type) {
        case 'chapter':
            return `<p><strong>Domanda:</strong> Spiega i concetti principali del capitolo "${item.id}"</p>`;
        case 'exercise':
            return `<p><strong>Esercizio:</strong> Ricordi come risolvere l'esercizio "${item.id}"?</p>`;
        case 'concept':
            return `<p><strong>Concetto:</strong> Definisci e spiega: ${item.content || item.id}</p>`;
        default:
            return `<p><strong>Ripassa:</strong> ${item.content || item.id}</p>`;
    }
}

function calculatePreviewInterval(item, quality) {
    const result = calculateSM2Interval(item, quality);
    return result.interval;
}

function getQualityLabel(quality) {
    const labels = ['Di nuovo', 'Molto difficile', 'Difficile', 'Buono', 'Facile', 'Perfetto'];
    return labels[quality] || 'N/A';
}

// Review item function (called from UI)
function reviewItem(itemId, quality) {
    reviewSpacedRepetitionItem(itemId, quality);
    
    // Update the review interface
    setTimeout(() => {
        const reviewContainer = document.getElementById('reviewInterface');
        if (reviewContainer) {
            reviewContainer.innerHTML = createReviewInterface();
        }
        
        // Check if all reviews are done
        const remainingDue = getItemsDueForReview().length;
        if (remainingDue === 0) {
            showNotification('🎉 Tutti i ripassi completati! Ottimo lavoro!', 'success');
        }
    }, 500);
}

function updateSpacedRepetitionDisplay() {
    const stats = getSpacedRepetitionStats();
    const now = Date.now();
    
    // Update due count
    const dueElement = document.getElementById('dueToday');
    if (dueElement) {
        dueElement.textContent = stats.due;
    }
    
    // Update upcoming reviews
    const upcoming = Object.values(appState.spacedRepetitionData)
        .filter(item => item.nextReview > now)
        .sort((a, b) => a.nextReview - b.nextReview)
        .slice(0, 3);
    
    const upcomingElement = document.getElementById('upcomingReviews');
    if (upcomingElement) {
        const upcomingHtml = upcoming.map(item => `
            <div class="review-item" onclick="showItemDetails('${item.id}')">
                <div class="review-item-header">
                    ${getItemTypeIcon(item.type)} ${item.id}
                </div>
                <div class="review-item-meta">
                    <span class="review-time">${formatTimeUntil(item.nextReview)}</span>
                    <span class="review-ease">Ease: ${item.easeFactor.toFixed(1)}</span>
                </div>
            </div>
        `).join('');
        
        upcomingElement.innerHTML = upcomingHtml || 
            '<p style="color: #94a3b8;">Nessun ripasso programmato</p>';
    }
    
    // Update advanced stats
    updateAdvancedSpacedRepetitionStats(stats);
}

// Update advanced statistics display
function updateAdvancedSpacedRepetitionStats(stats) {
    // Create or update advanced stats section
    let advancedStatsElement = document.getElementById('advancedSRStats');
    if (!advancedStatsElement && document.querySelector('.spaced-repetition-card')) {
        const srCard = document.querySelector('.spaced-repetition-card');
        advancedStatsElement = document.createElement('div');
        advancedStatsElement.id = 'advancedSRStats';
        advancedStatsElement.className = 'advanced-sr-stats';
        srCard.appendChild(advancedStatsElement);
    }
    
    if (advancedStatsElement) {
        advancedStatsElement.innerHTML = `
            <div class="sr-stats-grid">
                <div class="sr-stat-item">
                    <span class="sr-stat-value">${stats.total}</span>
                    <span class="sr-stat-label">Totale</span>
                </div>
                <div class="sr-stat-item">
                    <span class="sr-stat-value">${stats.learning}</span>
                    <span class="sr-stat-label">In apprendimento</span>
                </div>
                <div class="sr-stat-item">
                    <span class="sr-stat-value">${stats.graduated}</span>
                    <span class="sr-stat-label">Diplomati</span>
                </div>
                <div class="sr-stat-item">
                    <span class="sr-stat-value">${stats.averageEase.toFixed(1)}</span>
                    <span class="sr-stat-label">Ease Media</span>
                </div>
                <div class="sr-stat-item">
                    <span class="sr-stat-value">${stats.totalReviews}</span>
                    <span class="sr-stat-label">Ripassi Totali</span>
                </div>
                <div class="sr-stat-item">
                    <span class="sr-stat-value">${(stats.averageQuality * 20).toFixed(0)}%</span>
                    <span class="sr-stat-label">Accuratezza</span>
                </div>
            </div>
        `;
    }
}

// Enhanced review mode initialization
function initializeReviewMode() {
    // Generate progress heatmap
    generateProgressHeatmap();
    
    // Generate strength chart  
    generateStrengthChart();
    
    // Generate learning trend
    generateLearningTrend();
    
    // Identify weaknesses
    identifyWeaknesses();
    
    // Initialize SM-2 review interface
    initializeReviewInterface();
}

// Initialize the review interface
function initializeReviewInterface() {
    const reviewContainer = document.getElementById('reviewInterface');
    if (!reviewContainer) {
        // Create review interface container
        const reviewModeContent = document.getElementById('reviewMode');
        if (reviewModeContent) {
            const reviewInterfaceHtml = `
                <div class="review-interface-container">
                    <h3>📚 Sistema di Ripasso Intelligente (Anki SM-2)</h3>
                    <div id="reviewInterface">${createReviewInterface()}</div>
                    <div class="review-analytics">
                        <h4>📊 Analisi delle Performance</h4>
                        <div id="reviewAnalytics">${createReviewAnalytics()}</div>
                    </div>
                </div>
            `;
            reviewModeContent.insertAdjacentHTML('beforeend', reviewInterfaceHtml);
        }
    } else {
        reviewContainer.innerHTML = createReviewInterface();
    }
}

// Create review analytics
function createReviewAnalytics() {
    const stats = getSpacedRepetitionStats();
    const items = Object.values(appState.spacedRepetitionData);
    
    // Calculate additional metrics
    const easeDifficulty = items.filter(item => item.easeFactor < 2.0).length;
    const easeGood = items.filter(item => item.easeFactor >= 2.0 && item.easeFactor < 2.8).length;
    const easeEasy = items.filter(item => item.easeFactor >= 2.8).length;
    
    const recentReviews = items
        .filter(item => item.lastReview && (Date.now() - item.lastReview) < 7 * 24 * 60 * 60 * 1000)
        .length;
    
    return `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h5>📈 Distribuzione Difficoltà</h5>
                <div class="difficulty-bars">
                    <div class="difficulty-bar">
                        <span class="diff-label">Difficile</span>
                        <div class="diff-progress">
                            <div class="diff-fill difficulty" style="width: ${stats.total ? (easeDifficulty / stats.total * 100) : 0}%"></div>
                        </div>
                        <span class="diff-count">${easeDifficulty}</span>
                    </div>
                    <div class="difficulty-bar">
                        <span class="diff-label">Normale</span>
                        <div class="diff-progress">
                            <div class="diff-fill normal" style="width: ${stats.total ? (easeGood / stats.total * 100) : 0}%"></div>
                        </div>
                        <span class="diff-count">${easeGood}</span>
                    </div>
                    <div class="difficulty-bar">
                        <span class="diff-label">Facile</span>
                        <div class="diff-progress">
                            <div class="diff-fill easy" style="width: ${stats.total ? (easeEasy / stats.total * 100) : 0}%"></div>
                        </div>
                        <span class="diff-count">${easeEasy}</span>
                    </div>
                </div>
            </div>
            
            <div class="analytics-card">
                <h5>⏱️ Attività Recente</h5>
                <div class="recent-activity">
                    <div class="activity-stat">
                        <span class="activity-number">${recentReviews}</span>
                        <span class="activity-label">Ripassi questa settimana</span>
                    </div>
                    <div class="activity-stat">
                        <span class="activity-number">${stats.due}</span>
                        <span class="activity-label">Dovuti oggi</span>
                    </div>
                    <div class="activity-stat">
                        <span class="activity-number">${(stats.averageQuality * 20).toFixed(0)}%</span>
                        <span class="activity-label">Accuratezza media</span>
                    </div>
                </div>
            </div>
            
            <div class="analytics-card">
                <h5>🎯 Prossimi Obiettivi</h5>
                <div class="goals-list">
                    ${stats.learning > 0 ? `<div class="goal-item">📚 ${stats.learning} concetti da diplomare</div>` : ''}
                    ${stats.due > 5 ? `<div class="goal-item">⚡ Riduci l'arretrato (${stats.due} dovuti)</div>` : ''}
                    ${stats.averageEase < 2.3 ? `<div class="goal-item">💪 Migliora la padronanza (ease: ${stats.averageEase.toFixed(1)})</div>` : ''}
                    ${stats.total < 10 ? `<div class="goal-item">➕ Aggiungi più contenuti (${stats.total} attuali)</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Show item details
function showItemDetails(itemId) {
    const item = appState.spacedRepetitionData[itemId];
    if (!item) return;
    
    const modal = document.createElement('div');
    modal.className = 'item-details-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${getItemTypeIcon(item.type)} ${item.id}</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="item-stats">
                    <div class="stat-row">
                        <span>Tipo:</span>
                        <span>${item.type}</span>
                    </div>
                    <div class="stat-row">
                        <span>Ease Factor:</span>
                        <span>${item.easeFactor.toFixed(2)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Intervallo:</span>
                        <span>${item.interval} giorni</span>
                    </div>
                    <div class="stat-row">
                        <span>Ripetizioni:</span>
                        <span>${item.repetitions}</span>
                    </div>
                    <div class="stat-row">
                        <span>Prossimo ripasso:</span>
                        <span>${new Date(item.nextReview).toLocaleDateString()}</span>
                    </div>
                    <div class="stat-row">
                        <span>Stato:</span>
                        <span>${item.isLearning ? '📚 In apprendimento' : '🎓 Diplomato'}</span>
                    </div>
                </div>
                
                ${item.reviewHistory.length > 0 ? `
                <div class="review-history">
                    <h4>Cronologia Ripassi</h4>
                    <div class="history-timeline">
                        ${item.reviewHistory.slice(-5).map(review => `
                            <div class="history-item">
                                <span class="history-date">${new Date(review.date).toLocaleDateString()}</span>
                                <span class="history-quality">${getQualityLabel(review.quality)}</span>
                                <span class="history-interval">${review.interval}d</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function formatTimeUntil(timestamp) {
    const diff = timestamp - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `tra ${days} giorni`;
    if (hours > 0) return `tra ${hours} ore`;
    return 'presto';
}

// Practice Mode
function startPractice(type) {
    const content = document.getElementById('practiceContent');
    content.style.display = 'block';
    
    if (type === 'mixed') {
        loadMixedPractice();
    } else if (type === 'focused') {
        loadFocusedPractice();
    } else if (type === 'adaptive') {
        loadAdaptivePractice();
    }
}

function loadMixedPractice() {
    // Get problems from all chapters
    const problems = getAllProblems();
    const shuffled = shuffleArray(problems);
    
    displayPracticeProblems(shuffled.slice(0, 5));
}

function loadAdaptivePractice() {
    // Get problems based on user level
    const problems = getProblemsForLevel(appState.adaptiveDifficulty);
    displayPracticeProblems(problems);
}

// Metacognitive Dashboard
function initializeReviewMode() {
    // Generate heatmap
    generateProgressHeatmap();
    
    // Generate strength chart
    generateStrengthChart();
    
    // Generate learning trend
    generateLearningTrend();
    
    // Identify weaknesses
    identifyWeaknesses();
}

function generateProgressHeatmap() {
    const heatmap = document.getElementById('progressHeatmap');
    const data = generateHeatmapData();
    
    heatmap.innerHTML = data.map((value, index) => {
        const intensity = value / 10;
        const color = `rgba(79, 70, 229, ${intensity})`;
        const date = new Date();
        date.setDate(date.getDate() - (29 - index));
        
        return `<div class="heatmap-cell" 
            style="background: ${color}" 
            title="${date.toLocaleDateString()}: ${value} attività"
            onclick="showDayDetails('${date.toISOString()}')"></div>`;
    }).join('');
}

function generateHeatmapData() {
    // Simulate activity data
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 10));
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
            type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', appState.theme);
    updateThemeIcon();
    localStorage.setItem('theme', appState.theme);
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    icon.className = appState.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

function toggleFocusMode() {
    appState.focusMode = !appState.focusMode;
    document.body.classList.toggle('focus-mode');
    
    const icon = document.getElementById('focusIcon');
    icon.className = appState.focusMode ? 'fas fa-expand' : 'fas fa-compress';
}

function showShortcuts() {
    document.getElementById('shortcutsModal').classList.add('show');
}

function closeShortcuts() {
    document.getElementById('shortcutsModal').classList.remove('show');
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Navigation
        if (e.key === 'ArrowLeft') {
            navigateChapter(-1);
        } else if (e.key === 'ArrowRight') {
            navigateChapter(1);
        }
        
        // Run code
        else if (e.ctrlKey && e.key === 'Enter') {
            const activeEditor = document.querySelector('.editor-textarea:focus');
            if (activeEditor) {
                const editorId = activeEditor.id.replace('-code', '');
                runPythonCode(editorId);
            }
        }
        
        // Focus mode
        else if (e.key === 'f' && !e.ctrlKey && !e.target.matches('input, textarea')) {
            toggleFocusMode();
        }
        
        // Theme
        else if (e.key === 't' && !e.ctrlKey && !e.target.matches('input, textarea')) {
            toggleTheme();
        }
        
        // Help
        else if (e.key === '?' && !e.target.matches('input, textarea')) {
            showShortcuts();
        }
    });
}

function navigateChapter(direction) {
    const chapters = ['prologo', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'epilogo'];
    const currentIndex = chapters.indexOf(appState.currentChapter);
    const newIndex = Math.max(0, Math.min(chapters.length - 1, currentIndex + direction));
    
    if (newIndex !== currentIndex) {
        loadChapter(chapters[newIndex]);
    }
}

// State Management
function saveState() {
    const state = {
        completedChapters: Array.from(appState.completedChapters),
        completedExercises: Array.from(appState.completedExercises),
        annotations: appState.annotations,
        mistakes: appState.mistakes,
        userLevel: appState.userLevel,
        exerciseStats: appState.exerciseStats,
        lastAccess: Date.now()
    };
    
    localStorage.setItem('dpLearningState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('dpLearningState');
    if (saved) {
        const state = JSON.parse(saved);
        appState.completedChapters = new Set(state.completedChapters || []);
        appState.completedExercises = new Set(state.completedExercises || []);
        appState.annotations = state.annotations || {};
        appState.mistakes = state.mistakes || [];
        appState.userLevel = state.userLevel || 1;
        appState.exerciseStats = state.exerciseStats || appState.exerciseStats;
    }
}

function saveSpacedRepetitionData() {
    localStorage.setItem('spacedRepetitionData', 
        JSON.stringify(appState.spacedRepetitionData));
}

function updateProgressDisplay() {
    const chapters = 8;
    const exercises = 20; // Total exercises
    
    const chaptersCompleted = appState.completedChapters.size;
    const exercisesCompleted = appState.completedExercises.size;
    
    // Update stats
    document.getElementById('problemsSolved').textContent = exercisesCompleted;
    document.getElementById('successRate').textContent = 
        appState.exerciseStats.attempted > 0 
            ? Math.round((appState.exerciseStats.solved / appState.exerciseStats.attempted) * 100) + '%'
            : '0%';
    
    // Update level
    const level = Math.floor((chaptersCompleted + exercisesCompleted) / 5) + 1;
    appState.userLevel = level;
    updateLevelDisplay();
}

function updateLevelDisplay() {
    const levels = ['Principiante', 'Intermedio', 'Avanzato', 'Esperto', 'Master'];
    const levelIndex = Math.min(appState.userLevel - 1, levels.length - 1);
    
    document.getElementById('currentLevel').style.width = `${(levelIndex + 1) * 20}%`;
    document.getElementById('levelLabel').textContent = levels[levelIndex];
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Helper functions for exercises and solutions
function getTestsForExercise(exerciseId) {
    const tests = {
        'fib-comparison': [
            { name: 'Test base F(0)', input: 0, expected: 0 },
            { name: 'Test base F(1)', input: 1, expected: 1 },
            { name: 'Test F(10)', input: 10, expected: 55 },
            { name: 'Test F(20)', input: 20, expected: 6765 }
        ],
        'memory-strategies': [
            { name: 'Test efficienza memoria', type: 'memory' },
            { name: 'Test correttezza risultati', type: 'correctness' }
        ]
    };
    
    return tests[exerciseId] || [];
}

function getSolutionForExercise(exerciseId) {
    const solutions = {
        'fib-comparison': `def fibonacci_ricorsivo(n):
    if n <= 1:
        return n
    return fibonacci_ricorsivo(n-1) + fibonacci_ricorsivo(n-2)

def fibonacci_memo(n, memo=None):
    if memo is None:
        memo = {}
    
    if n in memo:
        return memo[n]
    
    if n <= 1:
        result = n
    else:
        result = fibonacci_memo(n-1, memo) + fibonacci_memo(n-2, memo)
    
    memo[n] = result
    return result`,
        
        'memory-strategies': `def fib_con_lista(n):
    if n <= 1:
        return n
    
    dp = [0] * (n + 1)
    dp[0] = 0
    dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    return dp[n]

def fib_con_dizionario(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_con_dizionario(n-1, memo) + fib_con_dizionario(n-2, memo)
    return memo[n]

def fib_ottimizzata(n):
    if n <= 1:
        return n
    
    prev2, prev1 = 0, 1
    for i in range(2, n + 1):
        current = prev1 + prev2
        prev2, prev1 = prev1, current
    
    return prev1`
    };
    
    return solutions[exerciseId] || '';
}

function createCodeDiff(userCode, solution) {
    const userLines = userCode.split('\n');
    const solutionLines = solution.split('\n');
    
    // Simple diff visualization
    let diffHtml = '';
    const maxLines = Math.max(userLines.length, solutionLines.length);
    
    for (let i = 0; i < maxLines; i++) {
        const userLine = userLines[i] || '';
        const solutionLine = solutionLines[i] || '';
        
        if (userLine === solutionLine) {
            diffHtml += `<div class="diff-line diff-unchanged">${escapeHtml(userLine)}</div>`;
        } else {
            if (userLine) {
                diffHtml += `<div class="diff-line diff-removed">- ${escapeHtml(userLine)}</div>`;
            }
            if (solutionLine) {
                diffHtml += `<div class="diff-line diff-added">+ ${escapeHtml(solutionLine)}</div>`;
            }
        }
    }
    
    return diffHtml;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Problem and difficulty management
function adjustDifficulty(success) {
    if (success) {
        appState.adaptiveDifficulty = Math.min(5, appState.adaptiveDifficulty + 0.2);
    } else {
        appState.adaptiveDifficulty = Math.max(1, appState.adaptiveDifficulty - 0.1);
    }
}

function getAllProblems() {
    // Return array of all problems from all chapters
    return [
        { id: 'fib', chapter: 'prologo', difficulty: 1, title: 'Fibonacci Base' },
        { id: 'stairs', chapter: 'cap1', difficulty: 2, title: 'Climbing Stairs' },
        { id: 'coins', chapter: 'cap2', difficulty: 3, title: 'Coin Change' },
        // ... more problems
    ];
}

function getProblemsForLevel(level) {
    const allProblems = getAllProblems();
    return allProblems.filter(p => 
        p.difficulty >= level - 0.5 && p.difficulty <= level + 0.5
    );
}

// Funzioni aggiuntive necessarie per l'HTML
function initializeVisualizations() {
    // Inizializza visualizzazioni D3.js
    console.log('Visualizations initialized');
}

function checkAchievements() {
    // Verifica e sblocca achievement
    console.log('Checking achievements');
}

function trackMistake(editorId, code, error) {
    // Traccia errori per analisi
    appState.mistakes.push({
        editorId,
        code,
        error,
        timestamp: Date.now()
    });
    saveState();
}

function updateStats() {
    // Aggiorna statistiche display
    updateProgressDisplay();
}

function runSingleTest(code, test) {
    // Esegue un singolo test
    return new Promise((resolve) => {
        resolve({
            name: test.name,
            passed: true,
            result: 'Test passato'
        });
    });
}

function displayTestResults(outputElement, results) {
    // Mostra risultati dei test
    const html = results.map(r => 
        `<div class="test-case ${r.passed ? 'passed' : 'failed'}">
            ${r.name}: ${r.passed ? '✓ Passato' : '✗ Fallito'}
        </div>`
    ).join('');
    outputElement.innerHTML = html;
}

function copySolution(editorId) {
    // Copia soluzione nell'editor
    const solution = getSolutionForExercise(editorId);
    document.getElementById(`${editorId}-code`).value = solution;
}

function saveExplanation(topic, explanation) {
    // Salva spiegazione utente
    if (!appState.annotations[topic]) {
        appState.annotations[topic] = [];
    }
    appState.annotations[topic].push({
        text: explanation,
        timestamp: Date.now()
    });
    saveState();
}

function initializePracticeMode() {
    // Inizializza modalità pratica
    console.log('Practice mode initialized');
}

function displayPracticeProblems(problems) {
    // Mostra problemi di pratica
    console.log('Displaying practice problems:', problems);
}

function loadFocusedPractice() {
    // Carica pratica focalizzata
    console.log('Loading focused practice');
}

function generateStrengthChart() {
    // Genera grafico punti di forza
    console.log('Generating strength chart');
}

function generateLearningTrend() {
    // Genera tendenza apprendimento
    console.log('Generating learning trend');
}

function identifyWeaknesses() {
    // Identifica punti deboli
    console.log('Identifying weaknesses');
}

function showDayDetails(dateString) {
    // Mostra dettagli giorno
    console.log('Showing day details for:', dateString);
}

// =============================================
// POMODORO TIMER SYSTEM
// =============================================

// Initialize Pomodoro Timer
function initializePomodoroTimer() {
    // Load saved Pomodoro data
    const savedPomodoro = localStorage.getItem('pomodoroData');
    if (savedPomodoro) {
        const data = JSON.parse(savedPomodoro);
        Object.assign(appState.pomodoro, data);
    }
    
    // Reset daily stats if it's a new day
    const today = new Date().toDateString();
    const lastSession = localStorage.getItem('pomodoroLastDate');
    if (lastSession !== today) {
        appState.pomodoro.dailySessions = 0;
        appState.pomodoro.stats.today = 0;
        localStorage.setItem('pomodoroLastDate', today);
    }
    
    // Create Pomodoro UI if not exists
    createPomodoroUI();
    updatePomodoroDisplay();
    
    console.log('🍅 Pomodoro Timer inizializzato');
}

// Create Pomodoro UI
function createPomodoroUI() {
    const existingPomodoro = document.getElementById('pomodoroWidget');
    if (existingPomodoro) return;
    
    const pomodoroHTML = `
        <div id="pomodoroWidget" class="pomodoro-widget">
            <div class="pomodoro-header">
                <h4><i class="fas fa-clock"></i> Pomodoro Focus Timer</h4>
                <button class="pomodoro-settings-btn" onclick="showPomodoroSettings()">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
            
            <div class="pomodoro-display">
                <div class="pomodoro-session-type" id="pomodoroSessionType">
                    Sessione di Studio
                </div>
                <div class="pomodoro-timer" id="pomodoroTimer">
                    25:00
                </div>
                <div class="pomodoro-progress">
                    <div class="pomodoro-progress-bar" id="pomodoroProgressBar"></div>
                </div>
            </div>
            
            <div class="pomodoro-controls">
                <button class="btn btn-success" id="pomodoroStartBtn" onclick="startPomodoro()">
                    <i class="fas fa-play"></i> Inizia
                </button>
                <button class="btn btn-warning" id="pomodoroPauseBtn" onclick="pausePomodoro()" style="display: none;">
                    <i class="fas fa-pause"></i> Pausa
                </button>
                <button class="btn btn-info" id="pomodoroResumeBtn" onclick="resumePomodoro()" style="display: none;">
                    <i class="fas fa-play"></i> Riprendi
                </button>
                <button class="btn btn-danger" onclick="stopPomodoro()">
                    <i class="fas fa-stop"></i> Stop
                </button>
            </div>
            
            <div class="pomodoro-stats">
                <div class="stat-item">
                    <span class="stat-value" id="pomodoroSessionsToday">0</span>
                    <span class="stat-label">Oggi</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="pomodoroStreak">0</span>
                    <span class="stat-label">Streak</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="pomodoroTotalTime">0h</span>
                    <span class="stat-label">Totale</span>
                </div>
            </div>
        </div>
        
        <!-- Pomodoro Settings Modal -->
        <div id="pomodoroSettingsModal" class="pomodoro-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚙️ Impostazioni Pomodoro</h3>
                    <button onclick="closePomodoroSettings()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setting-group">
                        <label>Durata Sessione di Studio (minuti):</label>
                        <input type="number" id="workDurationSetting" min="1" max="60" value="25">
                    </div>
                    <div class="setting-group">
                        <label>Durata Pausa Breve (minuti):</label>
                        <input type="number" id="shortBreakSetting" min="1" max="30" value="5">
                    </div>
                    <div class="setting-group">
                        <label>Durata Pausa Lunga (minuti):</label>
                        <input type="number" id="longBreakSetting" min="1" max="60" value="15">
                    </div>
                    <div class="setting-group">
                        <label>Sessioni prima della pausa lunga:</label>
                        <input type="number" id="longBreakIntervalSetting" min="2" max="10" value="4">
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="autoStartBreaksSetting" checked>
                            Avvia automaticamente le pause
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="soundEnabledSetting" checked>
                            Suoni di notifica
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" onclick="savePomodoroSettings()">
                        <i class="fas fa-save"></i> Salva
                    </button>
                    <button class="btn btn-secondary" onclick="closePomodoroSettings()">
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to right sidebar
    const rightSidebar = document.querySelector('.right-sidebar');
    if (rightSidebar) {
        rightSidebar.insertAdjacentHTML('beforeend', pomodoroHTML);
    } else {
        // Create right sidebar if it doesn't exist
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            const newSidebar = document.createElement('div');
            newSidebar.className = 'right-sidebar';
            newSidebar.innerHTML = pomodoroHTML;
            mainLayout.appendChild(newSidebar);
            
            // Update CSS grid to accommodate new sidebar
            mainLayout.style.gridTemplateColumns = '250px 1fr 350px';
        }
    }
}

// Start Pomodoro Session
function startPomodoro() {
    if (appState.pomodoro.isActive) return;
    
    appState.pomodoro.isActive = true;
    appState.pomodoro.isPaused = false;
    
    // Update UI
    document.getElementById('pomodoroStartBtn').style.display = 'none';
    document.getElementById('pomodoroPauseBtn').style.display = 'inline-block';
    document.getElementById('pomodoroResumeBtn').style.display = 'none';
    
    // Start timer interval
    appState.pomodoroInterval = setInterval(updatePomodoroTimer, 1000);
    
    showNotification('🍅 Sessione Pomodoro iniziata! Buono studio!', 'success');
    savePomodoroData();
}

// Pause Pomodoro
function pausePomodoro() {
    if (!appState.pomodoro.isActive) return;
    
    appState.pomodoro.isPaused = true;
    clearInterval(appState.pomodoroInterval);
    
    // Update UI
    document.getElementById('pomodoroPauseBtn').style.display = 'none';
    document.getElementById('pomodoroResumeBtn').style.display = 'inline-block';
    
    showNotification('⏸️ Pomodoro in pausa', 'info');
}

// Resume Pomodoro
function resumePomodoro() {
    if (!appState.pomodoro.isActive || !appState.pomodoro.isPaused) return;
    
    appState.pomodoro.isPaused = false;
    
    // Update UI
    document.getElementById('pomodoroPauseBtn').style.display = 'inline-block';
    document.getElementById('pomodoroResumeBtn').style.display = 'none';
    
    // Restart timer
    appState.pomodoroInterval = setInterval(updatePomodoroTimer, 1000);
    
    showNotification('▶️ Pomodoro ripreso!', 'success');
}

// Stop Pomodoro
function stopPomodoro() {
    appState.pomodoro.isActive = false;
    appState.pomodoro.isPaused = false;
    clearInterval(appState.pomodoroInterval);
    
    // Reset timer to work session
    appState.pomodoro.currentSession = 'work';
    appState.pomodoro.timeRemaining = appState.pomodoro.settings.workDuration;
    
    // Update UI
    document.getElementById('pomodoroStartBtn').style.display = 'inline-block';
    document.getElementById('pomodoroPauseBtn').style.display = 'none';
    document.getElementById('pomodoroResumeBtn').style.display = 'none';
    
    updatePomodoroDisplay();
    showNotification('🛑 Pomodoro fermato', 'info');
    savePomodoroData();
}

// Update Pomodoro Timer
function updatePomodoroTimer() {
    if (!appState.pomodoro.isActive || appState.pomodoro.isPaused) return;
    
    appState.pomodoro.timeRemaining--;
    
    // Update display
    updatePomodoroDisplay();
    
    // Check if session completed
    if (appState.pomodoro.timeRemaining <= 0) {
        completeCurrentSession();
    }
    
    savePomodoroData();
}

// Complete Current Session
function completeCurrentSession() {
    clearInterval(appState.pomodoroInterval);
    appState.pomodoro.isActive = false;
    
    const currentSession = appState.pomodoro.currentSession;
    
    if (currentSession === 'work') {
        // Work session completed
        appState.pomodoro.sessionsCompleted++;
        appState.pomodoro.dailySessions++;
        appState.pomodoro.stats.today++;
        appState.pomodoro.stats.total++;
        appState.pomodoro.totalFocusTime += appState.pomodoro.settings.workDuration;
        
        // Check if it's time for long break
        const isLongBreak = (appState.pomodoro.sessionsCompleted % appState.pomodoro.settings.sessionsUntilLongBreak) === 0;
        
        if (isLongBreak) {
            appState.pomodoro.currentSession = 'longBreak';
            appState.pomodoro.timeRemaining = appState.pomodoro.settings.longBreakDuration;
            showNotification('🎉 Sessione completata! Tempo per una pausa lunga!', 'success');
        } else {
            appState.pomodoro.currentSession = 'shortBreak';
            appState.pomodoro.timeRemaining = appState.pomodoro.settings.shortBreakDuration;
            showNotification('✅ Sessione completata! Tempo per una pausa breve!', 'success');
        }
        
        // Update learning streak
        updateLearningStreak();
        
    } else {
        // Break completed
        appState.pomodoro.currentSession = 'work';
        appState.pomodoro.timeRemaining = appState.pomodoro.settings.workDuration;
        showNotification('⏰ Pausa finita! Pronto per un'altra sessione?', 'info');
    }
    
    // Auto-start next session if enabled
    if ((currentSession === 'work' && appState.pomodoro.settings.autoStartBreaks) ||
        (currentSession !== 'work' && appState.pomodoro.settings.autoStartWork)) {
        setTimeout(() => startPomodoro(), 1000);
    } else {
        // Reset UI for manual start
        document.getElementById('pomodoroStartBtn').style.display = 'inline-block';
        document.getElementById('pomodoroPauseBtn').style.display = 'none';
        document.getElementById('pomodoroResumeBtn').style.display = 'none';
    }
    
    updatePomodoroDisplay();
    playNotificationSound();
    savePomodoroData();
}

// Update Pomodoro Display
function updatePomodoroDisplay() {
    const minutes = Math.floor(appState.pomodoro.timeRemaining / 60);
    const seconds = appState.pomodoro.timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update timer display
    const timerElement = document.getElementById('pomodoroTimer');
    if (timerElement) {
        timerElement.textContent = timeString;
    }
    
    // Update session type
    const sessionTypeElement = document.getElementById('pomodoroSessionType');
    if (sessionTypeElement) {
        const sessionTypes = {
            'work': '🍅 Sessione di Studio',
            'shortBreak': '☕ Pausa Breve',
            'longBreak': '🌟 Pausa Lunga'
        };
        sessionTypeElement.textContent = sessionTypes[appState.pomodoro.currentSession];
    }
    
    // Update progress bar
    const progressElement = document.getElementById('pomodoroProgressBar');
    if (progressElement) {
        const totalDuration = appState.pomodoro.currentSession === 'work' 
            ? appState.pomodoro.settings.workDuration
            : appState.pomodoro.currentSession === 'shortBreak'
            ? appState.pomodoro.settings.shortBreakDuration
            : appState.pomodoro.settings.longBreakDuration;
        
        const progress = ((totalDuration - appState.pomodoro.timeRemaining) / totalDuration) * 100;
        progressElement.style.width = `${progress}%`;
    }
    
    // Update stats
    const todayElement = document.getElementById('pomodoroSessionsToday');
    if (todayElement) {
        todayElement.textContent = appState.pomodoro.dailySessions;
    }
    
    const streakElement = document.getElementById('pomodoroStreak');
    if (streakElement) {
        streakElement.textContent = appState.pomodoro.stats.streak;
    }
    
    const totalTimeElement = document.getElementById('pomodoroTotalTime');
    if (totalTimeElement) {
        const hours = Math.floor(appState.pomodoro.totalFocusTime / 3600);
        totalTimeElement.textContent = `${hours}h`;
    }
}

// Show Pomodoro Settings
function showPomodoroSettings() {
    const modal = document.getElementById('pomodoroSettingsModal');
    if (modal) {
        // Load current settings
        document.getElementById('workDurationSetting').value = appState.pomodoro.settings.workDuration / 60;
        document.getElementById('shortBreakSetting').value = appState.pomodoro.settings.shortBreakDuration / 60;
        document.getElementById('longBreakSetting').value = appState.pomodoro.settings.longBreakDuration / 60;
        document.getElementById('longBreakIntervalSetting').value = appState.pomodoro.settings.sessionsUntilLongBreak;
        document.getElementById('autoStartBreaksSetting').checked = appState.pomodoro.settings.autoStartBreaks;
        document.getElementById('soundEnabledSetting').checked = appState.pomodoro.settings.soundEnabled;
        
        modal.style.display = 'block';
    }
}

// Close Pomodoro Settings
function closePomodoroSettings() {
    const modal = document.getElementById('pomodoroSettingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save Pomodoro Settings
function savePomodoroSettings() {
    appState.pomodoro.settings.workDuration = parseInt(document.getElementById('workDurationSetting').value) * 60;
    appState.pomodoro.settings.shortBreakDuration = parseInt(document.getElementById('shortBreakSetting').value) * 60;
    appState.pomodoro.settings.longBreakDuration = parseInt(document.getElementById('longBreakSetting').value) * 60;
    appState.pomodoro.settings.sessionsUntilLongBreak = parseInt(document.getElementById('longBreakIntervalSetting').value);
    appState.pomodoro.settings.autoStartBreaks = document.getElementById('autoStartBreaksSetting').checked;
    appState.pomodoro.settings.soundEnabled = document.getElementById('soundEnabledSetting').checked;
    
    // Reset current timer if not active
    if (!appState.pomodoro.isActive) {
        appState.pomodoro.timeRemaining = appState.pomodoro.settings.workDuration;
        updatePomodoroDisplay();
    }
    
    savePomodoroData();
    closePomodoroSettings();
    showNotification('⚙️ Impostazioni Pomodoro salvate!', 'success');
}

// Save Pomodoro Data
function savePomodoroData() {
    const dataToSave = {
        sessionsCompleted: appState.pomodoro.sessionsCompleted,
        dailySessions: appState.pomodoro.dailySessions,
        totalFocusTime: appState.pomodoro.totalFocusTime,
        settings: appState.pomodoro.settings,
        stats: appState.pomodoro.stats
    };
    localStorage.setItem('pomodoroData', JSON.stringify(dataToSave));
}

// Update Learning Streak
function updateLearningStreak() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastLearningDate');
    
    if (lastDate === today) {
        // Already counted today
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate === yesterday.toDateString()) {
        // Continue streak
        appState.pomodoro.stats.streak++;
    } else {
        // Reset streak
        appState.pomodoro.stats.streak = 1;
    }
    
    localStorage.setItem('lastLearningDate', today);
    savePomodoroData();
}

// Play Notification Sound
function playNotificationSound() {
    if (!appState.pomodoro.settings.soundEnabled) return;
    
    // Create audio context for notification
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio not available');
    }
}

// Additional Interactive Functions
function updateFibVisualization(value) {
    document.getElementById('fibValue').textContent = `F(${value})`;
    // Update D3 visualization
    if (document.getElementById('fibCanvas').querySelector('svg')) {
        document.getElementById('fibCanvas').innerHTML = '';
        animateFibonacciTree(d3.select('#fibCanvas').append('svg').attr('width', 600).attr('height', 400), parseInt(value));
    }
}

function revealStep(stepElement) {
    stepElement.classList.remove('step-hidden');
    stepElement.querySelector('.step-reveal').style.display = 'none';
    
    // Add reveal animation
    stepElement.style.opacity = '0.5';
    stepElement.style.transform = 'scale(0.95)';
    setTimeout(() => {
        stepElement.style.transition = 'all 0.3s ease';
        stepElement.style.opacity = '1';
        stepElement.style.transform = 'scale(1)';
    }, 100);
    
    showNotification('Passo rivelato! 🎉', 'success');
}

function trackFibonacciCalls() {
    const canvas = document.getElementById('callChart');
    const ctx = canvas.getContext('2d');
    
    // Simulate call tracking data
    const callCounts = {
        'F(0)': 8,
        'F(1)': 5,
        'F(2)': 5,
        'F(3)': 3,
        'F(4)': 2,
        'F(5)': 1,
        'F(6)': 1
    };
    
    // Create bar chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(callCounts),
            datasets: [{
                label: 'Numero di Chiamate',
                data: Object.values(callCounts),
                backgroundColor: [
                    '#ef4444', '#ef4444', '#ef4444', // Duplicati in rosso
                    '#f59e0b', '#f59e0b', // Medi in arancione
                    '#10b981', '#10b981'  // Unici in verde
                ],
                borderColor: '#4f46e5',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Analisi Chiamate Ricorsive - Fibonacci(6)'
                },
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Numero di Chiamate'
                    }
                }
            }
        }
    });
    
    showNotification('📊 Analisi completata! Nota le chiamate duplicate in rosso.', 'info');
}

function checkPattern(element, isDP) {
    // Reset all options
    document.querySelectorAll('.practice-option').forEach(opt => {
        opt.classList.remove('selected');
        opt.style.background = '';
    });
    
    // Mark selection
    element.classList.add('selected');
    
    const feedbackDiv = document.getElementById('pattern-feedback');
    feedbackDiv.style.display = 'block';
    
    if (isDP) {
        element.style.background = '#10b981';
        element.style.color = 'white';
        feedbackDiv.innerHTML = `
            <div style="color: #10b981;">
                ✅ Corretto! Questo problema ha sottostruttura ottima:
                <ul style="margin-top: 10px;">
                    <li>Può essere diviso in sottoproblemi</li>
                    <li>I sottoproblemi si sovrappongono</li>
                    <li>La soluzione ottima dipende dalle soluzioni ottime dei sottoproblemi</li>
                </ul>
            </div>
        `;
        
        // Track correct answer
        if (!appState.completedExercises.has('pattern-recognition')) {
            appState.completedExercises.add('pattern-recognition');
            updateProgressDisplay();
            saveState();
        }
    } else {
        element.style.background = '#ef4444';
        element.style.color = 'white';
        feedbackDiv.innerHTML = `
            <div style="color: #ef4444;">
                ❌ Non proprio. Questo problema non ha sottostruttura ottima:
                <ul style="margin-top: 10px;">
                    <li>Non si divide naturalmente in sottoproblemi sovrapposti</li>
                    <li>Usa altre tecniche algoritmiche più appropriate</li>
                </ul>
            </div>
        `;
    }
    
    // Add to spaced repetition if correct
    if (isDP) {
        addToSpacedRepetition('pattern-recognition', 'exercise');
        checkAchievements();
    }
}

// Enhanced Python execution with better error handling and timeout
async function runPythonCodeEnhanced(editorId, timeout = 30000) {
    if (!appState.pythonReady) {
        showNotification('⏳ Ambiente Python in caricamento...', 'warning');
        return;
    }
    
    const code = document.getElementById(`${editorId}-code`).value;
    const outputElement = document.getElementById(`${editorId}-output`);
    
    if (!code.trim()) {
        outputElement.innerHTML = '<div style="color: #f59e0b;">⚠️ Inserisci del codice Python per eseguirlo</div>';
        return;
    }
    
    outputElement.innerHTML = '<div style="color: #10b981;"><i class="fas fa-spinner fa-spin"></i> Esecuzione in corso...</div>';
    
    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Esecuzione troppo lunga')), timeout);
    });
    
    try {
        // Clear previous state
        await appState.pyodide.runPython(`
            import sys
            from io import StringIO
            import time
            sys.stdout = StringIO()
            sys.stderr = StringIO()
        `);
        
        // Execute code with timeout
        await Promise.race([
            appState.pyodide.runPython(code),
            timeoutPromise
        ]);
        
        // Get output and errors
        const stdout = await appState.pyodide.runPython('sys.stdout.getvalue()');
        const stderr = await appState.pyodide.runPython('sys.stderr.getvalue()');
        
        let output = '';
        if (stdout) output += `<div style="color: #10b981;">✓ Output:</div><pre>${stdout}</pre>`;
        if (stderr) output += `<div style="color: #f59e0b;">⚠️ Warnings:</div><pre>${stderr}</pre>`;
        
        outputElement.innerHTML = output || '<div style="color: #94a3b8;">Codice eseguito senza output</div>';
        
        // Track successful execution
        if (!appState.completedExercises.has(editorId)) {
            appState.completedExercises.add(editorId);
            updateProgressDisplay();
            saveState();
            addToSpacedRepetition(editorId, 'exercise');
            showNotification('🎉 Esercizio completato!', 'success');
        }
        
        // Update stats
        appState.exerciseStats.attempted++;
        appState.exerciseStats.solved++;
        updateStats();
        
    } catch (error) {
        let errorMsg = error.toString();
        if (errorMsg.includes('Timeout')) {
            outputElement.innerHTML = `<div style="color: #ef4444;">⏱️ Timeout: Il codice impiega troppo tempo</div>`;
        } else {
            outputElement.innerHTML = `<div style="color: #ef4444;">✗ Errore:</div><pre style="color: #ef4444;">${errorMsg}</pre>`;
        }
        
        // Track mistake for analysis
        trackMistake(editorId, code, errorMsg);
        appState.exerciseStats.attempted++;
        updateStats();
    }
}

// Make functions globally available for HTML onclick handlers
window.loadChapter = loadChapter;
window.setMode = setMode;
window.runPythonCode = runPythonCode;
window.runPythonCodeEnhanced = runPythonCodeEnhanced;
window.runEducationalDemo = runEducationalDemo;
window.runTests = runTests;
window.showSolution = showSolution;
window.startFibVisualization = startFibVisualization;
window.updateFibVisualization = updateFibVisualization;
window.revealStep = revealStep;
window.trackFibonacciCalls = trackFibonacciCalls;
window.checkPattern = checkPattern;
window.checkRecall = checkRecall;
window.startPractice = startPractice;
window.toggleTheme = toggleTheme;
window.toggleFocusMode = toggleFocusMode;
window.showShortcuts = showShortcuts;
window.closeShortcuts = closeShortcuts;
window.copySolution = copySolution;
window.showDayDetails = showDayDetails;

// Pomodoro functions
window.startPomodoro = startPomodoro;
window.pausePomodoro = pausePomodoro;
window.resumePomodoro = resumePomodoro;
window.stopPomodoro = stopPomodoro;
window.showPomodoroSettings = showPomodoroSettings;
window.closePomodoroSettings = closePomodoroSettings;
window.savePomodoroSettings = savePomodoroSettings;

// Spaced Repetition SM-2 functions
window.reviewItem = reviewItem;
window.showItemDetails = showItemDetails;
window.getSpacedRepetitionStats = getSpacedRepetitionStats;
window.getItemsDueForReview = getItemsDueForReview;