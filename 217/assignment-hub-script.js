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

// Function to verify student ID with Flask API
async function verifyStudentId(studentId) {
    const replitUrl = getUrlParameter('replit');
    if (!replitUrl) {
        throw new Error('Replit URL not provided.');
    }

    const apiUrl = `${replitUrl}/verify?id=${encodeURIComponent(studentId)}`;
    const response = await fetch(apiUrl, { method: 'GET' });
    
    if (!response.ok) {
        throw new Error(`Failed to verify student ID. Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.isValid;
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

// Function to display error messages on the page
function displayError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Function to display loading indicator
function setLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = isLoading ? 'block' : 'none';
}

// Function to set the page title
function setPageTitle() {
    const courseNumber = getUrlParameter('course_id');
    const homeworkNumber = getUrlParameter('hw');
    
    if (courseNumber && homeworkNumber) {
        const newTitle = `Physics ${courseNumber} Homework #${homeworkNumber}`;
        document.title = newTitle;
        
        // Also update the h1 element
        const titleElement = document.getElementById('page-title');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }
}

// Function to check if all required elements are present
function checkRequiredElements() {
    const requiredIds = ['student-form', 'student-id', 'error-message', 'loading', 'assignment-content', 'questions'];
    const missingElements = requiredIds.filter(id => document.getElementById(id) === null);
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
    }
}

// Main function to initialize the assignment hub
async function initAssignmentHub() {
    try {
        console.log('Initializing assignment hub...');
        checkRequiredElements();
        setPageTitle();
        
        const studentForm = document.getElementById('student-form');
        const assignmentContent = document.getElementById('assignment-content');
        const questionsDiv = document.getElementById('questions');

        console.log('Adding event listener to student form...');
        studentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            setLoading(true);
            try {
                // clears previous error messages
                errorMessageDiv.style.display = 'none';
                errorMessageDiv.textContent = '';
                const studentId = document.getElementById('student-id').value;
                const flagCheck = getUrlParameter('fl');

                // Load problems
                const problems = await loadProblems();

                // Handle roster check if `fl` is '1'
                if (flagCheck === '1') {
                    const isValid = await verifyStudentId(studentId);
                    if (!isValid) {
                        throw new Error('Student ID not found, please try again or contact your professor!');
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

            } catch (error) {
                console.error('Error in form submission:', error);
                displayError(`An error occurred during form submission: ${error.message}`);
                // Keep the form visible on error
                studentForm.style.display = 'block';
                assignmentContent.style.display = 'none';
            } finally {
                setLoading(false);
            }
        });

        console.log('Assignment hub initialized successfully.');
    } catch (error) {
        console.error('Error in initAssignmentHub:', error);
        displayError(`Failed to initialize assignment hub: ${error.message}`);
    }
}

// Async wrapper function for initializing the hub
async function initializeHub() {
    try {
        console.log('Window loaded, initializing assignment hub...');
        await initAssignmentHub();
    } catch (error) {
        console.error('Uncaught error in initAssignmentHub:', error);
        displayError(`An unexpected error occurred: ${error.message}`);
    }
}

// Initialize the assignment hub when the page loads
window.addEventListener('load', initializeHub);

// Debug function to check URL parameters
function debugUrlParameters() {
    console.log('course_id:', getUrlParameter('course_id'));
    console.log('hw:', getUrlParameter('hw'));
    console.log('fl:', getUrlParameter('fl'));
    console.log('replit:', getUrlParameter('replit'));
}

// Call debug function on load
window.addEventListener('load', debugUrlParameters);
