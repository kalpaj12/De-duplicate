'use strict';

// Set totalDuplicatesClosed count
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
        totalDuplicatesClosed.textContent = "Total Duplicates Closed: 0";
    }
});


// various other options in the popup page
var blackListCurrURL = document.getElementById('blackListCurrURL');
blackListCurrURL.addEventListener('click', blackListCurrURLfn);

var blackListCurrDomain = document.getElementById('blackListCurrDomain');
blackListCurrDomain.addEventListener('click', blackListCurrDomainfn);

var openPopup = document.getElementById('openPopup');
openPopup.addEventListener('click', openPopupfn);

var deDuplicateProjectLink = document.getElementById('deDuplicateProjectLink');
deDuplicateProjectLink.addEventListener('click', deDuplicateProjectLinkfn);


// Functions
function blackListCurrURLfn() {

}

function blackListCurrDomainfn() {

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