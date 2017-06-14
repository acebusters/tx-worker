import { Receipt } from 'poker-helper';

function TxWorker(provider) {
  this.provider = provider;
}

TxWorker.prototype.forward = function forward(forwardReceipt) {
  let receipt;
  try {
    receipt = Receipt.parse(forwardReceipt);
  } catch (e) {
    return Promise.reject(`Bad Request: ${e}`);
  }
  const controllerAddrPomise = this.getProxyAddr(receipt.signer)
    .then(proxyAddr => this.getControllerAddr(proxyAddr))
    .then(controllerAddr => Promise.resolve(controllerAddr));
  let controllerAddr;
  const sender = this.provider.getSenderAddr();
  return controllerAddrPomise.then((_controllerAddr) => {
    controllerAddr = _controllerAddr;
    return this.forwardSendTx(forwardReceipt, controllerAddr, sender, 540000);
  });
};

TxWorker.prototype.forwardSendTx = function forwardSendTx(forwardReceipt,
  controllerAddr, sender, gas) {
  return new Promise((fulfill, reject) => {
    const controller = this.provider.getController(controllerAddr);
    controller.forward.sendTransaction(...Receipt.parseToParams(forwardReceipt),
      { from: sender, gas }, (err, rsp) => {
        if (err) {
          reject(`Error: ${err}`);
          return;
        }
        fulfill({ txHash: rsp });
      });
  });
};

TxWorker.prototype.getControllerAddr = function getControllerAddr(proxyAddr) {
  const self = this;
  return new Promise((fulfill, reject) => {
    const proxy = self.provider.getProxy(proxyAddr);
    proxy.owner.call((err, controllerAddr) => {
      if (err) {
        reject(err);
        return;
      }
      if (controllerAddr === '0x0000000000000000000000000000000000000000') {
        reject(`Not Found: no owner contract found in proxy ${proxyAddr}`);
        return;
      }
      fulfill(controllerAddr);
    });
  });
};

TxWorker.prototype.getProxyAddr = function getProxyAddr(signerAddr) {
  return new Promise((fulfill, reject) => {
    const factory = this.provider.getFactory();
    factory.signerToProxy.call(signerAddr, (err, proxyAddr) => {
      if (err) {
        reject(err);
        return;
      }
      if (proxyAddr === '0x0000000000000000000000000000000000000000') {
        reject(`Not Found: no proxy contract found for signer ${signerAddr}`);
        return;
      }
      fulfill(proxyAddr);
    });
  });
};

module.exports = TxWorker;

