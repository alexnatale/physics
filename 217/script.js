    // Global variables
        let homework = null;
        let studentId = '';
        let rng = null;

        // Function to get the course number and homework number from the HTML filename
        function getHomeworkInfo() {
            const filename = window.location.pathname.split('/').pop();
            const match = filename.match(/^(\d+)hw(\d+)\.html$/);
            if (match) {
                return {
                    courseNumber: match[1],
                    homeworkNumber: match[2]
                };
            }
            return null;
        }

        // Function to load homework data
        async function loadHomework() {
            const homeworkInfo = getHomeworkInfo();
            if (!homeworkInfo) {
                console.error('Invalid HTML filename format');
                return;
            }

            const { courseNumber, homeworkNumber } = homeworkInfo;
            console.log(`Loading homework for course ${courseNumber}, homework ${homeworkNumber}`);

            try {
                // Adjust this URL to point to your GitHub raw content
                const response = await fetch(`https://raw.githubusercontent.com/your-username/your-repo/main/course${courseNumber}_hw${homeworkNumber}.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                homework = await response.json();
                console.log('Homework JSON:', homework);
                document.getElementById('homework-title').textContent = `Homework ${homeworkNumber} - Physics ${courseNumber}`;
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
            studentId = document.getElementById('student-id').value;
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

                if (problem.type === 'multiple-choice') {
                    problemDiv.innerHTML += `
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

        // Event listener for the load homework button
        document.getElementById('load-homework-button').addEventListener('click', loadHomework);

        // Load homework info when the script runs
        window.addEventListener('load', () => {
            const homeworkInfo = getHomeworkInfo();
            if (homeworkInfo) {
                document.getElementById('homework-title').textContent = `Homework ${homeworkInfo.homeworkNumber} - Physics ${homeworkInfo.courseNumber}`;
            }
        });
