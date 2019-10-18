'use strict';

function openPopup() {
    chrome.runtime.openOptionsPage();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('openPopup').addEventListener('click',
        openPopup);
})