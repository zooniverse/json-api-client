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
    @emit 'will-change'
    for key, value of changeSet when @[key] isnt value
      if typeof value is 'function'
        value = value()
      @[key] = value
      unless key in @_changedKeys
        @_changedKeys.push key
    @emit 'change'

  hasUnsavedChanges: ->
    @_changedKeys.length isnt 0

  toJSON: ->
    result = {}
    for own key, value of this when key.charAt(0) isnt '_' and key not in @_ignoredKeys
      result[key] = value
    result
