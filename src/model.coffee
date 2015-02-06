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
      for key in arguments when key not in @_changedKeys
        @_changedKeys.push arguments...
    else
      for own key, value of changeSet
        unless key in @_changedKeys
          @_changedKeys.push key
        if value is undefined
          delete @key
        else
          @[key] = value
    @emit 'change'
    this

  hasUnsavedChanges: ->
    @_changedKeys.length isnt 0

  toJSON: ->
    result = {}
    for own key, value of this when key.charAt(0) isnt '_' and key not in @_ignoredKeys
      result[key] = value
    result
