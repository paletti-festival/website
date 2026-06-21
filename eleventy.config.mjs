import { EleventyI18nPlugin, RenderPlugin }from "@11ty/eleventy";
import pluginWebc from "@11ty/eleventy-plugin-webc";

import svgContents from "eleventy-plugin-svg-contents";
import { bundle, transform, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import htmlmin from "html-minifier";
import path from "node:path";
import nodeHtmlToImage from 'node-html-to-image';
import i18n from "eleventy-plugin-i18n";
import translations from "./_data/i18n/index.mjs";

import { build } from 'esbuild'
import browserslistToEsbuild from 'browserslist-to-esbuild'

export default function (eleventyConfig) {
  let js_map = {};
  /*
   * Plugins
   */

  // Language plugin that handles i18n links
  eleventyConfig.addPlugin(EleventyI18nPlugin, {
    defaultLanguage: "de",
  });

  eleventyConfig.addPlugin(pluginWebc, {
    bundlePluginOptions: {
      transforms: [
        // TODO transforms
      ]
    }
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

  eleventyConfig.addPlugin(RenderPlugin);

  /*
   * Custom filters
   */

  // Filter to minify CSS
  eleventyConfig.addFilter("cssmin", function(inputPath) {
    let targets = browserslistToTargets(browserslist("defaults"));

    return bundle({
      filename: inputPath,
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
    let next = null
    let nextdate = null

    for (let event of events) {
      const eventdate = event.data.end ? event.data.end : event.data.start
      if (now < eventdate && event.data.status === "CONFIRMED") {
        if (next == null || nextdate > eventdate) {
          next = event
          nextdate = eventdate
        }
      }
    }


    return next;
  });

  // Filter to get last event
  eleventyConfig.addAsyncFilter("lastDate", async function(events) {
    const now = new Date();
    let last = null;

    for (let event of events) {
      const eventEnd = new Date(event.data.end);
      const eventEndPlusTwoMonth = new Date(eventEnd.setMonth(eventEnd.getMonth() + 2))

      if (now > event.data.end && eventEndPlusTwoMonth > now && event.data.status === "CONFIRMED") {
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
      const eventdate = event.data.end ? event.data.end : event.data.start
      if (eventdate.getFullYear() == now.getFullYear()) {
        thisYear.push(event)
      }
    }

    return thisYear;
  });

  eleventyConfig.addAsyncFilter("hashed", async function(filename) {

    if (filename && filename.endsWith(".js")) {
      return js_map[filename];
    }

    return filename;
  });

  eleventyConfig.addFilter("notOver", function(date) {
    return date > Date.now()
  })

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

  eleventyConfig.addWatchTarget("assets/scripts/*.js");
  eleventyConfig.on(
		"eleventy.before",
		async () => {
			let result = await build({
        entryPoints: ["assets/scripts/*.js"],
        entryNames: '[dir]/[name]-[hash]',
        minify: true,
        bundle: true,
        format: "esm",
        target: browserslistToEsbuild(),
        metafile: true,
        outdir: '_site/scripts',
      })

      js_map = {};
      for (const [filename, outdata] of Object.entries(result.metafile.outputs)) {
        js_map[outdata.entryPoint.replace("assets/scripts/", "")] = filename.replace("_site", "");
      }
		}
	);

  // Transform to create image previews
  // eleventyConfig.addTransform("imagepreview", function(content) {
  //   if( this.page.outputPath && this.page.outputPath.endsWith(".png") ) {
  //     nodeHtmlToImage({
  //       output: this.page.outputPath,
  //       html: content
  //     })
  //     .then(() => console.log('The image was created successfully!'))
  //   }

  //   return content;
  // });

  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy(".htaccess");
  eleventyConfig.addPassthroughCopy({"assets/fonts": "fonts"});
  eleventyConfig.addPassthroughCopy({"assets/favicons": "."});
};