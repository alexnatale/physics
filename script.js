let homework = null;
let studentId = '';
let rng = null;

async function loadHomework() {
    studentId = document.getElementById('student-id').value;
    if (!studentId) {
        alert('Please enter a Student ID');
        return;
    }

    rng = new Math.seedrandom(studentId);

    try {
        const response = await fetch('homework.json');
        homework = await response.json();
        generateProblems();
        document.querySelector('#submission button').style.display = 'block';
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

    // Load previously submitted answers if they exist
    loadPreviousAnswers();
}

function submitAnswers() {
    const answers = homework.problems.map((problem, index) => {
        if (problem.type === 'numerical') {
            return {
                value: document.getElementById(`answer-${index}-value`).value,
                unit: document.getElementById(`answer-${index}-unit`).value
            };
        } else if (problem.type === 'multiple-choice') {
            const selected = document.querySelector(`input[name="answer-${index}"]:checked`);
            return selected ? selected.value : null;
        }
    });

    // Store answers locally
    localStorage.setItem(`answers-${studentId}`, JSON.stringify(answers));

    alert('Your answers have been submitted!');
    // In a real system, you would send this data to a server
    console.log('Student Answers:', answers);
}

function loadPreviousAnswers() {
    const previousAnswers = JSON.parse(localStorage.getItem(`answers-${studentId}`));
    if (previousAnswers) {
        homework.problems.forEach((problem, index) => {
            if (problem.type === 'numerical') {
                document.getElementById(`answer-${index}-value`).value = previousAnswers[index]?.value || '';
                document.getElementById(`answer-${index}-unit`).value = previousAnswers[index]?.unit || '';
            } else if (problem.type === 'multiple-choice') {
                const radio = document.getElementById(`answer-${index}-${previousAnswers[index]}`);
                if (radio) radio.checked = true;
            }
        });
    }
}

function isValidScientificNotation(value) {
    // Regular expression to match scientific notation
    const scientificNotationRegex = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
    return scientificNotationRegex.test(value);
}

function validateAnswers() {
    let isValid = true;
    homework.problems.forEach((problem, index) => {
        if (problem.type === 'numerical') {
            const valueInput = document.getElementById(`answer-${index}-value`);
            const unitInput = document.getElementById(`answer-${index}-unit`);
            
            if (!isValidScientificNotation(valueInput.value)) {
                valueInput.style.borderColor = 'red';
                isValid = false;
            } else {
                valueInput.style.borderColor = '';
            }
            
            if (unitInput.value.trim() === '') {
                unitInput.style.borderColor = 'red';
                isValid = false;
            } else {
                unitInput.style.borderColor = '';
            }
        } else if (problem.type === 'multiple-choice') {
            const selected = document.querySelector(`input[name="answer-${index}"]:checked`);
            if (!selected) {
                document.querySelector(`input[name="answer-${index}"]`).parentElement.style.color = 'red';
                isValid = false;
            } else {
                document.querySelector(`input[name="answer-${index}"]`).parentElement.style.color = '';
            }
        }
    });
    return isValid;
}

document.querySelector('#submission button').addEventListener('click', function(event) {
    event.preventDefault();
    if (validateAnswers()) {
        submitAnswers();
    } else {
        alert('Please correct the highlighted fields before submitting.');
    }
});
