var express = require('express');
var multer  = require('multer');
var request = require('request');
const path = require('path');
const {
  v4: uuidv4
} = require('uuid');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    var ext = '.' + file.mimetype.split('/')[1];
    cb(null, uuidv4() + ext)
  }
})

var upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 6000000
  },
  fileFilter: (req, file, callback) => {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback('Only images are allowed', false)
    }
    callback(null, true)
  }
})
var router = express.Router();
const asHandler = require('.././azureServiceHandler.js');

/* GET home page. */
var payload = upload.fields([
  {name: 'pic1', maxCount: 1}, 
  {name: 'pic2', maxCount: 1}
]);

// router.post('/', payload, function (req, res, next) {
router.post('/', function(req, res, next) {
    payload(req, res, function (err) {
      if(err){
        //multer error: wrong file type or file too large
        return res.sendStatus(413)
      } else {
          if (req.body['rcptoken'] === undefined || req.body['rcptoken'] === '' || req.body['rcptoken'] === null) {
            //missing rcp token, custom req from bad actor
            return res.sendStatus(403)
          } else{
            console.log(req.body);
            const reCaptchaSecret = process.env.RCP_SECRET;
            const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + reCaptchaSecret + "&response=" + req.body['rcptoken'] + "&remoteip=" + req.connection.remoteAddress;
            var validated = false;
            request(verificationURL, function (error, response, body) {
              if (error) {
                throw error;
              }
              body = JSON.parse(body);
              if (body.success !== undefined && !body.success) {
                res.send({
                  oall: "Failure"
                })
              }
              if (body.score > 0.5) {
                validated = true;
              }
              if (validated) {
                var date = new Date();
                var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
                  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
                var uploadRecord = {
                  "id": uuidv4(),
                  "uploaded": new Date(now_utc),
                  "pic1": req.files['pic1'] ? req.files['pic1'][0] : undefined,
                  "note1": req.body['note1'] ? {
                    field: 'note1',
                    note: req.body['note1']
                  } : "",
                  "pic2": req.files['pic2'] ? req.files['pic2'][0] : undefined,
                  "note2": req.body['note2'] ? {
                    field: 'note2',
                    note: req.body['note2']
                  } : ""
                }
                asHandler.structuredImport(uploadRecord, function (oallresult, metadata) {
                  if (oallresult) {
                    res.send({
                      oall: "Success",
                      myrowkey: metadata
                    })
                  } else {
                    res.send({
                      oall: "Failure",
                      myrowkey: metadata
                    })
                  }
                })
              } else {
                //recaptcha score too low, probably a bot
                return res.sendStatus(429)
              }
            })
          }
      }
    })
});

router.get('/', function(req,res,next){
  var pagebreak = "";
  if(req.query.nextRowKey){
    var clienttoken = {
      nextRowKey: req.query.nextRowKey,
      nextPartitionKey: req.query.nextPartitionKey,
      targetLocation: Number(req.query.targetLocation)
    }
  }
  let posts = asHandler.getEntities(clienttoken, function (reply, token) {
    if(token){
      res.append("Continuation-Token", JSON.stringify(token));
    }
      res.render('post-collection', { posts: reply });
  });
})

module.exports = router;
