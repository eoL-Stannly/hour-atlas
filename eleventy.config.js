export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  eleventyConfig.addFilter("money", (n) =>
    "£" + Number(n).toLocaleString("en-GB")
  );

  // The lightbox only needs the metadata, not the blur-up thumbnails.
  eleventyConfig.addFilter("lightboxData", (frames) =>
    Object.fromEntries(
      Object.entries(frames).map(([ref, f]) => [
        ref,
        { ref: f.ref, fallback: f.fallback, alt: f.alt, caption: f.caption, exif: f.exif },
      ])
    )
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
