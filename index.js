var https = require('https');
var fs = require('fs');
var jsonfile = require('jsonfile');
var twitter = require('twitter');

var bittrexFile = __dirname + "/support/bittrex/bittrex_currencies.json";
var bittrexCurrentFile = __dirname + "/support/bittrex/bittrex_current.json";

var gateIOFile = __dirname + "/support/gateio/gateio_currencies.json";
var gateIOCurrentFile = __dirname + "/support/gateio/gateio_current.json";

var binanceFile = __dirname + "/support/binance/binance_currencies.json";
var binanceCurrentFile = __dirname + "/support/binance/binance_current.json";

var poloniexFile = __dirname + "/support/poloniex/poloniex_currencies.json";
var poloniexCurrentFile = __dirname + "/support/poloniex/poloniex_current.json";

var bittrexRanFirst = false
var gateIORanFirst = false
var binanceRanFirst = false
var poloniexRanFirst = false

var client = new twitter({
  consumer_key: 'g95e3CY2JC3fMvj4EI7ghf8x3',
  consumer_secret: 'cdEDUm0hGXdi1Kw2Bj11SUO2jNzGurKtpkBD7S14j4bL0uiZR6',
  access_token_key: '955934157565079552-ze0mn6S5quiqRY1SPPX8Ba2Z6B9HHi7',
  access_token_secret: 'LEdBSyFYHAtd65ihcDLwIill1yGmmxhkUlCp7HsAZz4lm'
});

setup()

function bittrex() {
  var request = https.get("https://bittrex.com/api/v1.1/public/getcurrencies", function(response) {
    var body = ""
    response.on("data", function(chunk){
		  body += chunk;
	  });
    response.on("end", function() {
      var currentJSON = JSON.parse(body);
      jsonfile.writeFileSync(bittrexCurrentFile, currentJSON, function (err) {
        console.error("Error: " + err)
      });
      if (!bittrexRanFirst) {
        jsonfile.writeFileSync(bittrexFile, currentJSON, function (err) {
          console.error("Error: " + err)
        });
        bittrexRanFirst = true
      } else {
        var json = jsonfile.readFileSync(bittrexFile)
        var currentJSON = jsonfile.readFileSync(bittrexCurrentFile)
        if (objectEquals(json, currentJSON)) {
          console.log("No change on Bittrex.")
        } else {
          console.log("Change on Bittrex!")
          // Tweet
          client.post('statuses/update', {status: 'A coin has been added on the Bittrex Exchange!'},  function(error, tweet, response) {
            //if(error) throw error;
            console.log("Tweet Response: " + response);
          });
        }
      }
    })
  });
}

function gateIO() {
  var request = https.get("https://data.gate.io/api2/1/marketinfo", function(response) {
    var body = ""
    response.on("data", function(chunk){
		  body += chunk;
	  });
    response.on("end", function() {
      var currentJSON = JSON.parse(body);
      jsonfile.writeFileSync(gateIOCurrentFile, currentJSON, function (err) {
        console.error("Error: " + err)
      });
      if (!gateIORanFirst) {
        jsonfile.writeFileSync(gateIOFile, currentJSON, function (err) {
          console.error("Error: " + err)
        });
        gateIORanFirst = true
      } else {
        var json = jsonfile.readFileSync(gateIOFile)
        var currentJSON = jsonfile.readFileSync(gateIOCurrentFile)
        if (objectEquals(json, currentJSON)) {
          console.log("No change on Gate.io.")
        } else {
          client.post('statuses/update', {status: 'A coin has been added on the Gate.io Exchange!'},  function(error, tweet, response) {
            //if(error) throw error;
            console.log("Tweet Response: " + response);
          });
        }
      }
    })
  });
}

function binance() {
  var request = https.get("https://api.binance.com/api/v1/exchangeInfo", function(response) {
    var body = ""
    response.on("data", function(chunk){
		  body += chunk;
	  });
    response.on("end", function() {
      var currentJSON = JSON.parse(body);
      delete currentJSON.serverTime
      jsonfile.writeFileSync(binanceCurrentFile, currentJSON, function (err) {
        console.error("Error: " + err)
      });
      if (!binanceRanFirst) {
        jsonfile.writeFileSync(binanceFile, currentJSON, function (err) {
          console.error("Error: " + err)
        });
        binanceRanFirst = true
      } else {
        var json = jsonfile.readFileSync(binanceFile)
        var currentJSON = jsonfile.readFileSync(binanceCurrentFile)
        if (objectEquals(json, currentJSON)) {
          console.log("No change on Binance.")
        } else {
          client.post('statuses/update', {status: 'A coin has been added on the Binance Exchange!'},  function(error, tweet, response) {
            //if(error) throw error;
            console.log("Tweet Response: " + response);
          });
        }
      }
    })
  });
}

function poloniex() {
  var request = https.get("https://poloniex.com/public?command=returnCurrencies", function(response) {
    var body = ""
    response.on("data", function(chunk){
		  body += chunk;
	  });
    response.on("end", function() {
      var currentJSON = JSON.parse(body);
      jsonfile.writeFileSync(poloniexCurrentFile, currentJSON, function (err) {
        console.error("Error: " + err)
      });
      if (!poloniexRanFirst) {
        jsonfile.writeFileSync(poloniexFile, currentJSON, function (err) {
          console.error("Error: " + err)
        });
        poloniexRanFirst = true
      } else {
        var json = jsonfile.readFileSync(poloniexFile)
        var currentJSON = jsonfile.readFileSync(poloniexCurrentFile)
        if (objectEquals(json, currentJSON)) {
          console.log("No change on Poloniex.")
        } else {
          client.post('statuses/update', {status: 'A coin has been added on the Poloniex Exchange!'},  function(error, tweet, response) {
            //if(error) throw error;
            console.log("Tweet Response: " + response);
          });
        }
      }
    })
  });
}

function setup() {
  setInterval(bittrex, 1000)
  setInterval(gateIO, 1000)
  setInterval(binance, 1000)
  setInterval(poloniex, 1000)
}
function objectEquals(x, y) {
    // if both are function
    if (x instanceof Function) {
        if (y instanceof Function) {
            return x.toString() === y.toString();
        }
        return false;
    }
    if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
    if (x === y || x.valueOf() === y.valueOf()) { return true; }

    // if one of them is date, they must had equal valueOf
    if (x instanceof Date) { return false; }
    if (y instanceof Date) { return false; }

    // if they are not function or strictly equal, they both need to be Objects
    if (!(x instanceof Object)) { return false; }
    if (!(y instanceof Object)) { return false; }

    var p = Object.keys(x);
    return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) ?
            p.every(function (i) { return objectEquals(x[i], y[i]); }) : false;
}
