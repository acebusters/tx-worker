const chai      = require('chai');
const sinon     = require('sinon');
const sinonChai = require('sinon-chai');
const faucet    = require('../controllers/faucet');

const expect    = chai.expect;

chai.use(sinonChai);

var mkMockObj = function (fn, extra) {
  return Object.assign({
    event: {
      addr: 'NOT_AN_ADDRESS'
    },
    walletAddr: 'FAKE_WALLET_ADDRESS',
    amount: 999,
    provider: {
      getSenderAddr: function () {
        return 'NOT_A_SENDER_ADDR';
      },
      getController: function () {
        return {
          sendTx: {
            sendTransaction: function (addr, amount, obj, callback) {
              try {
                callback(null, fn && fn(addr, amount));
              } catch (e) {
                callback(e);
              }
            }
          }
        };
      }  
    },
  }, extra || {}); 
};

describe('Faucet', function () {
  describe('passOn', function () {
    it('add property to promise result', function (done) {
      Promise.resolve({ a: 1 })
      .then(faucet.passOn('b', function (obj) {
        return obj.a * 2;
      })) 
      .then(faucet.passOn('c', function (obj) {
        return obj.b * 3;
      }))
      .then(function (data) {
        expect(data).to.eql({ a: 1, b: 2, c: 6 });
        done(); 
      });
    }); 

    it('with null/undefined as initial value', function (done) {
      Promise.resolve(null)
      .then(faucet.passOn('a', function (obj) {
        return 0;
      }))
      .then(
        function (data) {
          expect(data).to.eql({ a: 0 });
          done();
        },
        function () {
          expect('no exception allowed').to.be.null;
        }
      );
    });

    it('leave exceptions alone', function (done) {
      Promise.reject('foobar')
      .then(faucet.passOn('a', function () { return 0; }))
      .catch(function (e) {
        expect(e).to.eql('foobar');
        done();
      });
    });
  });

  it('processParams', function () {
    var fakeAddr1 = undefined;
    var fakeAddr2 = '123';
    var fakeAddr3 = '0x71d2b12dad610fc929e0596b6e887dfb711eec286b7b8b0bdd742c0421a9c425';
    var addr      = '0xc3ccb3902a164b83663947aff0284c6624f3fbf2';

    var genErrTest = function (msg) {
      return function (obj) {
        var fn = function () {
          return faucet.processParams(obj);
        };

        expect(fn).to.throw(msg);
      };
    };

    var invalidEvent = genErrTest('invalid event object');
    var invalidAddr  = genErrTest('invalid addr');

    invalidEvent({});
    invalidAddr({ event: {} });
    invalidAddr({ event: { addr: fakeAddr1 } });
    invalidAddr({ event: { addr: fakeAddr2 } });
    invalidAddr({ event: { addr: fakeAddr3 } });

    expect(function () {
      return faucet.processParams({ event: { addr: addr } });
    }).to.not.throw(Error);
  });

  it('sendEther', function (done) {
    var fn      = sinon.spy(function () { return 'foobar'; });
    var mockObj = mkMockObj(fn);

    faucet.sendEther(mockObj)
    .then(function (ret) {
      expect(ret).to.eql('foobar');
      expect(fn.calledWith(mockObj.event.addr, mockObj.amount)).to.be.true;
      done();
    });
  });

  describe('** faucet handler **', function () {
    it('invalid addr', function (done) {
      var mockObj = mkMockObj();

      faucet.handler(mockObj.event, {}, function (err, data) {
        expect(data).to.not.exist;
        expect(err.message).to.have.string('invalid addr');
        done();
      });
    });

    // TODO: add more tests for handler
  });
});
