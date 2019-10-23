'use strict';

var userSettings = [{
    id: "close-options-after-save",
    value: false
}];

var buttonsave = document.getElementById('save');
buttonsave.addEventListener('click', save_options);

var toggleCloseOptionsMenuAfterSave = document.getElementById('close-options-after-save');
toggleCloseOptionsMenuAfterSave.addEventListener('click', toggle_triggered);

chrome.storage.local.get(['DeduplicateSettings'], function(result) {
    if ((['DeduplicateSettings'] in result)) {
        userSettings = result.DeduplicateSettings.userSettings;

        // Init other settings;
        document.getElementById('close-options-after-save').checked = userSettings.find(({
            id
        }) => id === 'close-options-after-save').value;

    } else {
        chrome.storage.local.set({
            DeduplicateSettings: userSettings
        });
    }
});

function save_options() {
    console.log("save clicked", userSettings);
    chrome.storage.local.set({
        DeduplicateSettings: {
            userSettings
        }
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        var shouldclose = userSettings.find(({
            id
        }) => id === 'close-options-after-save').value;
        if (shouldclose == true) {
            this.close();
        } else {
            setTimeout(function() {
                status.textContent = '';
            }, 1000);
        }
    });
}

function toggle_triggered(ToggleElement) {
    console.log("Toggle triggered on", ToggleElement.srcElement.id);
    // console.log("Toggle triggered on this.id", this.id);

    var x = userSettings.find(({
        id
    }) => id === ToggleElement.srcElement.id);

    x.value = ToggleElement.srcElement.checked;
    console.log("After toggle userSetting is", userSettings);
}