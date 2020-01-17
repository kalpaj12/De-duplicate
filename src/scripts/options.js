"use strict";

var userSettings = [
  {
    id: "closeOptionsMenuAfterSave",
    value: false
  }
];

function saveOptions() {
  // console.log("save clicked", userSettings);
  chrome.storage.local.set(
    {
      DeduplicateSettings: {
        userSettings
      }
    },
    function() {
      var status = document.getElementById("status");
      status.textContent = "Options saved.";
      var shouldclose = userSettings.find(
        ({ id }) => id === "closeOptionsMenuAfterSave"
      ).value;
      if (shouldclose === true) {
        this.close();
      } else {
        setTimeout(function() {
          status.textContent = "";
        }, 1000);
      }
    }
  );
}

function toggleTriggered(ToggleElement) {
  // console.log("Toggle triggered on", ToggleElement.srcElement.id);
  // console.log("Toggle triggered on this.id", this.id);

  var x = userSettings.find(({ id }) => id === ToggleElement.srcElement.id);

  x.value = ToggleElement.srcElement.checked;
  console.log("After toggle userSetting is", userSettings);
}

var buttonsave = document.getElementById("save");
buttonsave.addEventListener("click", saveOptions);

var toggleCloseOptionsMenuAfterSave = document.getElementById(
  "closeOptionsMenuAfterSave"
);
toggleCloseOptionsMenuAfterSave.addEventListener("click", toggleTriggered);

chrome.storage.local.get(["DeduplicateSettings"], function(result) {
  if (["DeduplicateSettings"] in result) {
    userSettings = result.DeduplicateSettings.userSettings;

    // Init other settings;
    document.getElementById(
      "closeOptionsMenuAfterSave"
    ).checked = userSettings.find(
      ({ id }) => id === "closeOptionsMenuAfterSave"
    ).value;
  } else {
    chrome.storage.local.set({
      DeduplicateSettings: userSettings
    });
  }
});
