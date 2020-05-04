var express = require('express');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })
var router = express.Router();

const { v4: uuidv4 } = require('uuid');
uuidv4();

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
    "uploaded" : Date.now(),
    "pic1" : req.files['pic1'][0],
    "note1" : req.body['note1'],
    "pic2" : req.files['pic2'][0],
    "note2" : req.body['note2'],
    "pic3" : req.files['pic3'][0],
    "note3" : req.body['note3'],
  }
  res.send('Got a POST request')
  //TODO: intake image from form body
  //Upload to azure blob storage
  //Add to real-time queue
});

module.exports = router;
