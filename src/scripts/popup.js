'use strict';

var ClosedduplicateCount = document.getElementById('ClosedduplicateCount');
chrome.storage.local.get(['Deduplicate'], function(result) {
    if ((['Deduplicate'] in result)) {
        var res = result.Deduplicate.totalduplicatesclosed;
        var value = parseInt(res, 10);
        if (value > 1000) {
            ClosedduplicateCount.textContent = "Total Duplicates Closed: 1000+";
        } else {
            ClosedduplicateCount.textContent = "Total Duplicates Closed: " + value;
        }
    } else {
        ClosedduplicateCount.textContent = "Total Duplicates Closed: " + 0;
    }
});

var urlblacklist = document.getElementById('urlblacklist');
urlblacklist.addEventListener('click', urlblacklistfn);

var domainblacklist = document.getElementById('domainblacklist');
domainblacklist.addEventListener('click', domainblacklistfn);

var openPopup = document.getElementById('openPopup');
openPopup.addEventListener('click', openPopupfn);

var githubpage = document.getElementById('githubpage');
githubpage.addEventListener('click', githubpagefn);

function urlblacklistfn() {

}

function domainblacklistfn() {

}

function openPopupfn() {
    chrome.runtime.openOptionsPage();
}

function githubpagefn() {
    chrome.tabs.create({
        url: "https://github.com/kalpaj12/De-duplicate",
        active: true
    });
}