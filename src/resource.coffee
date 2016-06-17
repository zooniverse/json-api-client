Model = require './model'

# Turn a JSON-API "href" template into a usable URL.
PLACEHOLDERS_PATTERN = /{(.+?)}/g

class Resource extends Model
  _type: null
  _headers: null
  _meta: null
  _linksCache: null
  _savingKeys: null
  _write: Promise.resolve()

  constructor: (@_type) ->
    unless @_type?
      throw new Error 'Don\'t call the Resource constructor directly, use `client.type("things").create({});`'
    @_headers = {}
    @_meta = {}
    @_linksCache = {}
    @_savingKeys = {}
    super null
    @_type.emit 'change'
    @emit 'create'

  getMeta: (key = @_type._name) ->
    @_meta[key]

  update: ->
    value = super
    if @id and @_type._resourcesCache[@id] isnt this
      @_type._resourcesCache[@id] = this
      @_type._resourcesCache[@href] = this if @href?
      @_type.emit 'change'
    value

  save: ->
    payload = {}
    changes = @toJSON.call @getChangesSinceSave()
    payload[@_type._name] = changes

    @_changedKeys.splice 0

    for key of changes
      @_savingKeys[key] ?= 0
      @_savingKeys[key] += 1

    @_write = @_write
      .catch =>
        null
      .then =>
        save = if @id
          @refresh(true).then =>
            @_type._client.put @_getURL(), payload, @_getHeadersForModification()
        else
          @_type._client.post @_type._getURL(), payload

        new ResourcePromise save.then ([result]) =>
          for key of changes
            @_savingKeys[key] -= 1
            if @_savingKeys[key] is 0
              delete @_savingKeys[key]

          unless result is this
            @update result
            result.destroy()
          @emit 'save'
          this
    @_write

  getChangesSinceSave: ->
    changes = {}
    for key in @_changedKeys
      changes[key] = @[key]
    changes

  refresh: (saveChanges) ->
    if saveChanges
      changes = @getChangesSinceSave()
      @refresh().then =>
        @update changes
    else if @id
      @_type._client.get @_getURL()
    else
      throw new Error 'Can\'t refresh a resource with no ID'

  uncache: ->
    if @id
      @emit 'uncache'
      delete @_type._resourcesCache[@id]
      delete @_type._resourcesCache[@href]
    else
      throw new Error 'Can\'t uncache a resource with no ID'

  delete: ->
    @_write = @_write
      .catch =>
        null
      .then =>
        deletion = if @id
          @refresh(true).then =>
            @_type._client.delete @_getURL(), null, @_getHeadersForModification()
        else
          Promise.resolve()

        new ResourcePromise deletion.then =>
          @emit 'delete'
          @_type.emit 'change'
          @destroy()
          null
    @_write

  get: (name, query) ->
    if @_linksCache[name]? and not query?
      @_linksCache[name]

    else
      resourceLink = @links?[name]
      typeLink = @_type._links[name]

      result = if  resourceLink? or typeLink?
        href = resourceLink?.href ? typeLink?.href
        type = resourceLink?.type ? typeLink?.type

        id = resourceLink?.id ? typeLink?.id
        id ?= if typeof resourceLink is 'string'
          resourceLink

        ids = resourceLink?.ids ? typeLink?.ids
        ids ?= if Array.isArray resourceLink
          resourceLink

        if href?
          fullHREF = @_applyHREF(href)
          cachedByHREF = @_type._client.type(type)._resourcesCache[fullHREF]

          if cachedByHREF? and not query?
            Promise.resolve(cachedByHREF)
          else
            @_type._client.get(fullHREF, query).then (links) ->
              if id?
                links[0]
              else
                links

        else if type?
          @_type._client.type(type).get(id ? ids, query).then (links) ->
            if id?
              links[0]
            else
              links

      else if name of this
        Promise.resolve @[name]

      else
        @_type._client.get @_getURL name

      result.then =>
        @_linksCache[name] = result unless query?

      new ResourcePromise result

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

  addLink: (name, value) ->
    url = @_getURL 'links', name

    data = {}
    data[name] = value # TODO: Should this always be an array?

    @_type._client.post(url, data).then =>
      @uncacheLink name
      @refresh()

  removeLink: (name, value) ->
    url = @_getURL 'links', name, [].concat(value).join ','
    @_type._client.delete(url).then =>
      @uncacheLink name
      @refresh()

  uncacheLink: (name) ->
    delete @_linksCache[name]

  _getHeadersForModification: ->
    headers =
      'If-Unmodified-Since': @_getHeader 'Last-Modified'
      'If-Match': @_getHeader 'ETag'
    for header, value of headers
      unless value?
        delete headers[header]
    headers

  _getHeader: (header) ->
    header = header.toLowerCase()
    (value for name, value of @_headers when name.toLowerCase() is header)[0]

  _getURL: ->
    if @href
      [@href, arguments...].join '/'
    else
      @_type._getURL @id, arguments...

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
