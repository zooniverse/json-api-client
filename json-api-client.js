!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.JSONAPIClient=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Emitter, print,
  __slice = [].slice;

print = _dereq_('./print');

module.exports = Emitter = (function() {
  Emitter.prototype._callbacks = null;

  function Emitter() {
    this._callbacks = {};
  }

  Emitter.prototype.listen = function(signal, callback) {
    var _base;
    if ((_base = this._callbacks)[signal] == null) {
      _base[signal] = [];
    }
    return this._callbacks[signal].push(callback);
  };

  Emitter.prototype.stopListening = function(signal, callback) {
    var handler, i, index, item, j, _i, _ref, _results;
    if (signal != null) {
      if (this._callbacks[signal] != null) {
        if (callback != null) {
          if (Array.isArray(callback)) {
            index = -1;
            _ref = this._callbacks[signal];
            for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
              handler = _ref[i];
              if (Array.isArray(handler) && callback.length === handler.length) {
                if (((function() {
                  var _j, _len, _results;
                  _results = [];
                  for (j = _j = 0, _len = callback.length; _j < _len; j = ++_j) {
                    item = callback[j];
                    if (handler[j] === item) {
                      _results.push(null);
                    }
                  }
                  return _results;
                })()).length === callback.length) {
                  index = i;
                  break;
                }
              }
            }
          } else {
            index = this._callbacks[signal].lastIndexOf(callback);
          }
          if (index !== -1) {
            return this._callbacks[signal].splice(index, 1);
          }
        } else {
          return this._callbacks[signal].splice(0);
        }
      }
    } else {
      _results = [];
      for (signal in this._callbacks) {
        _results.push(this.stopListening(signal));
      }
      return _results;
    }
  };

  Emitter.prototype.emit = function() {
    var callback, payload, signal, _i, _len, _ref, _ref1, _results;
    signal = arguments[0], payload = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    print.log('Emitting', signal, JSON.stringify(payload), (_ref = this._callbacks[signal]) != null ? _ref.length : void 0);
    if (signal in this._callbacks) {
      _ref1 = this._callbacks[signal];
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        callback = _ref1[_i];
        _results.push(this._callHandler(callback, payload));
      }
      return _results;
    }
  };

  Emitter.prototype._callHandler = function(handler, args) {
    var boundArgs, context, _ref;
    if (Array.isArray(handler)) {
      _ref = handler, context = _ref[0], handler = _ref[1], boundArgs = 3 <= _ref.length ? __slice.call(_ref, 2) : [];
      if (typeof handler === 'string') {
        handler = context[handler];
      }
    } else {
      boundArgs = [];
    }
    return handler.apply(context, boundArgs.concat(args));
  };

  return Emitter;

})();



},{"./print":5}],2:[function(_dereq_,module,exports){
var DEFAULT_TYPE_AND_ACCEPT, JSONAPIClient, Type, makeHTTPRequest, mergeInto, print,
  __slice = [].slice;

print = _dereq_('./print');

makeHTTPRequest = _dereq_('./make-http-request');

mergeInto = _dereq_('./merge-into');

Type = _dereq_('./type');

DEFAULT_TYPE_AND_ACCEPT = {
  'Content-Type': 'application/vnd.api+json',
  'Accept': "application/vnd.api+json"
};

module.exports = JSONAPIClient = (function() {
  var method, _fn, _i, _len, _ref;

  JSONAPIClient.prototype.root = '';

  JSONAPIClient.prototype.headers = null;

  JSONAPIClient.prototype.types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers;
    if (this.headers == null) {
      this.headers = {};
    }
    this.types = {};
    print.info('Created a new JSON-API client at', this.root);
  }

  JSONAPIClient.prototype.request = function(method, url, data, additionalHeaders) {
    var headers;
    print.info('Making a', method, 'request to', url);
    headers = mergeInto({}, DEFAULT_TYPE_AND_ACCEPT, this.headers, additionalHeaders);
    return makeHTTPRequest(method, this.root + url, data, headers).then(this.processResponseTo.bind(this))["catch"](this.processErrorResponseTo.bind(this));
  };

  _ref = ['get', 'post', 'put', 'delete'];
  _fn = function(method) {
    return JSONAPIClient.prototype[method] = function() {
      return this.request.apply(this, [method.toUpperCase()].concat(__slice.call(arguments)));
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    method = _ref[_i];
    _fn(method);
  }

  JSONAPIClient.prototype.processResponseTo = function(request) {
    var attribute, attributeType, href, link, primaryResults, resource, resources, response, type, typeAndAttribute, _j, _k, _len1, _len2, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    response = (function() {
      try {
        return JSON.parse(request.responseText);
      } catch (_error) {}
    })();
    if (response == null) {
      response = {};
    }
    print.log('Processing response', response);
    if ('meta' in response) {
      'TODO: No idea yet!';
    }
    if ('links' in response) {
      _ref1 = response.links;
      for (typeAndAttribute in _ref1) {
        link = _ref1[typeAndAttribute];
        _ref2 = typeAndAttribute.split('.'), type = _ref2[0], attribute = _ref2[1];
        if (typeof link === 'string') {
          href = link;
        } else {
          href = link.href, attributeType = link.type;
        }
        this.handleLink(type, attribute, href, attributeType);
      }
    }
    if ('linked' in response) {
      _ref3 = response.linked;
      for (type in _ref3) {
        resources = _ref3[type];
        print.log('Got', resources != null ? resources : 1, 'linked', type, 'resources.');
        if (this.types[type] == null) {
          this.createType(type);
        }
        _ref4 = [].concat(resources);
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          resource = _ref4[_j];
          this.types[type].createResource(resource);
        }
      }
    }
    if ('data' in response) {
      print.log('Got a top-level "data" collection of', (_ref5 = response.data.length) != null ? _ref5 : 1);
      primaryResults = (function() {
        var _k, _len2, _ref6, _results;
        _ref6 = [].concat(response.data);
        _results = [];
        for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
          resource = _ref6[_k];
          if (this.types[resource.type] == null) {
            this.createType(response.type);
          }
          _results.push(this.types[type].createResource(resource));
        }
        return _results;
      }).call(this);
    } else {
      primaryResults = [];
      for (type in response) {
        resources = response[type];
        if (!(type !== 'links' && type !== 'linked' && type !== 'meta' && type !== 'data')) {
          continue;
        }
        print.log('Got a top-level', type, 'collection of', (_ref6 = resources.length) != null ? _ref6 : 1);
        if (this.types[type] == null) {
          this.createType(type);
        }
        _ref7 = [].concat(resources);
        for (_k = 0, _len2 = _ref7.length; _k < _len2; _k++) {
          resource = _ref7[_k];
          primaryResults.push(this.types[type].createResource(resource, type));
        }
      }
    }
    print.info('Primary resources:', primaryResults);
    return Promise.all(primaryResults);
  };

  JSONAPIClient.prototype.handleLink = function(typeName, attributeName, hrefTemplate, attributeTypeName) {
    var _base;
    if (this.types[typeName] == null) {
      this.createType(typeName);
    }
    if ((_base = this.types[typeName].links)[attributeTypeName] == null) {
      _base[attributeTypeName] = {};
    }
    if (hrefTemplate != null) {
      this.types[typeName].links[attributeTypeName].href = hrefTemplate;
    }
    if (attributeTypeName != null) {
      return this.types[typeName].links[attributeTypeName].type = attributeName;
    }
  };

  JSONAPIClient.prototype.createType = function(name) {
    return new Type({
      name: name,
      apiClient: this
    });
  };

  JSONAPIClient.prototype.processErrorResponseTo = function(request) {
    return Promise.reject(JSON.parse(request.responseText));
  };

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};



},{"./make-http-request":3,"./merge-into":4,"./print":5,"./type":7}],3:[function(_dereq_,module,exports){
var print;

print = _dereq_('./print');

module.exports = function(method, url, data, headers, modify) {
  print.info('Requesting', method, url, data);
  return new Promise(function(resolve, reject) {
    var header, modifications, request, value;
    request = new XMLHttpRequest;
    request.open(method, encodeURI(url));
    request.withCredentials = true;
    if (headers != null) {
      for (header in headers) {
        value = headers[header];
        request.setRequestHeader(header, value);
      }
    }
    if (modify != null) {
      modifications = modify(request);
    }
    request.onreadystatechange = function(e) {
      var key, _ref;
      print.log('Ready state:', ((function() {
        var _results;
        _results = [];
        for (key in request) {
          value = request[key];
          if (value === request.readyState && key !== 'readyState') {
            _results.push(key);
          }
        }
        return _results;
      })())[0]);
      if (request.readyState === request.DONE) {
        print.log('Done; status is', request.status);
        if ((200 <= (_ref = request.status) && _ref < 300)) {
          return resolve(request);
        } else {
          return reject(request);
        }
      }
    };
    return request.send(JSON.stringify(data));
  });
};



},{"./print":5}],4:[function(_dereq_,module,exports){
module.exports = function() {
  var argument, key, value, _i, _len, _ref;
  _ref = Array.prototype.slice.call(arguments, 1);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    argument = _ref[_i];
    if (argument != null) {
      for (key in argument) {
        value = argument[key];
        arguments[0][key] = value;
      }
    }
  }
  return arguments[0];
};



},{}],5:[function(_dereq_,module,exports){
var LOG_LEVEL, print, _ref, _ref1,
  __slice = [].slice;

LOG_LEVEL = parseFloat((_ref = (_ref1 = location.search.match(/json-api-log=(\d+)/)) != null ? _ref1[1] : void 0) != null ? _ref : 0);

print = function() {
  var color, level, messages;
  level = arguments[0], color = arguments[1], messages = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  if (LOG_LEVEL >= level) {
    return console.log.apply(console, ['%c{json:api}', "color: " + color + "; font: bold 1em monospace;"].concat(__slice.call(messages)));
  }
};

module.exports = {
  log: print.bind(null, 4, 'gray'),
  info: print.bind(null, 3, 'blue'),
  warn: print.bind(null, 2, 'orange'),
  error: print.bind(null, 1, 'red')
};



},{}],6:[function(_dereq_,module,exports){
var Emitter, Resource, mergeInto, print,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

print = _dereq_('./print');

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

module.exports = Resource = (function(_super) {
  __extends(Resource, _super);

  Resource.prototype.id = '';

  Resource.prototype.href = '';

  Resource.prototype.type = '';

  Resource.prototype._type = null;

  Resource.prototype._changedKeys = null;

  Resource.prototype.created_at = '';

  Resource.prototype.updated_at = '';

  function Resource() {
    var config;
    config = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    this._changedKeys = [];
    Resource.__super__.constructor.apply(this, arguments);
    if (config != null) {
      mergeInto.apply(null, [this].concat(__slice.call(config)));
    }
    print.info("Created resource: " + this._type.name + " " + this.id, this);
    this.emit('create');
  }

  Resource.prototype.attr = function(attribute) {
    print.info('Getting link:', attribute);
    if (attribute in this) {
      print.warn("No need to access a non-linked attribute via attr: " + attribute, this);
      return Promise.resolve(this[attribute]);
    } else if ((this.links != null) && attribute in this.links) {
      print.log('Link of resource');
      return this._getLink(attribute, this.links[attribute]);
    } else if (attribute in this._type.links) {
      print.log('Link of type');
      return this._getLink(attribute, this._type.links[attribute]);
    } else {
      print.error('Not a link at all');
      return Promise.reject(new Error("No attribute " + attribute + " of " + this._type.name + " resource"));
    }
  };

  Resource.prototype._getLink = function(name, link) {
    var context, href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      print.log('Linked by ID(s)');
      ids = link;
      _ref = this._type.links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        context = {};
        context[this._type.name] = this;
        href = this.applyHREF(href, context);
        return this._type.apiClient.get(href);
      } else if (type != null) {
        type = this._type.apiClient.types[type];
        return type.get(ids);
      }
    } else if (link != null) {
      print.log('Linked by collection object', link);
      href = link.href, ids = link.ids, type = link.type;
      if (href != null) {
        context = {};
        context[this._type.name] = this;
        print.warn('HREF', href);
        href = this.applyHREF(href, context);
        return this._type.apiClient.get(href);
      } else if ((type != null) && (ids != null)) {
        type = this._type.apiClient.types[type];
        return type.get(ids);
      }
    } else {
      print.log('Linked, but blank');
      return Promise.resolve(null);
    }
  };

  Resource.prototype.PLACEHOLDERS_PATTERN = /{(.+?)}/g;

  Resource.prototype.applyHREF = function(href, context) {
    return href.replace(this.PLACEHOLDERS_PATTERN, function(_, path) {
      var segment, segments, value, _ref, _ref1;
      segments = path.split('.');
      print.warn('Segments', segments);
      value = context;
      while (segments.length !== 0) {
        segment = segments.shift();
        value = (_ref = value[segment]) != null ? _ref : (_ref1 = value.links) != null ? _ref1[segment] : void 0;
      }
      print.warn('Value', value);
      if (Array.isArray(value)) {
        value = value.join(',');
      }
      if (typeof value !== 'string') {
        throw new Error("Value for '" + path + "' in '" + href + "' should be a string.");
      }
      return value;
    });
  };

  Resource.prototype.update = function(changeSet) {
    var actualChanges, key, value;
    if (changeSet == null) {
      changeSet = {};
    }
    this.emit('will-change');
    actualChanges = 0;
    for (key in changeSet) {
      value = changeSet[key];
      if (!(this[key] !== value)) {
        continue;
      }
      this[key] = value;
      if (__indexOf.call(this._changedKeys, key) < 0) {
        this._changedKeys.push(key);
      }
      actualChanges += 1;
    }
    if (actualChanges !== 0) {
      return this.emit('change');
    }
  };

  Resource.prototype.save = function() {
    var payload, save;
    this.emit('will-save');
    payload = {};
    payload[this._type.name] = this.getChangesSinceSave();
    save = this.id ? this._type.apiClient.put(this.getURL(), payload) : this._type.apiClient.post(this._type.getURL(), payload);
    return save.then((function(_this) {
      return function(results) {
        _this.update(results);
        _this._changedKeys.splice(0);
        _this.emit('save');
        return results;
      };
    })(this));
  };

  Resource.prototype.getChangesSinceSave = function() {
    var changes, key, _i, _len, _ref;
    changes = {};
    _ref = this._changedKeys;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      changes[key] = this[key];
    }
    return changes;
  };

  Resource.prototype["delete"] = function() {
    var deletion;
    this.emit('will-delete');
    deletion = this.id ? this._type.apiClient["delete"](this.getURL()) : Promise.resolve();
    return deletion.then((function(_this) {
      return function() {
        return _this.emit('delete');
      };
    })(this));
  };

  Resource.prototype.matchesQuery = function(query) {
    var matches, param, value;
    matches = true;
    for (param in query) {
      value = query[param];
      if (this[param] !== value) {
        matches = false;
        break;
      }
    }
    return matches;
  };

  Resource.prototype.emit = function(signal, payload) {
    var _ref;
    Resource.__super__.emit.apply(this, arguments);
    return (_ref = this._type)._handleResourceEmission.apply(_ref, [this].concat(__slice.call(arguments)));
  };

  Resource.prototype.getURL = function() {
    return this.href || [this._type.getURL(), this.id].join('/');
  };

  Resource.prototype.toJSON = function() {
    var key, result, value;
    result = {};
    result[this._type.name] = {};
    for (key in this) {
      if (!__hasProp.call(this, key)) continue;
      value = this[key];
      if (key.charAt(0) !== '_') {
        result[this._type.name][key] = value;
      }
    }
    return result;
  };

  return Resource;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5}],7:[function(_dereq_,module,exports){
var Emitter, Resource, Type, defer, mergeInto, print,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

print = _dereq_('./print');

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

Resource = _dereq_('./resource');

defer = function() {
  var deferral;
  deferral = {};
  deferral.promise = new Promise(function(resolve, reject) {
    deferral.resolve = resolve;
    return deferral.reject = reject;
  });
  return deferral;
};

module.exports = Type = (function(_super) {
  __extends(Type, _super);

  Type.prototype.name = '';

  Type.prototype.apiClient = null;

  Type.prototype.links = null;

  Type.prototype.deferrals = null;

  Type.prototype.resourcePromises = null;

  function Type() {
    var configs;
    configs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Type.__super__.constructor.apply(this, arguments);
    if (configs != null) {
      mergeInto.apply(null, [this].concat(__slice.call(configs)));
    }
    print.info('Defining a new resource type:', this.name);
    if (this.links == null) {
      this.links = {};
    }
    if (this.deferrals == null) {
      this.deferrals = {};
    }
    if (this.resourcePromises == null) {
      this.resourcePromises = {};
    }
    this.apiClient.types[this.name] = this;
  }

  Type.prototype.getURL = function() {
    return '/' + this.name;
  };

  Type.prototype.queryLocal = function(query) {
    var id, resourcePromise;
    return Promise.all((function() {
      var _ref, _results;
      _ref = this.resourcePromises;
      _results = [];
      for (id in _ref) {
        resourcePromise = _ref[id];
        _results.push(resourcePromise);
      }
      return _results;
    }).call(this)).then(function(resources) {
      var resource, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = resources.length; _i < _len; _i++) {
        resource = resources[_i];
        if (resource != null ? resource.matchesQuery(query) : void 0) {
          _results.push(resource);
        }
      }
      return _results;
    });
  };

  Type.prototype.waitingFor = function(id) {
    return this.deferrals[id] != null;
  };

  Type.prototype.has = function(id) {
    return (this.resourcePromises[id] != null) && (this.deferrals[id] == null);
  };

  Type.prototype.get = function() {
    if (typeof arguments[0] === 'string' || Array.isArray(arguments[0])) {
      return this.getByIDs.apply(this, arguments);
    } else {
      return this.getByQuery.apply(this, arguments);
    }
  };

  Type.prototype.getByIDs = function(ids, options) {
    var givenString, id, incoming, url, _i, _len;
    print.info('Getting', this.name, 'by ID(s)', ids);
    if (typeof ids === 'string') {
      givenString = true;
      ids = [ids];
    }
    incoming = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        if (!this.has(id) && !this.waitingFor(id)) {
          _results.push(id);
        }
      }
      return _results;
    }).call(this);
    print.log('Incoming: ', incoming);
    if (incoming.length !== 0) {
      for (_i = 0, _len = incoming.length; _i < _len; _i++) {
        id = incoming[_i];
        this.deferrals[id] = defer();
        this.resourcePromises[id] = this.deferrals[id].promise;
      }
      url = [this.getURL(), incoming.join(',')].join('/');
      print.log('Request for', this.name, 'at', url);
      this.apiClient.get(url, options).then((function(_this) {
        return function(resources) {
          return print.log('Got', _this.name, resources);
        };
      })(this));
    }
    if (givenString) {
      return this.resourcePromises[ids[0]];
    } else {
      return Promise.all((function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
          id = ids[_j];
          _results.push(this.resourcePromises[id]);
        }
        return _results;
      }).call(this));
    }
  };

  Type.prototype.getByQuery = function(query, limit) {
    if (limit == null) {
      limit = Infinity;
    }
    return this.queryLocal(query).then((function(_this) {
      return function(existing) {
        var params;
        if (existing.length >= limit) {
          return existing;
        } else {
          params = {
            limit: limit - existing.length
          };
          return _this.apiClient.get(_this.getURL(), mergeInto(params, query)).then(function(resources) {
            return Promise.all(existing.concat(resources));
          });
        }
      };
    })(this));
  };

  Type.prototype.createResource = function(data) {
    var newResource, resource;
    if (data.id) {
      if (this.waitingFor(data.id)) {
        print.log('Resolving and removing deferral for', this.name, data.id);
        newResource = new Resource({
          _type: this
        });
        newResource.update(data);
        this.deferrals[data.id].resolve(newResource);
        this.deferrals[data.id] = null;
      } else if (this.has(data.id)) {
        print.log('The', this.name, 'resource', data.id, 'exists; will update');
        this.get(data.id).then(function(resource) {
          return resource.update(data);
        });
      } else {
        print.log('Creating new', this.name, 'resource', data.id);
        this.resourcePromises[data.id] = Promise.resolve(new Resource(data, {
          _type: this
        }));
      }
      return this.resourcePromises[data.id];
    } else {
      resource = new Resource({
        _type: this
      });
      resource.update(data);
      return resource;
    }
  };

  Type.prototype._handleResourceEmission = function(resource, signal, payload) {
    return this.emit('change');
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxjQUFBO0VBQUEsa0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxDQUFB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cEMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRW1pdHRlclxuICBfY2FsbGJhY2tzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQF9jYWxsYmFja3MgPSB7fVxuXG4gIGxpc3RlbjogKHNpZ25hbCwgY2FsbGJhY2spIC0+XG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXSA/PSBbXVxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0ucHVzaCBjYWxsYmFja1xuXG4gIHN0b3BMaXN0ZW5pbmc6IChzaWduYWwsIGNhbGxiYWNrKSAtPlxuICAgIGlmIHNpZ25hbD9cbiAgICAgIGlmIEBfY2FsbGJhY2tzW3NpZ25hbF0/XG4gICAgICAgIGlmIGNhbGxiYWNrP1xuICAgICAgICAgIGlmIEFycmF5LmlzQXJyYXkgY2FsbGJhY2tcbiAgICAgICAgICAgICMgQXJyYXktc3R5bGUgY2FsbGJhY2tzIG5lZWQgbm90IGJlIHRoZSBleGFjdCBzYW1lIG9iamVjdC5cbiAgICAgICAgICAgIGluZGV4ID0gLTFcbiAgICAgICAgICAgIGZvciBoYW5kbGVyLCBpIGluIEBfY2FsbGJhY2tzW3NpZ25hbF0gYnkgLTEgd2hlbiBBcnJheS5pc0FycmF5KGhhbmRsZXIpIGFuZCBjYWxsYmFjay5sZW5ndGggaXMgaGFuZGxlci5sZW5ndGhcbiAgICAgICAgICAgICAgaWYgKG51bGwgZm9yIGl0ZW0sIGogaW4gY2FsbGJhY2sgd2hlbiBoYW5kbGVyW2pdIGlzIGl0ZW0pLmxlbmd0aCBpcyBjYWxsYmFjay5sZW5ndGhcbiAgICAgICAgICAgICAgICBpbmRleCA9IGlcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGluZGV4ID0gQF9jYWxsYmFja3Nbc2lnbmFsXS5sYXN0SW5kZXhPZiBjYWxsYmFja1xuICAgICAgICAgIHVubGVzcyBpbmRleCBpcyAtMVxuICAgICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgaW5kZXgsIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIDBcbiAgICBlbHNlXG4gICAgICBAc3RvcExpc3RlbmluZyBzaWduYWwgZm9yIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuXG4gIGVtaXQ6IChzaWduYWwsIHBheWxvYWQuLi4pIC0+XG4gICAgcHJpbnQubG9nICdFbWl0dGluZycsIHNpZ25hbCwgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksIEBfY2FsbGJhY2tzW3NpZ25hbF0/Lmxlbmd0aFxuICAgIGlmIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuICAgICAgZm9yIGNhbGxiYWNrIGluIEBfY2FsbGJhY2tzW3NpZ25hbF1cbiAgICAgICAgQF9jYWxsSGFuZGxlciBjYWxsYmFjaywgcGF5bG9hZFxuXG4gIF9jYWxsSGFuZGxlcjogKGhhbmRsZXIsIGFyZ3MpIC0+XG4gICAgaWYgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICBbY29udGV4dCwgaGFuZGxlciwgYm91bmRBcmdzLi4uXSA9IGhhbmRsZXJcbiAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgIGhhbmRsZXIgPSBjb250ZXh0W2hhbmRsZXJdXG4gICAgZWxzZVxuICAgICAgYm91bmRBcmdzID0gW11cbiAgICBoYW5kbGVyLmFwcGx5IGNvbnRleHQsIGJvdW5kQXJncy5jb25jYXQgYXJnc1xuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xubWFrZUhUVFBSZXF1ZXN0ID0gcmVxdWlyZSAnLi9tYWtlLWh0dHAtcmVxdWVzdCdcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblR5cGUgPSByZXF1aXJlICcuL3R5cGUnXG5cbkRFRkFVTFRfVFlQRV9BTkRfQUNDRVBUID1cbiAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi92bmQuYXBpK2pzb24nXG4gICdBY2NlcHQnOiBcImFwcGxpY2F0aW9uL3ZuZC5hcGkranNvblwiXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSlNPTkFQSUNsaWVudFxuICByb290OiAnJ1xuICBoZWFkZXJzOiBudWxsXG5cbiAgdHlwZXM6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEByb290LCBAaGVhZGVycykgLT5cbiAgICBAaGVhZGVycyA/PSB7fVxuICAgIEB0eXBlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnQ3JlYXRlZCBhIG5ldyBKU09OLUFQSSBjbGllbnQgYXQnLCBAcm9vdFxuXG4gIHJlcXVlc3Q6IChtZXRob2QsIHVybCwgZGF0YSwgYWRkaXRpb25hbEhlYWRlcnMpIC0+XG4gICAgcHJpbnQuaW5mbyAnTWFraW5nIGEnLCBtZXRob2QsICdyZXF1ZXN0IHRvJywgdXJsXG4gICAgaGVhZGVycyA9IG1lcmdlSW50byB7fSwgREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQsIEBoZWFkZXJzLCBhZGRpdGlvbmFsSGVhZGVyc1xuICAgIG1ha2VIVFRQUmVxdWVzdCBtZXRob2QsIEByb290ICsgdXJsLCBkYXRhLCBoZWFkZXJzXG4gICAgICAudGhlbiBAcHJvY2Vzc1Jlc3BvbnNlVG8uYmluZCB0aGlzXG4gICAgICAuY2F0Y2ggQHByb2Nlc3NFcnJvclJlc3BvbnNlVG8uYmluZCB0aGlzXG5cbiAgZm9yIG1ldGhvZCBpbiBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnXSB0aGVuIGRvIChtZXRob2QpID0+XG4gICAgQDo6W21ldGhvZF0gPSAtPlxuICAgICAgQHJlcXVlc3QgbWV0aG9kLnRvVXBwZXJDYXNlKCksIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICByZXNwb25zZSA9IHRyeSBKU09OLnBhcnNlIHJlcXVlc3QucmVzcG9uc2VUZXh0XG4gICAgcmVzcG9uc2UgPz0ge31cbiAgICBwcmludC5sb2cgJ1Byb2Nlc3NpbmcgcmVzcG9uc2UnLCByZXNwb25zZVxuXG4gICAgaWYgJ21ldGEnIG9mIHJlc3BvbnNlXG4gICAgICAnVE9ETzogTm8gaWRlYSB5ZXQhJ1xuXG4gICAgaWYgJ2xpbmtzJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGVBbmRBdHRyaWJ1dGUsIGxpbmsgb2YgcmVzcG9uc2UubGlua3NcbiAgICAgICAgW3R5cGUsIGF0dHJpYnV0ZV0gPSB0eXBlQW5kQXR0cmlidXRlLnNwbGl0ICcuJ1xuICAgICAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJ1xuICAgICAgICAgIGhyZWYgPSBsaW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB7aHJlZiwgdHlwZTogYXR0cmlidXRlVHlwZX0gPSBsaW5rXG5cbiAgICAgICAgQGhhbmRsZUxpbmsgdHlwZSwgYXR0cmlidXRlLCBocmVmLCBhdHRyaWJ1dGVUeXBlXG5cbiAgICBpZiAnbGlua2VkJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZS5saW5rZWRcbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCByZXNvdXJjZXMgPyAxLCAnbGlua2VkJywgdHlwZSwgJ3Jlc291cmNlcy4nXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIGlmICdkYXRhJyBvZiByZXNwb25zZVxuICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwgXCJkYXRhXCIgY29sbGVjdGlvbiBvZicsIHJlc3BvbnNlLmRhdGEubGVuZ3RoID8gMVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgQGNyZWF0ZVR5cGUgcmVzcG9uc2UudHlwZSB1bmxlc3MgQHR5cGVzW3Jlc291cmNlLnR5cGVdP1xuICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcbiAgICBlbHNlXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IFtdXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlIHdoZW4gdHlwZSBub3QgaW4gWydsaW5rcycsICdsaW5rZWQnLCAnbWV0YScsICdkYXRhJ11cbiAgICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwnLCB0eXBlLCAnY29sbGVjdGlvbiBvZicsIHJlc291cmNlcy5sZW5ndGggPyAxXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBwcmltYXJ5UmVzdWx0cy5wdXNoIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZSwgdHlwZVxuXG4gICAgcHJpbnQuaW5mbyAnUHJpbWFyeSByZXNvdXJjZXM6JywgcHJpbWFyeVJlc3VsdHNcbiAgICBQcm9taXNlLmFsbCBwcmltYXJ5UmVzdWx0c1xuXG4gIGhhbmRsZUxpbms6ICh0eXBlTmFtZSwgYXR0cmlidXRlTmFtZSwgaHJlZlRlbXBsYXRlLCBhdHRyaWJ1dGVUeXBlTmFtZSkgLT5cbiAgICB1bmxlc3MgQHR5cGVzW3R5cGVOYW1lXT9cbiAgICAgIEBjcmVhdGVUeXBlIHR5cGVOYW1lXG5cbiAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXSA/PSB7fVxuICAgIGlmIGhyZWZUZW1wbGF0ZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLmhyZWYgPSBocmVmVGVtcGxhdGVcbiAgICBpZiBhdHRyaWJ1dGVUeXBlTmFtZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLnR5cGUgPSBhdHRyaWJ1dGVOYW1lXG5cbiAgY3JlYXRlVHlwZTogKG5hbWUpIC0+XG4gICAgbmV3IFR5cGUgbmFtZTogbmFtZSwgYXBpQ2xpZW50OiB0aGlzXG5cbiAgcHJvY2Vzc0Vycm9yUmVzcG9uc2VUbzogKHJlcXVlc3QpIC0+XG4gICAgUHJvbWlzZS5yZWplY3QgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuXG5tb2R1bGUuZXhwb3J0cy51dGlsID0ge21ha2VIVFRQUmVxdWVzdH1cbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcblxuIyBNYWtlIGEgcmF3LCBub24tQVBJIHNwZWNpZmljIEhUVFAgcmVxdWVzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMsIG1vZGlmeSkgLT5cbiAgcHJpbnQuaW5mbyAnUmVxdWVzdGluZycsIG1ldGhvZCwgdXJsLCBkYXRhXG4gIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICAgIHJlcXVlc3Qub3BlbiBtZXRob2QsIGVuY29kZVVSSSB1cmxcblxuICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuXG4gICAgaWYgaGVhZGVycz9cbiAgICAgIGZvciBoZWFkZXIsIHZhbHVlIG9mIGhlYWRlcnNcbiAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyIGhlYWRlciwgdmFsdWVcblxuICAgIGlmIG1vZGlmeT9cbiAgICAgIG1vZGlmaWNhdGlvbnMgPSBtb2RpZnkgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoZSkgLT5cbiAgICAgIHByaW50LmxvZyAnUmVhZHkgc3RhdGU6JywgKGtleSBmb3Iga2V5LCB2YWx1ZSBvZiByZXF1ZXN0IHdoZW4gdmFsdWUgaXMgcmVxdWVzdC5yZWFkeVN0YXRlIGFuZCBrZXkgaXNudCAncmVhZHlTdGF0ZScpWzBdXG4gICAgICBpZiByZXF1ZXN0LnJlYWR5U3RhdGUgaXMgcmVxdWVzdC5ET05FXG4gICAgICAgIHByaW50LmxvZyAnRG9uZTsgc3RhdHVzIGlzJywgcmVxdWVzdC5zdGF0dXNcbiAgICAgICAgaWYgMjAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgMzAwXG4gICAgICAgICAgcmVzb2x2ZSByZXF1ZXN0XG4gICAgICAgIGVsc2UgIyBpZiA0MDAgPD0gcmVxdWVzdC5zdGF0dXMgPCA2MDBcbiAgICAgICAgICByZWplY3QgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5zZW5kIEpTT04uc3RyaW5naWZ5IGRhdGFcbiIsIiMgVGhpcyBpcyBhIHByZXR0eSBzdGFuZGFyZCBtZXJnZSBmdW5jdGlvbi5cbiMgTWVyZ2UgcHJvcGVydGllcyBvZiBhbGwgYXJndWVtZW50cyBpbnRvIHRoZSBmaXJzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBmb3IgYXJndW1lbnQgaW4gQXJyYXk6OnNsaWNlLmNhbGwgYXJndW1lbnRzLCAxIHdoZW4gYXJndW1lbnQ/XG4gICAgZm9yIGtleSwgdmFsdWUgb2YgYXJndW1lbnRcbiAgICAgIGFyZ3VtZW50c1swXVtrZXldID0gdmFsdWVcbiAgYXJndW1lbnRzWzBdXG4iLCJMT0dfTEVWRUwgPSBwYXJzZUZsb2F0IGxvY2F0aW9uLnNlYXJjaC5tYXRjaCgvanNvbi1hcGktbG9nPShcXGQrKS8pP1sxXSA/IDBcblxucHJpbnQgPSAobGV2ZWwsIGNvbG9yLCBtZXNzYWdlcy4uLikgLT5cbiAgaWYgTE9HX0xFVkVMID49IGxldmVsXG4gICAgY29uc29sZS5sb2cgJyVje2pzb246YXBpfScsIFwiY29sb3I6ICN7Y29sb3J9OyBmb250OiBib2xkIDFlbSBtb25vc3BhY2U7XCIsIG1lc3NhZ2VzLi4uXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgbG9nOiBwcmludC5iaW5kIG51bGwsIDQsICdncmF5J1xuICBpbmZvOiBwcmludC5iaW5kIG51bGwsIDMsICdibHVlJ1xuICB3YXJuOiBwcmludC5iaW5kIG51bGwsIDIsICdvcmFuZ2UnXG4gIGVycm9yOiBwcmludC5iaW5kIG51bGwsIDEsICdyZWQnXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlIGV4dGVuZHMgRW1pdHRlclxuICBpZDogJydcbiAgaHJlZjogJydcbiAgdHlwZTogJydcblxuICBfdHlwZTogbnVsbFxuICBfY2hhbmdlZEtleXM6IG51bGxcblxuICBjcmVhdGVkX2F0OiAnJ1xuICB1cGRhdGVkX2F0OiAnJ1xuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlnLi4uKSAtPlxuICAgIEBfY2hhbmdlZEtleXMgPSBbXVxuICAgIHN1cGVyXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZy4uLiBpZiBjb25maWc/XG4gICAgcHJpbnQuaW5mbyBcIkNyZWF0ZWQgcmVzb3VyY2U6ICN7QF90eXBlLm5hbWV9ICN7QGlkfVwiLCB0aGlzXG4gICAgQGVtaXQgJ2NyZWF0ZSdcblxuICAjIEdldCBhIHByb21pc2UgZm9yIGFuIGF0dHJpYnV0ZSByZWZlcnJpbmcgdG8gKGFuKW90aGVyIHJlc291cmNlKHMpLlxuICBhdHRyOiAoYXR0cmlidXRlKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcgbGluazonLCBhdHRyaWJ1dGVcbiAgICBpZiBhdHRyaWJ1dGUgb2YgdGhpc1xuICAgICAgcHJpbnQud2FybiBcIk5vIG5lZWQgdG8gYWNjZXNzIGEgbm9uLWxpbmtlZCBhdHRyaWJ1dGUgdmlhIGF0dHI6ICN7YXR0cmlidXRlfVwiLCB0aGlzXG4gICAgICBQcm9taXNlLnJlc29sdmUgQFthdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBAbGlua3M/IGFuZCBhdHRyaWJ1dGUgb2YgQGxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgcmVzb3VyY2UnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAbGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgYXR0cmlidXRlIG9mIEBfdHlwZS5saW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHR5cGUnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAX3R5cGUubGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2VcbiAgICAgIHByaW50LmVycm9yICdOb3QgYSBsaW5rIGF0IGFsbCdcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciBcIk5vIGF0dHJpYnV0ZSAje2F0dHJpYnV0ZX0gb2YgI3tAX3R5cGUubmFtZX0gcmVzb3VyY2VcIlxuXG4gIF9nZXRMaW5rOiAobmFtZSwgbGluaykgLT5cbiAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGxpbmtcbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IElEKHMpJ1xuICAgICAgaWRzID0gbGlua1xuICAgICAge2hyZWYsIHR5cGV9ID0gQF90eXBlLmxpbmtzW25hbWVdXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgaHJlZiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlIGlmIGxpbms/XG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBjb2xsZWN0aW9uIG9iamVjdCcsIGxpbmtcbiAgICAgICMgSXQncyBhIGNvbGxlY3Rpb24gb2JqZWN0LlxuICAgICAge2hyZWYsIGlkcywgdHlwZX0gPSBsaW5rXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgcHJpbnQud2FybiAnSFJFRicsIGhyZWZcbiAgICAgICAgaHJlZiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT8gYW5kIGlkcz9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCwgYnV0IGJsYW5rJ1xuICAgICAgIyBJdCBleGlzdHMsIGJ1dCBpdCdzIGJsYW5rLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlIG51bGxcblxuICAjIFR1cm4gYSBKU09OLUFQSSBcImhyZWZcIiB0ZW1wbGF0ZSBpbnRvIGEgdXNhYmxlIFVSTC5cbiAgUExBQ0VIT0xERVJTX1BBVFRFUk46IC97KC4rPyl9L2dcbiAgYXBwbHlIUkVGOiAoaHJlZiwgY29udGV4dCkgLT5cbiAgICBocmVmLnJlcGxhY2UgQFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcbiAgICAgIHByaW50Lndhcm4gJ1NlZ21lbnRzJywgc2VnbWVudHNcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIHByaW50Lndhcm4gJ1ZhbHVlJywgdmFsdWVcblxuICAgICAgaWYgQXJyYXkuaXNBcnJheSB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4gJywnXG5cbiAgICAgIHVubGVzcyB0eXBlb2YgdmFsdWUgaXMgJ3N0cmluZydcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVmFsdWUgZm9yICcje3BhdGh9JyBpbiAnI3tocmVmfScgc2hvdWxkIGJlIGEgc3RyaW5nLlwiXG5cbiAgICAgIHZhbHVlXG5cbiAgdXBkYXRlOiAoY2hhbmdlU2V0ID0ge30pIC0+XG4gICAgQGVtaXQgJ3dpbGwtY2hhbmdlJ1xuICAgIGFjdHVhbENoYW5nZXMgPSAwXG5cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBjaGFuZ2VTZXQgd2hlbiBAW2tleV0gaXNudCB2YWx1ZVxuICAgICAgQFtrZXldID0gdmFsdWVcbiAgICAgIHVubGVzcyBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgICBAX2NoYW5nZWRLZXlzLnB1c2gga2V5XG4gICAgICBhY3R1YWxDaGFuZ2VzICs9IDFcblxuICAgIHVubGVzcyBhY3R1YWxDaGFuZ2VzIGlzIDBcbiAgICAgIEBlbWl0ICdjaGFuZ2UnXG5cbiAgc2F2ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1zYXZlJ1xuXG4gICAgcGF5bG9hZCA9IHt9XG4gICAgcGF5bG9hZFtAX3R5cGUubmFtZV0gPSBAZ2V0Q2hhbmdlc1NpbmNlU2F2ZSgpXG5cbiAgICBzYXZlID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnB1dCBAZ2V0VVJMKCksIHBheWxvYWRcbiAgICBlbHNlXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnBvc3QgQF90eXBlLmdldFVSTCgpLCBwYXlsb2FkXG5cbiAgICBzYXZlLnRoZW4gKHJlc3VsdHMpID0+XG4gICAgICBAdXBkYXRlIHJlc3VsdHNcbiAgICAgIEBfY2hhbmdlZEtleXMuc3BsaWNlIDBcbiAgICAgIEBlbWl0ICdzYXZlJ1xuICAgICAgcmVzdWx0c1xuXG4gIGdldENoYW5nZXNTaW5jZVNhdmU6IC0+XG4gICAgY2hhbmdlcyA9IHt9XG4gICAgZm9yIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICBjaGFuZ2VzW2tleV0gPSBAW2tleV1cbiAgICBjaGFuZ2VzXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBlbWl0ICd3aWxsLWRlbGV0ZSdcbiAgICBkZWxldGlvbiA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5kZWxldGUgQGdldFVSTCgpXG4gICAgZWxzZVxuICAgICAgIyBAX3R5cGUucmVtb3ZlUmVzb3VyY2UgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGRlbGV0aW9uLnRoZW4gPT5cbiAgICAgIEBlbWl0ICdkZWxldGUnXG5cbiAgbWF0Y2hlc1F1ZXJ5OiAocXVlcnkpIC0+XG4gICAgbWF0Y2hlcyA9IHRydWVcbiAgICBmb3IgcGFyYW0sIHZhbHVlIG9mIHF1ZXJ5XG4gICAgICBpZiBAW3BhcmFtXSBpc250IHZhbHVlXG4gICAgICAgIG1hdGNoZXMgPSBmYWxzZVxuICAgICAgICBicmVha1xuICAgIG1hdGNoZXNcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkKSAtPlxuICAgIHN1cGVyXG4gICAgQF90eXBlLl9oYW5kbGVSZXNvdXJjZUVtaXNzaW9uIHRoaXMsIGFyZ3VtZW50cy4uLlxuXG4gIGdldFVSTDogLT5cbiAgICBAaHJlZiB8fCBbQF90eXBlLmdldFVSTCgpLCBAaWRdLmpvaW4gJy8nXG5cbiAgdG9KU09OOiAtPlxuICAgIHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W0BfdHlwZS5uYW1lXSA9IHt9XG4gICAgZm9yIG93biBrZXksIHZhbHVlIG9mIHRoaXMgd2hlbiBrZXkuY2hhckF0KDApIGlzbnQgJ18nXG4gICAgICByZXN1bHRbQF90eXBlLm5hbWVdW2tleV0gPSB2YWx1ZVxuICAgIHJlc3VsdFxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxuZGVmZXIgPSAtPlxuICBkZWZlcnJhbCA9IHt9XG4gIGRlZmVycmFsLnByb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIGRlZmVycmFsLnJlc29sdmUgPSByZXNvbHZlXG4gICAgZGVmZXJyYWwucmVqZWN0ID0gcmVqZWN0XG4gIGRlZmVycmFsXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHlwZSBleHRlbmRzIEVtaXR0ZXJcbiAgbmFtZTogJydcbiAgYXBpQ2xpZW50OiBudWxsXG5cbiAgbGlua3M6IG51bGxcblxuICBkZWZlcnJhbHM6IG51bGxcbiAgcmVzb3VyY2VQcm9taXNlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlncy4uLikgLT5cbiAgICBzdXBlclxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWdzLi4uIGlmIGNvbmZpZ3M/XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5pbmcgYSBuZXcgcmVzb3VyY2UgdHlwZTonLCBAbmFtZVxuICAgIEBsaW5rcyA/PSB7fVxuICAgIEBkZWZlcnJhbHMgPz0ge31cbiAgICBAcmVzb3VyY2VQcm9taXNlcyA/PSB7fVxuICAgIEBhcGlDbGllbnQudHlwZXNbQG5hbWVdID0gdGhpc1xuXG4gIGdldFVSTDogLT5cbiAgICAnLycgKyBAbmFtZVxuXG4gIHF1ZXJ5TG9jYWw6IChxdWVyeSkgLT5cbiAgICBQcm9taXNlLmFsbChyZXNvdXJjZVByb21pc2UgZm9yIGlkLCByZXNvdXJjZVByb21pc2Ugb2YgQHJlc291cmNlUHJvbWlzZXMpLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgIHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZT8ubWF0Y2hlc1F1ZXJ5IHF1ZXJ5XG5cbiAgd2FpdGluZ0ZvcjogKGlkKSAtPlxuICAgIEBkZWZlcnJhbHNbaWRdP1xuXG4gIGhhczogKGlkKSAtPlxuICAgIEByZXNvdXJjZVByb21pc2VzW2lkXT8gYW5kIG5vdCBAZGVmZXJyYWxzW2lkXT9cblxuICBnZXQ6IC0+XG4gICAgaWYgdHlwZW9mIGFyZ3VtZW50c1swXSBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGFyZ3VtZW50c1swXVxuICAgICAgQGdldEJ5SURzIGFyZ3VtZW50cy4uLlxuICAgIGVsc2VcbiAgICAgIEBnZXRCeVF1ZXJ5IGFyZ3VtZW50cy4uLlxuXG4gICMgR2l2ZW4gYSBzdHJpbmcsIHJldHVybiBhIHByb21pc2UgZm9yIHRoYXQgcmVzb3VyY2UuXG4gICMgR2l2ZW4gYW4gYXJyYXksIHJldHVybiBhbiBhcnJheSBvZiBwcm9taXNlcyBmb3IgdGhvc2UgcmVzb3VyY2VzLlxuICBnZXRCeUlEczogKGlkcywgb3B0aW9ucykgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nJywgQG5hbWUsICdieSBJRChzKScsIGlkc1xuICAgIGlmIHR5cGVvZiBpZHMgaXMgJ3N0cmluZydcbiAgICAgIGdpdmVuU3RyaW5nID0gdHJ1ZVxuICAgICAgaWRzID0gW2lkc11cblxuICAgICMgT25seSByZXF1ZXN0IHRoaW5ncyB3ZSBkb24ndCBoYXZlIG9yIGRvbid0IGFscmVhZHkgaGF2ZSBhIHJlcXVlc3Qgb3V0IGZvci5cbiAgICBpbmNvbWluZyA9IChpZCBmb3IgaWQgaW4gaWRzIHdoZW4gbm90IEBoYXMoaWQpIGFuZCBub3QgQHdhaXRpbmdGb3IoaWQpKVxuICAgIHByaW50LmxvZyAnSW5jb21pbmc6ICcsIGluY29taW5nXG5cbiAgICB1bmxlc3MgaW5jb21pbmcubGVuZ3RoIGlzIDBcbiAgICAgIGZvciBpZCBpbiBpbmNvbWluZ1xuICAgICAgICBAZGVmZXJyYWxzW2lkXSA9IGRlZmVyKClcbiAgICAgICAgQHJlc291cmNlUHJvbWlzZXNbaWRdID0gQGRlZmVycmFsc1tpZF0ucHJvbWlzZVxuXG4gICAgICB1cmwgPSBbQGdldFVSTCgpLCBpbmNvbWluZy5qb2luICcsJ10uam9pbiAnLydcbiAgICAgIHByaW50LmxvZyAnUmVxdWVzdCBmb3InLCBAbmFtZSwgJ2F0JywgdXJsXG4gICAgICBAYXBpQ2xpZW50LmdldCh1cmwsIG9wdGlvbnMpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCBAbmFtZSwgcmVzb3VyY2VzXG5cbiAgICBpZiBnaXZlblN0cmluZ1xuICAgICAgQHJlc291cmNlUHJvbWlzZXNbaWRzWzBdXVxuICAgIGVsc2VcbiAgICAgIFByb21pc2UuYWxsIChAcmVzb3VyY2VQcm9taXNlc1tpZF0gZm9yIGlkIGluIGlkcylcblxuICBnZXRCeVF1ZXJ5OiAocXVlcnksIGxpbWl0ID0gSW5maW5pdHkpIC0+XG4gICAgQHF1ZXJ5TG9jYWwocXVlcnkpLnRoZW4gKGV4aXN0aW5nKSA9PlxuICAgICAgaWYgZXhpc3RpbmcubGVuZ3RoID49IGxpbWl0XG4gICAgICAgIGV4aXN0aW5nXG4gICAgICBlbHNlXG4gICAgICAgIHBhcmFtcyA9IGxpbWl0OiBsaW1pdCAtIGV4aXN0aW5nLmxlbmd0aFxuICAgICAgICBAYXBpQ2xpZW50LmdldChAZ2V0VVJMKCksIG1lcmdlSW50byBwYXJhbXMsIHF1ZXJ5KS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgUHJvbWlzZS5hbGwgZXhpc3RpbmcuY29uY2F0IHJlc291cmNlc1xuXG4gIGNyZWF0ZVJlc291cmNlOiAoZGF0YSkgLT5cbiAgICBpZiBkYXRhLmlkXG4gICAgICBpZiBAd2FpdGluZ0ZvciBkYXRhLmlkXG4gICAgICAgIHByaW50LmxvZyAnUmVzb2x2aW5nIGFuZCByZW1vdmluZyBkZWZlcnJhbCBmb3InLCBAbmFtZSwgZGF0YS5pZFxuICAgICAgICBuZXdSZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpc1xuICAgICAgICBuZXdSZXNvdXJjZS51cGRhdGUgZGF0YVxuICAgICAgICBAZGVmZXJyYWxzW2RhdGEuaWRdLnJlc29sdmUgbmV3UmVzb3VyY2VcbiAgICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXSA9IG51bGxcbiAgICAgIGVsc2UgaWYgQGhhcyBkYXRhLmlkXG4gICAgICAgIHByaW50LmxvZyAnVGhlJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWQsICdleGlzdHM7IHdpbGwgdXBkYXRlJ1xuICAgICAgICBAZ2V0KGRhdGEuaWQpLnRoZW4gKHJlc291cmNlKSAtPlxuICAgICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG4gICAgICBlbHNlXG4gICAgICAgIHByaW50LmxvZyAnQ3JlYXRpbmcgbmV3JywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF0gPSBQcm9taXNlLnJlc29sdmUgbmV3IFJlc291cmNlIGRhdGEsIF90eXBlOiB0aGlzXG5cbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdXG5cbiAgICBlbHNlXG4gICAgICByZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpc1xuICAgICAgcmVzb3VyY2UudXBkYXRlIGRhdGFcbiAgICAgIHJlc291cmNlXG5cbiAgX2hhbmRsZVJlc291cmNlRW1pc3Npb246IChyZXNvdXJjZSwgc2lnbmFsLCBwYXlsb2FkKSAtPlxuICAgIEBlbWl0ICdjaGFuZ2UnXG4iXX0=

