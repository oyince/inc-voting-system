module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((oneOfRule) => {
            if (
              oneOfRule.loader &&
              oneOfRule.loader.includes("source-map-loader")
            ) {
              oneOfRule.exclude = [
                ...(oneOfRule.exclude || []),
                /html5-qrcode/,
              ];
            }
          });
        }
      });

      return webpackConfig;
    },
  },
};
