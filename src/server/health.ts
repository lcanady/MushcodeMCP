/**
 * Health check endpoint for Docker containers and monitoring
 */

import { createServer } from 'http';
import { logger } from '../utils/logger.js';

export class HealthCheckServer {
  private server?: ReturnType<typeof createServer>;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
  }

  /**
   * Start the health check server
   */
  start(): void {
    this.server = createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        this.handleHealthCheck(req, res);
      } else if (req.url === '/metrics' && req.method === 'GET') {
        this.handleMetrics(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });

    this.server.listen(this.port, () => {
      logger.info(`Health check server listening on port ${this.port}`, {
        operation: 'health_server_start',
        port: this.port
      });
    });

    this.server.on('error', (error) => {
      logger.error('Health check server error', error, {
        operation: 'health_server_error'
      });
    });
  }

  /**
   * Stop the health check server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Health check server stopped', {
            operation: 'health_server_stop'
          });
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle health check requests
   */
  private handleHealthCheck(_req: any, res: any): void {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development'
    };

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(health, null, 2));

    logger.debug('Health check requested', {
      operation: 'health_check',
      status: 'healthy'
    });
  }

  /**
   * Handle metrics requests
   */
  private handleMetrics(_req: any, res: any): void {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    };

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(metrics, null, 2));

    logger.debug('Metrics requested', {
      operation: 'metrics_request'
    });
  }
}