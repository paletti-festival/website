const { EleventyI18nPlugin } = require("@11ty/eleventy");
const svgContents = require("eleventy-plugin-svg-contents");
const { transform } = require("lightningcss");
const htmlmin = require("html-minifier");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyI18nPlugin, {
    defaultLanguage: "de",
  });

  eleventyConfig.addPlugin(svgContents);

  eleventyConfig.addFilter("cssmin", function(code) {
    return transform({
      code: Buffer.from(code),
      minify: true,
      sourceMap: true
    }).code;
  });

  eleventyConfig.addTransform("htmlmin", function(content) {
    if( this.page.outputPath && this.page.outputPath.endsWith(".html") ) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }

    return content;
  });

  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("styles/*.css");
  eleventyConfig.addPassthroughCopy({"favicons": "."});
};