[![snyk](https://snyk.io/test/github/teunmooij/payload-tools/badge.svg)](https://snyk.io/test/github/teunmooij/payload-tools)

# payload tools and plugins

This repository will contain multiple tools and plugins for [payload cms](https://payloadcms.com):

## [payload-openapi](./packages/openapi/README.md)

[![npm version](https://badge.fury.io/js/payload-openapi.svg)](https://www.npmjs.com/package/payload-openapi)

Openapi tool for payload cms:

- generate openAPI 3 documentation from your Payload config

## [payload-swagger](./packages/swagger/README.md)

[![npm version](https://badge.fury.io/js/payload-swagger.svg)](https://www.npmjs.com/package/payload-swagger)

Swagger plugin for payload cms:

- exposes openapi document generated with `payload-openapi`
- includes a swagger ui
- easy setup as payload plugin

### Specs filter - operations

=> **operations**: Refers to a combination of a OpenAPI method & path from the [Path Object](https://spec.openapis.org/oas/v3.0.3.html#paths-object)
& [Path item](https://spec.openapis.org/oas/v3.0.3.html#path-item-object)

This will remove specific path items that match the operation definition `PUT::/pets`. In the example below, this would
mean that the item with the path '/pets' and method 'PUT' would be removed from the OpenAPI document.

For example:

```yaml
openapi: 3.0.0
info:
    title: API
    version: 1.0.0
paths:
    /pets:
        get:
            summary: Finds Pets by status
        put:
            summary: Update an existing pet
```

An `operationId` is an optional property. To offer support for OpenAPI documents that don't have operationIds, we have
added the `operation` definition which is the unique combination of the OpenAPI method & path, with a `::` separator
symbol.

This will allow filtering for very specific OpenAPI items, without the need of adding operationIds to the OpenAPI
document.

To facilitate managing the filtering, we have included wildcard options for the `operations` option, supporting the
methods & path definitions.

REMARK: Be sure to put quotes around the target definition.

Strict matching example: `"GET::/pets"`
This will target only the "GET" method and the specific path "/pets"

Method wildcard matching example: `"*::/pets"`
This will target all methods ('get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace') and the specific
path "/pets"

Path wildcard matching example: `"GET::/pets/*"`
This will target only the "GET" method and any path matching any folder behind the "/pets", like "/pets/123" and
"/pets/123/buy".

Method & Path wildcard matching example: `"*::/pets/*"`
A combination of wildcards for the method and path parts is even possible.

Example of usage:
```
http://payload-test/api/specs?filterOperations[]=*::/pets/*&filterOperations[]=GET::/ants
```

use comma separated the values
```
http://payload-test/api/specs?filterOperations=*::/pets/*,GET::/ants
```


## [create-payload-api-docs](./packages/create-api-docs/README.md)

[![npm version](https://badge.fury.io/js/create-payload-api-docs.svg)](https://www.npmjs.com/package/create-payload-api-docs)

CLI for generating openAPI 3 documentation for your Payload cms

## [payload-rbac](./packages/rbac/README.md)

[![npm version](https://badge.fury.io/js/payload-rbac.svg)](https://www.npmjs.com/package/payload-rbac)

Easy to use Role based access control for your Payload cms:

- plugin to extend your auth collection(s) with a `roles` property
- lots of predefined access control functions
- tools to combine access control functions to support more complex situations
- fully compatible with any custom access control functions you might already have

## [payload-query](./packages/query/README.md)

[![npm version](https://badge.fury.io/js/payload-query.svg)](https://www.npmjs.com/package/payload-query)

Query utility for your [Payload cms](https://payloadcms.com):

- create type safe queries
- predefine queries to be constructed with data passed in later (e.g. request data)
- select output fields on REST and Internal API.
