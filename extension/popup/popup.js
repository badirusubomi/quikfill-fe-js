document.addEventListener("DOMContentLoaded", () => {
	const loginBtn = document.getElementById("googleLogin");
	const scanBtn = document.getElementById("scanFormsBtn");
	const loginPage = document.getElementById("loginPage");
	const homePage = document.getElementById("homePage");

	if (loginBtn) {
		loginBtn.addEventListener("click", () => {
			const authUrl = "http://localhost:8080/auth/login/google";

			// Normally you'd use chrome.identity.launchWebAuthFlow here
			// Simulating success for now:

			var manifest = chrome.runtime.getManifest();

			var clientId = encodeURIComponent(manifest.oauth2.client_id);

			var scopes = encodeURIComponent(manifest.oauth2.scopes.join(" "));

			var redirectUri = encodeURIComponent(
				`http://localhost:8080/auth/google/callback`
			);
			var url =
				"https://accounts.google.com/o/oauth2/auth" +
				"?client_id=" +
				clientId +
				"&response_type=code" +
				"&access_type=offline" +
				"&redirect_uri=" +
				redirectUri +
				"&scope=" +
				scopes;

			chrome.identity.launchWebAuthFlow(
				{
					url: url,
					interactive: true,
				},
				function (redirectUrl) {
					if (chrome.runtime.lastError || !redirectUrl) {
						console.error(chrome.runtime.lastError);
						alert("Authentication failed");
						return;
					}

					// Parse the token from the redirect URL
					const url = new URL(redirectUrl);
					const token = url.searchParams.get("accessToken");

					if (token) {
						// Store the token in localStorage or chrome.storage
						localStorage.setItem("token", token);
						alert("Login successful!");
					} else {
						alert("Token not found");
					}
				}
			);
			onLoginSuccess();
		});
	}

	if (scanBtn) {
		scanBtn.addEventListener("click", () => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTab = tabs[0];

				if (!activeTab) {
					console.error("No active tab found");
					return;
				}

				chrome.tabs.sendMessage(
					activeTab.id,
					{ type: "SCAN_FORMS" },
					(response) => {
						if (chrome.runtime.lastError) {
							console.error("Error:", chrome.runtime.lastError.message);
							return;
						}

						if (response && response.forms) {
							console.log("Forms detected:", response.forms);
							// TODO: Show in UI or send to LLM
						}
					}
				);
			});
		});
	}

	function onLoginSuccess() {
		if (loginPage) loginPage.style.display = "none";
		if (homePage) homePage.style.display = "block";
	}
});
