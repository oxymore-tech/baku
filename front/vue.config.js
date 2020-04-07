const WorkerPlugin = require('worker-plugin');

module.exports = {
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      new WorkerPlugin({
        globalObject: 'self',
      }),
    ],
  },
};
