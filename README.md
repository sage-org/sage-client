# sage-client
[![npm version](https://badge.fury.io/js/sage-client.svg)](https://badge.fury.io/js/sage-client) [![Build Status](https://travis-ci.org/sage-org/sage-client.svg?branch=master)](https://travis-ci.org/sage-org/sage-client)

Javascript client for the SaGe query engine, built on top of the [`sparql-engine` framework](https://github.com/Callidon/sparql-engine).

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
Usage: sage-client <server> [options]

  Execute a SPARQL query using a SaGe interface

  Options:

    -q, --query <query>     evaluates the given SPARQL query
    -f, --file <file>       evaluates the SPARQL query in the given file
    -t, --type <mime-type>  determines the MIME type of the output (e.g., application/json) (default: application/json)
    -h, --help              output usage information
```
