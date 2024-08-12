let homework = null;
let rng = null;

async function loadHomework() {
    // Get the student ID from the URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('canvas_user_id');
    if (!studentId) {
        alert('Student ID is missing in the URL');
        return;
    }

    // Initialize the RNG with the student ID as the seed
    rng = new Math.seedrandom(studentId);

    // Get the current HTML filename
    const htmlFilename = document.location.pathname.split('/').pop();
    
    // Extract course name and homework number
    const match = htmlFilename.match(/(\d+)hw(\d+)\.html/);
    if (!match) {
        alert('Invalid file name format. Expected format: NNNhwM.html');
        return;
    }
    
    const courseName = match[1];
    const homeworkNumber = match[2];
    
    // Construct the JSON filename
    const jsonFilename = `course${courseName}hw${homeworkNumber}.json`;
    
    console.log('Fetching JSON file:', jsonFilename); // Debugging log

    try {
        const response = await fetch(jsonFilename);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        homework = await response.json();
        console.log('Homework loaded:', homework); // Debugging log
        generateProblems();
    } catch (error) {
        console.error('Error loading homework:', error);
        alert('Error loading homework. Please try again.');
    }
}

function generateProblems() {
    const problemsDiv = document.getElementById('homework-problems');
    problemsDiv.innerHTML = '';
    if (!homework || !homework.problems) {
        console.error('Homework data is missing or incorrectly formatted');
        return;
    }
    homework.problems.forEach((problem, index) => {
        const problemDiv = document.createElement('div');
        problemDiv.className = 'problem';
        
        let questionText = problem.question;
        problem.variables?.forEach(variable => {
            const value = variable.min + rng() * (variable.max - variable.min);
            questionText = questionText.replace(`{${variable.name}}`, value.toFixed(2));
        });
        problemDiv.innerHTML = `<p>${index + 1}. ${questionText}</p>`;
        problemsDiv.appendChild(problemDiv);
    });
}

document.addEventListener('DOMContentLoaded', loadHomework);
