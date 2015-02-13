Emitter = require './emitter'
mergeInto = require './merge-into'

module.exports = class Model extends Emitter
  _ignoredKeys: []
  _changedKeys: null

  constructor: (configs...) ->
    super
    @_changedKeys = []
    mergeInto this, configs...
    @emit 'create'

  update: (changeSet = {}) ->
    if typeof changeSet is 'string'
      # This is a note for myself, I'll remove it soon, and this feature will still work as it does now.
      console?.warn 'You can now update dotted-path keys, so you probably don\'t need to call Resource::update on strings anymore.'
      for key in arguments when key not in @_changedKeys
        @_changedKeys.push arguments...
    else
      for own key, value of changeSet
        path = key.split '.'
        rootKey = path[0]
        base = this
        until path.length is 1
          base = base[path.shift()]
        lastKey = path.shift()
        if value is undefined
          delete base[lastKey]
        else if typeof value is 'function'
          value.call base[lastKey]
        else
          base[key] = value
        unless rootKey in @_changedKeys
          @_changedKeys.push rootKey
    @emit 'change'
    this

  hasUnsavedChanges: ->
    @_changedKeys.length isnt 0

  toJSON: ->
    result = {}
    for own key, value of this when key.charAt(0) isnt '_' and key not in @_ignoredKeys
      result[key] = value
    result
