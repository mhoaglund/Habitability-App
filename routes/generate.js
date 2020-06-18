var express = require('express');
var router = express.Router();
const asHandler = require('.././azureServiceHandler.js');
const printer = require('.././printer.js');

//lookup gets called by the renderer in puppeteer. not really a human-usable thing.
router.get('/lookup', function (req, res, next) {
    if (req.query.RowKey) {
        asHandler.getEntity(req.query.RowKey, function(row){
            //RowKey comes back as id. Sorry.
            if(row.id){
                res.render('postrender', {
                    post: row
                });
            } else res.send(
                {
                    oall: "Failure",
                    myrowkey: undefined
                }
            )
        })
    } else {
        res.send("please enclose a rowkey");
    }
})

//root get generates and returns a post image.
router.get('/', function(req,res,next){
    if (req.query.RowKey) {
        printer.chromeGenerateScreenshot(req.query.RowKey, function(fileprops, err){
            if(!err){
                asHandler.blobUploadAsync(fileprops, function (result, filename) {
                    if (filename){
                        res.sendFile(filename);
                    } else {
                        res.send({
                            oall: "Failure"
                        })
                    }
                })
            }
        })
    } else {
        res.send("please enclose a rowkey");
    }
})

module.exports = router;