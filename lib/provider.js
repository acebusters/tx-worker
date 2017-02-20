var Web3 = require('web3');

function Provider(provider, senderAddr, factoryAddr, factoryAbi, proxyAbi, controllerAbi) {
  this.web3 = new Web3(provider);
  this.senderAddr = senderAddr;
  this.factoryAddr = factoryAddr;
  this.factoryAbi = factoryAbi;
  this.proxyAbi = proxyAbi;
  this.controllerAbi = controllerAbi;
}

Provider.prototype.getWeb3 = function () {
  return this.web3;
}

Provider.prototype.getFactory = function () {
  return this.web3.eth.contract(this.factoryAbi).at(this.factoryAddr);
}

Provider.prototype.getProxy = function (proxyAddr) {
  return this.web3.eth.contract(this.proxyAbi).at(proxyAddr);
}

Provider.prototype.getController = function (controllerAddr) {
  return this.web3.eth.contract(this.controllerAbi).at(controllerAddr);
}

Provider.prototype.getSenderAddr = function () {
  return this.senderAddr;
}

Provider.prototype.getFactoryAddr = function () {
  return this.factoryAddr;
}

module.exports = Provider;
