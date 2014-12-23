print = require './print'
Emitter = require './emitter'
mergeInto = require './merge-into'
Resource = require './resource'

defer = ->
  deferral = {}
  deferral.promise = new Promise (resolve, reject) ->
    deferral.resolve = resolve
    deferral.reject = reject
  deferral

module.exports = class Type extends Emitter
  _name: ''
  _apiClient: null

  _links: null # Resource link definitions

  _deferrals: null # Keys are IDs of specifically requested resources.
  _resourcePromises: null # Keys are IDs, values are promises resolving to resources.

  constructor: (@_name, @_apiClient) ->
    super
    @_links = {}
    @_deferrals = {}
    @_resourcePromises = {}
    print.info 'Defined a new type:', @_name

  _getURL: ->
    [null, @_name, arguments...].join '/'

  queryLocal: (query) ->
    existLocally = (promise for id, promise of @_resourcePromises when not @waitingFor id)
    Promise.all(existLocally).then (resources) ->
      resource for resource in resources when resource.matchesQuery query

  waitingFor: (id) ->
    @_deferrals[id]?

  has: (id) ->
    @_resourcePromises[id]? and not @_deferrals[id]?

  get: ->
    if typeof arguments[0] is 'string'
      @getByID arguments...
    else if Array.isArray arguments[0]
      @getByIDs arguments...
    else
      @getByQuery arguments...

  getByID: (id, otherArgs...) ->
    @getByIDs([id], otherArgs...).then ([resource]) ->
      resource

  getByIDs: (ids, options, callback) ->
    print.info 'Getting', @_name, 'by ID(s)', ids
    for id in ids
      @_deferrals[id] = defer()
      @_resourcePromises[id] = @_deferrals[id].promise

    url = [@_getURL(), ids.join ','].join '/'
    print.log 'Request for', @_name, 'at', url
    @_apiClient.get url, options, null, callback

    Promise.all (@_resourcePromises[id] for id in ids)

  getByQuery: (query, limit = Infinity, callback) ->
    @queryLocal(query).then (existing) =>
      if existing.length >= limit
        existing
      else
        existingIDs = (id for {id} in existing)
        params = {}
        if isFinite limit
          params.limit = limit - existing.length
        mergeInto params, query

        @_apiClient.get(@_getURL(), params, null, callback).then (resources) ->
          fetched = (resource for resource in resources when resource.id not in existingIDs)
          Promise.all existing.concat fetched

  addExistingResource: (data) ->
    if @waitingFor data.id
      print.log 'Done waiting for', @_name, 'resource', data.id
      newResource = new Resource _type: this, data
      deferral = @_deferrals[data.id]
      @_deferrals[data.id] = null
      deferral.resolve newResource

    else if @has data.id
      print.log 'The', @_name, 'resource', data.id, 'already exists; will update'
      @get(data.id).then (resource) ->
        resource.update data

    else
      print.log 'Accepting', @_name, 'resource', data.id
      newResource = new Resource _type: this, data
      @_resourcePromises[data.id] = Promise.resolve newResource

    @_resourcePromises[data.id]

  create: (data) ->
    print.log 'Creating a new', @_name, 'resource'
    resource = new Resource _type: this
    resource.update data
    resource

  createResource: ->
    console.warn 'Use Type::create, not ::createResource', arguments...
    @create arguments...
