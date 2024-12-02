module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { browsers: "defaults" } }],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  plugins: ["@babel/plugin-transform-runtime"],
};
