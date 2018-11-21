#!/usr/bin/env node
/* file : sage-client.js
MIT License

Copyright (c) 2017 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

const fs = require('fs')
const program = require('commander')
const { SageClient, Spy } = require('../src/lib.js')
// TODO wait for the SPARQL formatters that will be available in sparql-engine
// const JSONFormatter = require('../src/formatters/json-formatter.js')
// const XMLFormatter = require('sparql-engine/src/formatters/xml-formatter.js')
//
// const mimetypes = {
//   'application/json': JSONFormatter,
//   'application/sparql-results+json': JSONFormatter,
//   'json': JSONFormatter,
//   'application/xml': XMLFormatter,
//   'application/sparql-results+xml': XMLFormatter,
//   'xml': XMLFormatter
// }

// Command line interface to execute queries
program
  .description('Execute a SPARQL query using a SaGe interface')
  .usage('<server> [options]')
  .option('-q, --query <query>', 'evaluates the given SPARQL query')
  .option('-f, --file <file>', 'evaluates the SPARQL query in the given file')
  // .option('-t, --timeout <timeout>', 'set SPARQL query timeout in milliseconds (default: 30mn)', 30 * 60 * 1000)
  .option('-t, --type <mime-type>', 'determines the MIME type of the output (e.g., application/json)', 'application/json')
  .parse(process.argv)

// get servers
if (program.args.length !== 1) {
  process.stderr.write('Error: you must specify exactly one server to use.\nSee ./bin/sage-client.js --help for more details.\n')
  process.exit(1)
}

const server = program.args[0]
const spy = new Spy()

// fetch SPARQL query to execute
let query = null
if (program.query) {
  query = program.query
} else if (program.file && fs.existsSync(program.file)) {
  query = fs.readFileSync(program.file, 'utf-8')
} else {
  process.stderr.write('Error: you must specify a SPARQL query to execute.\nSee ./bin/sage-client.js --help for more details.\n')
  process.exit(1)
}
const client = new SageClient(server, spy)
let iterator = client.execute(query)
// TODO change to: const iterator = client.execute(query, program.type)
/* if (program.type === 'xml') {
  iterator = new XMLFormatter(iterator)
}
*/

iterator.on('error', error => {
  console.error('ERROR: An error occurred during query execution.')
  console.error(error.stack)
})

iterator.on('end', () => {
  const endTime = Date.now()
  const time = endTime - startTime
  console.log(`SPARQL query evaluated in ${time / 1000}s with ${spy.nbHTTPCalls} HTTP request(s)`)
})
const startTime = Date.now()
iterator.on('data', data => {
  console.log(data)
})
