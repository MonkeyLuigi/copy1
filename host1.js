// Import Octokit (for environments like bundlers or modern browsers)
import { Octokit } from 'https://cdn.skypack.dev/@octokit/core';

const GITHUB_API_URL = 'https://api.github.com/repos/monkeyluigi/senior_assassin/contents/';
const GITHUB_TOKEN_NO_PREFIX = "1DyloV1tSDJW813AgexIkMVK2YMqqX155bPA";
const GITHUB_TOKEN = 'ghp_' + GITHUB_TOKEN_NO_PREFIX;
const GITHUB_API_OWNER = 'monkeyluigi'; // Replace with your GitHub username
const GITHUB_API_REPO = 'senior_assassin'; // Replace with your repository name

const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

// Declare global variable for players
let players = [];

// Function to start a new game
async function startNewGame() {
    const gameCode = Math.floor(Math.random() * 1000000).toString();
    const hostPassword = Math.floor(Math.random() * 1000000).toString(); // Generate random password
    const filePath = `${gameCode}.json`; // Each game gets its own file
    const initialData = {
        gameCode: gameCode,
        hostPassword: hostPassword,
        players: []
    };

    try {
        // Attempt to create a new game file on GitHub
        const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner: GITHUB_API_OWNER,
            repo: GITHUB_API_REPO,
            path: filePath,
            message: `Create a new game with code ${gameCode}`,
            committer: {
                name: 'Game Host',
                email: 'kaden.c.clayton@gmail.com'
            },
            content: btoa(JSON.stringify(initialData)),
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (response.status === 201) { // Status 201 indicates successful file creation
            document.getElementById('game-code-display').textContent = `Game Code: ${gameCode}`;
            document.getElementById('host-password-display').textContent = `Host Password: ${hostPassword}`;
            alert("Game started! Save the password to edit the game.");
        } else {
            alert("Failed to create game. Please check your GitHub settings.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while creating the game.");
    }
}

// Function to resume a game by game code
async function resumeGame() {
    const gameCode = document.getElementById('resume-game-code').value.trim();
    const enteredPassword = document.getElementById('host-game-password').value.trim();
    const statusElement = document.getElementById('resume-status'); // Status messages

    if (!gameCode || !enteredPassword) {
        statusElement.textContent = "Please enter both a valid game code and password.";
        statusElement.style.color = "red";
        return;
    }

    try {
        const filePath = `${gameCode}.json`;

        // Fetch game data
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

            // Verify password
            if (gameData.hostPassword !== enteredPassword) {
                statusElement.textContent = "Incorrect password. Access denied.";
                statusElement.style.color = "red";
                return;
            }

            // Render player list if password is correct
            if (gameData.players && gameData.players.length > 0) {
                renderPlayerList(gameData.players);
                statusElement.textContent = "Game loaded successfully!";
                statusElement.style.color = "green";
            } else {
                statusElement.textContent = "No players found in the game.";
                statusElement.style.color = "red";
            }
        } else {
            statusElement.textContent = "Game not found. Check the game code.";
            statusElement.style.color = "red";
        }
    } catch (error) {
        console.error('Error:', error);
        statusElement.textContent = "An error occurred while loading the game.";
        statusElement.style.color = "red";
    }
}

// Function to render the list of players
function renderPlayerList(players) {
    const playerListContainer = document.getElementById('player-list');

    // Clear existing content
    playerListContainer.innerHTML = '';

    // Loop through players and create HTML for each
    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';

        const playerName = document.createElement('h3');
        playerName.textContent = `Name: ${player.name}`;

        const playerStatus = document.createElement('p');
        playerStatus.textContent = `Status: ${player.status}`;

        const contactInfo = document.createElement('p');
        contactInfo.textContent = `Contact: ${player.contact || "N/A"}`;

        const playerImage = document.createElement('img');
        playerImage.src = player.profilePicture || "placeholder.png"; // Fallback for missing profile picture
        playerImage.alt = `${player.name}'s profile picture`;
        playerImage.style.width = '100px';

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removePlayer(index);

        const killButton = document.createElement('button');
        killButton.textContent = 'Kill';
        killButton.onclick = () => killPlayer(index);

        // Append everything to the playerDiv
        playerDiv.appendChild(playerImage);
        playerDiv.appendChild(playerName);
        playerDiv.appendChild(playerStatus);
        playerDiv.appendChild(contactInfo);
        playerDiv.appendChild(removeButton);
        playerDiv.appendChild(killButton);

        // Append playerDiv to the container
        playerListContainer.appendChild(playerDiv);
    });
}

// Expose `startNewGame` and `resumeGame` globally
window.startNewGame = startNewGame;
window.resumeGame = resumeGame;
