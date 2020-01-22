# sage-client
[![npm version](https://badge.fury.io/js/sage-client.svg)](https://badge.fury.io/js/sage-client) [![Build Status](https://travis-ci.org/sage-org/sage-client.svg?branch=master)](https://travis-ci.org/sage-org/sage-client)

Javascript/typescript client for querying a [SaGe server](http://sage.univ-nantes.fr), built on top of the [`sparql-engine` framework](https://github.com/Callidon/sparql-engine).

# Installation

Requirements:
* [Node.js](https://nodejs.org/en/) v8.11.2 or higher
* [npm](https://nodejs.org/en/) v5.6.0 or higher

## npm installation

```bash
npm install -g sage-client
```

## Manual installation

```bash
git clone https://github.com/Callidon/sage-client.git
cd sage-client
npm install --production
```

# CLI Usage

```
Usage: sage-client <server-url> <default-graph-iri> [options]

Execute a SPARQL query using a SaGe server and the IRI of the default RDF graph

Options:
  -q, --query <query>     evaluates the given SPARQL query
  -f, --file <file>       evaluates the SPARQL query stored in the given file
  -h, --help              output usage information
```

# Library usage

The SaGe client can also be used as a regular Javascript/Typescript library
```javascript
const { SageClient, Spy } = require('sage-client')

// Create a spy to collect stats during query execution
const spy = new Spy()

// The URL of the SaGe server
const serverURL = 'http://sage.univ-nantes.fr/sparql'
// The IRI of the default graph
const defaultGraph = 'http://sage.univ-nantes.fr/sparql/dbpedia-2016-04'
// The SPARQL query to execute
const query = `
prefix dbo: <http://dbpedia.org/ontology/>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?movie ?title ?name WHERE {
  ?movie dbo:starring [ rdfs:label 'Brad Pitt'@en ];
  rdfs:label ?title;
  dbo:director [ rdfs:label ?name ].
  FILTER LANGMATCHES(LANG(?title), 'EN')
  FILTER LANGMATCHES(LANG(?name),  'EN')
}`

// Create a new SaGe client
const client = new SageClient(serverURL, defaultGraph, spy)

// Execute the SPARQL query
client.execute(query).subscribe(b => {
  // Print solutions bindings (in simple JSON format)
  console.log(b.toObject())
}, (error) => {
  // Report errors
  console.error('ERROR: An error occurred during query execution.')
  console.error(error.stack)
}, () => {
  // Print some starts after the end of query execution
  console.log('Query execution completed!')
  console.log(`SPARQL query evaluated with ${spy.nbHTTPCalls} HTTP request(s)`)
})
```
