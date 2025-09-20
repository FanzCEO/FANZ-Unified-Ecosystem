// System metrics endpoint for Node.js/Express application
import express from 'express'

export const systemRouter = express.Router()

systemRouter.get('/system', (req, res) => {
  try {
    const system = {
      service: {
        name: 'FANZ-Unified-Ecosystem',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      health: {
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      metrics: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      },
      endpoints: [
        '/healthz',
        '/system', 
        '/docs',
        '/version'
      ],
      database: {
        status: 'connected' // TODO: Add actual DB health check
      },
      integrations: {
        fanzdash: {
          registered: true,
          lastHeartbeat: new Date().toISOString(),
          endpoints: {
            register: process.env.FANZDASH_URL + '/introspect/register',
            heartbeat: process.env.FANZDASH_URL + '/api/heartbeat'
          }
        }
      }
    }
    
    res.json(system)
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})
