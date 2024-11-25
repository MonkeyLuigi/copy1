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
