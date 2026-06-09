module.exports = {
  apps: [
    {
      name: 'guideroom-relay',
      script: '/data/projects/guideroom/server/dist/relay.js',
      env: {
        RELAY_HTTP_PORT: 3002,
        RELAY_WS_PORT: 3003,
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
