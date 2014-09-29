# This is a pretty standard merge function.
# Merge properties of all arguements into the first.

module.exports = ->
  for argument in Array::slice.call arguments, 1 when argument?
    for key, value of argument
      arguments[0][key] = value
  arguments[0]
