const { EleventyI18nPlugin } = require("@11ty/eleventy");
const svgContents = require("eleventy-plugin-svg-contents");
const { bundle, transform, browserslistToTargets } = require("lightningcss");
const browserslist = require("browserslist");
const htmlmin = require("html-minifier");
const path = require("node:path");
const uglify = require("uglify-js");
const nodeHtmlToImage = require('node-html-to-image');

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyI18nPlugin, {
    defaultLanguage: "de",
  });

  eleventyConfig.addPlugin(svgContents);

  eleventyConfig.addFilter("cssmin", function(code) {
    let targets = browserslistToTargets(browserslist("defaults"));

    return transform({
      code: Buffer.from(code),
      minify: true,
      sourceMap: true,
      targets
    }).code;
  });

  eleventyConfig.addFilter("formatDate", function(date) {
    if (this.ctx?.lang == "en") {
      return date.toLocaleDateString('en-EN', {day: "2-digit", month: "short", year: "numeric"});
    }

    return date.toLocaleDateString('de-DE', {day: "2-digit", month: "short", year: "numeric"});
  });

  eleventyConfig.addFilter("formatTime", function(date) {
    if (this.ctx?.lang == "en") {
      return date.toLocaleTimeString('en-EN', {hour: "2-digit"});
    }

    return date.toLocaleTimeString('de-DE', {hour: "2-digit", minute: "2-digit"});
  });

  eleventyConfig.addFilter("nextDate", async function(events) {
    const now = new Date();

    for (let event of events) {
      if (now < event.data.until && event.data.status === "CONFIRMED") {
        return event;
      }
    }

    return null;
  });

  eleventyConfig.addFilter("lastDate", async function(events) {
    const now = new Date();
    let last = null;

    for (let event of events) {
      const evenEnd = new Date(event.data.until);
      const eventEndPlusTwoMonth = new Date(evenEnd.setMonth(evenEnd.getMonth() + 2))

      if (now > event.data.until && eventEndPlusTwoMonth > now && event.data.status === "CONFIRMED") {
        last = event;
      }
    }

    return last;
  });

  eleventyConfig.addFilter("thisYear", async function(events) {
    const now = new Date();
    let thisYear = [];

    for (let event of events) {
      if (event.data.until.getFullYear() == now.getFullYear()) {
        thisYear.push(event)
      }
    }

    return thisYear;
  });

  eleventyConfig.addTransform("htmlmin", function(content) {
    if( this.page.outputPath && this.page.outputPath.endsWith(".html") ) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        collapseBooleanAttributes: true,
        decodeEntities: true,
        minifyURLs: true,
        removeAttributeQuotes: false,
        removeComments: true,
        removeEmptyAttributes: true,
        sortAttributes: true,
        sortClassName: true
      });
      return minified;
    }

    return content;
  });


  eleventyConfig.addTransform("jsmin", function(content) {
    if( this.page.outputPath && this.page.outputPath.endsWith(".js") ) {
      let minified = uglify.minify(content, {
        module: true
      });
      return minified.code;
    }

    return content;
  });

  eleventyConfig.addTransform("imagepreview", function(content) {
    if( this.page.outputPath && this.page.outputPath.endsWith(".png") ) {
      nodeHtmlToImage({
        output: this.page.outputPath,
        html: content
      })
      .then(() => console.log('The image was created successfully!'))
    }

    return content;
  });

  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",

    compile: async function(inputContent, inputPath) {
      let parsed = path.parse(inputPath);
      if(parsed.name.startsWith("_")) {
        return;
      }

      let targets = browserslistToTargets(browserslist("defaults"));
      let result = bundle({
        filename: inputPath,
        minify: true,
        sourceMap: true,
        targets
      });

      return async (data) => {
        return result.code;
      };
    }
  });

  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy({"favicons": "."});
};