"use strict";

function blackListCurrURLfn() {}

function blackListCurrDomainfn() {}

function openPopupfn() {
  chrome.runtime.openOptionsPage();
}

function deDuplicateProjectLinkfn() {
  chrome.tabs.create({
    url: "https://github.com/kalpaj12/De-duplicate",
    active: true
  });
}

var blackListCurrURL = document.getElementById("blackListCurrURL");
blackListCurrURL.addEventListener("click", blackListCurrURLfn);

var blackListCurrDomain = document.getElementById("blackListCurrDomain");
blackListCurrDomain.addEventListener("click", blackListCurrDomainfn);

var openPopup = document.getElementById("openPopup");
openPopup.addEventListener("click", openPopupfn);

var deDuplicateProjectLink = document.getElementById("deDuplicateProjectLink");
deDuplicateProjectLink.addEventListener("click", deDuplicateProjectLinkfn);
