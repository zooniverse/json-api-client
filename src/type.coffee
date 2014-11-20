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
    Promise.all(resourcePromise for id, resourcePromise of @resourcePromises).then (resources) ->
      resource for resource in resources when resource?.matchesQuery query

  waitingFor: (id) ->
    @deferrals[id]?

  has: (id) ->
    @resourcePromises[id]? and not @deferrals[id]?

  get: ->
    if typeof arguments[0] is 'string' or Array.isArray arguments[0]
      @getByIDs arguments...
    else
      @getByQuery arguments...

  # Given a string, return a promise for that resource.
  # Given an array, return an array of promises for those resources.
  getByIDs: (ids, options) ->
    print.info 'Getting', @name, 'by ID(s)', ids
    if typeof ids is 'string'
      givenString = true
      ids = [ids]

    # Only request things we don't have or don't already have a request out for.
    incoming = (id for id in ids when not @has(id) and not @waitingFor(id))
    print.log 'Incoming: ', incoming

    unless incoming.length is 0
      for id in incoming
        @deferrals[id] = defer()
        @resourcePromises[id] = @deferrals[id].promise

      url = [@getURL(), incoming.join ','].join '/'
      print.log 'Request for', @name, 'at', url
      @apiClient.get(url, options).then (resources) =>
        print.log 'Got', @name, resources

    if givenString
      @resourcePromises[ids[0]]
    else
      Promise.all (@resourcePromises[id] for id in ids)

  getByQuery: (query, limit = Infinity) ->
    @queryLocal(query).then (existing) =>
      if existing.length >= limit
        existing
      else
        params = limit: limit - existing.length
        @apiClient.get(@getURL(), mergeInto params, query).then (resources) =>
          Promise.all existing.concat resources

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
