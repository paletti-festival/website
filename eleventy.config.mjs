import { EleventyI18nPlugin }from "@11ty/eleventy";

import svgContents from "eleventy-plugin-svg-contents";
import { bundle, transform, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import htmlmin from "html-minifier";
import path from "node:path";
import uglify from "uglify-js";
import nodeHtmlToImage from 'node-html-to-image';
import i18n from "eleventy-plugin-i18n";
import translations from "./_data/i18n/index.mjs";

export default function (eleventyConfig) {
  /*
   * Plugins
   */

  // Language plugin that handles i18n links
  eleventyConfig.addPlugin(EleventyI18nPlugin, {
    defaultLanguage: "de",
  });

  // i18n plugin that handles translations
  eleventyConfig.addPlugin(i18n, {
    translations,
    fallbackLocales: {
      "en": "de",
    },
  });

  // Plugin that allows to include SVG files
  eleventyConfig.addPlugin(svgContents);

  /*
   * Cutsom filters
   */

  // Filter to minify CSS
  eleventyConfig.addFilter("cssmin", function(code) {
    let targets = browserslistToTargets(browserslist("defaults"));

    return transform({
      code: Buffer.from(code),
      minify: true,
      sourceMap: true,
      targets
    }).code;
  });

  // Filter to format dates depending on the language
  eleventyConfig.addFilter("formatDate", function(date) {
    if (this.ctx?.lang == "en") {
      return date.toLocaleDateString('en-EN', {day: "2-digit", month: "short", year: "numeric"});
    }

    return date.toLocaleDateString('de-DE', {day: "2-digit", month: "short", year: "numeric"});
  });

  // Filter to format times depending on the language
  eleventyConfig.addFilter("formatTime", function(date) {
    if (this.ctx?.lang == "en") {
      return date.toLocaleTimeString('en-EN', {hour: "2-digit"});
    }

    return date.toLocaleTimeString('de-DE', {hour: "2-digit", minute: "2-digit"});
  });

  // Filter to get next event
  eleventyConfig.addAsyncFilter("nextDate", async function(events) {
    const now = new Date();

    for (let event of events) {
      if (now < event.data.until && event.data.status === "CONFIRMED") {
        return event;
      }
    }

    return null;
  });

  // Filter to get last event
  eleventyConfig.addAsyncFilter("lastDate", async function(events) {
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

  // Filter to get all events of this year
  eleventyConfig.addFilter("thisYear", function(events) {
    const now = new Date();
    let thisYear = [];

    for (let event of events) {
      if (event.data.until.getFullYear() == now.getFullYear()) {
        thisYear.push(event)
      }
    }

    return thisYear;
  });

  /*
   * Transforms
   */

  // Transform to minify HTML
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


  // Transform to minify JS
  eleventyConfig.addTransform("jsmin", function(content) {
    if( this.page.outputPath && this.page.outputPath.endsWith(".js") ) {
      let minified = uglify.minify(content, {
        module: true
      });
      return minified.code;
    }

    return content;
  });

  // Transform to minify CSS
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

  // Transform to create image previews
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

  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({"assets/fonts": "fonts"});
  eleventyConfig.addPassthroughCopy({"assets/scripts": "scripts"});
  eleventyConfig.addPassthroughCopy({"assets/favicons": "."});
};