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

    // Load questions progressively based on level
    async loadQuestionsForLevel(level) {
        // Determine which sets to load based on level
        const setsToLoad = this.getSetsForLevel(level);
        let allQuestions = [];
        
        for (const setNumber of setsToLoad) {
            try {
                const questions = await this.loadPuzzleSet(setNumber);
                if (questions && questions.length > 0) {
                    // Add set number and question index for tracking
                    questions.forEach((q, index) => {
                        q._setNumber = setNumber;
                        q._questionIndex = index;
                    });
                    allQuestions.push(...questions);
                }
            } catch (error) {
                console.log(`Could not load set ${setNumber}, skipping...`);
            }
        }
        
        console.log(`Loading ${setsToLoad.length} puzzle sets for level ${level}: ${allQuestions.length} questions`);
        
        // Shuffle questions for variety
        return this.shuffleArray([...allQuestions]);
    }
    
    // Get appropriate sets for level
    getSetsForLevel(level) {
        if (level <= 3) {
            return [1, 2, 3]; // Easier questions
        } else if (level <= 6) {
            return [4, 5, 6, 7, 8]; // Medium questions
        } else {
            return [9, 10, 11, 12, 13, 14, 15]; // Harder questions
        }
    }
    
    // Load additional questions when current level runs out
    async loadAdditionalQuestions(level) {
        // Try to load more sets based on progress
        const additionalSets = this.getAdditionalSetsForLevel(level);
        
        for (const setNumber of additionalSets) {
            try {
                await this.loadPuzzleSet(setNumber);
                console.log(`Loaded additional set ${setNumber}`);
            } catch (error) {
                console.log(`Could not load additional set ${setNumber}`);
            }
        }
    }
    
    // Get additional sets to try loading
    getAdditionalSetsForLevel(level) {
        if (level <= 3) {
            return [4, 5]; // Try slightly harder sets
        } else if (level <= 6) {
            return [9, 10, 11]; // Try harder sets
        } else {
            return [16, 17, 18, 19, 20]; // Try even harder sets
        }
    }

    // Get next question (ensuring no repeats of answered questions)
    async getNextQuestion(level) {
        // Load questions for current level on demand
        const levelQuestions = await this.loadQuestionsForLevel(level);
        
        // Filter out already answered questions
        const unansweredQuestions = levelQuestions.filter(q => 
            !this.answeredQuestions.has(this.getQuestionId(q))
        );
        
        if (unansweredQuestions.length === 0) {
            // Try to load more questions from available sets
            await this.loadAdditionalQuestions(level);
            const allQuestions = await this.loadQuestionsForLevel(level);
            const remainingQuestions = allQuestions.filter(q => 
                !this.answeredQuestions.has(this.getQuestionId(q))
            );
            
            if (remainingQuestions.length === 0) {
                console.log('All questions for this level have been answered!');
                return null; // No more questions available for this level
            }
            
            const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
            return remainingQuestions[randomIndex];
        }
        
        // Return a random question from available questions
        const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
        return unansweredQuestions[randomIndex];
    }
    
    // Load available questions progressively (only load sets that exist)
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