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
  {name: 'pic2', maxCount: 1},
  {name: 'pic3', maxCount: 1}
]);

router.post('/', payload, function(req, res, next) {
  //TODO improve this so we can handle missing images or single uploads
  var uploadRecord = {
    "id" : uuidv4(),
    "uploaded": new Date().getTime(),
    "pic1": req.files['pic1'] ? req.files['pic1'][0] : undefined,
    "note1": req.body['note1'] ? req.body['note1'] : "",
    "pic2": req.files['pic2'] ? req.files['pic2'][0] : undefined,
    "note2": req.body['note2'] ? req.body['note2'] : "",
    "pic3": req.files['pic3'] ? req.files['pic3'][0] : undefined,
    "note3": req.body['note3'] ? req.body['note3'] : "",
  }
  if(asHandler.structuredImport(uploadRecord)){
    res.send("Upload done.")
  } else {
    res.send("We had an issue.")
  }
  //TODO: intake image from form body
  //Upload to azure blob storage
  //Add to real-time queue
});

router.get('/', function(req,res,next){
  //TODO: retrieve a certain number of most recent posts
})

module.exports = router;
