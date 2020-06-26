var nodeMailer = require('nodemailer');
var express = require('express');
var router = express.Router();
const {
    body,
    validationResult
} = require('express-validator');

var bodyParser = require('body-parser');
const config = require('config');

router.post('/', [
    body('message').trim().escape(),
    body('visitorname').trim().escape(),
    body('visitoremail').isEmail()
    ], function (req, res, next) {
        const errors = validationResult(req);
        console.log(errors);
        //TODO find email in errors collection
        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SENDER_EMAIL,
                pass: process.env.SENDER_PASS
            }
        });
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: process.env.RCVR_EMAIL,
            subject: 'Habitability App Contact Submission',
            html: "<h2>Received a message on habitability.art!</h2><p>Message: " + req.body.message + "</p>" + "<h3>From: " + req.body.visitorname + "</h3><h3>Message sender's email: " + req.body.visitoremail + "</h3>"
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.send({
                    oall: "Failure"
                })
            } else {
                console.log('Email sent: ' + info.response);
                res.send({
                    oall: "Success"
                })
            }

        });
});

module.exports = router;
