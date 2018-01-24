var express = require('express');
var app = express();
var path = require('path');
var port = process.env.PORT || 8080;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(express.static(__dirname + '/'));


app.get('/', function(req, res) {
    res.sendFile(path.resolve(`${__dirname}/index.html`))
 
});


app.listen(port);