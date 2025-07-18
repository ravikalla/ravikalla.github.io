// Script to generate additional puzzle sets
const fs = require('fs');
const path = require('path');

// Space Explorer questions organized by difficulty
const spaceQuestions = {
  easy: [
    {q: "What is the closest star to Earth?", a: ["The Sun", "Alpha Centauri", "Proxima Centauri", "Sirius"], correct: 0},
    {q: "How many planets are in our solar system?", a: ["7", "8", "9", "10"], correct: 1},
    {q: "Which planet is known as the Red Planet?", a: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1},
    {q: "What is the largest planet in our solar system?", a: ["Saturn", "Neptune", "Jupiter", "Uranus"], correct: 2},
    {q: "Which planet has rings?", a: ["Jupiter", "Saturn", "Uranus", "All of the above"], correct: 3},
    {q: "What is the name of our galaxy?", a: ["Andromeda", "Milky Way", "Whirlpool", "Spiral"], correct: 1},
    {q: "What causes day and night on Earth?", a: ["Moon's orbit", "Earth's rotation", "Sun's movement", "Cloud cover"], correct: 1},
    {q: "How many moons does Earth have?", a: ["0", "1", "2", "3"], correct: 1},
    {q: "What is the hottest planet?", a: ["Mercury", "Venus", "Mars", "Jupiter"], correct: 1},
    {q: "What do astronauts wear in space?", a: ["Regular clothes", "Swimsuit", "Space suit", "Pajamas"], correct: 2}
  ],
  medium: [
    {q: "What is the Van Allen radiation belt?", a: ["A comet", "Magnetic field around Earth", "A planet", "A type of star"], correct: 1},
    {q: "What is the solar wind?", a: ["Wind on the Sun", "Stream of particles from Sun", "Air in space", "Magnetic field"], correct: 1},
    {q: "What is a pulsar?", a: ["A spinning neutron star", "A planet", "A comet", "A galaxy"], correct: 0},
    {q: "What is the escape velocity from Earth?", a: ["11.2 km/s", "7.9 km/s", "25 km/s", "5 km/s"], correct: 0},
    {q: "What is the name of Jupiter's largest moon?", a: ["Europa", "Ganymede", "Io", "Callisto"], correct: 1},
    {q: "What is the name of the first artificial satellite?", a: ["Sputnik 1", "Explorer 1", "Vanguard 1", "Luna 1"], correct: 0},
    {q: "What is the name of the first human in space?", a: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"], correct: 2},
    {q: "What is the name of Mars' largest volcano?", a: ["Olympus Mons", "Valles Marineris", "Mount Everest", "Mauna Kea"], correct: 0},
    {q: "What is the name of the largest asteroid?", a: ["Vesta", "Pallas", "Ceres", "Hygiea"], correct: 2},
    {q: "What is the name of the spacecraft that first reached interstellar space?", a: ["Voyager 1", "Voyager 2", "Pioneer 10", "Pioneer 11"], correct: 0}
  ],
  hard: [
    {q: "What is the name of the theoretical boundary around a black hole?", a: ["Event horizon", "Photon sphere", "Ergosphere", "Singularity"], correct: 0},
    {q: "What is the name of the phenomenon when light bends around massive objects?", a: ["Refraction", "Reflection", "Gravitational lensing", "Diffraction"], correct: 2},
    {q: "What is the name of the region where the solar wind meets interstellar space?", a: ["Heliosphere", "Heliopause", "Magnetosphere", "Chromosphere"], correct: 1},
    {q: "What is the name of the mission that first detected gravitational waves?", a: ["LIGO", "Virgo", "LISA", "GEO600"], correct: 0},
    {q: "What is the name of the largest known star?", a: ["Betelgeuse", "UY Scuti", "VY Canis Majoris", "Rigel"], correct: 1},
    {q: "What is the name of the spacecraft that first landed on a comet?", a: ["Rosetta", "Philae", "Deep Impact", "Stardust"], correct: 1},
    {q: "What is the name of the theory that explains the origin of the universe?", a: ["Big Bang Theory", "Steady State Theory", "Inflation Theory", "String Theory"], correct: 0},
    {q: "What is the name of the largest structure in the observable universe?", a: ["Galaxy clusters", "Superclusters", "Cosmic web", "Great Wall"], correct: 2},
    {q: "What is the name of the spacecraft that studied Saturn for 13 years?", a: ["Galileo", "Cassini", "Juno", "Messenger"], correct: 1},
    {q: "What is the name of the first space-based telescope?", a: ["Hubble", "Spitzer", "OAO-1", "Kepler"], correct: 2}
  ]
};

// Generate puzzle sets
function generateSpacePuzzleSets(startSet, endSet) {
  const allQuestions = [...spaceQuestions.easy, ...spaceQuestions.medium, ...spaceQuestions.hard];
  
  for (let setNum = startSet; setNum <= endSet; setNum++) {
    let content = '';
    
    // Select 10 questions for this set
    const selectedQuestions = [];
    const usedIndices = new Set();
    
    while (selectedQuestions.length < 10) {
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedQuestions.push(allQuestions[randomIndex]);
      }
    }
    
    // Format questions
    selectedQuestions.forEach(q => {
      content += `Q: ${q.q}\n`;
      q.a.forEach((answer, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D
        content += `${letter}: ${answer}\n`;
      });
      content += `CORRECT: ${q.correct}\n\n`;
    });
    
    // Write to file
    const filename = `Puzzleset${setNum}.txt`;
    const filepath = path.join(__dirname, 'puzzles', 'space', filename);
    fs.writeFileSync(filepath, content.trim());
    console.log(`Generated ${filename}`);
  }
}

// Generate sets 13-25 for testing
generateSpacePuzzleSets(13, 25);