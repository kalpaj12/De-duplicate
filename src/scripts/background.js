chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action.localeCompare("getAllTabs") === 0) {
        chrome.tabs.query({}, function(tabs) {
            sendResponse({
                data: tabs
            });
            return true;
        });
    } else if (msg.action.localeCompare("deleteDuplicate") === 0) {
        chrome.tabs.remove(msg.tabid);
    }
    return true;
});