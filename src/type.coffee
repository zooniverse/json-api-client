Emitter = require './emitter'
Resource = require './resource'

module.exports = class Type extends Emitter
  Resource: Resource

  _name: ''
  _client: null

  _links: null # Resource link definitions
  _cache: null

  constructor: (@_name, @_client) ->
    super
    @_links = {}
    @_cache = {}
    unless @_name and @_client?
      throw new Error 'Don\'t call the Type constructor directly, use `client.type("things");`'

  create: (data = {}, headers = {}, meta = {}) ->
    if data.type and data.type isnt @_name
      # The `type` specified by the resource trumps whatever you tried to create it as.
      @_client.type(data.type).create arguments...
    else
      resource = @_cache[data.id] ? new @Resource this
      resource._headers = headers
      resource._meta = meta
      resource.update data
      if resource is @_cache[data.id]
        resource._changedKeys.splice 0
      resource

  get: ->
    new Resource.Promise if typeof arguments[0] is 'string'
      @_getByID arguments...
    else if Array.isArray arguments[0]
      @_getByIDs arguments...
    else
      @_getByQuery arguments...

  _getByID: (id, otherArgs...) ->
    @_getByIDs([id], otherArgs...).then ([resource]) ->
      resource

  _getByIDs: (ids, otherArgs...) ->
    inCache = (id for id in ids when id of @_cache and otherArgs.length is 0)
    toFetch = (id for id in ids when id not in inCache)
    fetch = if toFetch.length is 0
      Promise.resolve []
    else
      url = @_getURL toFetch.join ','
      @_client.get url, otherArgs...
    fetch.then (fetched) =>
      fetchedByID = {}
      for resource in fetched
        fetchedByID[resource.id] = resource
      (fetchedByID[id] ? @_cache[id] for id in ids)

  _getByQuery: (query, otherArgs...) ->
    @_client.get @_getURL(), query, otherArgs...

  _getURL: ->
    ['', @_name, arguments...].join '/'

  createResource: ->
    console.warn 'Use Type::create, not ::createResource', arguments...
    @create arguments...
