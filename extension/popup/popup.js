// popup.js
//     const authUrl = 'http://localhost:8080/auth/login/google'; // Redirects to Google

//     // chrome.identity.launchWebAuthFlow({
//     //     url: authUrl,
//     //     interactive: true
//     // }, function (redirectUrl) {
//     //     if (chrome.runtime.lastError || !redirectUrl) {
//     //         console.error(chrome.runtime.lastError);
//     //         alert('Authentication failed');
//     //         return;
//     //     }

//     //     // Parse the token from the redirect URL
//     //     const url = new URL(redirectUrl);
//     //     const token = url.searchParams.get('token');

//     //     if (token) {
//     //         // Store the token in localStorage or chrome.storage
//     //         localStorage.setItem('token', token);
//     //         alert('Login successful!');
//     //     } else {
//     //         alert('Token not found');
//     //     }
//     // });

//     onLoginSuccess();
// });


document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('googleLogin');
    const scanBtn = document.getElementById('scanFormsBtn');
    const loginPage = document.getElementById('loginPage');
    const homePage = document.getElementById('homePage');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const authUrl = 'http://localhost:8080/auth/login/google';

            // Normally you'd use chrome.identity.launchWebAuthFlow here
            // Simulating success for now:
            onLoginSuccess();
        });
    }

    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];

                if (!activeTab) {
                    console.error('No active tab found');
                    return;
                }

                chrome.tabs.sendMessage(activeTab.id, { type: 'SCAN_FORMS' }, response => {
                    if (chrome.runtime.lastError) {
                        console.error('Error:', chrome.runtime.lastError.message);
                        return;
                    }

                    if (response && response.forms) {
                        console.log('Forms detected:', response.forms);
                        // TODO: Show in UI or send to LLM
                    }
                });
            });
        });
    }

    function onLoginSuccess() {
        if (loginPage) loginPage.style.display = 'none';
        if (homePage) homePage.style.display = 'block';
    }
});

