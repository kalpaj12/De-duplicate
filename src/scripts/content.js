'use strict';

var greatSuspenderDomain = "chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html";

var totalTabCount = 0;
var nonduplicateTabCount = 0;
var duplicateTabCount = 0;

var duplicateURLTrackerSet = new Set();
var duplicateTabinfo = new Array();
var nonduplicateTabinfo = new Array();

function cleanDuplicates(duplicateTabinfo) {
    duplicateTabinfo.forEach((element) => {
        chrome.runtime.sendMessage({
            action: "switchNonDuplicate",
            tabInfo: element
        });
        chrome.runtime.sendMessage({
            action: "deleteDuplicate",
            tabid: element.id
        });
    });
}

// Message to background.js
chrome.runtime.sendMessage({
    action: "getAllTabs"
}, function(response) {
    response.data.forEach((element) => {
        if (element.incognito === false) {
            totalTabCount++;
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

            if (duplicateURLTrackerSet.has(tabInfo.url) === false) {
                nonduplicateTabinfo.push(tabInfo);
                duplicateURLTrackerSet.add(tabInfo.url);
                nonduplicateTabCount++;
            } else {
                const tab = nonduplicateTabinfo.find(({
                    url
                }) => url == tabInfo.url);
                tabInfo.duplicateOfid = tab.id;
                duplicateTabinfo.push(tabInfo);
                duplicateTabCount++;
            }
        }
    });

    console.log("Total non-incognito Tabs: " + totalTabCount);

    chrome.runtime.sendMessage({
        action: "setBadgeText",
        text: nonduplicateTabCount.toString()
    });

    chrome.storage.sync.set({
        'Deduplicate': nonduplicateTabinfo
    });

    if (duplicateTabCount > 0) {
        console.log("Duplicate non-incognito Tabs: " + duplicateTabCount);
        // duplicateTabinfo.forEach((element) => {
        //     console.log(element);
        // });
        cleanDuplicates(duplicateTabinfo);
    }
});

// Message from background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.sender.localeCompare("kalpajag_deduplicate") === 0) {

    }
    return true;
});