'use strict';

var greatSuspenderDomain = "chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html";

chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 0, 0, 255]
});

function getAllTabs(callback) {
    chrome.tabs.query({}, function(tabs) {
        callback(tabs);
    });
}

function closeDuplicateTabs(tabId) {
    chrome.tabs.get(tabId, function(tab) {
        if (chrome.runtime.lastError) {
            // This error can be ignored due
            // to the fact that while cleaning up another tab, this tab was removed
            // but was not updated to storage.local
            console.log(chrome.runtime.lastError.message);
        } else if (tab && tab.id) {
            chrome.tabs.remove(tab.id);
        }
    });
}

// function switchNonDuplicate(tabInfo) {
//     chrome.tabs.update(tabInfo.duplicateOfid, {
//         active: true
//     }, function(tab) {
//         chrome.windows.update(tab.windowId, {
//             focused: true
//         });
//     });
// }

function removeSingleDuplicate(duplicateTabinfo) {
    // switchNonDuplicate(duplicateTabinfo);
    closeDuplicateTabs(duplicateTabinfo[0].id);
}

function removeMultipleDuplicates(duplicateTabinfo) {
    duplicateTabinfo.forEach((element, pos, duplicateTabinfo) => {
        closeDuplicateTabs(element.id);
        if (Object.is(duplicateTabinfo.length - 1, pos)) {
            // switchNonDuplicate(element);
        }
    });
}

function setBadgeText(text) {
    chrome.browserAction.setBadgeText({
        text: text
    });
}

function cleanduplicates(newTabDetails) {
    var totalduplicatesclosed = 0;
    var duplicateTabCount = 0;
    var newtabsadded = 0;

    var nonduplicateTabinfo = new Array();
    var duplicateTabinfo = new Array();

    chrome.storage.local.get(['Deduplicate'], function(result) {
        if ((['Deduplicate'] in result)) {
            totalduplicatesclosed += result.Deduplicate.totalduplicatesclosed;
            nonduplicateTabinfo = result.Deduplicate.nonduplicateTabinfo;

            var chromeCleanupSynchoronous = new Promise((resolve, reject) => {
                newTabDetails.forEach((element, pos, tabs) => {
                    if (!element.incognito) {
                        if (element.url.includes(greatSuspenderDomain)) {
                            var urlBegin = element.url.indexOf("&uri=");
                            element.url = element.url.substring(urlBegin + 5);
                        }

                        var tabInfo = {
                            id: element.id,
                            url: element.url,
                            windowId: element.windowId,
                            duplicateOfid: element.id
                        };

                        var isDuplicate = nonduplicateTabinfo.find(({
                            url,
                            id
                        }) => (url == tabInfo.url) && (id != tabInfo.id));

                        if (isDuplicate) {
                            console.log(element, isDuplicate);
                            duplicateTabinfo.push(tabInfo);
                            totalduplicatesclosed++;
                            duplicateTabCount++;
                        } else {
                            nonduplicateTabinfo.push(tabInfo);
                            newtabsadded++;
                        }
                    }
                    if (pos === tabs.length - 1) resolve();
                });
            });

            chromeCleanupSynchoronous.then(() => {

                // requires fix
                chrome.browserAction.getBadgeText({}, function(result) {
                    var value = parseInt(result, 10);
                    value -= duplicateTabCount;
                    value += newtabsadded;
                    setBadgeText(value.toString());
                });

                chrome.storage.local.set({
                    Deduplicate: {
                        totalduplicatesclosed,
                        nonduplicateTabinfo,
                    }
                });

                if (duplicateTabCount == 1) {
                    removeSingleDuplicate(duplicateTabinfo);
                } else if (duplicateTabCount > 1) {
                    removeMultipleDuplicates(duplicateTabinfo);
                }
            });
        } else {
            console.error("SYNC ERROR");
        }
    });
}

// Context => Right click
const rightclickOptions = {
    "blacklist": "Blacklist options",
    "visit_github": "View project on GitHub"
};

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "blacklist") {
        chrome.runtime.openOptionsPage();
    } else if (info.menuItemId === "visit_github") {
        chrome.tabs.create({
            url: "https://github.com/kalpaj12/De-duplicate",
            active: true
        });
    }
});

chrome.runtime.onInstalled.addListener(function() {

    for (let key of Object.keys(rightclickOptions)) {
        chrome.contextMenus.create({
            id: key,
            title: rightclickOptions[key],
            type: 'normal',
            contexts: ['all'],
        });
    }

    chrome.runtime.openOptionsPage();

    getAllTabs(function(tabs) {
        var nonduplicateTabCount = 0;
        var duplicateTabCount = 0;

        var duplicateURLTrackerSet = new Set();
        var duplicateTabinfo = new Array();
        var nonduplicateTabinfo = new Array();

        var chromeCleanupSynchoronous = new Promise((resolve, reject) => {
            tabs.forEach((element, pos, tabs) => {
                if (!element.incognito) {
                    if (element.url.includes(greatSuspenderDomain)) {
                        var urlBegin = element.url.indexOf("&uri=");
                        element.url = element.url.substring(urlBegin + 5);
                    }

                    var tabInfo = {
                        id: element.id,
                        url: element.url,
                        windowId: element.windowId,
                        duplicateOfid: element.id
                    };

                    if (!duplicateURLTrackerSet.has(tabInfo.url)) {
                        duplicateURLTrackerSet.add(tabInfo.url);
                        nonduplicateTabinfo.push(tabInfo);
                        nonduplicateTabCount++;
                    } else {
                        const tab = nonduplicateTabinfo.find(({
                            url
                        }) => url === tabInfo.url);
                        tabInfo.duplicateOfid = tab.id;
                        duplicateTabinfo.push(tabInfo);
                        duplicateTabCount++;
                    }
                }
                if (pos === tabs.length - 1) resolve();
            });
        });

        chromeCleanupSynchoronous.then(() => {
            setBadgeText(nonduplicateTabCount.toString());

            // The below line is for debug purpose, doesn't affect anything.
            chrome.storage.local.remove(['Deduplicate']);

            chrome.storage.local.set({
                Deduplicate: {
                    totalduplicatesclosed: duplicateTabCount,
                    nonduplicateTabinfo,
                }
            });

            if (duplicateTabCount == 1) {
                removeSingleDuplicate(duplicateTabinfo);
            } else if (duplicateTabCount > 1) {
                removeMultipleDuplicates(duplicateTabinfo);
            }
        });
    });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (!removeInfo.isWindowClosing) {
        console.log("Tab is closing: ", tabId, removeInfo);

        // A tab might be closed manually or via this extension
        chrome.storage.local.get(['Deduplicate'], function(result) {
            if ((['Deduplicate'] in result)) {
                var closedTab = result.Deduplicate.nonduplicateTabinfo.find(({
                    id
                }) => id == tabId);
                if (closedTab) {
                    // This tab was closed manually and was a previous non-duplicate;
                    var nonduplicateTabinfo = result.Deduplicate.nonduplicateTabinfo.filter(function(element) {
                        return element.id !== tabId;
                    });
                    chrome.storage.local.set({
                        Deduplicate: {
                            totalduplicatesclosed: result.Deduplicate.totalduplicatesclosed,
                            nonduplicateTabinfo,
                        }
                    });
                    setBadgeText(nonduplicateTabinfo.length.toString());
                } else {
                    // This extension cleaned up a tab;
                }
            } else {
                console.error("SYNC ERROR");
            }
        });
    }
});

chrome.windows.onRemoved.addListener(function(windowId) {
    console.log("Window is closing", windowId);
    chrome.storage.local.get(['Deduplicate'], function(result) {
        if ((['Deduplicate'] in result)) {
            chrome.windows.getAll({
                populate: true
            }, function(windows) {
                if (windows.length == 0) {
                    chrome.storage.local.set({
                        Deduplicate: {
                            totalduplicatesclosed: result.Deduplicate.totalduplicatesclosed,
                            nonduplicateTabinfo: []
                        }
                    });
                } else {
                    var nonduplicateTabinfo = result.Deduplicate.nonduplicateTabinfo.filter(function(element) {
                        return element.windowId !== windowId;
                    });
                    chrome.storage.local.set({
                        Deduplicate: {
                            totalduplicatesclosed: result.Deduplicate.totalduplicatesclosed,
                            nonduplicateTabinfo,
                        }
                    });
                    setBadgeText(nonduplicateTabinfo.length.toString());
                }
            });
        } else {
            console.error("SYNC ERROR");
        }
    });
});

var newTabDetails = new Array();
chrome.tabs.onCreated.addListener(function(tab) {
    console.log("new tab added:", tab);
    newTabDetails.push(tab);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // What if a previous non-duplicate tab is updated to a duplicate?
    if (changeInfo.status && changeInfo.status === "complete") {
        var statusTab = newTabDetails.find(({
            id
        }) => id == tabId);

        if (statusTab) {
            statusTab.status = "complete";
            statusTab.url = tab.url;
        }

        const iscomplete = x => x.status == "complete";

        if (newTabDetails.length > 0) {
            if (newTabDetails.every(iscomplete)) {
                console.log("All tabs have loaded successfully");
                cleanduplicates(newTabDetails);
                chrome.browserAction.getBadgeText({}, function(result) {
                    var value = parseInt(result, 10);
                    console.log(value, newTabDetails.length);
                    value += newTabDetails.length;
                    setBadgeText(value.toString());
                    newTabDetails = [];
                });
            } else {
                console.log("Few tabs are still loading");
            }
        }
    }
});