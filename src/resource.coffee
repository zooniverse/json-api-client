Model = require './model'
mergeInto = require './merge-into'

# Turn a JSON-API "href" template into a usable URL.
PLACEHOLDERS_PATTERN = /{(.+?)}/g

module.exports = class Resource extends Model
  _ignoredKeys: Model::_ignoredKeys.concat ['id', 'type', 'href', 'created_at', 'updated_at']

  _type: null
  _headers: null
  _meta: null

  constructor: (@_type) ->
    super null
    @_headers ?= {}
    @_meta ?= {}
    unless @_type?
      throw new Error 'Don\'t call the Resource constructor directly, use `client.type("things").create({});`'
    @_type.emit 'change'

  getRequestMeta: (key) ->
    @_meta[key ? @_type._name]

  update: ->
    value = super
    if @id
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

    save.then ([result]) =>
      @emit 'save'
      result

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

    deletion.then =>
      @emit 'delete'
      @_type.emit 'change'
      null

  link: (name) ->
    link = @links?[name] ? @_type._links[name]
    if link?
      @_getLink name, link
    else
      throw new Error "No link '#{name}' defined for #{@_type.name} #{@id}"

  _getLink: (name, link) ->
    if typeof link is 'string' or Array.isArray link
      {href, type} = @_type._links[name]

      if href?
        @_type._client.get(@_applyHREF href).then (resources) =>
          if typeof @links[name] is 'string'
            resources[0]
          else
            resources

      else if type?
        type = @_type._client._types[type]
        type.get link

      else
        throw new Error "No HREF or type for link '#{name}' of #{@_type.name} #{@id}"

    else # It's a collection object.
      {id, ids, type, href} = link

      if (id? or ids?) and type?
        @_type._client.type(type).get id ? ids

      else if href?
        @_type._client.get(@_applyHREF href).then (resources) =>
          if typeof @links[name] is 'string'
            resources[0]
          else
            resources

      else
        throw new Error "No HREF, type, or IDs for link '#{name}' of #{@_type.name} #{@id}"

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

  attr: ->
    console.warn 'Use Resource::link, not ::attr', arguments...
    @link arguments...
