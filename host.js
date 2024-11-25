// FIX THISSSSSS
// Import Octokit (for environments like bundlers or modern browsers)
import { Octokit } from 'https://cdn.skypack.dev/@octokit/core';

// Example script
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
    const filePath = `${gameCode}.json`; // Each game gets its own file
    const initialData = {
        gameCode: gameCode,
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
            alert("Game started! Share this code with joiners.");
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
    const statusElement = document.getElementById('resume-status'); // Status messages

    if (!gameCode) {
        statusElement.textContent = "Please enter a valid game code.";
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

            // Render player list
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

async function removePlayer(index) {
    const gameCode = document.getElementById('resume-game-code').value.trim();

    if (!gameCode) {
        alert("No game code found. Please resume a game first.");
        return;
    }

    const filePath = `${gameCode}.json`;

    try {
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

            // Remove the player at the specified index
            gameData.players.splice(index, 1);

            // Update the game data on GitHub
            const updateResponse = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                owner: GITHUB_API_OWNER,
                repo: GITHUB_API_REPO,
                path: filePath,
                message: `Remove player at index ${index}`,
                committer: {
                    name: 'Game Host',
                    email: 'your-email@example.com'
                },
                content: btoa(JSON.stringify(gameData)),
                sha: response.data.sha, // Required for updates
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (updateResponse.status === 200) {
                alert("Player removed successfully!");
                renderPlayerList(gameData.players); // Refresh the list
            } else {
                alert("Failed to update the game data. Try again.");
            }
        } else {
            alert("Failed to fetch the game data. Check the game code.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while removing the player.");
    }
}



// Function to render the list of players
function renderPlayerList(players) {
    const playerListContainer = document.getElementById('player-list'); // Ensure this exists in your HTML

    // Clear existing content
    playerListContainer.innerHTML = '';

    // Loop through players and create HTML for each
    players.forEach((player,index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';

        const playerName = document.createElement('h3');
        playerName.textContent = `Name: ${player.name}`;

        const playerStatus = document.createElement('p');
        playerStatus.textContent = `Status: ${player.status}`;

        const contactInfo = document.createElement('p');
        contactInfo.textContent = `Contact: ${player.contact}`;

        const playerImage = document.createElement('img');
        playerImage.src = player.profilePicture; // Base64 or URL
        playerImage.alt = `${player.name}'s profile picture`;
        playerImage.style.width = '100px'; // Adjust size as needed

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-button';
        removeButton.onclick = () => removePlayer(index); // Pass the player's index

        // Append everything to the playerDiv
        playerDiv.appendChild(playerImage);
        playerDiv.appendChild(playerName);
        playerDiv.appendChild(playerStatus);
        playerDiv.appendChild(contactInfo);
        playerDiv.appendChild(removeButton);

        // Append playerDiv to the container
        playerListContainer.appendChild(playerDiv);
    });
}

// Make `startNewGame` and `resumeGame` accessible in the global scope for HTML onclick usage
window.startNewGame = startNewGame;
window.resumeGame = resumeGame;
