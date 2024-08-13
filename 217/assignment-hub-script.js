// Utility function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Seeded random number generator
function seededRandom(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Function to load problems from JSON
async function loadProblems() {
    const courseId = getUrlParameter('course_id');
    const hwNumber = getUrlParameter('hw');
    
    if (!courseId || !hwNumber) {
        throw new Error('Missing course_id or hw number in URL parameters');
    }
    
    const filename = `course${courseId}_hw${hwNumber}.json`;
    const response = await fetch(filename);
    
    if (!response.ok) {
        throw new Error(`Failed to load ${filename}. Status: ${response.status}`);
    }
    
    return await response.json();
}

// Function to load student roster
async function loadStudentRoster() {
    const response = await fetch('student_roster.json');
    return await response.json();
}

// Function to generate a problem based on student ID
function generateProblem(problem, studentId) {
    let questionText = problem.question;
    if (problem.variables) {
        problem.variables.forEach(variable => {
            const value = Math.floor(seededRandom(studentId + variable.name.charCodeAt(0)) * (variable.max - variable.min + 1) + variable.min);
            questionText = questionText.replace(`{${variable.name}}`, value);
        });
    }
    return questionText;
}

// Function to shuffle array (for multiple choice options)
function shuffleArray(array, studentId) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(studentId + i) * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Main function to initialize the assignment hub
async function initAssignmentHub() {
    try {
        const problems = await loadProblems();
        const studentForm = document.getElementById('student-form');
        const assignmentContent = document.getElementById('assignment-content');
        const questionsDiv = document.getElementById('questions');
        const canvasLink = document.getElementById('canvas-link');

        studentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const studentId = document.getElementById('student-id').value;
            const flagCheck = getUrlParameter('fl');

            if (flagCheck === '1') {
                const roster = await loadStudentRoster();
                if (!roster.includes(studentId)) {
                    alert('Error: Student ID not found in the roster.');
                    return;
                }
            }

            // Generate and display problems
            questionsDiv.innerHTML = '';
            problems.problems.forEach((problem, index) => {
                const questionText = generateProblem(problem, studentId + index);
                const questionElement = document.createElement('div');
                questionElement.innerHTML = `<h3>Question ${index + 1}</h3><p>${questionText}</p>`;

                if (problem.type === 'multiple-choice') {
                    const choicesHtml = shuffleArray([...problem.choices], studentId + index)
                        .map((choice, i) => `<li>${String.fromCharCode(65 + i)}. ${choice}</li>`)
                        .join('');
                    questionElement.innerHTML += `<ul>${choicesHtml}</ul>`;
                }

                questionsDiv.appendChild(questionElement);
            });

            // Show assignment content and hide the form
            assignmentContent.style.display = 'block';
            studentForm.style.display = 'none';

            // Update Canvas quiz link
            const courseId = getUrlParameter('course_id');
            const hwNumber = getUrlParameter('hw');
            canvasLink.href = `https://your-canvas-instance.instructure.com/courses/${courseId}/quizzes/${hwNumber}`;
        });
    } catch (error) {
        console.error('Error initializing assignment hub:', error);
        alert('An error occurred while loading the assignment. Please check the URL parameters and try again.');
    }
}

// Initialize the assignment hub when the page loads
window.addEventListener('load', initAssignmentHub);
