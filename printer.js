const puppeteer = require('puppeteer');
const path = require('path');
var appDir = path.dirname(require.main.filename);

const urlbase = "http://524b5b669e5d.ngrok.io/generate/lookup?RowKey="

let instance = null;

function toparams(_input) {
    return Object.keys(_input).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(_input[key]);
    }).join('&');
}

const getBrowserInstance = async function () {
    if (!instance)
        instance = await puppeteer.launch();
    return instance;
}

function chromeGenerateScreenshot(_input, cb) {
    (async () => {
        try {
            var droproot = appDir + '\\';
            var dropfile = _input + 'post.png';
            var droplocation = droproot + dropfile;
            const browser = await getBrowserInstance();
            const page = await browser.newPage();
            await page.goto(urlbase + _input, {
                waitUntil: 'networkidle2',
                timeout: 0
            });
            await page.setViewport({
                width: 1000,
                height: 1100,
            });
            await page.screenshot({
                path: droplocation
            });
            cb({
                "path": droproot,
                "filename": dropfile
            }, null);
        } catch (err) {
            cb(null, err)
        }
    })();
}

/**
 * Close currently-running chrome instance.
 */
function cleanUp() {
    (async () => {
        const browser = await getBrowserInstance();
        await browser.close();
    })();
}

//chromeGeneratePDF("filename", output, function(droppedfile, sn){var self = this;});
module.exports.chromeGenerateScreenshot = chromeGenerateScreenshot
module.exports.cleanUp = cleanUp