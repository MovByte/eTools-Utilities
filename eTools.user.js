// ==UserScript==
// @name        eTools QOL improvements
// @namespace   Violentmonkey Scripts
// @match       https://www.etools.ch/searchSubmit.do*
// @grant       none
// @version     1.001
// @author      Ryan Wilson
// @license     AGPL-3.0-or-later
// @description ...
// @require     https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @require     https://update.greasyfork.org/scripts/421384/1134973/GM_fetch.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM_xmlhttpRequest
// @downloadURL https://update.greasyfork.org/scripts/498448/eTools%20QOL%20improvements.user.js
// @updateURL   https://github.com/MovByte/eTools-Utilities/raw/main/eTools.user.js
// ==/UserScript==

// TODO: Achieve better safety
//
// TODO: Support mobile and support engine-specific search with these options
// Not here but in the CSS Stylish add an option to disable the highlight

// TODO: Add a proper userscript config with GM_config
// -  @see https://github.com/sizzlemctwizzle/GM_config/wiki/
// TODO: Use proper JSDoc annotations on the config object for all the properties
const config = {
  removeHighlight: true,
  disableMobileLink: false,
  /** Bring the "By Topic:" menu to the top of the right sidebar **/
  bringByTopicToTop: true,
  moveSearchStatusesToBottom: true,
  removeAffiliateLink: true,
  displayFullLink: true,
  faviSources: false,
  showFavi: true, // Fetches the favicon from the sites in a bare proxy
  autofill: {
    enabled: true,
    service: "brave",
  },
  preview: {
    enable: false,
    // This would allow for any site to be iframed with the preview feature, bringing preview to any site, using aero
    proxyPreview: true,
  },
};

const usingMobile =
  location.pathname === "/mobileSearch.do" ||
  location.pathname === "mobileSearchSubmit.do";
const usingDesktop =
  location.pathname === "/search.do" ||
  location.pathname === "/searchSubmit.do";

if (usingDesktop) {
  if (config.moveSearchStatusesToBottom) {
    const results = document.getElementsByClassName("result")[0];
    const resultsTable = results.parentNode;
    const statuses = [
      ...document.getElementsByClassName("searchStatus"),
    ].filter((status) => resultsTable.contains(status));
    // Search statuses on eTools are optional so they might not exist
    if (statuses.length !== 0) {
      statuses.at(-1).style["padding-bottom"] = "15px";
      statuses.forEach((status) => {
        resultsTable.appendChild(status);
      });
    }
  }
  if (config.disableMobileLink) {
    [...document.getElementsByTagName("a")]
      .find((link) => (link.href = "mobileSearch.do"))
      .removeAttribute("href");
    // Consider: Perhaps I should add "mobile version" to the sidebar instead and make the favicon just redirect to the real home page, not the mobile version of the site? It would be a more logical place to put the mobile version.
  }
  if (config.bringByTopicToTop) {
    // const sidebarLeft = [...document.getElementsByTagName("td")][100];
    const sourceBox = [...document.getElementsByClassName("boxTop")][2];
    const resultsToolTitle = [...document.getElementsByTagName("h3")].find(
      (title) => title.textContent === "Results Tool"
    );
    if (resultsToolTitle)
      resultsToolTitle.insertAdjacentElement("afterend", sourceBox);
  }
  if (config.faviSources) {
    const links = [...document.getElementsByTagName("a")];
    const engineToFavi = new Map();
    // TODO: Find HD sources for each favicon
    // TODO: Finish adding all of the sources
    engineToFavi.set(
      "Brave",
      "https://cdn.search.brave.com/serp/v2/_app/immutable/assets/favicon-32x32.B2iBzfXZ.png"
    );
    engineToFavi.set("DuckDuckGo", "https://duckduckgo.com/favicon.ico");
    engineToFavi.set("Google", "https://www.google.com/favicon.ico");
    engineToFavi.set("Mojeek", "https://www.mojeek.com/favicon.ico");
    engineToFavi.set("Qwant", "https://www.qwant.com/favicon.ico");
    engineToFavi.set(
      "Wikipedia",
      "https://www.wikipedia.org/static/favicon/wikipedia.ico"
    );
    engineToFavi.set(
      "Yandex",
      "https://yastatic.net/s3/home-static/_/nova/7f2537ce.png"
    );

    for (let [text, faviLink] of engineToFavi) {
      const ddgs = links.filter((link) => link.innerText === text);
      ddgs.forEach((ddg) => {
        ddg.innerText = "";
        const favi = document.createElement("img");
        favi.src = faviLink;
        favi.style.width = "20px";
        favi.style.height = "20px";
        // TODO: Keep the link to the search engine but append the current query to it
        ddg.insertAdjacentElement("afterend", favi);
      });
    }
  }
  if (!config.preview.enable) {
    const pipeText = " | ";
    // FIXME: Doesn't work on Engine-specific search
    [...document.getElementsByTagName("a")]
      .filter((link) => link.textContent === "preview" && /^p\d/.test(link.id))
      .forEach((previewLink) => {
        const pipe = previewLink.previousSibling;
        // Parity check
        if (pipe.textContent === pipeText) {
          pipe.remove();
        }
        previewLink.remove();
      });
  }
  // TODO: Add the "proxy preview" feature
  if (config.proxyPreview) {
    /*
      [...document.getElementsByClassName("attr")].forEach(attr => {
          [...attr.childNodes].forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                  const isPipe = child.textContent === pipeText;
                  const isSource = child.textContent === "Source: ";
                  if (config.faviSources && (isPipe || isSource))
                    ...
              }
          });
      })
      */
  }
}

const affiliateRedirect = "https://www.etools.ch/redirect.do?a=";
if (config.displayFullLink || config.removeAffiliateLink) {
  if (usingDesktop || usingMobile) {
    const searchEntries = [
      ...(usingDesktop
        ? document.getElementsByClassName("record")
        : document.getElementsByTagName("a")),
    ];
    for (const searchEntry of searchEntries) {
      const children = [...searchEntry.children];
      const titleElement = children.find(
        (el) => el instanceof HTMLAnchorElement
      );
      if (config.removeAffiliateLink) {
        if (titleElement.href.startsWith(affiliateRedirect))
          titleElement.href = decodeURIComponent(
            titleElement.href.split(affiliateRedirect).pop()
          );
      }
      if (config.displayFullLink) {
        const titleLink = titleElement.href;
        if (titleLink) {
          if (usingDesktop) {
            const urlDiv = children.find((child) => child.className === "attr");
            const attrChildren = [...urlDiv.children];
            const displayLink = attrChildren[0];
            displayLink.innerText = titleLink;
          } else {
            for (const child of children) {
              if (child.tagName === "var") child.innerText = titleLink;
            }
          }
        }
      }
    }
  }
}

if (config.autofill) {
  const searchBar = document.getElementById("query");
  searchBar.autocomplete = "off";
  const autofill = document.createElement("datalist");
  autofill.id = "autofill";
  searchBar.setAttribute("list", "autofill");
  searchBar.insertAdjacentElement("afterend", autofill);
  searchBar.addEventListener("input", (e) => {
    if (config.autofill.service === "brave")
      GM_fetch(
        `https://search.brave.com/api/suggest?q=${e.target.value}&rich=false&source=web`,
        {
          method: "GET",
        }
      )
        .then((resp) => resp.json())
        .then((results) => {
          const sgs = results[1];
          // Clear previous suggestions
          autofill.innerHTML = "";
          // Add new suggestions
          for (const sg of sgs) {
            const option = document.createElement("option");
            option.value = sg;
            autofill.appendChild(option);
          }
        });
  });
}
