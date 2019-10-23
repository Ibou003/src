import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { ReverseProxy } from './proxy/ReverseProxy';
import * as  bodyParser from 'body-parser';
require('source-map-support').install();
import { logger } from './utils/Logger';

const app = express();
// Init
// tslint:disable-next-line:variable-name
const Prometheus = require('prom-client');
const metricsInterval = Prometheus.collectDefaultMetrics();
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
});
export default class Server {

  /**
   * bootstrap the server and does not return anything
   */

  public static bootstrap(): Server {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
    app.disable('x-powered-by');
    app.use(require('morgan')('dev'));
    app.use(cookieParser());

    const solutionsFolder = process.env.SOLUTIONS_FOLDER || './solutions';
    const reverseProxy = new ReverseProxy();
    reverseProxy.loadRules(app, solutionsFolder);

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.raw({type: 'application/*'}));
    app.use(bodyParser.text({type: 'text/*'}));
    app.use(bodyParser.json());

    app.get('/status', (req, res) => {
      res.send('Starting ros-engine');
    });

    /**
     * In order to have Prometheus get the data from this app a specific URL is registered
     */
    app.get('/metrics', (req, res) => {
      res.set('Content-Type', Prometheus.register.contentType);
      res.end(Prometheus.register.metrics());
    });

    app.use((req, res, next) => {
      res.end(JSON.stringify(req.body, null, 2));
      const responseTimeInMs = Date.now() - res.locals.startEpoch;
      httpRequestDurationMicroseconds
        .labels(req.method, req.route.path, res.statusCode)
        .observe(responseTimeInMs);
      next();
    });

    // tslint:disable-next-line:no-shadowed-variable
    const server = app.listen(port, () => {
      logger.log('info', `ROS Engine démarré sur le port ${port}`);
    });

    // Error handler
    app.use((err, req, res, next) => {
      res.statusCode = 500;
      logger.info('Ressource introuvable');
      // Do not expose your error in production
      res.end({ error: err.message });
      next();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      clearInterval(metricsInterval);

      server.close((err) => {
        if (err) {
          logger.info('error', err);
          process.exit(1);
        }

        process.exit(0);
      });
    });
    process.on('SIGINT', () => {
      logger.log('error', 'Caught SIGINT, shutting down.');
      process.exit(0);
    });
    return this;
  }
}
let server = Server.bootstrap();
export { server };
