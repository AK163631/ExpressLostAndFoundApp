var express = require('express');
const path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    //res.set('Content-Type', 'text/html');
    res.sendFile('/webroot/index.html');
});


module.exports = router;
