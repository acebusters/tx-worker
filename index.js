import Web3 from 'web3';
import Raven from 'raven';
import Pusher from 'pusher';

import Provider from './src/provider';
import TxWorker from './src/index';

let web3Provider;
let pusher;

exports.handler = function handler(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false; // eslint-disable-line no-param-reassign
  Raven.config(process.env.SENTRY_URL).install();

  if (typeof pusher === 'undefined') {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: 'eu',
      encrypted: true,
    });
  }

  // get configuration
  const providerUrl = process.env.PROVIDER_URL;
  const senderAddr = process.env.SENDER_ADDR;
  const factoryAddr = process.env.FACTORY_ADDR;
  const path = event.context['resource-path'];
  let web3;

  // set up web3 and worker
  if (!web3Provider) {
    web3 = new Web3();
    web3Provider = new web3.providers.HttpProvider(providerUrl);
  }
  web3 = new Web3(web3Provider);
  const provider = new Provider(web3, senderAddr, factoryAddr);
  const worker = new TxWorker(provider, pusher);

  // handle request
  let handleRequest;
  if (path.indexOf('forward') > -1) {
    handleRequest = worker.forward(event.forwardReceipt, event.resetConfReceipt);
  } else {
    handleRequest = Promise.reject(`Error: unexpected path: ${path}`);
  }
  handleRequest.then((data) => {
    callback(null, data);
  }).catch((err) => {
    Raven.captureException(err, { server_name: 'tx-worker' }, (sendErr) => {
      if (sendErr) {
        console.log(JSON.stringify(sendErr)); // eslint-disable-line no-console
        callback(sendErr);
        return;
      }
      callback(err);
    });
  });
};
