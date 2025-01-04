class HealthController {
  check = async (req, res) => {
    try {
      // Check database connection
      await mongoose.connection.db.admin().ping();
      
      const healthInfo = {
        status: 'healthy',
        service: 'SmartSelect API',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
          status: 'connected',
          name: mongoose.connection.name
        }
      };

      res.status(200).json(healthInfo);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'SmartSelect API',
        timestamp: new Date(),
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
}

module.exports = new HealthController(); 