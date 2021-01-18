#!/usr/bin/env node
import fsp from "fs/promises";
import got from "got";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

async function getDOMFromWebsite() {
  const site = await got(
    "https://github.com/OpenSourceRaidGuild/website/issues/labels"
  );
  return new JSDOM(site.body).window;
}

async function exportGitHubLabels() {
  const DOM = (await getDOMFromWebsite()).document;
  let labels = [];
  [].slice.call(DOM.querySelectorAll(".js-label-link")).forEach((element) => {
    labels.push({
      name: element.textContent.trim(),
      description: element.getAttribute("title"),
      // color: element.style.backgroundColor
      //   .substring(4, element.style.backgroundColor.length - 1)
      //   .split(",")
      //   .reduce((hexValue, rgbValue) => {
      //     return hexValue + Number(rgbValue).toString(16).padStart(2, "0");
      //   }, ""),
    });
  });
  return labels;
}
fsp.writeFile(
  "./database.json",
  JSON.stringify(await exportGitHubLabels(), { space: 2 })
);

// function saveDataAsJSON(data, filename) {
//   const blob = new Blob([JSON.stringify(data, null, 4)], { type: "text/json" });
//   const a = document.createElement("a");
//   a.download = filename;
//   a.href = window.URL.createObjectURL(blob);
//   a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
//   a.click();
// }
// saveDataAsJSON(exportGitHubLabels(), document.title + ".json");
