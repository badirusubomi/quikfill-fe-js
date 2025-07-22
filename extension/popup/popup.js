document.addEventListener("DOMContentLoaded", () => {
	const loginBtn = document.getElementById("googleLogin");
	const scanBtn = document.getElementById("scanFormsBtn");
	const uploadBtn = document.getElementById("uploadSubmitBtn");
	const fileInput = document.getElementById("fileInput");
	const uploadForm = document.getElementById("uploadForm");
	const loginPage = document.getElementById("loginPage");
	const homePage = document.getElementById("homePage");

	if (localStorage.getItem("token")) {
		onLoginSuccess();
	}

	if (loginBtn) {
		loginBtn.addEventListener("click", () => {
			const authUrl = "http://localhost:8080/auth/login/google";

			// Use the Chrome Identity API to handle OAuth2 login
			// This will open a new window for Google login

			var manifest = chrome.runtime.getManifest();

			var clientId = encodeURIComponent(manifest.oauth2.client_id);

			var scopes = encodeURIComponent(manifest.oauth2.scopes.join(" "));

			var redirectUri = encodeURIComponent(
				`http://localhost:8080/auth/google/callback`
			);
			// const redirectUri = encodeURIComponent(chrome.identity.getRedirectURL());
			// console.log("Redirect URI:", redirectUri);
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
				if (!activeTab) return console.error("No active tab");

				// Inject content.js manually
				chrome.scripting.executeScript(
					{
						target: { tabId: activeTab.id },
						files: ["scripts/content.js"]
					},
					() => {
						if (chrome.runtime.lastError) {
							console.error("Script injection failed:", chrome.runtime.lastError.message);
							return;
						}

						// Now it's safe to send the SCAN_FIELDS message
						chrome.tabs.sendMessage(activeTab.id, { type: "SCAN_FIELDS" }, (response) => {
							if (chrome.runtime.lastError) {
								console.error("Message send failed:", chrome.runtime.lastError.message);
								return;
							}

							if (response?.fields) {
								console.log("✅ Fields found:", response.fields);

								(async () => {
									const queryResponse = await fetch("http://localhost:8080/query", {
										method: "POST",
										headers: {
											"Content-Type": "application/json",
											authorization: `Bearer ${localStorage.getItem("token")}`,
										},
										body: JSON.stringify({
											data: response.fields.map((field) => ({
												fieldIndex: field.fieldIndex,
												label: field.label || ''
											})),
										}),
									});

									if (!queryResponse.ok) {
										const errorData = await queryResponse.json();
										console.error("Backend query failed:", errorData);
										alert("Error: " + (errorData.message || queryResponse.statusText));
										return;
									}

									const fieldsData = await queryResponse.json();
									console.log("🔍 Backend result:", fieldsData);

									// Send the data back to content script to populate fields
									chrome.tabs.sendMessage(activeTab.id, {
										type: "POPULATE_FIELDS",
										data: fieldsData.data
									}, (response) => {
										if (chrome.runtime.lastError) {
											console.error("POPULATE_FIELDS error:", chrome.runtime.lastError.message);
											return;
										}

										console.log(response.status);
									});
								})();
							} else {
								console.warn("No fields returned.");
							}
						});
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
