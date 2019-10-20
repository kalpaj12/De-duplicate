'use strict';

var greatSuspenderDomain = "chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html";

var newTabDetails = new Array();
var newTabDetailsmutex;

function getAllTabs(callback) {
    chrome.tabs.query({}, function(tabs) {
        callback(tabs);
    });
}

function removeSingleDuplicate(duplicateTabinfo) {
    switchNonDuplicate(duplicateTabinfo);
    closeDuplicateTabs(duplicateTabinfo[0].id);
}

function removeMultipleDuplicates(duplicateTabinfo) {
    duplicateTabinfo.forEach((element, pos, duplicateTabinfo) => {
        closeDuplicateTabs(element.id);
        if (Object.is(duplicateTabinfo.length - 1, pos)) {
            switchNonDuplicate(element);
        }
    });
}

function switchNonDuplicate(tabInfo) {
    chrome.tabs.update(tabInfo.duplicateOfid, {
        active: true
    }, function(tab) {
        chrome.windows.update(tab.windowId, {
            focused: true
        });
    });
}

function closeDuplicateTabs(tabId) {
    chrome.tabs.remove(tabId);
}

function setBadgeText(text) {
    chrome.browserAction.setBadgeText({
        text: text
    });
}

function deleteDuplicatesAfterInitPhase() {
    var duplicateTabCount = 0;
    var nonduplicateTabCount = 0;
    var nonduplicateTabinfo = new Array();

    var chromeSync_synchoronous = new Promise((resolve, reject) => {
        chrome.storage.sync.get(['Deduplicate'], function(result) {
            if ((['Deduplicate'] in result)) {
                duplicateTabCount = result.Deduplicate.totalduplicatesclosed;
                nonduplicateTabinfo = result.Deduplicate.nonduplicateTabinfo;
                nonduplicateTabCount = nonduplicateTabinfo.length;
                console.log("saved nonduplicatetabs: ", nonduplicateTabinfo);
            } else {
                console.log("SYNC ERROR => couldnot find synced data");
            }
            resolve();
        });
    });

    chromeSync_synchoronous.then(() => {
        console.log("running clean duplicates on newtab=>", newTabDetails);
        newTabDetails.forEach((element, pos, newTabDetails) => {
            if (!element.incognito) {
                if (element.url.includes(greatSuspenderDomain)) {
                    var urlBegin = element.url.indexOf("&uri=");
                    element.url = element.url.substring(urlBegin + 5);
                }

                const isduplicate = nonduplicateTabinfo.find(({
                    url
                }) => (url === element.url) && (url !== "chrome://newtab/"));

                if (isduplicate) {
                    console.log("DUPLICATE FOUND");
                    duplicateTabCount++;
                    closeDuplicateTabs(element.id);
                    // change focus
                } else {
                    nonduplicateTabinfo = nonduplicateTabinfo.concat(element);
                    nonduplicateTabCount++;
                }
            }
        });
        chrome.storage.sync.set({
            Deduplicate: {
                totalduplicatesclosed: duplicateTabCount,
                nonduplicateTabinfo,
            }
        });
        setBadgeText(nonduplicateTabCount.toString());
        newTabDetailsmutex.then(() => {
            newTabDetails = [];
        });
    });
}

chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 0, 0, 255]
});

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

    getAllTabs(function(tabs) {
        var nonduplicateTabCount = 0;
        var duplicateTabCount = 0;

        var duplicateURLTrackerSet = new Set();
        var duplicateTabinfo = new Array();
        var nonduplicateTabinfo = new Array();

        var chromeSync_synchoronous = new Promise((resolve, reject) => {
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
                        nonduplicateTabinfo.push(tabInfo);
                        duplicateURLTrackerSet.add(tabInfo.url);
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

        setBadgeText(nonduplicateTabCount.toString());

        chromeSync_synchoronous.then(() => {
            chrome.storage.sync.remove(['Deduplicate']);
            chrome.storage.sync.set({
                Deduplicate: {
                    totalduplicatesclosed: duplicateTabCount,
                    nonduplicateTabinfo,
                }
            });
        });

        if (duplicateTabCount > 0) {
            if (duplicateTabCount > 1) {
                removeMultipleDuplicates(duplicateTabinfo);
            } else {
                removeSingleDuplicate(duplicateTabinfo);
            }
        }
    });
});

chrome.tabs.onCreated.addListener(function(tab) {
    newTabDetailsmutex = new Promise((resolve, reject) => {
        console.log("new tab added:", tab);
        newTabDetails.push(tab);
        console.log("After addition of new tab, newTabdetails is:", newTabDetails);
        resolve();
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status && changeInfo.status === "complete") {
        console.log("tab updated: ", tab);
        const updateTabdetails = newTabDetails.find(({
            id
        }) => id === tabId);
        if (updateTabdetails) {
            console.log("new tab was updated");
            var updatedTabArray = newTabDetails.filter(function(el) {
                return el.id != tab.id;
            });
            updatedTabArray.push(tab);
            newTabDetails = updatedTabArray;
            console.log("new tab array:", newTabDetails);
            deleteDuplicatesAfterInitPhase();
        } else {
            console.log("old tab was updated", tab);
            getAllTabs(function(tabs) {
                const isduplicate = tabs.find(({
                    url,
                    id
                }) => (url === tab.url) && (id !== tab.id));

                if (isduplicate) {
                    closeDuplicateTabs(tab.id);
                    // update nonduplicateTabinfo
                    chrome.storage.sync.get(['Deduplicate'], function(result) {
                        if ((['Deduplicate'] in result)) {
                            var totalduplicatesclosed = result.Deduplicate.totalduplicatesclosed;
                            totalduplicatesclosed++;
                            chrome.storage.sync.set({
                                Deduplicate: {
                                    totalduplicatesclosed,
                                    nonduplicateTabinfo: result.Deduplicate.nonduplicateTabinfo
                                }
                            });
                        } else {
                            console.log("SYNC ERROR");
                        }
                    });
                    setBadgeText((tabs.length - 1).toString());
                }
            });
        }
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    console.log("onRemoved fired: ", tabId);
    chrome.tabs.query({}, function(tabs) {
        chrome.storage.sync.get(['Deduplicate'], function(result) {
            if ((['Deduplicate'] in result)) {
                const tab = result.Deduplicate.nonduplicateTabinfo.find(({
                    id
                }) => id == tabId);
                if (tab) {
                    var nonduplicateTabinfo = result.Deduplicate.nonduplicateTabinfo.filter(function(el) {
                        return el.id != tabId;
                    });
                    chrome.storage.sync.set({
                        Deduplicate: {
                            totalduplicatesclosed: result.Deduplicate.totalduplicatesclosed,
                            nonduplicateTabinfo,
                        }
                    });
                }
            } else {
                console.log("STORAGE SYNC ERROR!");
            }
        });
        console.log("non duplicate tabs: ", tabs.length);
        setBadgeText(tabs.length.toString());
    });
});