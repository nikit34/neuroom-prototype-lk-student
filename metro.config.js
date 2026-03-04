const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .glb to asset extensions so Metro bundles them as binary assets
config.resolver.assetExts.push('glb');

module.exports = config;
