var forwardController = require('./controllers/forward');
var faucetController = require('./controllers/faucet');

var runRoutes = function (path, fallback, args, routes) {
  var matched = false;

  for (var i = 0, len = routes.length; i < len; i += 1) {
    if (path.indexOf(routes[i].route) !== -1) {
      matched = true;
      routes[i].handler.apply(null, args);
      break;
    }
  }

  if (!matched) {
    fallback.apply(null, args);
  }
};


exports.handler = function(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  var path = event.context['resource-path'];
  var fallback = function (event, context, callback) {
    callback('Error: unexpected path: ' + path);
  };

  if (event.context['http-method'] != 'GET') {
    console.log('Request received:\n', JSON.stringify(event));
    console.log('Context received:\n', JSON.stringify(context));
  }

  runRoutes(path, fallback, [event, context, callback], [
    { route: 'forward', handler: forwardController.handler },
    { route: 'faucet',  handler: faucetController.handler },
  ]);
};

