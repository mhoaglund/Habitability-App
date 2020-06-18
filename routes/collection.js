var express = require('express');
var multer  = require('multer')
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

var upload = multer({ storage: storage })
var router = express.Router();
const asHandler = require('.././azureServiceHandler.js');

/* GET home page. */
var payload = upload.fields([
  {name: 'pic1', maxCount: 1}, 
  {name: 'pic2', maxCount: 1}
]);

router.post('/', payload, function(req, res, next) {
  var date = new Date();
  var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
  var uploadRecord = {
    "id" : uuidv4(),
    "uploaded": new Date(now_utc),
    "pic1": req.files['pic1'] ? req.files['pic1'][0] : undefined,
    "note1": req.body['note1'] ? {field: 'note1', note: req.body['note1']} : "",
    "pic2": req.files['pic2'] ? req.files['pic2'][0] : undefined,
    "note2": req.body['note2'] ? {field: 'note2', note: req.body['note2']} : ""
  }
  asHandler.structuredImport(uploadRecord, function(oallresult, metadata){
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
