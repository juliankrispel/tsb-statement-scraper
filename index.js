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
    {id: 'balance', title: 'BALANCE'},
  ]
});

const startPage = 'https://online.tsb.co.uk/personal/logon/login.jsp';

const userIdField = '[id="frmLogin:strCustomerLogin_userID"]';
const passwordField = '[id="frmLogin:strCustomerLogin_pwd"]';
const loginButton = '[id="frmLogin:btnLogin1"]';


// Memorable info
const confirmMemInfo = '[id="frmentermemorableinformation1:btnContinue"]';

// Crawling statements
const previousLink = '.previous input';
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
.wait('#frmentermemorableinformation1')
.evaluate(() => {
  const characterDropdowns = '[id="frmentermemorableinformation1"] select';
  const characterLabels = '[id="frmentermemorableinformation1"] label';
  const res = [];

  document.querySelectorAll(characterDropdowns).forEach(select => {
    res.push({
      select: 'select[id="' + select.id + '"]',
    });
  })

  document.querySelectorAll(characterLabels).forEach((label, index) => {
    res[index].label = 'label[id="' + label.id + '"]';
    res[index].number = parseInt(label.textContent[10]) - 1;
  });

  return res;
})
.then(res => res.reduce((accum, val) => accum.then(() => nightmare.select(val.select, `&nbsp;${secret[val.number].toLowerCase()}`)), Promise.resolve()))
.then(() => nightmare.click(confirmMemInfo).wait('.accountDetails a').evaluate(() => document.querySelector('.accountDetails a').id))
.then(linkId => nightmare.click(`[id="${linkId}"]`))
.then(() => crawlPagesUntil(dateStringUntil))
.then(() => console.log('done done done'))
.then(() => nightmare.end())
