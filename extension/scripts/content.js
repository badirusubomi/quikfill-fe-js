
// function scanForms() {
// 	const forms = document.querySelectorAll('form');
// 	const result = [];

// 	forms.forEach((form, index) => {
// 		const fields = [];

// 		const inputs = form.querySelectorAll('input, textarea, select');
// 		inputs.forEach(input => {
// 			const type = input.type || input.tagName.toLowerCase();
// 			const name = input.name || input.id || input.placeholder || '';

// 			fields.push({
// 				tag: input.tagName.toLowerCase(),
// 				type,
// 				name,
// 				label: getLabel(input),
// 				required: input.required || false
// 			});
// 		});

// 		result.push({
// 			formIndex: index,
// 			action: form.action || null,
// 			method: form.method || 'GET',
// 			fields
// 		});
// 	});

// 	return result;
// }

// function getLabel(input) {
// 	const id = input.id;
// 	if (id) {
// 		const label = document.querySelector(`label[for="${id}"]`);
// 		if (label) return label.innerText.trim();
// 	}

// 	// Try to find parent label
// 	const parentLabel = input.closest('label');
// 	if (parentLabel) return parentLabel.innerText.trim();

// 	return '';
// }

// console.log("✅ content.js is running on this page");

// // Listen for message from popup or background
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
// 	if (message.type === 'SCAN_FORMS') {
// 		const forms = scanForms();
// 		sendResponse({ forms });
// 	}
// });

// Updated content.js

function scanFields() {
	const fieldSelectors = [
		'input:not([type="hidden"])',
		'textarea',
		'select',
		'[contenteditable="true"]',
		'div[role="textbox"]',
		'div[class*="field"]',
		'div[class*="input"]'
	];

	const result = [];

	fieldSelectors.forEach(selector => {
		const elements = document.querySelectorAll(selector);

		elements.forEach((el, index) => {
			const bounding = el.getBoundingClientRect();
			if (bounding.width > 0 && bounding.height > 0) {
				result.push({
					fieldIndex: index,
					tag: el.tagName.toLowerCase(),
					type: el.type || null,
					name: el.name || el.id || el.placeholder || el.getAttribute('aria-label') || null,
					label: getLabel(el),
					required: el.required || el.getAttribute('aria-required') === 'true' || false,
					value: el.value || el.textContent.trim() || null
				});
			}
		});
	});

	return result;
}

function getLabel(input) {
	const id = input.id;
	if (id) {
		const label = document.querySelector(`label[for="${id}"]`);
		if (label) return label.innerText.trim();
	}

	// Try to find parent label
	const parentLabel = input.closest('label');
	if (parentLabel) return parentLabel.innerText.trim();

	// Try ARIA label
	const ariaLabel = input.getAttribute('aria-label');
	if (ariaLabel) return ariaLabel;

	// Fallback to placeholder or null
	return input.placeholder || null;
}

console.log("✅ content.js is running on this page");

// Listen for message from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'SCAN_FIELDS') {
		const fields = scanFields();
		sendResponse({ fields });
	}
});

