var tabs;

function getAllTabs(callback) {
  chrome.tabs.query({}, function(tabs) {
    callback(tabs);
  });
}

window.setInterval(() => {
  getAllTabs(alltabs => {
    tabs = alltabs;
    // console.log(tabs);
  });
}, 3000);

var contentlist = document.getElementById("content-list");
var searchBox = document.getElementById("searchbox");

searchBox.addEventListener("keydown", async event => {
  const value = event.target.value;
  //   console.log(value, tabs);

  if (value.length && tabs && tabs.length) {
    contentlist.innerHTML = "";
    let results = fuzzysort.go(value, tabs, {
      keys: ["title", "url"]
    });

    results.forEach(res => {
      contentlist.innerHTML += `<li><a href="${res.obj.url}">${res.obj.title}</a></li>`;
    });
  }
});
