# sage-client
JS client for the SaGe query engine

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

# Supported SPARQL language features

* SELECT, ASK, CONSTRUCT & DESCRIBE queries
* Basic Graph Patterns
* Optional
* SPARQL subqueries
* [SERVICE queries](https://www.w3.org/TR/2013/REC-sparql11-federated-query-20130321/)
* Union
* Limit / Offset
* Group By
* Order By
* Aggregates queries (Min, Max, Avg, Count, Sum, Sample, Group_Concat)
* SPARQL Filters:
  * '+', '-', '\*', '/', '=', '!=', '<', '<=', '>', '>=', '!', '&&', '||'
  * lang, langmatches
  * contains
  * regex
  * str
  * http://www.w3.org/2001/XMLSchema#integer
  * http://www.w3.org/2001/XMLSchema#double
  * bound
  * isIRI, isBlank, isLiteral
  * sameterm
* SPARQL 1.1 VALUES
* SPARQL 1.1 Property Paths:
  * Sequence '/'
  * Reverse '^'
  * Alterative '|'
  * Negated '!'
