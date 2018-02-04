var https = require('https');
var express = require("express");
var app = express();
var fs = require('fs');
var jsonfile = require('jsonfile');
var twitter = require('twitter');
var cheerio = require('cheerio');
var apn = require('apn');

var bittrexFile = __dirname + "/support/bittrex/bittrex_currencies.json";
var bittrexCurrentFile = __dirname + "/support/bittrex/bittrex_current.json";

var gateIOFile = __dirname + "/support/gateio/gateio_currencies.json";
var gateIOCurrentFile = __dirname + "/support/gateio/gateio_current.json";

var binanceFile = __dirname + "/support/binance/binance_latest_static.fam";
var binanceCurrentFile = __dirname + "/support/binance/binance_latest_current.fam";

var poloniexFile = __dirname + "/support/poloniex/poloniex_currencies.json";
var poloniexCurrentFile = __dirname + "/support/poloniex/poloniex_current.json";

var coinExchangeFile = __dirname + "/support/coinexchange/coinexchange_currencies.json";
var coinExchangeCurrentFile = __dirname + "/support/coinexchange/coinexchange_current.json";

var gdaxFile = __dirname + "/support/gdax/gdax_currencies.json";
var gdaxCurrentFile = __dirname + "/support/gdax/gdax_current.json";

var bittrexRanFirst = false
var gateIORanFirst = false
var binanceRanFirst = false
var poloniexRanFirst = false
var coinExchangeRanFirst = false
var gdaxRanFirst = false

var gdaxRequestOptions = {
  host: 'api.gdax.com',
  port: 443,
  headers: {'User-Agent': 'Mozilla/5.0'},
  path: '/currencies',
  method: 'GET'  
}

var options = {
   token: {
     key: "cert_notifications.p8",
     keyId: "3UV67HCS32",
     teamId: "69TNSUL7ZG"
   },
   production: false
};
var apnProvider = new apn.Provider(options);
var deviceToken = "D6A661A715835B790A8FABB3A34922808266470AA467531DE108EDBE5D9F5227";

var client = new twitter({
  consumer_key: 'g95e3CY2JC3fMvj4EI7ghf8x3',
  consumer_secret: 'cdEDUm0hGXdi1Kw2Bj11SUO2jNzGurKtpkBD7S14j4bL0uiZR6',
  access_token_key: '955934157565079552-ze0mn6S5quiqRY1SPPX8Ba2Z6B9HHi7',
  access_token_secret: 'LEdBSyFYHAtd65ihcDLwIill1yGmmxhkUlCp7HsAZz4lm'
});

var INTERVAL = 2000;
var PORT = 8080;

setup()

function bittrex() {
  var request = https.get("https://bittrex.com/api/v1.1/public/getcurrencies", function(response) {
    var body = ""
    response.on("data", function(chunk){
		  body += chunk;
	  });
    response.on("end", function() {
      var currentJSON = JSON.parse(body);
      jsonfile.writeFileSync(bittrexCurrentFile, currentJSON);
      if (!bittrexRanFirst) {
        jsonfile.writeFileSync(bittrexFile, currentJSON);
        bittrexRanFirst = true
      } else {
        var json = jsonfile.readFileSync(bittrexFile)
        var currentJSON = jsonfile.readFileSync(bittrexCurrentFile)

        if (objectEquals(json, currentJSON)) {
          console.log("No change on Bittrex.")
        } else {
          var currentCount = currentJSON.result.length;
          var oldCount = json.result.length;
          if (currentCount > oldCount) {
            var currencyName = currentJSON.result[currentCount-1].Currency
            var currencyLink = "https://bittrex.com/Market/Index?MarketName=BTC-" + currencyName;
            var exchangeLink = "https://coincodex.com/crypto/" + currencyName.toLowerCase() + "/exchanges/";
            console.log("New coin added to Bittrex: " + currencyName + " CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            notification(currencyName + " has been added on the bittrex exchange!")
            client.post('statuses/update', {status:  currencyName + ' has been added on the bittrex exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(bittrexFile, currentJSON);
            var time = Date.now()
            fs.mkdirSync(__dirname + '/additions/bittrex-' + time)
            jsonfile.writeFileSync(__dirname + '/additions/bittrex-' + time + '/current.json', currentJSON)
            jsonfile.writeFileSync(__dirname + '/additions/bittrex-' + time + '/currencies.json', json)
          } else {
            console.log("False alarm on Bittrex. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(bittrexFile, currentJSON);
          }
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
      jsonfile.writeFileSync(gateIOCurrentFile, currentJSON);
      if (!gateIORanFirst) {
        jsonfile.writeFileSync(gateIOFile, currentJSON);
        gateIORanFirst = true
      } else {
        var json = jsonfile.readFileSync(gateIOFile)
        var currentJSON = jsonfile.readFileSync(gateIOCurrentFile)
        if (objectEquals(json, currentJSON)) {
          console.log("No change on Gate.io.")
        } else {
          var currentCount = currentJSON.pairs.length;
          var oldCount = json.pairs.length;
          if (currentCount > oldCount) {
            var obj = currentJSON.pairs[currentCount-1];
            var keys = Object.keys(obj);
            var rawName = keys[0];
            var btcCheck = rawName.replace('_btc', '');
            var ethCheck = btcCheck.replace('_eth', '');
            var usdtCheck = btcCheck.replace('_usdt', '');
            var currency = usdtCheck.toUpperCase();
            var currencyLink = "https://gate.io/trade/" + currency + "_BTC";
            var exchangeLink = "https://coincodex.com/crypto/" + currency.toLowerCase() + "/exchanges/";
            console.log("New coin added to Gate.io: " + currency + " CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            notification(currency + " has been added on the gate.io exchange!")
            client.post('statuses/update', {status:  currency + ' has been added on the gate.io exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(gateIOFile, currentJSON);
            var time = Date.now()
            fs.mkdirSync(__dirname + '/additions/gateio-' + time)
            jsonfile.writeFileSync(__dirname + '/additions/gateio-' + time + '/current.json', currentJSON)
            jsonfile.writeFileSync(__dirname + '/additions/gateio-' + time + '/currencies.json', json)
          } else {
            console.log("False alarm on Gate.io. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(gateIOFile, currentJSON);
          }
        }
      }
    })
  });
}

function binance() {
  var request = https.get("https://support.binance.com/hc/en-us/sections/115000106672-New-Listings", function(response) {
    var body = ""
    response.on("data", function(chunk) {
      body += chunk;
    });
    response.on("end", function() {
      var $ = cheerio.load(body);
      var text = $('li.article-list-item').children().first().html();
      var latestCurrency = text.match(/\(([^)]+)\)/)[1];
      fs.writeFileSync(binanceCurrentFile, latestCurrency, 'utf8')
      if (!binanceRanFirst) {
        fs.writeFileSync(binanceFile, latestCurrency, 'utf8')
        binanceRanFirst = true
      } else {
        var staticLatest = fs.readFileSync(binanceFile);
        if (latestCurrency == staticLatest) {
          console.log("No change on Binance.")
        } else {
          console.log("Change on Binance.")
          var currencyLink = "https://www.binance.com/trade.html?symbol=" + latestCurrency + "_BTC";
          var exchangeLink = "https://coincodex.com/crypto/" + latestCurrency.toLowerCase() + "/exchanges/";
          console.log("New coin added to Binance: " + latestCurrency)
          notification(latestCurrency + " has been added on the binance exchange!")
          client.post('statuses/update', {status:  latestCurrency + ' has been added on the binance exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
            console.log("Tweet Response: " + response);
          });
          fs.writeFileSync(binanceFile, latestCurrency, 'utf8')
          var time = Date.now()
          fs.mkdirSync(__dirname + '/additions/binance-' + time)
          fs.writeFileSync(__dirname + '/additions/binance-' + time + '/current.json', latestCurrency, 'utf8')
          fs.writeFileSync(__dirname + '/additions/binance-' + time + '/currencies.json', staticLatest, 'utf8')
        }
      }
    });
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
      jsonfile.writeFileSync(poloniexCurrentFile, currentJSON);
      if (!poloniexRanFirst) {
        jsonfile.writeFileSync(poloniexFile, currentJSON);
        poloniexRanFirst = true
      } else {
        var json = jsonfile.readFileSync(poloniexFile)
        var currentJSON = jsonfile.readFileSync(poloniexCurrentFile)
        if (objectEquals(json, currentJSON)) {
          console.log("No change on Poloniex.")
        } else {
          var currentCount = Object.keys(currentJSON).length;
          var oldCount = Object.keys(json).length;
          if (currentCount > oldCount) {
            var currency = Object.keys(currentJSON)[currentCount-1];
            var currencyLink = "https://poloniex.com/exchange#btc_" + currency.toLowerCase();
            var exchangeLink = "https://coincodex.com/crypto/" + currency.toLowerCase() + "/exchanges/";
            console.log("New coin added to Poloniex: " + currency + " CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            notification(currency + " has been added on the poloniex exchange!")
            client.post('statuses/update', {status:  currency + ' has been added on the poloniex exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(poloniexFile, currentJSON);
            var time = Date.now()
            fs.mkdirSync(__dirname + '/additions/poloniex-' + time)
            jsonfile.writeFileSync(__dirname + '/additions/poloniex-' + time + '/current.json', currentJSON)
            jsonfile.writeFileSync(__dirname + '/additions/poloniex-' + time + '/currencies.json', json)
          } else {
            console.log("False alarm on Poloniex. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(poloniexFile, currentJSON);
          }
        }
      }
    })
  });
}

function coinExchange() {
  var request = https.get("https://www.coinexchange.io/api/v1/getmarkets", function(response) {
    var body = ""
    response.on("data", function(chunk){
		  body += chunk;
	  });
    response.on("end", function() {
      var currentJSON = JSON.parse(body);
      jsonfile.writeFileSync(coinExchangeCurrentFile, currentJSON);
      if (!coinExchangeRanFirst) {
        jsonfile.writeFileSync(coinExchangeFile, currentJSON);
        coinExchangeRanFirst = true
      } else {
        var json = jsonfile.readFileSync(coinExchangeFile)
        var currentJSON = jsonfile.readFileSync(coinExchangeCurrentFile)
        if (objectEquals(json, currentJSON)) {
          console.log("No change on CoinExchange.")
        } else {
          var currentCount = currentJSON.result.length;
          var oldCount = json.result.length;
          if (currentCount > oldCount) {
            var currency = currentJSON.result[currentCount-1].MarketAssetCode;
            var currencyLink = "https://www.coinexchange.io/market/" + currency + "/BTC";
            var exchangeLink = "https://coincodex.com/crypto/" + currency.toLowerCase() + "/exchanges/";
            console.log("New coin added to CoinExchange: " + currency + " CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            notification(currency + " has been added on coinexchange!")
            client.post('statuses/update', {status:  currency + ' has been added on coinexchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(coinExchangeFile, currentJSON);
            var time = Date.now()
            fs.mkdirSync(__dirname + '/additions/coinexchange-' + time)
            jsonfile.writeFileSync(__dirname + '/additions/coinexchange-' + time + '/current.json', currentJSON)
            jsonfile.writeFileSync(__dirname + '/additions/coinexchange-' + time + '/currencies.json', json)
          } else {
            console.log("False alarm on CoinExchange. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(coinExchangeFile, currentJSON);
          }
        }
      }
    })
  });
}

function gdax() {
  var request = https.get(gdaxRequestOptions, function(response) {
    var body = ""
    response.on("data", function(chunk){
		  body += chunk;
	  });
    response.on("end", function() {
      var currentJSON = JSON.parse(body);
      jsonfile.writeFileSync(gdaxCurrentFile, currentJSON);
      if (!gdaxRanFirst) {
        jsonfile.writeFileSync(gdaxFile, currentJSON);
        gdaxRanFirst = true
      } else {
        var json = jsonfile.readFileSync(gdaxFile)
        var currentJSON = jsonfile.readFileSync(gdaxCurrentFile)

        if (objectEquals(json, currentJSON)) {
          console.log("No change on GDAX.")
        } else {
          var currentCount = currentJSON.length;
          var oldCount = json.length;
          if (currentCount > oldCount) {
            var currencyName = currentJSON[currentCount-1].id
            var currencyLink = "https://www.gdax.com/trade/BTC-" + currencyName;
            var exchangeLink = "https://coincodex.com/crypto/" + currencyName.toLowerCase() + "/exchanges/";
            console.log("New coin added to GDAX: " + currencyName + " CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            notification(currencyName + " has been added on the gdax exchange!")
            client.post('statuses/update', {status:  currencyName + ' has been added on the gdax exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(gdaxFile, currentJSON);
            var time = Date.now()
            fs.mkdirSync(__dirname + '/additions/gdax-' + time)
            jsonfile.writeFileSync(__dirname + '/additions/gdax-' + time + '/current.json', currentJSON)
            jsonfile.writeFileSync(__dirname + '/additions/gdax-' + time + '/currencies.json', json)
          } else {
            console.log("False alarm on GDAX. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(gdaxFile, currentJSON);
          }
        }
      }
    })
  });
}

function setup() {
  setInterval(bittrex, INTERVAL)
  setInterval(gateIO, INTERVAL)
  setInterval(binance, INTERVAL)
  setInterval(poloniex, INTERVAL)
  setInterval(coinExchange, INTERVAL)
  setInterval(gdax, INTERVAL)

  server()
}

function objectEquals(x, y) {
    if (x instanceof Function) {
        if (y instanceof Function) {
            return x.toString() === y.toString();
        }
        return false;
    }
    if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
    if (x === y || x.valueOf() === y.valueOf()) { return true; }
    if (x instanceof Date) { return false; }
    if (y instanceof Date) { return false; }
    if (!(x instanceof Object)) { return false; }
    if (!(y instanceof Object)) { return false; }
    var p = Object.keys(x);
    return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) ?
            p.every(function (i) { return objectEquals(x[i], y[i]); }) : false;
}

function server() {
 app.listen(PORT, function() {
   console.log("Server listening on port: " + PORT);
 });
 app.get('/ping', function(request, response) {
   response.writeHeader(200, {"Content-Type": "text/html"});
   response.write("<html>fuckamonitor - v1.0.0; Server has been running for <code>" + process.uptime() + "</code> seconds.</html>")
   response.end()
 });
}

function notification(text) {
  console.log("Sending notification")

  var notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600;
  notification.badge = 2;
  notification.sound = "ping.aiff";
  notification.alert = text;
  notification.payload = {'messageFrom': 'fuckamonitor'};
  notification.topic = "com.parth.fuckamonitor";

  apnProvider.send(notification, deviceToken).then( result => {
	   // Show the result of the send operation:
	    console.log(result);
  });
}
