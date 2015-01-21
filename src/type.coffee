Emitter = require './emitter'
Resource = require './resource'

module.exports = class Type extends Emitter
  _name: ''
  _client: null

  _links: null # Resource link definitions

  constructor: (@_name, @_client) ->
    super
    @_links = {}

  create: (data, headers = {}) ->
    newResource = new Resource data, _type: this, _headers: headers
    unless 'id' of data
      newResource.update data
    newResource

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
