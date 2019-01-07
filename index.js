/* Configure these parameters to crawl for your statements */
const userId = '<your-user-id>';
const password = '<your-password>';
const secret = '<your-secret>';
const dateStringUntil = '<date>';
const fileName = 'statements.csv';

const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true });
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const tdFields = ['date', 'description', 'type', 'in', 'out', 'balance'];

const records = createCsvWriter({
  path: fileName,
  header: [
    {id: 'date', title: 'DATE'},
    {id: 'description', title: 'DESCRIPTION'},
    {id: 'type', title: 'TYPE'},
    {id: 'in', title: 'IN'},
    {id: 'out', title: 'OUT'},
  ]
});

const startPage = 'https://internetbanking.tsb.co.uk/personal/logon/login/';

const userIdField = '[name="userId"]';
const passwordField = '[name="password"]';
const loginButton = '[type="submit"]';


// Memorable info
const confirmMemInfo = '[type="submit"]';

// Crawling statements
const previousLink = 'a[action="previous"]';
const firstDate = 'tbody tr:first-child > *:first-child';

const crawlPagesUntil = dateString =>
Promise.resolve()
.then(() => nightmare.wait('tbody tr'))
.then(() => nightmare.evaluate(() => {
  const tdFields = ['date', 'description', 'type', 'in', 'out', 'balance'];
  const rows = [];

  document.querySelectorAll('tbody tr').forEach(tr => {
    const row = {};
    Array.from(tr.children).map((td, index) => {
      row[tdFields[index]] = td.textContent;
    });
    rows.push(row);
  });

  return rows;
}))
.then((rows) => records.writeRecords(rows))
.then(() => nightmare.click(previousLink))
.then(() => new Promise(res => setTimeout(() => res(), 2000)))
.then(() => nightmare.evaluate(() => (
  document.querySelector('tbody tr:first-child > *:first-child').textContent
)))
.then(currentDate => {
  if (new Date(currentDate) > new Date(dateString)) {
    return crawlPagesUntil(dateString);
  }
})

nightmare.goto(startPage)
.wait(userIdField)
.type(userIdField, userId)
.type(passwordField, password)
.click(loginButton)
.wait('.memorable-information-select-size')
.evaluate(() => {
  const characterDropdowns = '.memorable-information-select-size select';
  const characterLabels = '.memorable-information-select-size span';
  const res = [];

  document.querySelectorAll(characterDropdowns).forEach(select => {
    res.push({
      select: 'select[id="' + select.id + '"]',
    });
  })

  document.querySelectorAll(characterLabels).forEach((node, index) => {
    res[index].number = Number(node.textContent[node.textContent.length - 2]) - 1
  });

  console.log('res', res)
  return res;
})
.then(res => res.reduce((accum, val) => accum.then(() => nightmare.select(val.select, `${secret[val.number].toLowerCase()}`)), Promise.resolve()))
.then(() => nightmare.click(confirmMemInfo).wait('.accounts-std a'))
.then(() => nightmare.click(`.accounts-std a`))
.then(() => crawlPagesUntil(dateStringUntil))
.then(() => console.log('done done done'))
.then(() => nightmare.end())
