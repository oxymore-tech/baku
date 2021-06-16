module.exports = {
  lintOnSave: false,

  pwa: {
    name: 'Baku',
    themeColor: '#FFFFFF',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',

    // configure the workbox plugin
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swSrc: 'pwa/sw.js',
      // ...other Workbox options...
    }
  }
};
