var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var utils = require('../lib/utils');
var Provider = require('../lib/provider');
var ABI = require('../lib/abi');

var WALLET_CONTROLLER_ADDRESS = '0x965491745e24265711775386a33dbae46fc9923d';
var AMOUNT_TO_SEND            = 100;
var GAS                       = new BigNumber('1000000000000000000');;

var passOn = function passOn(key, fn) {
  return function genByPassOn(obj) {
    var prevObj = obj || {};

    return Promise.resolve(fn(prevObj))
      .then(function (value) {
        prevObj[key] = value;
        return prevObj;
      });
  };
};

var processParams = function checkParams(obj) {
  var event = obj.event;

  if (!event) {
    throw new Error('faucet: invalid event object');
  }

  if (!utils.isAddress(event.addr)) {
    throw new Error('faucet: invalid addr');
  }

  return event;
};

var getProvider = function getProvider(obj) {
  var event         = obj.event;
  var providerUrl   = event['stage-variables'].providerUrl;
  var senderAddr    = event['stage-variables'].senderAddr;
  var factoryAddr   = event['stage-variables'].factoryAddr;
  var path          = event.context['resource-path'];
  var web3          = new Web3();
  var web3Provider  = new web3.providers.HttpProvider(providerUrl);
  var provider      = new Provider(
    web3Provider,
    senderAddr,
    factoryAddr,
    ABI.factoryAbi,
    ABI.proxyAbi,
    ABI.controllerAbi
  );

  return provider;
};

var sendEther = function sendEther(obj) {
  var event       = obj.event;
  var walletAddr  = obj.walletAddr;
  var amount      = obj.amount;
  var gas         = obj.gas;
  var addr        = event.addr;
  var controller  = obj.provider.getController(walletAddr);
  var senderAddr  = obj.provider.getSenderAddr();

  return new Promise(function (resolve, reject) {
    controller.sendTx.sendTransaction(
      addr,
      amount,
      { from: senderAddr, gas: gas },
      function (err, data) {
        if (err)  return reject(err);
        return resolve(data);
      }
    );
  });
};

var handler = function(event, context, callback) {
  return Promise.resolve({
      event:      event,
      walletAddr: WALLET_CONTROLLER_ADDRESS,
      amount:     AMOUNT_TO_SEND,
      gas:        GAS,
    })
    .then(passOn('event', processParams))
    .then(passOn('provider', getProvider))
    .then(sendEther)
    .then(
      function onResolve(data) {
        callback(null, data);
      },
      function onReject(e) {
        callback(e);
      }
    );
};

module.exports = {
  handler: handler,
  sendEther: sendEther,
  getProvider: getProvider,
  processParams: processParams,
  passOn: passOn,
};

