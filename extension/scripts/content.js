// Final content.js with iframe + Shadow DOM + late-load handling

function scanFieldsInDocument(doc = document) {
	const fieldSelectors = [
		'input:not([type="hidden"])',
		'input[type="text"]',
		'input[type="email"]',
		'textarea',
		'select',
		'[contenteditable="true"]',
		'div[role="textbox"]',
		'div[class*="field"]',
		'div[class*="input"]'
	];

	const result = [];

	fieldSelectors.forEach(selector => {
		const elements = doc.querySelectorAll(selector);

		elements.forEach((el, index) => {
			const bounding = el.getBoundingClientRect();
			if (bounding.width > 0 && bounding.height > 0) {
				result.push({
					fieldIndex: index,
					tag: el.tagName.toLowerCase(),
					type: el.type || null,
					name: el.name || el.id || el.placeholder || el.getAttribute('aria-label') || null,
					label: getLabel(el, doc),
					required: el.required || el.getAttribute('aria-required') === 'true' || false,
					value: el.value || el.textContent.trim() || null
				});
			}
		});
	});

	// Handle Shadow DOM
	const allElements = doc.querySelectorAll('*');
	allElements.forEach(el => {
		if (el.shadowRoot) {
			const shadowFields = scanFieldsInDocument(el.shadowRoot);
			result.push(...shadowFields);
		}
	});

	// Handle same-origin iframes
	const iframes = doc.querySelectorAll('iframe');
	iframes.forEach(iframe => {
		try {
			const childDoc = iframe.contentDocument || iframe.contentWindow.document;
			if (childDoc) {
				const nestedFields = scanFieldsInDocument(childDoc);
				result.push(...nestedFields);
			}
		} catch (err) {
			console.warn("Cannot access iframe:", iframe.src);
		}
	});

	return result;
}

function getLabel(input, doc = document) {
	const id = input.id;
	if (id) {
		const label = doc.querySelector(`label[for="${id}"]`);
		if (label) return label.innerText.trim();
	}

	const parentLabel = input.closest('label');
	if (parentLabel) return parentLabel.innerText.trim();

	const ariaLabel = input.getAttribute('aria-label');
	if (ariaLabel) return ariaLabel;

	return input.placeholder || null;
}

function scanFields() {
	return scanFieldsInDocument(document);
}

function populateField(el, value) {
	if (!el) return;
	if (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "file")) {
		el.value = value;
		el.dispatchEvent(new Event("input", { bubbles: true }));
	} else if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
		el.textContent = value;
	} else if (el.tagName === "DIV" && el.getAttribute("role") === "textbox") {
		el.innerText = value;
	}
	el.style.backgroundColor = "#e0ffe0";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'SCAN_FIELDS') {
		const fields = scanFields();
		sendResponse({ fields });
	}

	if (message.type === 'POPULATE_FIELDS') {
		const backendData = message.data;

		backendData.forEach((fieldResponse) => {
			let el = document.querySelector(`[name="${fieldResponse.label}"], [id="${fieldResponse.label}"]`);

			if (!el) {
				const possibleElements = document.querySelectorAll(
					'input:not([type="hidden"]), textarea, select, [contenteditable="true"], div[role="textbox"], div[class*="field"], div[class*="input"]'
				);
				el = possibleElements[fieldResponse.fieldIndex];
			}

			populateField(el, fieldResponse.response);
		});

		sendResponse({ status: "✅ Fields populated successfully" });
	}
});

console.log("✅ content.js loaded and listening");

// Handle late-loaded pages
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		console.log("📄 DOM fully loaded");
	});
} else {
	console.log("📄 DOM already loaded");
}
