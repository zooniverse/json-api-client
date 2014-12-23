print = require './print'
makeHTTPRequest = require './make-http-request'
mergeInto = require './merge-into'
Type = require './type'
Resource = require './resource'

DEFAULT_TYPE_AND_ACCEPT =
  'Content-Type': 'application/vnd.api+json'
  'Accept': "application/vnd.api+json"

module.exports = class JSONAPIClient
  root: '/'
  headers: null

  _types: null # Types that have been defined

  constructor: (@root, @headers = {}) ->
    @_types = {}
    print.info 'Created a new JSON-API client at', @root

  request: (method, url, data, additionalHeaders, callback) ->
    headers = mergeInto {}, DEFAULT_TYPE_AND_ACCEPT, @headers, additionalHeaders
    makeHTTPRequest method, @root + url, data, headers
      .then (request) =>
        @processResponseTo request, callback
      .catch (request) =>
        @processErrorResponseTo request

  for method in ['get', 'post', 'put', 'delete'] then do (method) =>
    @::[method] = ->
      @request method, arguments...

  processResponseTo: (request, callback) ->
    response = try JSON.parse request.responseText
    response ?= {}
    print.log 'Processing response', response

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
        for resource in [].concat resources
          @type(type).addExistingResource resource

    if 'data' of response
      print.log 'Got a top-level "data" collection of', response.data.length ? 1
      primaryResults = for resource in [].concat response.data
        @type(response.type).addExistingResource resource
    else
      primaryResults = []
      for type, resources of response when type not in ['links', 'linked', 'meta', 'data']
        print.log 'Got a top-level', type, 'collection of', resources.length ? 1
        for resource in [].concat resources
          primaryResults.push @type(type).addExistingResource resource

    print.info 'Primary resources:', primaryResults
    callback? request, response
    Promise.all primaryResults

  handleLink: (typeName, attributeName, hrefTemplate, attributeTypeName) ->
    type = @type typeName

    type.links[attributeName] ?= {}
    if hrefTemplate?
      type.links[attributeName].href = hrefTemplate
    if attributeTypeName?
      type.links[attributeName].type = attributeTypeName

  type: (name) ->
    @_types[name] ?= new Type name, this
    @_types[name]

  createType: ->
    console.warn 'Use JSONAPIClient::type, not ::createType', arguments...
    @type arguments...

  processErrorResponseTo: (request) ->
    Promise.reject try
      JSON.parse request.responseText
    catch
      new Error request.responseText || request.status

module.exports.util = {makeHTTPRequest}
module.exports.Type = Type
module.exports.Resource = Resource
