'use strict';

var host = require('../config').host;

module.exports = `<urlset>
  <url>
      <loc>${host}/</loc>
      <lastmod>Wed Aug 23 2017</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.00</priority>
  </url>
  <url>
      <loc>${host}/landing-page</loc>
      <lastmod>Wed Aug 23 2017</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.90</priority>
  </url>
  <url>
      <loc>${host}/contact-us</loc>
      <lastmod>Wed Aug 23 2017</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.90</priority>
  </url>
  <url>
      <loc>${host}/terms</loc>
      <lastmod>Wed Aug 23 2017</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.20</priority>
  </url>
  <url>
      <loc>${host}/thanks</loc>
      <lastmod>Wed Aug 23 2017</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.40</priority>
  </url>
</urlset>`;