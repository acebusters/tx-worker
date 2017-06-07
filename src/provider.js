const factoryAbi = [{ constant: true, inputs: [{ name: '', type: 'address' }], name: 'signerToProxy', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_signer', type: 'address' }, { name: '_recovery', type: 'address' }, { name: '_timeLock', type: 'uint256' }], name: 'create', outputs: [], payable: false, type: 'function' }, { anonymous: false, inputs: [{ indexed: true, name: 'signer', type: 'address' }, { indexed: false, name: 'proxy', type: 'address' }, { indexed: false, name: 'controller', type: 'address' }, { indexed: false, name: 'recovery', type: 'address' }], name: 'AccountCreated', type: 'event' }];
const proxyAbi = [{ constant: false, inputs: [{ name: '_newOwner', type: 'address' }], name: 'transfer', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [{ name: '_addr', type: 'address' }], name: 'isOwner', outputs: [{ name: '', type: 'bool' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: 'destination', type: 'address' }, { name: 'data', type: 'bytes' }], name: 'forward', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'owner', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: 'destination', type: 'address' }, { name: 'value', type: 'uint256' }], name: 'send', outputs: [], payable: false, type: 'function' }, { payable: true, type: 'fallback' }, { anonymous: false, inputs: [{ indexed: true, name: 'sender', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }], name: 'Received', type: 'event' }];
const controllerAbi = [{ constant: true, inputs: [], name: 'newControllerPendingUntil', outputs: [{ name: '', type: 'uint96' }], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'newRecoveryPendingUntil', outputs: [{ name: '', type: 'uint96' }], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'signer', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'newController', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'version', outputs: [{ name: '', type: 'uint96' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_destination', type: 'address' }, { name: '_value', type: 'uint256' }], name: 'sendTx', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'newRecovery', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_newController', type: 'address' }], name: 'signControllerChange', outputs: [], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_newRecovery', type: 'address' }], name: 'signRecoveryChange', outputs: [], payable: false, type: 'function' }, { constant: false, inputs: [], name: 'changeController', outputs: [], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_nonceAndAddr', type: 'bytes32' }, { name: '_data', type: 'bytes' }, { name: '_r', type: 'bytes32' }, { name: '_s', type: 'bytes32' }, { name: '_v', type: 'uint8' }], name: 'forward', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [{ name: '', type: 'bytes32' }], name: 'nonceMap', outputs: [{ name: '', type: 'bool' }], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_newSigner', type: 'address' }], name: 'changeSigner', outputs: [], payable: false, type: 'function' }, { constant: false, inputs: [{ name: '_destination', type: 'address' }, { name: '_payload', type: 'bytes' }], name: 'forwardTx', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'timeLock', outputs: [{ name: '', type: 'uint96' }], payable: false, type: 'function' }, { constant: false, inputs: [], name: 'changeRecovery', outputs: [], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'recovery', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { constant: true, inputs: [], name: 'proxy', outputs: [{ name: '', type: 'address' }], payable: false, type: 'function' }, { inputs: [{ name: '_proxy', type: 'address' }, { name: '_signer', type: 'address' }, { name: '_recovery', type: 'address' }, { name: '_timeLock', type: 'uint96' }], payable: false, type: 'constructor' }, { anonymous: false, inputs: [{ indexed: false, name: 'action', type: 'bytes32' }], name: 'Event', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, name: 'error', type: 'bytes32' }], name: 'Error', type: 'event' }];

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

Provider.prototype.getController = function getController(controllerAddr) {
  return this.web3.eth.contract(controllerAbi).at(controllerAddr);
};

Provider.prototype.getSenderAddr = function getSenderAddr() {
  return this.senderAddr;
};

Provider.prototype.getFactoryAddr = function getFactoryAddr() {
  return this.factoryAddr;
};

module.exports = Provider;
