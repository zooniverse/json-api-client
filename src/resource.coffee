Model = require './model'

# Turn a JSON-API "href" template into a usable URL.
PLACEHOLDERS_PATTERN = /{(.+?)}/g

class Resource extends Model
  _ignoredKeys: Model::_ignoredKeys.concat ['id', 'type', 'href']

  _type: null
  _headers: null
  _meta: null
  _linksCache: null

  constructor: (@_type) ->
    unless @_type?
      throw new Error 'Don\'t call the Resource constructor directly, use `client.type("things").create({});`'
    super null
    @_linksCache = {}
    @_type.emit 'change'
    @emit 'create'

  getRequestMeta: (key) ->
    @_meta[key ? @_type._name]

  update: ->
    value = super
    if @id and @_type._cache[@id] isnt this
      @_type._cache[@id] = this
      @_type.emit 'change'
    value

  save: ->
    payload = {}
    payload[@_type._name] = @getChangesSinceSave()

    save = if @id
      headers = {}
      if 'Last-Modified' of @_headers
        headers['If-Unmodified-Since'] = @_headers['Last-Modified']
      @_type._client.put @_getURL(), payload, headers
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

  refresh: ->
    if @id
      @_type.get @id, {}
    else
      throw new Error 'Can\'t refresh a resource with no ID'

  uncache: ->
    if @id
      @emit 'uncache'
      delete @_type._cache[@id]
    else
      throw new Error 'Can\'t uncache a resource with no ID'

  delete: ->
    deletion = if @id
      @uncache()
      headers = {}
      if 'Last-Modified' of @_headers
        headers['If-Unmodified-Since'] = @_headers['Last-Modified']
      @_type._client.delete @_getURL(), null, headers
    else
      Promise.resolve()

    new ResourcePromise deletion.then =>
      @emit 'delete'
      @_type.emit 'change'
      @destroy()
      null

  get: (name, {skipCache} = {}) ->
    new ResourcePromise if name of this
      Promise.resolve @[name]
    else if @_linksCache[name]? and not skipCache
      @_linksCache[name]
    else
      link = @links?[name]
      result = if typeof link is 'string' or Array.isArray link # It's an ID or IDs.
        @_getLinkByIDs name, link
      else if link? # It's a collection object.
        @_getLinkByObject name, link
      else
        throw new Error "No link '#{name}' defined for #{@_type._name}##{@id}"
      result.then =>
        @_linksCache[name] = result
      result

  _getLinkByIDs: (name, idOrIDs) ->
    if @_type._links[name]?
      {type, href} = @_type._links[name]

      if type?
        @_type._client.type(type).get idOrIDs
      else if href?
        @_type._client.get(@_applyHREF href).then (resources) ->
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
    console.warn 'Use Resource::get, not ::link', arguments...
    @get arguments...

# NOTE: This is totally experimental.
class ResourcePromise
  _promise: null
  _parent: null

  constructor: (@_promise, @_parent) ->
    # Pass

  then: ->
    new @constructor @_promise.then(arguments...), @_promise

  catch: ->
    new @constructor @_promise.catch(arguments...), @_promise

  end: ->
    new @constructor @_parent

  for methodName, method of Resource.prototype
    if typeof method is 'function' and methodName not of this.prototype
      do (methodName, method) =>
        @::[methodName] = (args...) ->
          outPromise = @_promise.then (promisedValue) ->
            results = for resource in [].concat(promisedValue)
              method.apply resource, args
            if Array.isArray promisedValue
              Promise.all results
            else
              results[0]
          new @constructor outPromise, @_promise

module.exports = Resource
module.exports.Promise = ResourcePromise
