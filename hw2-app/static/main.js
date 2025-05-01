// strict syntax checking
"use strict";

// wait for the DOM to be fully loaded before executing
// information about toLocaleDateString from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
document.addEventListener("DOMContentLoaded", function () {
  // autofilling today's date; in the form: Wednesday, April 9, 2025
  let today = new Date();
  let options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  let formattedDate = today.toLocaleDateString("en-US", options);
  document.getElementById("todays-date").textContent = formattedDate;

  // get the nyt api key from backend
  fetch("/api/key")
    .then(statusCheck)
    .then((resp) => resp.json())
    .then((data) => {
      // store API key in a variable
      const apiKey = data.apiKey;
      // make the NYT request
      makeRequest(apiKey);
    })
    .catch((err) => {
      console.error("Error fetching API key", err.message);
    });
});

function makeRequest(apiKey) {
  let url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=Davis%20OR%20Sacramento&api-key=${apiKey}`;
  fetch(url)
    .then(statusCheck)
    .then((resp) => resp.json())
    .then(processData)
    .catch(handleError);
}

function processData(responseData) {
  // Get the articles
  const articles = responseData.response.docs;

  // main-content div is where we'll add the articles
  const mainContent = document.querySelector(".main-content");

  // Add each article to the page
  articles.forEach((article) => {
    // Create article container
    const articleDiv = document.createElement("div");
    articleDiv.className = "article";

    // Create and add headline
    const heading = document.createElement("h2");
    heading.textContent = article.headline.main;
    articleDiv.appendChild(heading);

    // Add image if there is one
    if (
      article.multimedia &&
      article.multimedia.default &&
      article.multimedia.default.url
    ) {
      const img = document.createElement("img");
      img.className = "article-image";
      img.src = article.multimedia.default.url;
      img.alt = article.headline.main;
      articleDiv.appendChild(img);
    }

    // Add article summary
    const paragraph = document.createElement("p");
    paragraph.textContent = article.abstract;
    articleDiv.appendChild(paragraph);

    // Add this article to the main content div
    mainContent.appendChild(articleDiv);
  });
}

async function statusCheck(res) {
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res;
}

function handleError(err) {
  console.error("Error fetching data", err.message);
}
