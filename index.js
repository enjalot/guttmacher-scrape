import { scrapeTable } from "./scrape.js";
import * as d3 from "d3";
import fs from "fs";

const page1Columns = ({
  state: "STATE",
  licensed: "MUST BE PERFORMED BY A LICENSED PHYSICIAN",
  hospital: "MUST BE PERFORMED IN A HOSPITAL IF AT:",
  second: "SECOND PHYSICIAN MUST PARTICIPATE IF AT:",
  endangerment: "PROHIBITED EXCEPT IN CASES OF LIFE OR HEALTH ENDANGERMENT IF AT:",
  partial: '"PARTIAL-BIRTH" ABORTION BANNED',
  publicAll: "PUBLIC FUNDING OF ABORTION: Funds All or Most Medically Necessary Abortions",
  publicLimited: "PUBLIC FUNDING OF ABORTION: Funds Limited to Life Endangerment, Rape and Incest",
  insurance: "PRIVATE INSURANCE COVERAGE LIMITED"
})
const page2Columns = ({
  state: "STATE",
  refusalIndividual: "PROVIDERS MAY REFUSE TO PARTICIPATE: Individual",
  refusalInstitution: "PROVIDERS MAY REFUSE TO PARTICIPATE: Institution",
  counselingBreastCancer: "MANDATED COUNSELING INCLUDES INFORMATION ON: Breast Cancer Link",
  counselingFetalPain: "MANDATED COUNSELING INCLUDES INFORMATION ON: Fetal Pain",
  counselingMentalHealth: "MANDATED COUNSELING INCLUDES INFORMATION ON: Negative Psychological Effects",
  waitingPeriod: "WAITING PERIOD (in Hours) AFTER COUNSELING",
  parental: "PARENTAL INVOLVEMENT REQUIRED FOR MINORS",
})
const absenceColumns = ({
  state: "State",
  unenforced: "Restricting the right to abortion: Unenforced pre-Roe abortion ban",
  postroe: "Restricting the right to abortion: Post-Roe ban intended to take effect if Roe overturned",
  unconstitutional: "Restricting the right to abortion: Unconstitutional, post-Roe restrictions that could take effect if Roe overturned",
  intent: "Restricting the right to abortion: Expressed intent to limit abortion to maximum extent permitted",
  notsecured: "Restricting the right to abortion: Constitution explicitly does not secure right to abortion",
  protectedThroughout: "Protecting the right to abortion: Throughout pregnancy",
  protectedPrior: "Protecting the right to abortion: Prior to viability",
})


let now = new Date();
fs.writeFileSync(`data/last-run.txt`, now.toISOString())

// get the overview tables
scrapeTable("https://www.guttmacher.org/print/state-policy/explore/overview-abortion-laws")
  .then(function(response) {
    // this actually gets the tables and the keys
    // console.log("raw", data)
    // save the raw data to a file
    let data = response.tableData;
    fs.writeFileSync("data/abortion-overview-raw.html", JSON.stringify(response.html));
    console.log("wrote", "data/abortion-overview-raw.html")
    fs.writeFileSync("data/abortion-overview-raw.json", JSON.stringify(data));
    console.log("wrote", "data/abortion-verview-raw.json")
    let page1Header = 'Overview of State Abortion Law (page 1 of 2)'
    let page2Header = 'Overview of State Abortion Law (page 2 of 2)'
    let page2Index = data.findIndex(function(element) { return element[0] == page2Header });

    // skip the first 3 rows: the table name and the two header rows
    let page1 = data.filter(function(row,index) { return index < page2Index }).slice(3)
    let page1KeyRaw = page1[page1.length -1];
    let page1data = page1.slice(0, page1.length - 2);
    // console.log("page1data", page1data) 
    processPage("abortion-overview-page1", page1data, page1Columns, page1KeyRaw);

    let page2 = data.filter(function(row,index) { return index > page2Index }).slice(2)
    let page2KeyRaw = page2[page2.length -1];
    let page2data = page2.slice(0, page1.length - 2);
    processPage("abortion-overview-page2", page2data, page2Columns, page2KeyRaw);

  })

  
  scrapeTable("https://www.guttmacher.org/print/state-policy/explore/abortion-policy-absence-roe")
    .then(function(response) {
      // save the raw data to a file
      let data = response.tableData;
      fs.writeFileSync("data/abortion-policy-raw.html", JSON.stringify(response.html));
      console.log("wrote", "data/abortion-policy-raw.html")
      fs.writeFileSync("data/abortion-policy-raw.json", JSON.stringify(data));
      console.log("wrote", "data/abortion-policy-raw.json")
      // console.log("raw", data)

      // skip the first 3 rows: the table name and the two header rows
      let rows = data.slice(3, data.length - 1)
      // this isn't part of the table in this page so we can't parse it
      // without adding more scrape logic to scrape.js
      let keyRaw = [`q Permanently enjoined by court order; law not in effect.
        s Temporarily enjoined by court order; law not in effect.
        †   Law includes an exception to protect the life of the patient.
        ‡   Law includes an exception to protect the health of the patient.
        Ψ  Law includes an exception in cases of rape.`]
      processPage("abortion-policy", rows, absenceColumns, keyRaw);
    })

  function processPage(name, data, columns, rawKey) {
    let csv = d3.csvFormatRows([Object.keys(columns)].concat(data));

    // before writing page1csv to file, lets read it in and see if there are any differences
    try {
      let previous = d3.csvParseRows(fs.readFileSync(`data/${name}.csv`, "utf8"))
      // TODO: maybe a more robust difference checker here
      // this only seems to include the rows from the new file, would be nice to see rows from both
      let diff = d3.difference(data.map(d => d.join("")), previous.map(d => d.join("")));
      // console.log(diff, diff.size)
      if(diff.size) {
        // copy the old page1 csv file to page1.csv.previous
        fs.copyFileSync(`data/${name}.csv`, `data/${name}.csv.previous`);
        // write page1diff to a file
        fs.writeFileSync(`data/${name}.diff.json`, JSON.stringify([...diff.entries()]));
      } else {
        // delete the diff file if no difference
        try {
          fs.unlinkSync(`data/${name}.diff.json`);
          fs.unlinkSync(`data/${name}.csv.previous`);
        } catch (e) {}
      }
    } catch (e) {
      try {
        fs.unlinkSync(`data/${name}.csv.previous`);
      } catch (e) {}
    }
    fs.writeFileSync(`data/${name}.csv`, csv);
    console.log("wrote", `data/${name}.csv`)

    let key = {} 
    rawKey[0].split("\n").forEach(d => {
      let s = d.trim()
      key[s.slice(0,1)] = s.slice(1).trim()
    });
    fs.writeFileSync(`data/${name}-key.json`, JSON.stringify(key));
    console.log("wrote", `data/${name}-key.json`)

  }