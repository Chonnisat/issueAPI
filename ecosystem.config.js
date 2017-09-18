module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'api.issueApi.com',
      script    : './build/server.js',
      instances : 0,
      exec_mode : "cluster",
      env: {
        COMMON_VARIABLE: 'true',
        PORT: 3000
      },
      env_production : {
        NODE_ENV: 'production',
        PORT: 9292
      }
    }
  ],
};
