const Web3 = require('web3');
const Provider = require('./lib/provider');
const TxWorker = require('./lib/index');

var web3Provider;

exports.handler = function(event, context, callback) {

  if (event.context['http-method'] != 'GET') {
    console.log('Request received:\n', JSON.stringify(event));
    console.log('Context received:\n', JSON.stringify(context));
  }

  // get configuration
  const providerUrl = event['stage-variables'].providerUrl;
  const senderAddr = event['stage-variables'].senderAddr;
  const factoryAddr = event['stage-variables'].factoryAddr;
  const factoryAbi = event['stage-variables'].factoryAbi;
  const proxyAbi = event['stage-variables'].proxyAbi;
  const controllerAbi = event['stage-variables'].controllerAbi;
  const path = event.context['resource-path'];

  // set up web3 and worker
  if (!provider) {
    const web3 = new Web3();
    web3Provider = new web3.providers.HttpProvider(providerUrl);
  }
  const provider = new Provider(web3Provider, senderAddr, factoryAddr, factoryAbi, proxyAbi, controllerAbi);
  const worker = new TxWorker(provider);
  
  // handle request
  var handleRequest;
  if (path.indexOf('forward') > -1) {
    handleRequest = worker.forward(event.nonceAndAddr, event.data, event.r, event.s, event.v);
  } else {
    handleRequest = Promise.reject('Error: unexpected path: ' + path);
  }
  handleRequest.then(function(data){
    callback(null, data);
  }).catch(function(err){
    console.log(err.stack);
    callback(err);
  });
}