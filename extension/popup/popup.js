document.getElementById('googleLogin').addEventListener('click', () => {
    const authUrl = 'http://localhost:8080/auth/google'; // Redirects to Google

    chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
    }, function (redirectUrl) {
        if (chrome.runtime.lastError || !redirectUrl) {
            console.error(chrome.runtime.lastError);
            alert('Authentication failed');
            return;
        }

        // Parse the token from the redirect URL
        const url = new URL(redirectUrl);
        const token = url.searchParams.get('token');

        if (token) {
            // Store the token in localStorage or chrome.storage
            localStorage.setItem('token', token);
            alert('Login successful!');
        } else {
            alert('Token not found');
        }
    });
});
