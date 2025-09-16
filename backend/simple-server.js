const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FANZ Backend Server is running',
    timestamp: new Date().toISOString() 
  });
});

// Basic API info route  
app.get('/api/status', (req, res) => {
  res.json({
    service: 'FANZ Unified Ecosystem Backend',
    version: '1.0.0',
    status: 'operational',
    database: {
      connected: true,  // Placeholder for now
      status: 'connected'
    },
    vendor_access: {
      enabled: true,
      status: 'configured'
    }
  });
});

// Vendor access stub endpoints
app.get('/api/vendor-access/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Vendor access system is operational'
  });
});

app.get('/api/vendor-access/profiles', (req, res) => {
  res.json({
    profiles: [
      {
        id: '1',
        company_name: 'Test Contractor',
        vendor_type: 'contractor',
        status: 'active'
      }
    ],
    total: 1
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 FANZ Backend Server Started Successfully!

   Server: http://localhost:${PORT}
   Health: http://localhost:${PORT}/health
   Status: http://localhost:${PORT}/api/status
   
   Environment: ${process.env.NODE_ENV || 'development'}
   Timestamp: ${new Date().toISOString()}
  `);
});

module.exports = app;