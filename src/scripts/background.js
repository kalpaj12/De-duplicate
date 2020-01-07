"use strict";

var duplicatesArr = new Array();
var nonduplicateArr = new Array();
var nonduplicateURLSet = new Set();
var newTabsArr = new Array();

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

const greatSuspenderURL = "chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html";

function urlCleanUp(tab) {
    if (tab.url.includes(greatSuspenderURL)) {
        var urlBegin = tab.url.indexOf("&uri=");
        tab.url = tab.url.substring(urlBegin + 5);
    }
    return tab;
}

chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 0, 0, 255]
});

function setBadgeText(text) {
    chrome.browserAction.setBadgeText({
        text
    });
}

function getAllTabs(callback) {
    chrome.tabs.query({}, function(tabs) {
        callback(tabs);
    });
}

function closeDuplicateTab(tabId) {
    chrome.tabs.get(tabId, function(tab) {
        if (tab && tab.id) {
            chrome.tabs.remove(tab.id);
        } else {
            console.error("Tab not found!", tabId);
        }
    });
}

function switchFocus(tabInfo) {
    chrome.tabs.update(tabInfo.duplicateOfid, {
        active: true
    }, function(tab) {
        chrome.windows.update(tab.windowId, {
            focused: true
        }, function() {
            closeDuplicateTab(tabInfo.id);
        });
    });
}

function removeSingleDuplicate(duplicatesArr, changefocus) {
    if (changefocus)
        switchFocus(duplicatesArr[0]);
    else
        closeDuplicateTab(duplicatesArr[0].id);
}

function removeMultipleDuplicates(duplicatesArr) {
    duplicatesArr.forEach((tab, pos) => {
        if (pos !== duplicatesArr.length - 1)
            closeDuplicateTab(tab.id);
        else
            removeSingleDuplicate([tab], true);
    });
}

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
        var asyncInit = new Promise((resolve, reject) => {
            tabs.forEach((tab) => {
                if (!tab.incognito) {
                    tab = urlCleanUp(tab);

                    var tabInfo = {
                        id: tab.id,
                        url: tab.url || tab.pendingUrl,
                        windowId: tab.windowId,
                        duplicateOfid: tab.id
                    };

                    if (tabInfo.url) {
                        if (!nonduplicateURLSet.has(tabInfo.url)) {
                            nonduplicateURLSet.add(tabInfo.url);
                            nonduplicateArr.push(tabInfo);
                        } else {
                            const nonduplicatetabversion = nonduplicateArr.find(({
                                url,
                                id
                            }) => url === tabInfo.url && id !== tabInfo.id);
                            tabInfo.duplicateOfid = nonduplicatetabversion.id;
                            duplicatesArr.push(tabInfo);
                        }
                    } else {
                        // This should be non-reachable as tabInfo takes either tab.url || tab.pendingUrl
                        console.error("Tab had no URL", tab);
                    }
                }
            });
            resolve();
        });

        asyncInit.then(() => {
            setBadgeText(nonduplicateArr.length.toString());
            if (duplicatesArr.length) {
                removeMultipleDuplicates(duplicatesArr);
            }
        });
    });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // console.log("Tab is closing", tabId);
    var tab = nonduplicateArr.find(({
        id
    }) => id == tabId);

    if (tab) {
        nonduplicateArr = nonduplicateArr.filter(function(newTab) {
            return newTab.id !== tab.id;
        });
        setBadgeText(nonduplicateArr.length.toString());
    } else {
        // console.log("Extension cleaned up a duplicate");
    }
});

chrome.windows.onRemoved.addListener(function(windowId) {
    // console.log("Window is closing", windowId);
    nonduplicateArr = nonduplicateArr.filter(function(tab) {
        return tab.windowId !== windowId;
    });
    setBadgeText(nonduplicateArr.length.toString());
});

chrome.tabs.onCreated.addListener(function(tab) {
    // console.log("new tab added:", tab);
    newTabsArr.push(tab);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    tab = urlCleanUp(tab);
    if (changeInfo.discarded && changeInfo.discarded === true) {
        var nonduplicateTab = nonduplicateArr.find(({
            url
        }) => url == tab.url);
        // console.log("Discarded Tab", nonduplicateTab.id, tab.id);
        nonduplicateTab.id = tab.id;
    } else if (changeInfo.status && changeInfo.status === "complete") {
        var updatednewTab = newTabsArr.find(({
            id
        }) => id == tabId);

        if (updatednewTab) {
            updatednewTab.status = "complete";
            updatednewTab.url = tab.url;

            var duplicateExists = nonduplicateArr.find(({
                url,
                id
            }) => url === updatednewTab.url && id !== tab.id);

            if (duplicateExists) {
                removeSingleDuplicate([{
                    id: updatednewTab.id,
                    duplicateOfid: duplicateExists.id
                }], true);
                newTabsArr = newTabsArr.filter(function(tab) {
                    return tab.id !== updatednewTab.id
                });
            } else {
                // console.log("pushed to nonduplicateArr");
                nonduplicateArr.push({
                    id: updatednewTab.id,
                    url: updatednewTab.url,
                    windowId: updatednewTab.windowId,
                    duplicateOfid: updatednewTab.id
                });
                newTabsArr = newTabsArr.filter(function(tab) {
                    return tab.id !== updatednewTab.id;
                });
            }
        } else {
            // console.log("Non duplicate tab updated");
            var isduplicateafterupdate = nonduplicateArr.find(({
                url,
                id
            }) => url === tab.url && id !== tab.id);

            if (isduplicateafterupdate) {
                nonduplicateArr = nonduplicateArr.filter(function(tab) {
                    return tab.id !== tabId;
                });
                removeSingleDuplicate([{
                    id: tab.id,
                    url: tab.url,
                    windowId: tab.windowId,
                    duplicateOfid: isduplicateafterupdate.id
                }], true);
            } else {
                var isExistsinnonduplicateArr = nonduplicateArr.find(({
                    id
                }) => id === tab.id);
                if (isExistsinnonduplicateArr) {
                    isExistsinnonduplicateArr.url = tab.url;
                    isExistsinnonduplicateArr.status = "complete";
                } else {
                    nonduplicateArr.push({
                        id: tab.id,
                        url: tab.url || tab.pendingUrl,
                        windowId: tab.windowId,
                        duplicateOfid: tab.id
                    });
                }
            }
        }
    }
    setBadgeText(nonduplicateArr.length.toString());
});