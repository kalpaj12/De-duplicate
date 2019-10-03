var GreatSuspenderDomain = "chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html";

var TotalTabCount = 0;
var DuplicateTabCount = 0;

var Tabset = new Set();
var DuplicateTabs = new Array();

chrome.runtime.sendMessage({
    action: "getAllTabs"
}, function(response) {
    response.data.forEach(element => {
        if (element.incognito === false) {
            if (element.url.includes(GreatSuspenderDomain)) {
                var url_begin = element.url.indexOf("&uri=");
                element.url = element.url.substring(url_begin + 5);
            }

            Tabset.add(element.url);
            TotalTabCount++;
            DuplicateTabCount++;

            if (DuplicateTabCount != Tabset.size) {

                var tabInfo = {
                    id: element.id,
                    url: element.url,
                    windowId: element.windowId
                };

                DuplicateTabs.push(tabInfo);
                DuplicateTabCount--;
            }
        }
    });
    if (TotalTabCount - Tabset.size > 0) {
        console.log("Duplicates: " + (TotalTabCount - Tabset.size));
        DuplicateTabs.forEach(element => {
            console.log(element);
        });
    }
});