var https = require('https');
var fs = require('fs');
var jsonfile = require('jsonfile');
var twitter = require('twitter');
var cheerio = require('cheerio');

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

var bittrexRanFirst = false
var gateIORanFirst = false
var binanceRanFirst = false
var poloniexRanFirst = false
var coinExchangeRanFirst = false

var client = new twitter({
  consumer_key: 'g95e3CY2JC3fMvj4EI7ghf8x3',
  consumer_secret: 'cdEDUm0hGXdi1Kw2Bj11SUO2jNzGurKtpkBD7S14j4bL0uiZR6',
  access_token_key: '955934157565079552-ze0mn6S5quiqRY1SPPX8Ba2Z6B9HHi7',
  access_token_secret: 'LEdBSyFYHAtd65ihcDLwIill1yGmmxhkUlCp7HsAZz4lm'
});

var INTERVAL = 2000;

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
          var currentCount = currentJSON.result.length;
          var oldCount = json.result.length;
          if (currentCount > oldCount) {
            var currencyName = currentJSON.result[currentCount-1].Currency
            var currencyLink = "https://bittrex.com/Market/Index?MarketName=BTC-" + currencyName;
            var exchangeLink = "https://coincodex.com/crypto/" + currencyName.toLowerCase() + "/exchanges/";
            console.log("New coin added to Bittrex: " + currencyName)
            client.post('statuses/update', {status:  currencyName + ' has been added on the bittrex exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(bittrexFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
          } else {
            console.log("False alarm on Bittrex. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(bittrexFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
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
            console.log("New coin added to Gate.io: " + currency)
            client.post('statuses/update', {status:  currency + ' has been added on the gate.io exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(gateIOFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
          } else {
            console.log("False alarm on Gate.io. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(gateIOFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
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
      fs.writeFileSync(binanceCurrentFile, latestCurrency, 'utf8', function(err) {
        if (err) return console.log(err);
      })
      if (!binanceRanFirst) {
        fs.writeFileSync(binanceFile, latestCurrency, 'utf8', function(err) {
          if (err) return console.log(err);
        })
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
          client.post('statuses/update', {status:  latestCurrency + ' has been added on the binance exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
            console.log("Tweet Response: " + response);
          });
          fs.writeFileSync(binanceFile, latestCurrency, 'utf8', function(err) {
            if (err) return console.log(err);
          })
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
          var currentCount = Object.keys(currentJSON).length;
          var oldCount = Object.keys(json).length;
          if (currentCount > oldCount) {
            var currency = Object.keys(currentJSON)[currentCount-1];
            var currencyLink = "https://poloniex.com/exchange#btc_" + currency.toLowerCase();
            var exchangeLink = "https://coincodex.com/crypto/" + currency.toLowerCase() + "/exchanges/";
            console.log("New coin added to Poloniex: " + currency)
            client.post('statuses/update', {status:  currency + ' has been added on the poloniex exchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(poloniexFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
          } else {
            console.log("False alarm on Poloniex. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(poloniexFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
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
      jsonfile.writeFileSync(coinExchangeCurrentFile, currentJSON, function (err) {
        console.error("Error: " + err)
      });
      if (!coinExchangeRanFirst) {
        jsonfile.writeFileSync(coinExchangeFile, currentJSON, function (err) {
          console.error("Error: " + err)
        });
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
            console.log("New coin added to CoinExchange: " + currency)
            client.post('statuses/update', {status:  currency + ' has been added on coinexchange! ' + currencyLink + ' other exchanges: ' + exchangeLink},  function(error, tweet, response) {
              console.log("Tweet Response: " + response);
            });
            jsonfile.writeFileSync(coinExchangeFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
          } else {
            console.log("False alarm on CoinExchange. CurrentCount: " + currentCount + ", OldCount: " + oldCount)
            jsonfile.writeFileSync(coinExchangeFile, currentJSON, function(err) {
              console.error("Error: " + err)
            });
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
