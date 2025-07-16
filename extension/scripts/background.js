document.getElementById('scanFormsBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tabId = tabs[0].id;

        chrome.tabs.sendMessage(tabId, { type: 'SCAN_FORMS' }, response => {
            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError.message);
                return;
            }

            if (response && response.forms) {
                console.log('Forms detected:', response.forms);
                // Do something with the form data (e.g., send to LLM, display in UI)
            }
        });
    });
});
