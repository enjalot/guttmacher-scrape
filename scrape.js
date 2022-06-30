// scrape two tables from
// https://www.guttmacher.org/print/state-policy/explore/overview-abortion-laws
// scrape one table from 
// https://www.guttmacher.org/print/state-policy/explore/abortion-policy-absence-roe

import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs';


function scrapeTable(url) {
  return new Promise(function(resolve, reject) {
      fetch(url)
      .then(function(res) {
          return res.text();
      })
      .then(function(html) {
          let $ = cheerio.load(html);
          let table = $('table');
          let tableData = [];
          table.find('tr').each(function(i, elem) {
              let row = [];
              $(this).find('td').each(function(i, elem) {
                  row.push($(this).text().trim().replace(/[\u200B-\u200D\uFEFF]/g, ''));
              });
              tableData.push(row);
          });
          resolve({ html, tableData });
      })
      .catch(function(err) {
          reject(err);
      });
  });
}

export { scrapeTable };