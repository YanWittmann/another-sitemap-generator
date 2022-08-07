const puppeteer = require('puppeteer');
const fs = require("fs");
const path = require('path');

async function crawlUrls(urls, doNotIncludeOrFollowUrlFilter, includeButDoNotFollowUrlFilter, urlMapper) {
    let remainingUrlsToCheck = urls;
    let allFoundUrls = [];

    remainingUrlsToCheck = applyUrlFilterers(null, remainingUrlsToCheck, doNotIncludeOrFollowUrlFilter);

    while (remainingUrlsToCheck.length > 0) {
        const url = remainingUrlsToCheck.shift();
        allFoundUrls.push(url);

        if (!includeButDoNotFollowUrlFilter(url)) continue;

        let foundUrls = await extractUrlsFromPage(url);
        let filteredUrls = applyUrlFilterers(url, foundUrls, doNotIncludeOrFollowUrlFilter);
        let mappedUrls = filteredUrls.map(urlMapper);
        console.log(url, '-->', foundUrls, '-->', mappedUrls);

        for (let i = 0; i < filteredUrls.length; i++) {
            if (!allFoundUrls.includes(filteredUrls[i]) && !remainingUrlsToCheck.includes(filteredUrls[i])) {
                remainingUrlsToCheck.push(filteredUrls[i]);
            }
        }
    }

    return allFoundUrls;
}

function applyUrlFilterers(baseUrl, urls, customFilter) {
    if (baseUrl !== null) {
        urls = urls.map(e => relativeToAbsoluteLink(baseUrl, e));
    }
    urls = urls.map(e => e.replace(/\/$/, ''));

    urls = urls.filter(customFilter);
    // make distinct
    urls = urls.filter((item, index) => urls.indexOf(item) === index);

    return urls;
}

function relativeToAbsoluteLink(base, relative) {
    if (relative.startsWith('http')) return relative;
    if (relative.startsWith('//')) return 'http:' + relative;

    let baseParts = base.split('/');
    let relativeParts = relative.split('/');

    if (!relative.includes('..')) {
        return baseParts.slice(0, -1).join('/') + '/' + relative;
    }

    let result = [];
    for (let i = 0; i < relativeParts.length; i++) {
        if (relativeParts[i] === '..') {
            baseParts.pop();
        } else {
            result.push(relativeParts[i]);
        }
    }

    return baseParts.join('/') + '/' + result.join('/');
}

async function extractUrlsFromPage(url) {
    try {
        const browser = await puppeteer.launch();
        const [page] = await browser.pages();

        await page.goto(url, {waitUntil: 'networkidle0'});
        //const data = await page.evaluate(() => document.querySelector('*').outerHTML);
        //console.log(data);

        const links = await page.evaluate(() => {
            function defaultUrlFilter(url) {
                if (url === undefined) return false;
                if (url === null) return false;
                if (url.length === 0) return false;
                if (url.includes('mailto')) return false;

                return true;
            }

            function defaultUrlMapper(url) {
                url = removeGet(url);
                url = url.replace(/\/$/, '');
                return url;
            }

            function removeGet(url) {
                if (url.includes('?')) {
                    return url.split('?')[0];
                }
                return url;
            }

            function removeDuplicates(urls) {
                return urls.filter((item, index) => urls.indexOf(item) === index);
            }

            return removeDuplicates(Array.from(document.querySelectorAll('a'))
                .map(link => link.href)
                .filter(defaultUrlFilter)
                .map(defaultUrlMapper));
        });

        await browser.close();

        return links;
    } catch (err) {
        console.error(err);
    }
}

function generateSiteMap(urls, minified) {
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>';
    if (!minified) sitemap += '\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    if (!minified) sitemap += '\n';

    for (let i = 0; i < urls.length; i++) {
        if (!minified) sitemap += '    ';
        sitemap += '<url>';
        if (!minified) sitemap += '\n        ';
        sitemap += '<loc>' + urls[i] + '</loc>';
        if (!minified) sitemap += '\n    ';
        sitemap += '</url>';
        if (!minified) sitemap += '\n';
    }

    sitemap += '</urlset>';

    console.log('Generated sitemap for', urls.length, 'urls');

    return sitemap;
}

function writeSiteMap(sitemap, filename) {
    const file = path.join(__dirname, filename);
    fs.writeFile(file, sitemap, (err) => {
        if (err) throw err;
        console.log('The sitemap has been saved to', file);
    });
}

function getFileExtension(file) {
    if (file === undefined) return '';
    if (file.length === 0) return '';

    file = file.replace(/^https?:\/\//, '');
    if (!file.includes('/')) {
        return '';
    }

    let filename = file.split('/').pop();
    if (filename.includes('.')) {
        return filename.split('.').pop();
    } else {
        return '';
    }
}

function isFileOfType(file, fileTypes) {
    if (file === undefined) return false;
    if (file.length === 0) return false;

    const ext = getFileExtension(file);

    if (ext.length === 0 && (fileTypes.includes('') || fileTypes.includes('any') || fileTypes.includes('directory'))) return true;

    return !!fileTypes.includes(ext);
}

module.exports = {crawlUrls, generateSiteMap, writeSiteMap, isFileOfType};
