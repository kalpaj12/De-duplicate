'use strict';

document.getElementById('save').addEventListener('click',
    save_options);

function save_options() {
    chrome.storage.sync.set({}, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 1000);
    });
}