module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta.env.MODE → process.env.NODE_ENV (fixes zustand on Metro web)
      function transformImportMeta() {
        return {
          visitor: {
            MetaProperty(path) {
              // import.meta.env.MODE → process.env.NODE_ENV
              // import.meta.env → process.env
              // import.meta → { env: process.env }
              const { parent } = path;
              if (
                parent.type === 'MemberExpression' &&
                parent.property.name === 'env'
              ) {
                path.replaceWithSourceString('process');
              } else {
                path.replaceWithSourceString('({ env: process.env })');
              }
            },
          },
        };
      },
    ],
  };
};
