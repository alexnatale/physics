// Global variables
let homework = null;
let studentId = '';
let rng = null;

// Function to get the current homework number (you might want to pass this as a parameter)
function getCurrentHomework() {
    return '1'; // Hardcoded to 1 for now
}

// Function to get the course number (you might want to pass this as a parameter)
function getCourseNumber() {
    return '217'; // Hardcoded to 217 for now
}

// Function to load homework data
async function loadHomework() {
    const homeworkNumber = getCurrentHomework();
    const courseNumber = getCourseNumber();
    console.log(`Loading homework for course ${courseNumber}, homework ${homeworkNumber}`);

    try {
        // Adjust this URL to point to your GitHub raw content
        const response = await fetch(`https://raw.githubusercontent.com/your-username/your-repo/main/course${courseNumber}_hw${homeworkNumber}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        homework = await response.json();
        console.log('Homework JSON:', homework);

        generateProblems();
    } catch (error) {
        console.error('Error loading homework:', error);
        document.getElementById('homework-problems').innerHTML = 'Error loading homework. Please try again.';
    }
}

// Function to generate problems
function generateProblems() {
    const problemsDiv = document.getElementById('homework-problems');
    problemsDiv.innerHTML = '';

    // Use Canvas's user ID if available, otherwise use a random seed
    studentId = typeof ENV !== 'undefined' && ENV.current_user_id ? ENV.current_user_id : Math.random().toString(36).substring(7);
    rng = new Math.seedrandom(studentId);

    homework.problems.forEach((problem, index) => {
        const problemDiv = document.createElement('div');
        problemDiv.className = 'problem';
        
        let questionText = problem.question;
        problem.variables?.forEach(variable => {
            const value = variable.min + rng() * (variable.max - variable.min);
            questionText = questionText.replace(`{${variable.name}}`, value.toFixed(2));
        });

        problemDiv.innerHTML = `<p><strong>Problem ${index + 1}:</strong> ${questionText}</p>`;

        if (problem.type === 'numerical') {
            problemDiv.innerHTML += `
                <p>Enter your answer (value and unit) in the corresponding Canvas question below.</p>
            `;
        } else if (problem.type === 'multiple-choice') {
            problemDiv.innerHTML += `
                <p>Choose your answer in the corresponding Canvas multiple-choice question below.</p>
                <ul>
                    ${problem.choices.map((choice, choiceIndex) => `
                        <li>${String.fromCharCode(97 + choiceIndex)}) ${choice}</li>
                    `).join('')}
                </ul>
            `;
        }

        problemsDiv.appendChild(problemDiv);
    });
}

// Load homework when the script runs
window.addEventListener('load', loadHomework);
