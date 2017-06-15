import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import { it, describe, beforeEach, afterEach } from 'mocha';
import { Receipt } from 'poker-helper';
import TxWorker from './src/index';

chai.use(sinonChai);

const ADDR1 = '0xe10f3d125e5f4c753a6456fc37123cf17c6900f2';
const ADDR2 = '0xc3ccb3902a164b83663947aff0284c6624f3fbf2';

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

const pusher = {
  trigger() {},
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
    if (pusher.trigger.restore) pusher.trigger.restore();
    if (factory.signerToProxy.call.restore) factory.signerToProxy.call.restore();
    if (proxy.owner.call.restore) proxy.owner.call.restore();
    if (controller.forward.sendTransaction.restore) controller.forward.sendTransaction.restore();
    if (controller.forward.estimateGas.restore) controller.forward.estimateGas.restore();
  });

  it('should error on invalid receipt.', (done) => {
    const invalidReceipt = 'M4YP.q2nMwonzSBctgq6qrQP9R6t/4xWjUIp5a+QnbQyd+U0=.V2RkK7APB5zIwVA0SGFnQRhPO/gEEnLdCdGG+bYrjKo=.G93u/wARIjMAAAAOgujGz0LI0f+VlLF6P1DpShLMhg8=.AAAAAAAAAAABBBAAAAAAAAAAAAAAAAAAAAAAAAAB1MA=.ESIzRA==';
    new TxWorker(provider).forward(invalidReceipt).catch((err) => {
      expect(err).to.contain('Bad Request: ');
      done();
    }).catch(done);
  });

  it('should handle non existing signer in factory.', (done) => {
    const forwardReceipt = 'M4YP.q2nMwonzSBctgq6qrQP9R6t/4xWjUIp5a+QnbQyd+U0=.V2RkK7APB5zIwVA0SGFnQRhPO/gEEnLdCdGG+bYrjKo=.G93u/wARIjMAAAAOgujGz0LI0f+VlLF6P1DpShLMhg8=.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB1MA=.ESIzRA==';
    sinon.stub(factory.signerToProxy, 'call').yields(null, '0x0000000000000000000000000000000000000000');

    new TxWorker(provider).forward(forwardReceipt).catch((err) => {
      expect(err).to.contain('Not Found: ');
      done();
    }).catch(done);
  });

  it('should handle abandoned proxy contract.', (done) => {
    const forwardReceipt = 'M4YP.q2nMwonzSBctgq6qrQP9R6t/4xWjUIp5a+QnbQyd+U0=.V2RkK7APB5zIwVA0SGFnQRhPO/gEEnLdCdGG+bYrjKo=.G93u/wARIjMAAAAOgujGz0LI0f+VlLF6P1DpShLMhg8=.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB1MA=.ESIzRA==';
    sinon.stub(factory.signerToProxy, 'call').yields(null, ADDR1);
    sinon.stub(proxy.owner, 'call').yields(null, '0x0000000000000000000000000000000000000000');

    new TxWorker(provider).forward(forwardReceipt).catch((err) => {
      expect(err).to.contain('Not Found: ');
      done();
    }).catch(done);
  });

  it('should handle error in tx send.', (done) => {
    const forwardReceipt = 'M4YP.q2nMwonzSBctgq6qrQP9R6t/4xWjUIp5a+QnbQyd+U0=.V2RkK7APB5zIwVA0SGFnQRhPO/gEEnLdCdGG+bYrjKo=.G93u/wARIjMAAAAOgujGz0LI0f+VlLF6P1DpShLMhg8=.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB1MA=.ESIzRA==';
    sinon.stub(factory.signerToProxy, 'call').yields(null, ADDR1);
    sinon.stub(proxy.owner, 'call').yields(null, ADDR1);
    sinon.stub(controller.forward, 'sendTransaction').yields('error');

    new TxWorker(provider).forward(forwardReceipt).catch((err) => {
      expect(err).to.contain('Error: ');
      done();
    }).catch(done);
  });

  it('should allow to send tx.', (done) => {
    const forwardReceipt = 'M3H7.MNZGDLtAeTTotcF1RaTQC9yxTG1v872In6Gsya76od8=.KFBvWNlOMlaQ4Ig2S8d7cC4sBru9Vrg7H2vcdoCKyhM=.G8vPm8PCpXAAAAAJ+MBn16c2YEpuxSOND1mmlhVVaEI=.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=.koQ4zQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9AAAAAAAAAAAAAAAAAA+SccfDWbn6bznUytzcR/sW8cfsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABA==';
    const txHash = '0xd797353793ef8d7007997b7fa9802a2945116c608afd3adfb84e8005a81ea2b2';
    sinon.stub(pusher, 'trigger').returns(null);
    sinon.stub(factory.signerToProxy, 'call').yields(null, ADDR1);
    sinon.stub(proxy.owner, 'call').yields(null, ADDR1);
    sinon.stub(controller.forward, 'sendTransaction').yields(null, txHash);

    new TxWorker(provider, pusher).forward(forwardReceipt).then((rsp) => {
      expect(rsp).to.eql({ txHash });
      expect(pusher.trigger).callCount(1);
      expect(controller.forward.sendTransaction).calledWith(
        ...Receipt.parseToParams(forwardReceipt), sinon.match.any);
      done();
    }).catch(done);
  });
});
