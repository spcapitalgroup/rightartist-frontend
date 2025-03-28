const { override } = require("customize-cra");

module.exports = override(
  (config) => {
    const sourceMapLoader = config.module.rules.find((rule) =>
      rule.loader && rule.loader.includes("source-map-loader")
    );
    if (sourceMapLoader) {
      sourceMapLoader.exclude = [
        /node_modules\/react-datepicker/,
      ];
    }
    return config;
  }
);