print = require './print'
makeHTTPRequest = require './make-http-request'
mergeInto = require './merge-into'
Type = require './type'

DEFAULT_TYPE_AND_ACCEPT =
  'Content-Type': 'application/vnd.api+json'
  'Accept': "application/vnd.api+json"

module.exports = class JSONAPIClient
  root: ''
  headers: null

  types: null

  constructor: (@root, @headers) ->
    @types = {}
    print.info 'Created a new JSON-API client at', @root

  request: (method, url, data, additionalHeaders) ->
    print.info 'Making a', method, 'request to', url
    headers = mergeInto {}, DEFAULT_TYPE_AND_ACCEPT, @headers, additionalHeaders
    makeHTTPRequest(method, @root + url, data, headers).then @processResponseTo.bind this

  for method in ['get', 'post', 'put', 'delete'] then do (method) =>
    @::[method] = ->
      @request method.toUpperCase(), arguments...

  processResponseTo: (request) ->
    response = JSON.parse request.responseText
    print.log 'Processing response', response

    if 'meta' of response
      'TODO: No idea yet!'

    if 'links' of response
      for typeAndAttribute, link of response.links
        [type, attribute] = typeAndAttribute.split '.'
        if typeof link is 'string'
          href = link
        else
          {href, type: attributeType} = link

        @handleLink type, attribute, href, attributeType

    if 'linked' of response
      for type, resources of response.linked
        print.log 'Got', resources ? 1, 'linked', type, 'resources.'
        @createType type unless @types[type]?
        for resource in [].concat resources
          @types[type].createResource resource

    if 'data' of response
      print.log 'Got a top-level "data" collection of', response.data.length ? 1
      primaryResults = for resource in [].concat response.data
        @createType response.type unless @types[resource.type]?
        @types[type].createResource resource
    else
      primaryResults = []
      for type, resources of response when type not in ['links', 'linked', 'meta', 'data']
        print.log 'Got a top-level', type, 'collection of', resources.length ? 1
        @createType type unless @types[type]?
        for resource in [].concat resources
          primaryResults.push @types[type].createResource resource, type

    print.info 'Primary resources:', primaryResults
    primaryResults

  handleLink: (typeName, attributeName, hrefTemplate, attributeTypeName) ->
    unless @types[typeName]?
      @createType typeName

    @types[typeName].links[attributeTypeName] ?= {}
    if hrefTemplate?
      @types[typeName].links[attributeTypeName].href = hrefTemplate
    if attributeTypeName?
      @types[typeName].links[attributeTypeName].type = attributeName

  createType: (name) ->
    new Type name: name, apiClient: this

module.exports.util = {makeHTTPRequest}
