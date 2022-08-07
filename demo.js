
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
    return url.replace(/%20&%20/g, '%20%26%20');
}

generator.crawlUrls(['http://yanwittmann.de'], myDoNotIncludeOrFollowUrlFilter, myIncludeButDoNotFollowUrlFilter, myUrlMapper).then(r => {
    generator.writeSiteMap(generator.generateSiteMap(r, false), 'sitemap.xml');
});
