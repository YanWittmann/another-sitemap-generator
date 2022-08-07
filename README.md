# Another Sitemap Generator

A sitemap generator that will wait for the web pages to be fully loaded, then extract the links.

## How to use

First of all to get you started: A runnable example can be found in the [demo.js](demo.js) file. This is its code:

```javascript
const generator = require("./sitemap-generator.js");

const myDoNotIncludeOrFollowUrlFilter = (file) => {
    if (!file.includes('yanwittmann.de')) return false;
    if (!generator.isFileOfType(file, ['htm', 'html', 'directory'])) return false;

    return true;
}

const myIncludeButDoNotFollowUrlFilter = (url) => {
    if (url.includes('/schule/site')) return false;

    return true;
}

const myUrlMapper = (url) => {
    // escape ampersand in between escaped spaces
    return url.replace(/%20&%20/g, '%20%26%20');
}

generator.crawlUrls(['http://yanwittmann.de'], myDoNotIncludeOrFollowUrlFilter, myIncludeButDoNotFollowUrlFilter, myUrlMapper).then(r => {
    generator.writeSiteMap(generator.generateSiteMap(r, false), 'sitemap.xml');
});
```

Steps to follow:

1. Run the `crawlUrls` function. It has four parameters:
    1. The root urls to crawl. This is an array of strings.
    2. A function that decides whether a URL should be included or not. If it returns `false`, the URL will not be
       included or be followed.
    3. A function that decides whether a URL should be followed or not. If it returns `false`, the URL will not be
       followed. BUT: it will be included in the final list of URLs.
    4. A function that maps the URL to a different URL. This is useful if you know that a URL contains malformed data
       that you want to fix or automatically redirect to another URL.
2. The `crawlUrls` function returns a promise. You can use the `.then` function to get the result. Use
   the `generateSiteMap` function to generate the sitemap content.
3. Finally, use the `writeSiteMap` function to write the sitemap to a file.
