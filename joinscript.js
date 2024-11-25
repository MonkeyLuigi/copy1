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
async function uploadImageToGitHub(imageFile, fileName) {
    const filePath = `images/${fileName}`; // Store in the 'images/' folder
    const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // Extract base64 content
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });

    try {
        const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner: GITHUB_API_OWNER,
            repo: GITHUB_API_REPO,
            path: filePath,
            message: `Upload image: ${fileName}`,
            committer: {
                name: "Game Host",
                email: "your-email@example.com"
            },
            content: base64Content, // Base64 encoded image content
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (response.status === 201) {
            return `https://raw.githubusercontent.com/${GITHUB_API_OWNER}/${GITHUB_API_REPO}/main/${filePath}`;
        } else {
            throw new Error("Failed to upload the image.");
        }
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    }
}


// Function for players to join a game
async function joinGame() {
    const gameCode = document.getElementById('join-game-code').value.trim();
    const playerName = document.getElementById('player-name').value.trim();
    const contactInfo = document.getElementById('contact-info').value.trim();
    const profilePictureInput = document.getElementById('profile-picture');
    const statusElement = document.getElementById('join-status');

    if (!gameCode || !playerName || !contactInfo) {
        statusElement.textContent = "Please enter a valid game code, contact info, and/or your name.";
        statusElement.style.color = "red";
        return;
    }

    if (!profilePictureInput.files || profilePictureInput.files.length === 0) {
        statusElement.textContent = "Please upload a profile picture to join.";
        statusElement.style.color = "red";
        return;
    }

    try {
        const profilePictureFile = profilePictureInput.files[0];
        const uniqueFileName = `${playerName}_${Date.now()}.jpg`; // Ensure unique file name
        const profilePictureURL = await uploadImageToGitHub(profilePictureFile, uniqueFileName);

        if (!profilePictureURL) {
            statusElement.textContent = "Failed to upload profile picture. Please try again.";
            statusElement.style.color = "red";
            return;
        }

        const filePath = `${gameCode}.json`;

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

            const nameExists = gameData.players.some(player => player.name.toLowerCase() === playerName.toLowerCase());
            if (nameExists) {
                statusElement.textContent = "This name is already in use. Please choose a different name.";
                statusElement.style.color = "red";
                return;
            }

            const newPlayer = {
                name: playerName,
                contact: contactInfo,
                status: "alive",
                profilePicture: profilePictureURL
            };
            gameData.players.push(newPlayer);

            const sha = response.data.sha;
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
                sha: sha,
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
