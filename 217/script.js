let homework = null;
let rng = null;
let questionToShow = null;

async function loadHomework() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('canvas_user_id');
    questionToShow = urlParams.get('q'); // Get the question number from URL

    if (!studentId) {
        alert('Student ID is missing in the URL');
        return;
    }

    rng = new Math.seedrandom(studentId);

    const htmlFilename = document.location.pathname.split('/').pop();
    const match = htmlFilename.match(/(\d+)hw(\d+)\.html/);
    if (!match) {
        alert('Invalid file name format. Expected format: NNNhwM.html');
        return;
    }

    const courseName = match[1];
    const homeworkNumber = match[2];
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
        alert('Error loading homework. Please check the console for more details.');
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
        // If questionToShow is null or matches the current index + 1, display the question
        if (questionToShow === null || parseInt(questionToShow) === index + 1) {
            const problemDiv = document.createElement('div');
            problemDiv.className = 'problem';

            let questionText = problem.question;
            problem.variables?.forEach(variable => {
                const value = variable.min + rng() * (variable.max - variable.min);
                questionText = questionText.replace(`{${variable.name}}`, value.toFixed(2));
            });
            problemDiv.innerHTML = `<p>${index + 1}. ${questionText}</p>`;
            problemsDiv.appendChild(problemDiv);
        }
    });
}

document.addEventListener('DOMContentLoaded', loadHomework);
