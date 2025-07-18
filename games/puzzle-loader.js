// Static Puzzle Loading System for GitHub Pages
// Loads puzzle sets from text files using AJAX

class PuzzleLoader {
    constructor(gameType) {
        this.gameType = gameType;
        this.puzzleCache = new Map();
        this.currentPuzzleSet = 1;
        this.questionsPerSet = 10;
        this.totalSets = 50; // 50 sets * 10 questions = 500 questions
        this.loadedQuestions = [];
        this.currentQuestionIndex = 0;
        this.answeredQuestions = new Set(); // Track questions that have been answered correctly
        this.availableQuestions = []; // Pool of unanswered questions
    }

    // Load a specific puzzle set from text file
    async loadPuzzleSet(setNumber) {
        if (this.puzzleCache.has(setNumber)) {
            return this.puzzleCache.get(setNumber);
        }

        try {
            const response = await fetch(`puzzles/${this.gameType}/Puzzleset${setNumber}.txt`);
            if (!response.ok) {
                throw new Error(`Failed to load puzzle set ${setNumber}`);
            }
            
            const text = await response.text();
            const questions = this.parsePuzzleText(text);
            
            this.puzzleCache.set(setNumber, questions);
            return questions;
        } catch (error) {
            console.warn(`Could not load puzzle set ${setNumber}:`, error);
            return this.getFallbackQuestions();
        }
    }

    // Parse puzzle text format
    parsePuzzleText(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const questions = [];
        
        for (let i = 0; i < lines.length; i += 6) {
            if (i + 5 < lines.length) {
                const question = {
                    q: lines[i].replace('Q: ', ''),
                    a: [
                        lines[i + 1].replace('A: ', ''),
                        lines[i + 2].replace('B: ', ''),
                        lines[i + 3].replace('C: ', ''),
                        lines[i + 4].replace('D: ', '')
                    ],
                    correct: parseInt(lines[i + 5].replace('CORRECT: ', '')) || 0
                };
                questions.push(question);
            }
        }
        
        return questions;
    }

    // Get fallback questions if file loading fails
    getFallbackQuestions() {
        const fallbacks = {
            'space': [
                { q: "What is the closest planet to the Sun?", a: ["Mercury", "Venus", "Earth", "Mars"], correct: 0 },
                { q: "How many moons does Earth have?", a: ["0", "1", "2", "3"], correct: 1 },
                { q: "Which planet is known as the Red Planet?", a: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
                { q: "What is the largest planet in our solar system?", a: ["Saturn", "Neptune", "Jupiter", "Uranus"], correct: 2 },
                { q: "Which planet has beautiful rings?", a: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1 },
                { q: "What do we call a group of stars that form a picture?", a: ["Galaxy", "Constellation", "Nebula", "Comet"], correct: 1 },
                { q: "What is the name of our galaxy?", a: ["Andromeda", "Milky Way", "Whirlpool", "Spiral"], correct: 1 },
                { q: "What do astronauts wear in space?", a: ["Regular clothes", "Swimsuit", "Space suit", "Pajamas"], correct: 2 },
                { q: "What is our closest star?", a: ["Polaris", "Alpha Centauri", "The Sun", "Sirius"], correct: 2 },
                { q: "What causes day and night?", a: ["Moon's orbit", "Earth's rotation", "Sun's movement", "Cloud cover"], correct: 1 }
            ],
            'geography': [
                { q: "Which country has this flag? 🇺🇸", a: ["United States", "Canada", "Mexico", "Brazil"], correct: 0 },
                { q: "What is the capital of France?", a: ["London", "Berlin", "Paris", "Rome"], correct: 2 },
                { q: "Which country has this flag? 🇯🇵", a: ["China", "Japan", "Korea", "Thailand"], correct: 1 },
                { q: "What is the capital of Italy?", a: ["Milan", "Naples", "Venice", "Rome"], correct: 3 },
                { q: "Which country has this flag? 🇬🇧", a: ["Ireland", "United Kingdom", "Scotland", "Wales"], correct: 1 },
                { q: "What is the capital of Germany?", a: ["Munich", "Hamburg", "Berlin", "Frankfurt"], correct: 2 },
                { q: "Which country has this flag? 🇨🇦", a: ["United States", "Canada", "Australia", "New Zealand"], correct: 1 },
                { q: "What is the capital of Australia?", a: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
                { q: "Which continent is Egypt in?", a: ["Asia", "Africa", "Europe", "South America"], correct: 1 },
                { q: "What is the longest river in the world?", a: ["Amazon", "Nile", "Mississippi", "Yangtze"], correct: 1 }
            ]
        };
        
        return fallbacks[this.gameType] || fallbacks['space'];
    }

    // Load questions progressively
    async loadQuestionsForLevel(level) {
        // For Space Explorer (levels 1-10) and Geography Quest style games
        let setNumber;
        if (level <= 3) {
            setNumber = 1;
        } else if (level <= 6) {
            setNumber = 2;
        } else {
            setNumber = 3;
        }
        
        console.log(`Loading puzzle set ${setNumber} for level ${level}`);
        const questions = await this.loadPuzzleSet(setNumber);
        
        // Shuffle questions for variety
        return this.shuffleArray([...questions]);
    }

    // Get next question (ensuring no repeats of answered questions)
    async getNextQuestion(level) {
        // Load all available questions if we haven't already
        if (this.availableQuestions.length === 0) {
            await this.loadAllAvailableQuestions();
        }
        
        // Filter out already answered questions
        const unansweredQuestions = this.availableQuestions.filter(q => 
            !this.answeredQuestions.has(this.getQuestionId(q))
        );
        
        if (unansweredQuestions.length === 0) {
            console.log('All questions have been answered! Congratulations!');
            return null; // No more questions available
        }
        
        // Select appropriate difficulty based on level
        const levelQuestions = this.filterQuestionsByLevel(unansweredQuestions, level);
        
        if (levelQuestions.length === 0) {
            // If no questions for this level, use any unanswered question
            const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
            return unansweredQuestions[randomIndex];
        }
        
        // Return a random question from appropriate level
        const randomIndex = Math.floor(Math.random() * levelQuestions.length);
        return levelQuestions[randomIndex];
    }
    
    // Load all available questions from all puzzle sets
    async loadAllAvailableQuestions() {
        this.availableQuestions = [];
        
        for (let setNumber = 1; setNumber <= this.totalSets; setNumber++) {
            try {
                const questions = await this.loadPuzzleSet(setNumber);
                if (questions && questions.length > 0) {
                    // Add set number and question index for tracking
                    questions.forEach((q, index) => {
                        q._setNumber = setNumber;
                        q._questionIndex = index;
                    });
                    this.availableQuestions.push(...questions);
                }
            } catch (error) {
                // Stop loading when we can't find more sets
                console.log(`Loaded ${setNumber - 1} puzzle sets with ${this.availableQuestions.length} total questions`);
                break;
            }
        }
        
        console.log(`Total questions loaded: ${this.availableQuestions.length}`);
    }
    
    // Generate unique ID for a question
    getQuestionId(question) {
        return `${question._setNumber}-${question._questionIndex}-${question.q.substring(0, 20)}`;
    }
    
    // Filter questions by difficulty level
    filterQuestionsByLevel(questions, level) {
        // Determine which sets are appropriate for this level
        let appropriateSets = [];
        if (level <= 3) {
            appropriateSets = [1, 2, 3, 4, 5]; // Easier questions
        } else if (level <= 6) {
            appropriateSets = [6, 7, 8, 9, 10, 11, 12]; // Medium questions
        } else {
            appropriateSets = [13, 14, 15, 16, 17, 18, 19, 20]; // Harder questions
        }
        
        return questions.filter(q => appropriateSets.includes(q._setNumber));
    }
    
    // Mark a question as answered correctly
    markQuestionAsAnswered(question) {
        const questionId = this.getQuestionId(question);
        this.answeredQuestions.add(questionId);
        console.log(`Question marked as answered: ${questionId}. Total answered: ${this.answeredQuestions.size}`);
    }
    
    // Get statistics
    getProgress() {
        return {
            totalQuestions: this.availableQuestions.length,
            answeredQuestions: this.answeredQuestions.size,
            remainingQuestions: this.availableQuestions.length - this.answeredQuestions.size
        };
    }

    // Preload next puzzle set for smooth gameplay
    async preloadNextSet(currentLevel) {
        const nextSetNumber = Math.ceil((currentLevel + 10) / 10);
        if (nextSetNumber <= this.totalSets && !this.puzzleCache.has(nextSetNumber)) {
            try {
                await this.loadPuzzleSet(nextSetNumber);
            } catch (error) {
                console.log(`Preloading set ${nextSetNumber} failed, will use fallback`);
            }
        }
    }

    // Utility function to shuffle array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Get total available questions
    getQuestionCount() {
        return this.totalSets * this.questionsPerSet;
    }

    // Clear cache (useful for testing)
    clearCache() {
        this.puzzleCache.clear();
        this.loadedQuestions = [];
        this.currentQuestionIndex = 0;
    }
}

// Global puzzle loader instances
window.PuzzleLoader = PuzzleLoader;