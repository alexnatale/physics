// Utility function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to load hashed student IDs from S3
async function loadStudentRoster() {
    const rosterHash = getUrlParameter('roster');
    if (!rosterHash) {
        console.log('No roster hash provided. Skipping roster check.');
        return null;
    }

    try {
        // Decrypt the S3 URL using a predefined key (replace 'your-secret-key' with an actual secret key)
        const bytes = CryptoJS.AES.decrypt(rosterHash, 'your-secret-key');
        const s3Url = bytes.toString(CryptoJS.enc.Utf8);

        const response = await fetch(s3Url);
        if (!response.ok) {
            throw new Error(`Failed to load roster. Status: ${response.status}`);
        }
        const hashedIds = await response.json();
        return new Set(hashedIds);
    } catch (error) {
        console.error('Error loading student roster:', error);
        throw new Error('Failed to load student roster. Please check the roster URL.');
    }
}

// Function to verify student ID
async function verifyStudentId(studentId) {
    const roster = await loadStudentRoster();
    if (!roster) return true; // If no roster is provided, allow all IDs

    const hashedStudentId = CryptoJS.SHA256(studentId).toString();
    return roster.has(hashedStudentId);
}

// ... (other utility functions remain the same)

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
                const studentId = document.getElementById('student-id').value;

                // Verify student ID
                const isValidStudent = await verifyStudentId(studentId);
                if (!isValidStudent) {
                    throw new Error('Student ID not found in the roster, please try again or contact your professor!');
                }

                // Load problems
                const problems = await loadProblems();

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
window.addEventListener('load', initAssignmentHub);
