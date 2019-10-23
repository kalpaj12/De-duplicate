'use strict';

var totalDuplicatesClosed = document.getElementById('totalDuplicatesClosed');

chrome.storage.local.get(['Deduplicate'], function(result) {
    if ((['Deduplicate'] in result)) {
        var res = result.Deduplicate.totalduplicatesclosed;
        var value = parseInt(res, 10);
        if (value > 1000) {
            totalDuplicatesClosed.textContent = "Total Duplicates Closed: 1000+";
        } else {
            totalDuplicatesClosed.textContent = "Total Duplicates Closed: " + value;
        }
    } else {
        totalDuplicatesClosed.textContent = "Total Duplicates Closed: " + 0;
    }
});

var blacklistedURLs = document.getElementById('blacklistedURLs');
blacklistedURLs.addEventListener('click', blacklistedURLsfn);

var blacklistedDomains = document.getElementById('blacklistedDomains');
blacklistedDomains.addEventListener('click', blacklistedDomainsfn);

var openPopup = document.getElementById('openPopup');
openPopup.addEventListener('click', openPopupfn);

var deDuplicateProjectLink = document.getElementById('deDuplicateProjectLink');
deDuplicateProjectLink.addEventListener('click', deDuplicateProjectLinkfn);




// Functions
function blacklistedURLsfn() {

}

function blacklistedDomainsfn() {

}

function openPopupfn() {
    chrome.runtime.openOptionsPage();
}

function deDuplicateProjectLinkfn() {
    chrome.tabs.create({
        url: "https://github.com/kalpaj12/De-duplicate",
        active: true
    });
}