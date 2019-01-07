const csv = require('csvtojson');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { format } = require('date-fns')

const records = createCsvWriter({
  path: 'freeagent-statements.csv',
  header: [
    {id: 'date', title: 'DATE'},
    {id: 'amount', title: 'AMOUNT'},
    {id: 'description', title: 'DESCRIPTION'},
  ]
});


csv()
  .fromFile('statements.csv')
  .then(statements => {
    const rows = []
    statements.forEach(_row => {
      const row = {}
      row.date = format(new Date(_row.DATE), 'DD/MM/YYYY')

      if (_row.IN) {
        row.amount = _row.IN.replace(',', '')
      } else if (_row.OUT) {
        row.amount = `-${_row.OUT.replace(',', '')}`
      }

      row.description = _row.DESCRIPTION
      rows.push(row)
    })
    return records.writeRecords(rows)
  })
  .then(() => console.log('done done done'))


