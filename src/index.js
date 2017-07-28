import { Receipt } from 'poker-helper';

function TxWorker(provider, pusher) {
  this.provider = provider;
  this.pusher = pusher;
}

TxWorker.prototype.forward = function forward(forwardReceipt, resetConfReceipt) {
  try {
    const receipt = Receipt.parse(forwardReceipt);
    const resetReceipt = resetConfReceipt && Receipt.parse(resetConfReceipt);
    const sender = this.provider.getSenderAddr();
    return this.getAccount(
      resetReceipt ? resetReceipt.oldSignerAddr : receipt.signer,
    ).then((account) => {
      const proms = [];
      if (account.ownerAddr !== sender) {
        return Promise.reject(`Bad Request: wrong owner ${account.ownerAddr} found on poxy ${account.proxyAddr}`);
      }
      proms.push(this.sendTx(account.proxyAddr,
        receipt.destinationAddr, receipt.amount, receipt.data, sender, 540000));
      if (receipt.data.indexOf(receipt.signer.replace('0x', '')) > -1) {
        proms.push(this.publishUpdate(receipt.destinationAddr, receipt));
      }
      return Promise.all(proms);
    }).then(rsp => Promise.resolve(rsp[0]));
  } catch (e) {
    return Promise.reject(`Bad Request: ${e}`);
  }
};

TxWorker.prototype.sendTx = function sendTx(proxyAddr, destination,
  value, data, sender, gas) {
  return new Promise((fulfill, reject) => {
    const proxy = this.provider.getProxy(proxyAddr);
    proxy.forward.sendTransaction(destination, value, data,
      { from: sender, gas }, (err, rsp) => {
        if (err) {
          reject(`Error: ${err}`);
          return;
        }
        fulfill({ txHash: rsp });
      });
  });
};

TxWorker.prototype.getAccount = function getAccount(signerAddr) {
  return new Promise((fulfill, reject) => {
    const factory = this.provider.getFactory();
    factory.getAccount.call(signerAddr, (err, rsp) => {
      if (err) {
        return reject(err);
      }
      const proxyAddr = rsp[0];
      const ownerAddr = rsp[1];
      const isLocked = rsp[2];
      if (proxyAddr === '0x') {
        return reject(`Not Found: no proxy contract found for signer ${signerAddr}`);
      }
      if (!isLocked) {
        return reject(`Bad Request: ${proxyAddr} is an unlocked account. send tx with ${ownerAddr}`);
      }
      return fulfill({ proxyAddr, ownerAddr, isLocked });
    });
  });
};

TxWorker.prototype.publishUpdate = function publishUpdate(topic, msg) {
  return new Promise((fulfill, reject) => {
    try {
      const rsp = this.pusher.trigger(topic, 'update', {
        type: 'joinRequest',
        payload: msg,
      });
      fulfill(rsp);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = TxWorker;

