import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import { it, describe, beforeEach, afterEach } from 'mocha';
import TxWorker from './src/index';

chai.use(sinonChai);

// secretSeed: 'brother mad churn often amount wing pretty critic rhythm man insane ridge' }
const ADDR1 = '0xe10f3d125e5f4c753a6456fc37123cf17c6900f2';
// const KEY1 = '0x7bc8feb5e1ce2927480de19d8bc1dc6874678c016ae53a2eec6a6e9df717bfac';

// secretSeed: 'erosion warm student north injury good evoke river despair critic wrestle unveil' }
const ADDR2 = '0xc3ccb3902a164b83663947aff0284c6624f3fbf2';
// const KEY2 = '0x71d2b12dad610fc929e0596b6e887dfb711eec286b7b8b0bdd742c0421a9c425';

const provider = {
  getFactory() {},
  getProxy() {},
  getController() {},
  getSenderAddr() { return ADDR2; },
};

const factory = {
  signerToProxy: {
    call() {},
  },
};

const proxy = {
  owner: {
    call() {},
  },
};

const controller = {
  forward: {
    sendTransaction() {},
    estimateGas() {},
  },
};

const nonceAndDest = '0x00000000000000000000000000ec49c9f2bfff47c36fecf8c208812865b8b1d8';
const data = '0xcc872b6600000000000000000000000000000000000000000000000000000000000007d0';
// Signed by PRIV1
const sig = {
  r: '0x8d202e28dd5237ea5aff4d1434e3a7631cdd8597cdaf1700395a59b396d6bee5',
  s: '0x56fe16f79839ea7ab6f93824472e6fc3b2bc48aea96962c5e3a75d38752ad1d7',
  v: 28,
};

describe('Transaction Worker forward', () => {
  beforeEach(() => {
    sinon.stub(provider, 'getFactory').returns(factory);
    sinon.stub(provider, 'getProxy').returns(proxy);
    sinon.stub(provider, 'getController').returns(controller);
  });

  afterEach(() => {
    if (provider.getFactory.restore) provider.getFactory.restore();
    if (provider.getProxy.restore) provider.getProxy.restore();
    if (provider.getController.restore) provider.getController.restore();

    if (factory.signerToProxy.call.restore) factory.signerToProxy.call.restore();
    if (proxy.owner.call.restore) proxy.owner.call.restore();
    if (controller.forward.sendTransaction.restore) controller.forward.sendTransaction.restore();
    if (controller.forward.estimateGas.restore) controller.forward.estimateGas.restore();
  });

  it('should error on invalid signer address.', (done) => {
    new TxWorker(provider).forward('0x1234', null, null, null).catch((err) => {
      expect(err).to.contain('Bad Request: ');
      done();
    }).catch(done);
  });

  it('should error on invalid sig.', (done) => {
    const faultySig = { r: '0x00', s: '0x00', v: 28 };
    new TxWorker(provider).forward(ADDR1, nonceAndDest, data, faultySig).catch((err) => {
      expect(err).to.contain('Error: ');
      done();
    }).catch(done);
  });

  it('should error on wrong signer.', (done) => {
    new TxWorker(provider).forward(ADDR2, nonceAndDest, data, sig).catch((err) => {
      expect(err).to.contain('Unauthorized: ');
      done();
    }).catch(done);
  });

  it('should handle non existing signer in factory.', (done) => {
    sinon.stub(factory.signerToProxy, 'call').yields(null, '0x0000000000000000000000000000000000000000');

    new TxWorker(provider).forward(ADDR1, nonceAndDest, data, sig).catch((err) => {
      expect(err).to.contain('Not Found: ');
      done();
    }).catch(done);
  });

  it('should handle abandoned proxy contract.', (done) => {
    sinon.stub(factory.signerToProxy, 'call').yields(null, ADDR1);
    sinon.stub(proxy.owner, 'call').yields(null, '0x0000000000000000000000000000000000000000');

    new TxWorker(provider).forward(ADDR1, nonceAndDest, data, sig).catch((err) => {
      expect(err).to.contain('Not Found: ');
      done();
    }).catch(done);
  });

  it('should prevent tx with high gas cost.', (done) => {
    sinon.stub(factory.signerToProxy, 'call').yields(null, ADDR1);
    sinon.stub(proxy.owner, 'call').yields(null, ADDR1);
    sinon.stub(controller.forward, 'estimateGas').yields(null, 1200000);

    new TxWorker(provider).forward(ADDR1, nonceAndDest, data, sig).catch((err) => {
      expect(err).to.contain('Bad Request: ');
      done();
    }).catch(done);
  });

  it('should handle error in tx send.', (done) => {
    sinon.stub(factory.signerToProxy, 'call').yields(null, ADDR1);
    sinon.stub(proxy.owner, 'call').yields(null, ADDR1);
    sinon.stub(controller.forward, 'estimateGas').yields(null, 200000);
    sinon.stub(controller.forward, 'sendTransaction').yields('error');

    new TxWorker(provider).forward(ADDR1, nonceAndDest, data, sig).catch((err) => {
      expect(err).to.contain('Error: ');
      done();
    }).catch(done);
  });

  it('should allow to send tx.', (done) => {
    const txHash = '0xd797353793ef8d7007997b7fa9802a2945116c608afd3adfb84e8005a81ea2b2';

    sinon.stub(factory.signerToProxy, 'call').yields(null, ADDR1);
    sinon.stub(proxy.owner, 'call').yields(null, ADDR1);
    sinon.stub(controller.forward, 'estimateGas').yields(null, 200000);
    sinon.stub(controller.forward, 'sendTransaction').yields(null, txHash);

    new TxWorker(provider).forward(ADDR1, nonceAndDest, data, sig).then((rsp) => {
      expect(rsp).to.eql({ txHash });
      expect(controller.forward.sendTransaction).calledWith(
        nonceAndDest,
        data, sinon.match.any, sinon.match.any,
        sig.v, sinon.match.any);
      done();
    }).catch(done);
  });
});
