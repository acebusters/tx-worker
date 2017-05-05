var ethUtil = require('ethereumjs-util');
var utils   = require('./utils');

var TxWorker = function(provider) {
  this.provider = provider;
};

TxWorker.prototype.forward = function(signer, nonceAndAddr, data, sig) {
  // validate parameters
  if (!utils.isAddress(signer)) {
    return Promise.reject('Bad Request: signer address is not valid.');
  }
  var recoveredSigner, r, s;
  try {
    var payload = new Buffer(nonceAndAddr.replace('0x', '') + data.replace('0x', ''), 'hex');
    var hash = ethUtil.sha3(payload);
    r = new Buffer(sig.r.replace('0x', ''), 'hex');
    s = new Buffer(sig.s.replace('0x', ''), 'hex');
    var pub = ethUtil.ecrecover(hash, sig.v, r, s);
    recoveredSigner = '0x' + ethUtil.pubToAddress(pub).toString('hex');
  } catch (e) {
    return Promise.reject('Error: ' + e);
  }
  if (signer !== recoveredSigner) {
    return Promise.reject('Unauthorized: recoveredSigner: ' + recoveredSigner 
      +' did not match expected signer: ' + signer);
  }

  // the real deal
  var self = this;
  var controllerAddrPomise = this.getProxyAddr(signer).then(function(proxyAddr) {    
    return self.getControllerAddr(proxyAddr);
  }).then(function(controllerAddr) {
    return Promise.resolve(controllerAddr);
  });
  var controllerAddr;
  var sender = self.provider.getSenderAddr();
  return controllerAddrPomise.then(function(_controllerAddr) {
    controllerAddr = _controllerAddr;
  //   return self.forwardEstimateGas(controllerAddr, sender, nonceAndAddr, data, sig.r, sig.s, sig.v);
  // }).then(function(gas) {
  //   console.log('gas: ' + gas);
  //   if (gas > 1000000) {
  //     return Promise.reject('Bad Request: gas cost of ' + gas + ' too high.');
  //   }
  //  return self.forwardSendTx(controllerAddr, sender, gas + 40000, nonceAndAddr, data, sig.r, sig.s, sig.v);
    return self.forwardSendTx(controllerAddr, sender, 540000, nonceAndAddr, data, sig.r, sig.s, sig.v);
  });
}

TxWorker.prototype.forwardSendTx = function(controllerAddr, sender, gas, nonceAndAddr, data, r, s, v) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var controller = self.provider.getController(controllerAddr);
    controller.forward.sendTransaction(nonceAndAddr, data, r, s, v, {from: sender, gas: gas}, function(err, rsp) {
      if (err) {
        reject('Error: ' + err);
        return;
      }
      fulfill({txHash: rsp});
    });
  });
}

TxWorker.prototype.forwardEstimateGas = function(controllerAddr, sender, nonceAndAddr, data, r, s, v) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var controller = self.provider.getController(controllerAddr);
    controller.forward.estimateGas(nonceAndAddr, data, r, s, v, {from: sender}, function(err, rsp) {
      if (err) {
        reject('Error: ' + err);
        return;
      }
      fulfill(rsp);
    });
  });
}

TxWorker.prototype.getControllerAddr = function(proxyAddr) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var proxy = self.provider.getProxy(proxyAddr);
    proxy.owner.call(function(err, controllerAddr) {
      if (err) {
        reject(err);
        return;
      };
      if (controllerAddr === '0x0000000000000000000000000000000000000000') {
        reject('Not Found: no owner contract found in proxy ' + proxyAddr);
        return;
      }
      fulfill(controllerAddr);
    });
  });
}

TxWorker.prototype.getProxyAddr = function(signerAddr) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var factory = self.provider.getFactory();
    factory.signerToProxy.call(signerAddr, function(err, proxyAddr) {
      if (err) {
        reject(err);
        return;
      };
      if (proxyAddr === '0x0000000000000000000000000000000000000000') {
        reject('Not Found: no proxy contract found for signer ' + signerAddr);
        return;
      }
      fulfill(proxyAddr);
    });
  });
}

module.exports = TxWorker;
