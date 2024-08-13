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

// Function to load student roster from a dynamic URL
async function loadStudentRoster() {
    const rosterUrl = getUrlParameter('roster');
    if (!rosterUrl) {
        console.log('No roster URL provided. Skipping roster check.');
        return null;
    }

    try {
        const response = await fetch(rosterUrl);
        if (!response.ok) {
            throw new Error(`Failed to load roster. Status: ${response.status}`);
        }
        const csvText = await response.text();
        
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                complete: function(results) {
                    // Extract student IDs from the parsed CSV
                    const studentIds = results.data.map(row => row['Student ID']);
                    resolve(studentIds);
                },
                error: function(error) {
                    reject(new Error('Failed to parse CSV: ' + error.message));
                }
            });
        });
    } catch (error) {
        console.error('Error loading student roster:', error);
        throw new Error('Failed to load student roster. Please check the roster URL.');
    }
}

    try {
        const response = await fetch(rosterUrl);
        if (!response.ok) {
            throw new Error(`Failed to load roster. Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading student roster:', error);
        throw new Error('Failed to load student roster. Please check the roster URL.');
    }
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
    const requiredIds = ['student-form', 'student-id', 'error-message', 'loading', 'assignment-content', 'questions', 'canvas-link'];
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
        const canvasLink = document.getElementById('canvas-link');

        console.log('Adding event listener to student form...');
        studentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            setLoading(true);
            try {
                const studentId = document.getElementById('student-id').value;
                const flagCheck = getUrlParameter('fl');

                // Load problems
                const problems = await loadProblems();

                if (flagCheck === '1') {
                    const roster = await loadStudentRoster();
                    if (roster && !roster.includes(studentId)) {
                        throw new Error('Student ID not found in the roster, please try again or contact your professor!');
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
            } catch (error) {
                console.error('Error in form submission:', error);
                displayError(`An error occurred during form submission: ${error.message}`);
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

// Initialize the assignment hub when the page loads
window.addEventListener('load', function() {
    console.log('Window loaded, initializing assignment hub...');
    initAssignmentHub().catch(error => {
        console.error('Uncaught error in initAssignmentHub:', error);
        displayError(`An unexpected error occurred: ${error.message}`);
    });
});

// Debug function to check URL parameters
function debugUrlParameters() {
    console.log('course_id:', getUrlParameter('course_id'));
    console.log('hw:', getUrlParameter('hw'));
    console.log('fl:', getUrlParameter('fl'));
    console.log('roster:', getUrlParameter('roster'));
}

// Call debug function on load
window.addEventListener('load', debugUrlParameters);
