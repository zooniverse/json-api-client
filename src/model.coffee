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
    changesMade = false
    for own key, value of changeSet
      if @[key] isnt value
        changesMade = true
        unless key in @_changedKeys
          @_changedKeys.push key
      if typeof value is 'function'
        value = value()
      @[key] = value
    if changesMade
      @emit 'change'
    changesMade

  hasUnsavedChanges: ->
    @_changedKeys.length isnt 0

  toJSON: ->
    result = {}
    for own key, value of this when key.charAt(0) isnt '_' and key not in @_ignoredKeys
      result[key] = value
    result
