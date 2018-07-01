(function() {
  var xml2js = require('xml2js'),
      fs = require('fs'),
      path = require('path'),
      request = require('request');

  request("http://api.bart.gov/api/etd.aspx?cmd=etd&orig=MLBR", function(error, response, body) {
    parseData(body);
  });

  function parseData(data) {
    var parseString = xml2js.parseString;
    parseString(data, function(err, result) {
      string_result = JSON.stringify(result);
      fs.writeFile(path.join(__dirname, '../','data/MLBR.json'), string_result, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("saved");
        }
      });
    });
  }

}).call(this);
