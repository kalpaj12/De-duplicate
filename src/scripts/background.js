'use strict';

chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 0, 0, 255]
});

const rightclickOptions = {
    "blacklist": "Blacklist options",
    "visit_github": "View project on GitHub"
};

chrome.runtime.onInstalled.addListener(function() {
    for (let key of Object.keys(rightclickOptions)) {
        chrome.contextMenus.create({
            id: key,
            title: rightclickOptions[key],
            type: 'normal',
            contexts: ['all'],
        });
    }
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "blacklist") {
        chrome.tabs.create({
            url: chrome.extension.getURL('src/html/popup.html'),
            active: false
        }, function(tab) {
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                focused: true
            });
        });
    } else if (info.menuItemId === "visit_github") {
        chrome.tabs.create({
            url: "https://github.com/kalpaj12/De-duplicate",
            active: true
        });
    }
});

// Messages listeners
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

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    chrome.tabs.query({}, function(tabs) {
        // also, update the saved nonduplicate info
        chrome.browserAction.setBadgeText({
            text: tabs.length.toString()
        });
    });
});