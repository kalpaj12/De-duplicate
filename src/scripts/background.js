chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 0, 0, 255]
});

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
    } else if (msg.action.localeCompare("switchNonDuplicate") === 0) {
        chrome.tabs.update(msg.tabInfo.duplicateOfid, {
            active: true
        }, function(tab) {
            chrome.windows.update(tab.windowId, {
                focused: true
            });
        });
    } else if (msg.action.localeCompare("setBadgeText") === 0) {
        chrome.browserAction.setBadgeText({
            text: msg.text
        });
    }
    return true;
});