function scanForms() {
	const forms = document.querySelectorAll('form');
	const result = [];

	forms.forEach((form, index) => {
		const fields = [];

		const inputs = form.querySelectorAll('input, textarea, select');
		inputs.forEach(input => {
			const type = input.type || input.tagName.toLowerCase();
			const name = input.name || input.id || input.placeholder || '';

			fields.push({
				tag: input.tagName.toLowerCase(),
				type,
				name,
				label: getLabel(input),
				required: input.required || false
			});
		});

		result.push({
			formIndex: index,
			action: form.action || null,
			method: form.method || 'GET',
			fields
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

	return '';
}

// Listen for message from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'SCAN_FORMS') {
		const forms = scanForms();
		sendResponse({ forms });
	}
});
