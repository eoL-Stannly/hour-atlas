export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addFilter("sortByRating", (list) =>
    [...list].sort((a, b) => b.rating - a.rating || a.price - b.price)
  );

  // "1 country" rather than "1 countries".
  eleventyConfig.addFilter("pl", (n, one, many) =>
    `${n} ${Number(n) === 1 ? one : many || one + "s"}`
  );

  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));

  // Collapse the whitespace Nunjucks leaves behind. Safe here because the
  // site has no pre or textarea elements.
  eleventyConfig.addTransform("tighten", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    return content
      .replace(/\n\s*\n+/g, "\n")
      .replace(/>\s+</g, "> <")
      .trim();
  });
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  eleventyConfig.addFilter("money", (n) =>
    "£" + Number(n).toLocaleString("en-GB")
  );

  eleventyConfig.addFilter("slug", (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
