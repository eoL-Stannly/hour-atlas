export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addFilter("sortByRating", (list) =>
    [...list].sort((a, b) => b.rating - a.rating || a.price - b.price)
  );

  // "1 country" rather than "1 countries".
  eleventyConfig.addFilter("pl", (n, one, many) =>
    `${n} ${Number(n) === 1 ? one : many || one + "s"}`
  );

  eleventyConfig.addFilter("limit", (list, n) => list.slice(0, n));

  // Keeps the hero photo from repeating a second time in the gallery grid.
  eleventyConfig.addFilter("rejectByKey", (list, key) =>
    (list || []).filter((item) => item.key !== key)
  );

  eleventyConfig.addFilter("findBySlug", (list, slug) =>
    list.find((x) => x.slug === slug)
  );

  eleventyConfig.addFilter("attr", (obj, key) => (obj ? obj[key] : null));

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
