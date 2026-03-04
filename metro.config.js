const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure 'web' is included in platforms for .web.tsx resolution
if (!config.resolver.platforms.includes('web')) {
  config.resolver.platforms.push('web');
}

// Block lottie-react-native on web — it uses import.meta which Metro can't handle
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'lottie-react-native') {
    return {
      type: 'empty',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
