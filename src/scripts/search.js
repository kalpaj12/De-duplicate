chrome.runtime.sendMessage(
  {
    action: "nonDuplicateTabs"
  },
  function(response) {
    console.log(response.nonduplicateArr);
  }
);

document.getElementById("content-list").innerHTML = "Some URLS";
