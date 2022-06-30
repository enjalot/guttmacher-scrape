# guttmacher-scrape
Scraping tables from Guttmacher Institute's websites:
[Overview of Abortion Laws](https://www.guttmacher.org/print/state-policy/explore/overview-abortion-laws) and 
[Abortion Policy in Absence of Roe](https://www.guttmacher.org/print/state-policy/explore/abortion-policy-absence-roe)

## Daily updates
This repo has a [GitHub Action](https://github.com/enjalot/guttmacher-scrape/actions/workflows/scrape.yml) that will run the scraping script every day at 9am EST and commit any updates to the [data folder](https://github.com/enjalot/guttmacher-scrape/tree/main/data)

## Usage
```bash
npm install
node index.js
```
