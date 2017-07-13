const factoryAbi = [{ constant: true, inputs: [{ name: '_proxy', type: 'address' }], name: 'getSigner', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_signer', type: 'address' }, { name: '_lockAddr', type: 'address' }], name: 'create', outputs: [], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_newSigner', type: 'address' }], name: 'handleRecovery', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [{ name: '_signer', type: 'address' }], name: 'getAccount', outputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }, { name: '', type: 'bool' }], payable: false, type: 'function' }, { anonymous: false, inputs: [{ indexed: true, name: 'signer', type: 'address' }, { indexed: false, name: 'proxy', type: 'address' }], name: 'AccountCreated', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'newSigner', type: 'address' }, { indexed: false, name: 'proxy', type: 'address' }, { indexed: false, name: 'oldSigner', type: 'address' }], name: 'AccountRecovered', type: 'event' }];
const proxyAbi = [{ constant: false, inputs: [{ name: '_newOwner', type: 'address' }], name: 'transfer', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'getOwner', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'isLocked', outputs: [{ name: '', type: 'bool' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_from', type: 'address' }, { name: '_value', type: 'uint256' }, { name: '_data', type: 'bytes' }], name: 'tokenFallback', outputs: [], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_r', type: 'bytes32' }, { name: '_s', type: 'bytes32' }, { name: '_pl', type: 'bytes32' }], name: 'unlock', outputs: [], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_destination', type: 'address' }, { name: '_value', type: 'uint256' }, { name: '_data', type: 'bytes' }], name: 'forward', outputs: [], payable: false, type: 'function' }, { inputs: [{ name: '_owner', type: 'address' }, { name: '_lockAddr', type: 'address' }], payable: false, type: 'constructor' }, { payable: true, type: 'fallback' }, { anonymous: false, inputs: [{ indexed: true, name: 'sender', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }], name: 'Deposit', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, name: 'to', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }, { indexed: false, name: 'data', type: 'bytes' }], name: 'Withdrawal', type: 'event' }];

function Provider(web3, senderAddr, factoryAddr) {
  this.web3 = web3;
  this.senderAddr = senderAddr;
  this.factoryAddr = factoryAddr;
}

Provider.prototype.getWeb3 = function getWeb3() {
  return this.web3;
};

Provider.prototype.getFactory = function getFactory() {
  return this.web3.eth.contract(factoryAbi).at(this.factoryAddr);
};

Provider.prototype.getProxy = function getProxy(proxyAddr) {
  return this.web3.eth.contract(proxyAbi).at(proxyAddr);
};

Provider.prototype.getSenderAddr = function getSenderAddr() {
  return this.senderAddr;
};

Provider.prototype.getFactoryAddr = function getFactoryAddr() {
  return this.factoryAddr;
};

module.exports = Provider;
