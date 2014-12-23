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
      @_handleLinks response.links

    if 'linked' of response
      for type, linked of response.linked
        linked = [].concat linked
        print.log 'Got', linked.length, 'linked', type, 'resource(s)'
        for resource in linked
          @type(type).addExistingResource resource

    if 'data' of response
      data = [].concat response.data
      print.log 'Got a top-level "data" collection of', data.length, 'resource(s)'
      primaryResults = for resource in data
        @type(resource.type).addExistingResource resource
    else
      primaryResults = []
      for typeName, resources of response when typeName not in ['meta', 'links', 'linked', 'data']
        type = @type typeName
        resources = [].concat resources
        print.log 'Got a top-level', type, 'collection of', resources.length, 'resource(s)'
        for resource in resources
          primaryResults.push type.addExistingResource resource

    print.info 'Primary resources:', primaryResults
    callback? request, response
    Promise.all primaryResults

  _handleLinks: (links) ->
    for typeAndAttribute, link of links
      [typeName, attributeName] = typeAndAttribute.split '.'
      if typeof link is 'string'
        href = link
      else
        {href, type} = link
      @_handleLink typeName, attributeName, href, type

  _handleLink: (typeName, attributeName, hrefTemplate, attributeTypeName) ->
    type = @type typeName

    type._links[attributeName] ?= {}
    if hrefTemplate?
      type._links[attributeName].href = hrefTemplate
    if attributeTypeName?
      type._links[attributeName].type = attributeTypeName

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
