Emitter = require './emitter'
Resource = require './resource'

module.exports = class Type extends Emitter
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

  create: (data = {}, headers = {}) ->
    resource = @_cache[data.id]
    if resource?
      resource._headers = headers
    else
      resource = new Resource this, headers
    resource.update data
    resource

  get: ->
    if typeof arguments[0] is 'string'
      @_getByID arguments...
    else if Array.isArray arguments[0]
      @_getByIDs arguments...
    else
      @_getByQuery arguments...

  _getByID: (id, otherArgs...) ->
    @_getByIDs([id], otherArgs...).then ([resource]) ->
      resource

  _getByIDs: (ids, otherArgs...) ->
    url = @_getURL ids.join ','
    @_client.get url, otherArgs...

  _getByQuery: (query, otherArgs...) ->
    @_client.get @_getURL(), query, otherArgs...

  _getURL: ->
    ['', @_name, arguments...].join '/'

  createResource: ->
    console.warn 'Use Type::create, not ::createResource', arguments...
    @create arguments...
