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
  name: ''
  apiClient: null

  links: null # Resource link definitions

  deferrals: null # Keys are IDs of specifically requested resources.
  resourcePromises: null # Keys are IDs, values are promises resolving to resources.

  constructor: (@name, @apiClient) ->
    super
    @links = {}
    @deferrals = {}
    @resourcePromises = {}
    print.info 'Defined a new type:', @name

  getURL: ->
    '/' + @name

  queryLocal: (query) ->
    existLocally = (promise for id, promise of @resourcePromises when not @waitingFor id)
    Promise.all(existLocally).then (resources) ->
      resource for resource in resources when resource.matchesQuery query

  waitingFor: (id) ->
    @deferrals[id]?

  has: (id) ->
    @resourcePromises[id]? and not @deferrals[id]?

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
    print.info 'Getting', @name, 'by ID(s)', ids
    for id in ids
      @deferrals[id] = defer()
      @resourcePromises[id] = @deferrals[id].promise

    url = [@getURL(), ids.join ','].join '/'
    print.log 'Request for', @name, 'at', url
    @apiClient.get url, options, null, callback

    Promise.all (@resourcePromises[id] for id in ids)

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

        @apiClient.get(@getURL(), params, null, callback).then (resources) ->
          fetched = (resource for resource in resources when resource.id not in existingIDs)
          Promise.all existing.concat fetched

  addExistingResource: (data) ->
    if @waitingFor data.id
      print.log 'Done waiting for', @name, 'resource', data.id
      newResource = new Resource _type: this, data
      deferral = @deferrals[data.id]
      @deferrals[data.id] = null
      deferral.resolve newResource

    else if @has data.id
      print.log 'The', @name, 'resource', data.id, 'already exists; will update'
      @get(data.id).then (resource) ->
        resource.update data

    else
      print.log 'Accepting', @name, 'resource', data.id
      newResource = new Resource _type: this, data
      @resourcePromises[data.id] = Promise.resolve newResource

    @resourcePromises[data.id]

  createResource: (data) ->
    print.log 'Creating a new', @name, 'resource'
    resource = new Resource _type: this
    resource.update data
    resource
