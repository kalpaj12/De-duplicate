'use strict';

var greatSuspenderDomain = "chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html";

var nonduplicateTabCount = 0;
var duplicateTabCount = 0;

var duplicateURLTrackerSet = new Set();
var duplicateTabinfo = new Array();
var nonduplicateTabinfo = new Array();
var newTabDetails = new Array();

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
        if (tab && tab.id) {
            chrome.tabs.remove(tab.id);
        }
    });
}

function switchNonDuplicate(tabInfo) {
    chrome.tabs.update(tabInfo.duplicateOfid, {
        active: true
    }, function(tab) {
        chrome.windows.update(tab.windowId, {
            focused: true
        }, function() {
            closeDuplicateTabs(tabInfo.id);
        });
    });
}

function removeSingleDuplicate(duplicateTabinfo, switchtononduplicate) {
    if (switchtononduplicate)
        switchNonDuplicate(duplicateTabinfo[0]);
    else
        closeDuplicateTabs(duplicateTabinfo[0].id);
}

function removeMultipleDuplicates(duplicateTabinfo) {
    duplicateTabinfo.forEach((element) => {
        closeDuplicateTabs(element.id);
    });
}

function setBadgeText(text) {
    chrome.browserAction.setBadgeText({
        text: text
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
        var chromeCleanupSynchoronous = new Promise((resolve, reject) => {
            tabs.forEach((element, pos) => {
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

                    if (tabInfo.url) {
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
                }
                if (pos === tabs.length - 1) resolve();
            });
        });

        chromeCleanupSynchoronous.then(() => {
            setBadgeText(nonduplicateTabCount.toString());
            chrome.storage.local.set({
                Deduplicate: {
                    totalduplicatesclosed: duplicateTabCount,
                    nonduplicateTabinfo,
                }
            });

            if (duplicateTabCount == 1) {
                removeSingleDuplicate(duplicateTabinfo, false);
            } else if (duplicateTabCount > 1) {
                removeMultipleDuplicates(duplicateTabinfo);
            }
        });
    });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    console.log("Tab is closing", tabId);
    var tab = nonduplicateTabinfo.find(({
        id
    }) => id == tabId);

    if (tab) {
        nonduplicateTabinfo = nonduplicateTabinfo.filter(function(t) {
            return t.id !== tab.id;
        });
        setBadgeText(nonduplicateTabinfo.length.toString());
    } else {
        console.log("Extension cleaned up a duplicate");
    }
});

chrome.windows.onRemoved.addListener(function(wId) {
    console.log("Window is closing", wId);
    nonduplicateTabinfo = nonduplicateTabinfo.filter(function(tab) {
        return tab.windowId !== wId;
    });
    setBadgeText(nonduplicateTabinfo.length.toString());
});

chrome.tabs.onCreated.addListener(function(tab) {
    console.log("new tab added:", tab);
    newTabDetails.push(tab);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url.includes(greatSuspenderDomain)) {
        var urlBegin = tab.url.indexOf("&uri=");
        tab.url = tab.url.substring(urlBegin + 5);
    }
    if (changeInfo.discarded && changeInfo.discarded == true) {
        var stab = nonduplicateTabinfo.find(({
            url
        }) => url == tab.url);
        console.log("Discarded Tab", stab.id, tab.id);
        stab.id = tab.id;
    } else if (changeInfo.status && changeInfo.status === "complete") {
        var statusTab = newTabDetails.find(({
            id
        }) => id == tabId);

        if (statusTab) {
            statusTab.status = "complete";
            statusTab.url = tab.url;

            var statustabdupcheck = nonduplicateTabinfo.find(({
                url,
                id
            }) => url === statusTab.url && id !== tab.id);

            if (statustabdupcheck) {

                var removestatusTab = {
                    id: statusTab.id,
                    url: statusTab.url,
                    windowId: statusTab.windowId,
                    duplicateOfid: statustabdupcheck.id
                };
                removeSingleDuplicate([removestatusTab], true);
                newTabDetails = newTabDetails.filter(function(ntab) {
                    return ntab.id !== statusTab.id
                });
            } else {
                var stabInfo = {
                    id: statusTab.id,
                    url: statusTab.url,
                    windowId: statusTab.windowId,
                    duplicateOfid: statusTab.id
                };
                console.log("pushed to nonduplicateTabinfo");
                nonduplicateTabinfo.push(stabInfo);
                newTabDetails = newTabDetails.filter(function(ntab) {
                    return ntab.id !== stabInfo.id
                });
            }
        } else {
            console.log("Non duplicate tab updated");
            var tabdupcheck = nonduplicateTabinfo.find(({
                url,
                id
            }) => url === tab.url && id !== tab.id);

            if (tabdupcheck) {
                nonduplicateTabinfo = nonduplicateTabinfo.filter(function(ntab) {
                    return ntab.id !== tab.id
                });
                var removethistab = {
                    id: tab.id,
                    url: tab.url,
                    windowId: tab.windowId,
                    duplicateOfid: tabdupcheck.id
                };
                removeSingleDuplicate([removethistab], true);
            } else {
                var thistab = nonduplicateTabinfo.find(({
                    id
                }) => id === tab.id);
                if (thistab) {
                    thistab.url = tab.url;
                    thistab.status = "complete";
                } else {
                    console.error("The tab was either moved from another window, and then its property was changed, or some other shit happened");
                }
            }
        }
    }
    setBadgeText(nonduplicateTabinfo.length.toString());
});