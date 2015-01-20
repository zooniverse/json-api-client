Model = require './model'
mergeInto = require './merge-into'

# Turn a JSON-API "href" template into a usable URL.
PLACEHOLDERS_PATTERN = /{(.+?)}/g

module.exports = class Resource extends Model
  _ignoredKeys: Model::_ignoredKeys.concat ['id', 'type', 'href', 'created_at', 'updated_at']

  _type: null
  _headers: null

  constructor: (configs...) ->
    super
    @_type.emit 'change'

  update: ->
    super
    @_type.emit 'change'

  save: ->
    @emit 'will-save'

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
      @update result
      @_changedKeys.splice 0
      @emit 'save'
      result

  getChangesSinceSave: ->
    changes = {}
    for key in @_changedKeys
      changes[key] = @[key]
    changes

  getFresh: ->
    if @id
      @_type.get @id
    else
      throw new Error 'Can\'t get fresh copy of a resource with no ID'

  delete: ->
    @emit 'will-delete'
    deletion = if @id
      headers = {}
      if 'Last-Modified' of @_headers
        headers['If-Unmodified-Since'] = @_headers['Last-Modified']
      @_type._client.delete(@_getURL(), null, headers).then =>
        @_type.emit 'change'
        null
    else
      Promise.resolve()

    deletion.then =>
      @emit 'delete'

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
      {href, ids, type} = link

      if href?
        @_type._client.get(@_applyHREF href).then (resources) =>
          if typeof @links[name] is 'string'
            resources[0]
          else
            resources

      else if type? and ids?
        type = @_type._client._types[type]
        type.get ids

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
