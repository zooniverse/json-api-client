# JSON-API Client

A client for the pre-release version of the JSON API spec <http://jsonapi.org/> used by Zooniverse Panoptes.

Requires a native or polyfilled `Promise` class.

## Setting up a client

```coffee
JSONAPIClient = require 'json-api-client'

PATH_TO_API_ROOT = 'https://example.com/api'

DEFAULT_HEADERS =
  'Content-Type': 'application/json'
  'Accept': 'application/vnd.api+json; version=1'

client = new JSONAPIClient PATH_TO_API_ROOT, DEFAULT_HEADERS
```

## Working with resources

```coffee
# Create a resource
brian = client.type('people').create name: 'Brian'

# Change a resource (locally)
brian.update name: 'Brian C.'

# Save a resource to the server
brian.save()

# Delete a resource from the server
brian.delete()
```

### Retrieving existing resources

```coffee
# Retrieve a resource by ID
client.type('people').get('1').then (person) ->

# Retrieve several resources by ID
client.type('people').get(['1', '2', '3']).then (people) ->

# Retrieve a resource by ID, skipping local cache
# (Any request with query params is passed to the server.)
client.type('people').get('1', {})).then (person) ->

# Retrieve a resource by query (likewise, this is never cached)
client.type('people').get(name: 'Brian').then (people) ->

# Chaining promised resource methods (experimental)
client.type('people').get(name: 'Brian').index(0).update(name: 'Brian C.').save().get('name').then (briansName) ->
```

### Watching a resource for changes

```coffee
HANDLER = ->
  console.log 'The resource changed.'

client.type('people').get('1').then (person) ->
  person.listen HANDLER
  person.stopListening HANDLER
```

### Working with links

```coffee
# Get a link (from local cache if, possible)
client.type('people').get('1').then (person) ->
  person.get('pets').then (personsPets) ->

# Or (experimental)
client.type('people').get('1').get('pets').then (personsPets) ->

# Skip the local cache (again, with query params)
person.get('pets', {}).then (personsPets) ->

# Set a link manually
client.type('animals').create(name: 'Spot').save().then (spot) ->
  client.type('people').get('1').then (person) ->
    person.update('links.pets': [spot.id]).save()

# Add an item to a link (instead of replacing the whole thing)
client.type('people').get('1').addLink 'pets', [rex.id, rover.id]

# Remove an item from a link
client.type('people').get('1').removeLink 'pets', spot.id
```

### Getting response metadata

```coffee
client.type('people').get('1').then (person) ->
  meta = person.getMeta()
  "Page #{meta.page} / #{meta.page_count}"
```
