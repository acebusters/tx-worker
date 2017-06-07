import ethUtil from 'ethereumjs-util';

/**
 * Checks if the given string is a checksummed address
 *
 * @method isChecksumAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
function isChecksumAddress(addr) {
  // Check each case
  const address = addr.replace('0x', '');
  const addressHash = ethUtil.sha3(address.toLowerCase());
  for (let i = 0; i < 40; i += 1) {
    // the nth letter should be uppercase if the nth digit of casemap is 1
    if ((parseInt(addressHash[i], 16) > 7
      && address[i].toUpperCase() !== address[i])
      || (parseInt(addressHash[i], 16) <= 7
        && address[i].toLowerCase() !== address[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
function isAddress(address) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    // check if it has the basic requirements of an address
    return false;
  } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
    // If it's all small caps or all all caps, return true
    return true;
  }
  // Otherwise check each case
  return isChecksumAddress(address);
}

function TxWorker(provider) {
  this.provider = provider;
}

TxWorker.prototype.forward = function forward(signer, nonceAndAddr, data, sig) {
  // validate parameters
  if (!isAddress(signer)) {
    return Promise.reject('Bad Request: signer address is not valid.');
  }
  let recoveredSigner;
  let r;
  let s;

  try {
    const payload = new Buffer(nonceAndAddr.replace('0x', '') + data.replace('0x', ''), 'hex');
    const hash = ethUtil.sha3(payload);
    r = new Buffer(sig.r.replace('0x', ''), 'hex');
    s = new Buffer(sig.s.replace('0x', ''), 'hex');
    const pub = ethUtil.ecrecover(hash, sig.v, r, s);
    recoveredSigner = `0x${ethUtil.pubToAddress(pub).toString('hex')}`;
  } catch (e) {
    return Promise.reject(`Error: ${e}`);
  }
  if (signer !== recoveredSigner) {
    return Promise.reject(`Unauthorized: recoveredSigner: ${recoveredSigner
      } did not match expected signer: ${signer}`);
  }

  // the real deal
  const controllerAddrPomise = this.getProxyAddr(signer)
    .then(proxyAddr => this.getControllerAddr(proxyAddr))
    .then(controllerAddr => Promise.resolve(controllerAddr));
  let controllerAddr;
  const sender = this.provider.getSenderAddr();
  return controllerAddrPomise.then((_controllerAddr) => {
    controllerAddr = _controllerAddr;
    return this.forwardEstimateGas(controllerAddr,
      sender, nonceAndAddr, data, sig.r, sig.s, sig.v);
  }).then((gas) => {
    if (gas > 1000000) {
      return Promise.reject(`Bad Request: gas cost of ${gas} too high.`);
    }
    return this.forwardSendTx(controllerAddr,
    sender, gas + 500000, nonceAndAddr, data, sig.r, sig.s, sig.v);
   // return this.forwardSendTx(controllerAddr, sender, 540000,
   // nonceAndAddr, data, sig.r, sig.s, sig.v);
  });
};

TxWorker.prototype.forwardSendTx = function forwardSendTx(controllerAddr,
  sender, gas, nonceAndAddr, data, r, s, v) {
  return new Promise((fulfill, reject) => {
    const controller = this.provider.getController(controllerAddr);
    controller.forward.sendTransaction(nonceAndAddr,
      data, r, s, v, { from: sender, gas }, (err, rsp) => {
        if (err) {
          reject(`Error: ${err}`);
          return;
        }
        fulfill({ txHash: rsp });
      });
  });
};

TxWorker.prototype.forwardEstimateGas = function forwardEstimateGas(controllerAddr,
  sender, nonceAndAddr, data, r, s, v) {
  return new Promise((fulfill, reject) => {
    const controller = this.provider.getController(controllerAddr);
    controller.forward.estimateGas(nonceAndAddr, data, r, s, v, { from: sender }, (err, rsp) => {
      if (err) {
        reject(`Error: ${err}`);
        return;
      }
      fulfill(rsp);
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
