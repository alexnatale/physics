let homework = null;
let studentId = '';
let rng = null;

async function loadHomework() {
    studentId = document.getElementById('student-id').value.trim();
    if (!studentId) {
        alert('Please enter a Student ID');
        return;
    }

    rng = new Math.seedrandom(studentId);

    // Extract course and homework numbers from the HTML file name
    const fileName = window.location.pathname.split('/').pop(); // Get the current HTML file name
    const [courseNumber, homeworkNumber] = fileName.match(/(\d+)hw(\d+)/).slice(1); // Extract numbers

    const jsonFileName = `course${courseNumber}_hw${homeworkNumber}.json`;
    
    try {
        const response = await fetch(jsonFileName);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        homework = await response.json();
        generateProblems();
    } catch (error) {
        console.error('Error loading homework:', error);
        alert('Error loading homework. Please try again.');
    }
}

function generateProblems() {
    const problemsDiv = document.getElementById('homework-problems');
    problemsDiv.innerHTML = '';

    homework.problems.forEach((problem, index) => {
        const problemDiv = document.createElement('div');
        problemDiv.className = 'problem';

        let questionText = problem.question;
        problem.variables?.forEach(variable => {
            const value = variable.min + rng() * (variable.max - variable.min);
            questionText = questionText.replace(`{${variable.name}}`, value.toFixed(2));
        });

        problemDiv.innerHTML = `<p>${index + 1}. ${questionText}</p>`;

        if (problem.type === 'numerical') {
            problemDiv.innerHTML += `
                <div class="numerical-input">
                    <input type="text" id="answer-${index}-value" placeholder="Value (in scientific notation)">
                    <input type="text" id="answer-${index}-unit" placeholder="Unit">
                </div>
            `;
        } else if (problem.type === 'multiple-choice') {
            problem.choices.forEach((choice, choiceIndex) => {
                const letter = String.fromCharCode(97 + choiceIndex); // a, b, c, d, e, f
                problemDiv.innerHTML += `
                    <div>
                        <input type="radio" id="answer-${index}-${letter}" name="answer-${index}" value="${letter}">
                        <label for="answer-${index}-${letter}">${letter}) ${choice}</label>
                    </div>
                `;
            });
        }

        problemsDiv.appendChild(problemDiv);
    });
}

// Load homework when enter is pressed in the student ID input
document.getElementById('student-id').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        loadHomework();
    }
});
