var Buffer = require('buffer');
var Web3 = require('web3');
var Provider = require('../lib/provider');
var TxWorker = require('../lib/index');
var ABI = require('../lib/abi');

var web3Provider;

exports.handler = function(event, context, callback) {
  // get configuration
  var providerUrl = event['stage-variables'].providerUrl;
  var senderAddr = event['stage-variables'].senderAddr;
  var factoryAddr = event['stage-variables'].factoryAddr;

  // set up web3 and worker
  if (!web3Provider) {
    var web3 = new Web3();
    web3Provider = new web3.providers.HttpProvider(providerUrl);
  }
  var provider = new Provider(web3Provider, senderAddr, factoryAddr, ABI.factoryAbi, ABI.proxyAbi, ABI.controllerAbi);
  var worker = new TxWorker(provider);
  
  worker.forward(
    event.signer,
    event.nonceAndDest,
    event.data, {
      r: event.r,
      s: event.s,
      v: event.v 
  })
  .then(function(data){
    callback(null, data);
  })
  .catch(function(err){
    console.log(err.stack);
    callback(err);
  });
};

