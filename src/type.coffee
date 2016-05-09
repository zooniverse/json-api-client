Emitter = require './emitter'
Resource = require './resource'
mergeInto = require './merge-into'

module.exports = class Type extends Emitter
  Resource: Resource

  _name: ''
  _client: null

  _links: null # Resource link definitions
  _resourcesCache: null

  constructor: (@_name, @_client) ->
    super
    @_links = {}
    @_resourcesCache = {}
    unless @_name and @_client?
      throw new Error 'Don\'t call the Type constructor directly, use `client.type("things");`'

  create: (data = {}, headers = {}, meta = {}) ->
    if data.type and data.type isnt @_name
      # The `type` specified by the resource trumps whatever you tried to create it as.
      @_client.type(data.type).create arguments...
    else
      resource = @_resourcesCache[data.id] ? new @Resource this
      mergeInto resource._headers, headers
      mergeInto resource._meta, meta

      if data.id?
        for key, value of data when (key not in resource._changedKeys) and (key not of resource._savingKeys)
          resource[key] = value
        @_resourcesCache[resource.id] = resource
        resource.emit 'change'
      else
        resource.update data
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
    requests = for id in ids
      if id of @_resourcesCache and (otherArgs.length is 0 or not otherArgs[0]?)
        Promise.resolve @_resourcesCache[id]
      else
        @_client.get(@_getURL(id), otherArgs...).then ([resource]) ->
          resource
    Promise.all requests

  _getByQuery: (query, otherArgs...) ->
    @_client.get @_getURL(), query, otherArgs...

  _getURL: ->
    ['', @_name, arguments...].join '/'
