makeHTTPRequest = require './make-http-request'
mergeInto = require './merge-into'
Emitter = require './emitter'
Type = require './type'
Model = require './model'
Resource = require './resource'

DEFAULT_TYPE_AND_ACCEPT =
  'Content-Type': 'application/vnd.api+json'
  'Accept': 'application/vnd.api+json'

RESERVED_TOP_LEVEL_KEYS = ['meta', 'links', 'linked', 'data']

module.exports = class JSONAPIClient
  root: '/'
  headers: null

  _typesCache: null # Types that have been defined

  constructor: (@root, @headers = {}) ->
    @_typesCache = {}

  request: (method, url, payload, headers) ->
    fullURL = @root + url
    allHeaders = mergeInto {}, DEFAULT_TYPE_AND_ACCEPT, @headers, headers
    makeHTTPRequest method, fullURL, payload, allHeaders
      .then @processResponse.bind this
      .catch @handleError.bind this

  for method in ['get', 'post', 'put', 'delete'] then do (method) =>
    @::[method] = ->
      @request method, arguments...

  processResponse: (request) ->
    response = try JSON.parse request.responseText catch then {}
    headers = @_getHeadersFor request

    if 'links' of response
      @_handleLinks response.links

    if 'linked' of response
      for typeName, linkedResources of response.linked
        for resourceData in [].concat linkedResources
          @type(typeName).create resourceData, headers, response.meta

    results = []
    if 'data' of response
      for resourceData in [].concat response.data
        results.push @type(resourceData.type).create resourceData, headers, response.meta
    else
      for typeName, resources of response when typeName not in RESERVED_TOP_LEVEL_KEYS
        for resourceData in [].concat resources
          results.push @type(typeName).create resourceData, headers, response.meta
    results

  _getHeadersFor: (request) ->
    headers = {}
    for pair in request.getAllResponseHeaders().split '\n' when pair isnt ''
      [key, value...] = pair.split ':'
      headers[key.trim()] = value.join(':').trim()
    headers

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

  handleError: ->
    # Override this as necessary.
    Promise.reject arguments...

  type: (name) ->
    @_typesCache[name] ?= new Type name, this
    @_typesCache[name]

  createType: ->
    console?.warn 'Use JSONAPIClient::type, not ::createType', arguments...
    @type arguments...

module.exports.makeHTTPRequest = makeHTTPRequest
module.exports.Emitter = Emitter
module.exports.Type = Type
module.exports.Model = Model
module.exports.Resource = Resource

Object.defineProperty module.exports, 'util', get: ->
  console?.warn 'makeHTTPRequest is available directly from the JSONAPIClient object, no need for `util`'
  {makeHTTPRequest}
