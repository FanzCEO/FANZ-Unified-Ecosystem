/**
 * FANZ Money Dash Database Configuration
 * Handles database connections with security and performance optimizations
 */

import mongoose from 'mongoose';
import logger, { logError, logSecurityEvent } from './logger.js';

// Database connection configuration
const DB_CONFIG = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Connect to MongoDB database
 */
export async function connectDatabase() {
  if (isConnected) {
    logger.info('Database already connected');
    return mongoose.connection;
  }

  try {
    connectionAttempts++;
    
    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI || 
                    process.env.MONGO_URL || 
                    'mongodb://localhost:27017/fanz-money-dash';

    logger.info(`Attempting database connection (attempt ${connectionAttempts})`);

    // Connect with configuration
    await mongoose.connect(mongoUri, DB_CONFIG);

    isConnected = true;
    connectionAttempts = 0;

    logger.info('Database connected successfully', {
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    });

    // Set up connection event listeners
    setupConnectionEventListeners();

    return mongoose.connection;

  } catch (error) {
    logError(error, { 
      context: 'database_connection',
      attempt: connectionAttempts,
      maxAttempts: MAX_RETRY_ATTEMPTS
    });

    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      logger.info(`Retrying database connection in 5 seconds (attempt ${connectionAttempts + 1}/${MAX_RETRY_ATTEMPTS})`);
      setTimeout(() => connectDatabase(), 5000);
    } else {
      logError(new Error('Max database connection attempts reached'), {
        context: 'database_connection_failed'
      });
      throw error;
    }
  }
}

/**
 * Setup connection event listeners
 */
function setupConnectionEventListeners() {
  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('Database connection established');
  });

  mongoose.connection.on('error', (error) => {
    isConnected = false;
    logError(error, { context: 'database_connection_error' });
    logSecurityEvent('database_connection_error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.info('Database disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.info('Database reconnected');
  });

  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('Database connection closed due to application termination');
      process.exit(0);
    } catch (error) {
      logError(error, { context: 'database_graceful_shutdown' });
      process.exit(1);
    }
  });
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('Database connection closed');
  } catch (error) {
    logError(error, { context: 'database_disconnect' });
    throw error;
  }
}

/**
 * Check database connection status
 */
export function isConnectedToDatabase() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get database connection info
 */
export function getDatabaseInfo() {
  if (!mongoose.connection) {
    return null;
  }

  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    collections: Object.keys(mongoose.connection.collections)
  };
}

export default mongoose;