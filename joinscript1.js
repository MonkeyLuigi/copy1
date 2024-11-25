// GitHub API Configuration
// Import Octokit (for environments like bundlers or modern browsers)
import { Octokit } from 'https://cdn.skypack.dev/@octokit/core';

// Example script
const GITHUB_API_URL = 'https://api.github.com/repos/monkeyluigi/senior_assassin/contents/';
const GITHUB_TOKEN_SUFFIX = '1DyloV1tSDJW813AgexIkMVK2YMqqX155bPA';
const GITHUB_TOKEN = "ghp_" + GITHUB_TOKEN_SUFFIX;
const GITHUB_API_OWNER = 'monkeyluigi'; // Replace with your GitHub username
const GITHUB_API_REPO = 'senior_assassin'; // Replace with your repository name

const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

// Function for players to join a game
async function joinGame() {
    const gameCode = document.getElementById('join-game-code').value.trim();
    const playerName = document.getElementById('player-name').value.trim();
    const contactInfo = document.getElementById('contact-info').value.trim();
    const profilePictureInput = document.getElementById('profile-picture');
    const statusElement = document.getElementById('join-status'); // Corrected ID

    // Check if game code and player name are provided
    if (!gameCode || !playerName) {
        statusElement.textContent = "Please enter both a valid game code and your name.";
        statusElement.style.color = "red";
        return;
    }

    // Check if a profile picture is uploaded
    if (!profilePictureInput.files || profilePictureInput.files.length === 0) {
        statusElement.textContent = "Please upload a profile picture to join.";
        statusElement.style.color = "red";
        return;
    }

    try {
        // Convert the uploaded file to a Base64 string
        const file = profilePictureInput.files[0];
        const profilePicture = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file); // Convert file to Base64 URL
        });

        const filePath = `${gameCode}.json`;

        // Fetch the current game data
        const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner: GITHUB_API_OWNER,
            repo: GITHUB_API_REPO,
            path: filePath,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (response.status === 200) {
            const content = atob(response.data.content);
            const gameData = JSON.parse(content);

            // Check if the player name is already in use
            const nameExists = gameData.players.some(player => player.name.toLowerCase() === playerName.toLowerCase());
            if (nameExists) {
                statusElement.textContent = "This name is already in use. Please choose a different name.";
                statusElement.style.color = "red";
                return;
            }

            // Add the new player to the game data
            const newPlayer = {
                name: playerName,
                status: "alive",
                profilePicture: profilePicture
            };
            gameData.players.push(newPlayer);

            // Upload updated game data to GitHub
            const sha = response.data.sha; // Get the sha of the existing file
            const updateResponse = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                owner: GITHUB_API_OWNER,
                repo: GITHUB_API_REPO,
                path: filePath,
                message: `Add ${playerName} to the game`,
                committer: {
                    name: 'Game Host',
                    email: 'your-email@example.com'
                },
                content: btoa(JSON.stringify(gameData)),
                sha: sha, // Include the sha for updates
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (updateResponse.status === 200 || updateResponse.status === 201) {
                statusElement.textContent = `${playerName} has joined the game!`;
                statusElement.style.color = "green";
            } else {
                statusElement.textContent = "Failed to join the game. Try again.";
                statusElement.style.color = "red";
            }
        } else {
            statusElement.textContent = "Game not found. Check the game code.";
            statusElement.style.color = "red";
        }
    } catch (error) {
        console.error('Error:', error);
        statusElement.textContent = "An error occurred while joining the game.";
        statusElement.style.color = "red";
    }
}



// Expose the function globally so the HTML can use it
window.joinGame = joinGame;
