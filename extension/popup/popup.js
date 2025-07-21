document.addEventListener("DOMContentLoaded", () => {
	const loginBtn = document.getElementById("googleLogin");
	const scanBtn = document.getElementById("scanFormsBtn");
	const uploadBtn = document.getElementById("uploadSubmitBtn");
	const fileInput = document.getElementById("fileInput");
	const uploadForm = document.getElementById("uploadForm");
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
						// alert("Login successful!");
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

	uploadForm.addEventListener("submit", async (event) => {
		// Listen for 'submit' event
		event.preventDefault(); // <--- THIS IS THE CRUCIAL LINE

		const formData = new FormData();
		formData.append("file", fileInput.files[0]);

		try {
			let uploadResponse = await fetch(`http://localhost:8080/upload`, {
				headers: {
					authorization: `Bearer ${localStorage.getItem("token")}`,
					// Note: Content-Type is handled automatically by fetch when using FormData
					// so you don't need to set it explicitly for multipart/form-data
				},
				method: "POST",
				body: formData,
			});

			// Always check response.ok for successful HTTP status (200-299)
			if (!uploadResponse.ok) {
				const errorData = await uploadResponse.json();
				console.error(
					"Upload failed:",
					errorData.message || uploadResponse.statusText
				);
				alert(
					"Upload failed: " + (errorData.message || uploadResponse.statusText)
				);
				return; // Stop execution if response is not OK
			}

			const responseData = await uploadResponse.json(); // It's .json() not .json
			console.log("Upload successful:", responseData);
			alert("File uploaded successfully!");
		} catch (error) {
			console.error("Network or parsing error:", error);
			alert("An error occurred during upload. Check console for details.");
		}
	});

	function onLoginSuccess() {
		if (loginPage) loginPage.style.display = "none";
		if (homePage) homePage.style.display = "block";
	}
});
