Model = require './model'

removeUnderscoredKeys = (target) ->
  if Array.isArray target
    (removeUnderscoredKeys value for value in target)
  else if target? and typeof target is 'object'
    results = {}
    for key, value of target when key.charAt(0) isnt '_'
      results[key] = removeUnderscoredKeys value
    results
  else
    target

# Turn a JSON-API "href" template into a usable URL.
PLACEHOLDERS_PATTERN = /{(.+?)}/g

class Resource extends Model
  _type: null
  _headers: null
  _meta: null
  _linksCache: null

  constructor: (@_type) ->
    unless @_type?
      throw new Error 'Don\'t call the Resource constructor directly, use `client.type("things").create({});`'
    @_headers = {}
    @_meta = {}
    @_linksCache = {}
    super null
    @_type.emit 'change'
    @emit 'create'

  getMeta: (key = @_type._name) ->
    @_meta[key]

  update: ->
    value = super
    if @id and @_type._resourcesCache[@id] isnt this
      @_type._resourcesCache[@id] = this
      @_type.emit 'change'
    value

  save: ->
    payload = {}
    payload[@_type._name] = removeUnderscoredKeys @getChangesSinceSave()

    save = if @id
      @_refreshHeaders().then =>
        @_type._client.put @_getURL(), payload, @_getHeadersForModification()
    else
      @_type._client.post @_type._getURL(), payload

    new ResourcePromise save.then ([result]) =>
      unless result is this
        @update result
        @_changedKeys.splice 0
        result.destroy()
      @emit 'save'
      this

  getChangesSinceSave: ->
    changes = {}
    for key in @_changedKeys
      changes[key] = @[key]
    changes

  refresh: (params = {})->
    if @id
      @_type.get @id, params
    else
      throw new Error 'Can\'t refresh a resource with no ID'

  uncache: ->
    if @id
      @emit 'uncache'
      delete @_type._resourcesCache[@id]
    else
      throw new Error 'Can\'t uncache a resource with no ID'

  delete: ->
    deletion = if @id
      @_refreshHeaders().then =>
        @_type._client.delete @_getURL(), null, @_getHeadersForModification()
    else
      Promise.resolve()

    new ResourcePromise deletion.then =>
      @emit 'delete'
      @_type.emit 'change'
      @destroy()
      null

  get: (name, {skipCache} = {}) ->
    if name of this
      new ResourcePromise Promise.resolve @[name]
    else if @_linksCache[name]? and not skipCache
      @_linksCache[name]
    else
      link = @links?[name]
      typeLink = @_type._links[name]
      result = if typeof link is 'string' or Array.isArray link # It's an ID or IDs.
        @_getLinkByIDs name, link, typeLink
      else if link? or typeLink? # It's a collection object.
        @_getLinkByObject name, link ? typeLink
      else
        throw new Error "No link '#{name}' defined for #{@_type._name}##{@id}"
      result.then =>
        @_linksCache[name] = result
      result

  _refreshHeaders: ->
    # TODO: Make a HEAD request.
    changes = @getChangesSinceSave()
    @refresh().then =>
      @update changes

  _getHeadersForModification: ->
    headers = {}
    if 'Last-Modified' of @_headers
      headers['If-Unmodified-Since'] = @_headers['Last-Modified']
    if 'ETag' of @_headers
      headers['If-Match'] = @_headers['ETag']
    headers

  _getLinkByIDs: (name, idOrIDs, typeLink) ->
    if typeLink?
      {type, href} = typeLink

      if type?
        @_type._client.type(type).get idOrIDs
      else if href?
        new ResourcePromise @_type._client.get(@_applyHREF href).then (resources) ->
          if typeof idOrIDs is 'string'
            resources[0]
          else
            resources
      else
        throw new Error "No type or href for link '#{name}' of #{@_type._name}##{@id ? '?'}"
    else
      throw new Error "No link '#{name}' for #{@_type._name}"

  _getLinkByObject: (name, {id, ids, type, href}) ->
    if (id? or ids?) and type?
      @_type._client.type(type).get id ? ids
    else if href?
      new ResourcePromise @_type._client.get @_applyHREF href
    else
      throw new Error "No type and ID(s) or href for link '#{name}' of #{@_type._name}##{@id ? '?'}"

  _applyHREF: (href) ->
    context = {}
    context[@_type._name] = this

    href.replace PLACEHOLDERS_PATTERN, (_, path) ->
      segments = path.split '.'

      value = context
      until segments.length is 0
        segment = segments.shift()
        value = value[segment] ? value.links?[segment]

      if Array.isArray value
        value = value.join ','

      unless typeof value is 'string'
        throw new Error "Value for '#{path}' in '#{href}' should be a string."

      value

  _getURL: ->
    @href || @_type._getURL @id, arguments...

  link: ->
    console?.warn 'Use Resource::get, not ::link', arguments...
    @get arguments...

  getRequestMeta: ->
    console?.warn 'Use Resource::getMeta, not ::getRequestMeta', arguments...
    @getMeta arguments...

# NOTE: This is totally experimental.
class ResourcePromise
  _promise: null

  constructor: (@_promise) ->
    unless @_promise instanceof Promise
      throw new Error 'ResourcePromise requires a real promise instance'

  then: ->
    @_promise.then arguments...

  catch: ->
    @_promise.catch arguments...

  index: (index) ->
    @_promise = @_promise.then (value) ->
      index %%= value.length
      value[index]
    this

  for methodName, method of Resource.prototype
    if typeof method is 'function' and methodName not of this.prototype
      do (methodName) =>
        @::[methodName] = (args...) ->
          @_promise = @_promise.then (promisedValue) =>
            results = for resource in [].concat promisedValue
              result = resource[methodName] args...
              if result instanceof @constructor
                result = result._promise
              result
            if Array.isArray promisedValue
              Promise.all results
            else
              results[0]
          this

module.exports = Resource
module.exports.Promise = ResourcePromise
