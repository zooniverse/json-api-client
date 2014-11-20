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

  JSONAPIClient.prototype.root = '/';

  JSONAPIClient.prototype.headers = null;

  JSONAPIClient.prototype.types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers != null ? headers : {};
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
        this.createType(type);
        _ref4 = [].concat(resources);
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          resource = _ref4[_j];
          this.types[type].addExistingResource(resource);
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
          this.createType(response.type);
          _results.push(this.types[response.type].addExistingResource(resource));
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
        this.createType(type);
        _ref7 = [].concat(resources);
        for (_k = 0, _len2 = _ref7.length; _k < _len2; _k++) {
          resource = _ref7[_k];
          primaryResults.push(this.types[type].addExistingResource(resource));
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
    var _base;
    if ((_base = this.types)[name] == null) {
      _base[name] = new Type(name, this);
    }
    return this.types[name];
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

  Resource.prototype._type = null;

  Resource.prototype._readOnlyKeys = ['id', 'type', 'href', 'created_at', 'updated_at'];

  Resource.prototype._changedKeys = null;

  function Resource() {
    var config;
    config = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Resource.__super__.constructor.apply(this, arguments);
    this._changedKeys = [];
    if (config != null) {
      mergeInto.apply(null, [this].concat(__slice.call(config)));
    }
    this.emit('create');
    print.info("Constructed a resource: " + this._type.name + " " + this.id, this);
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
      return function(_arg) {
        var result;
        result = _arg[0];
        _this.update(result);
        _this._changedKeys.splice(0);
        _this.emit('save');
        return result;
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
      if (key.charAt(0) !== '_' && __indexOf.call(this._readOnlyKeys, key) < 0) {
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
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

  function Type(name, apiClient) {
    this.name = name;
    this.apiClient = apiClient;
    Type.__super__.constructor.apply(this, arguments);
    this.links = {};
    this.deferrals = {};
    this.resourcePromises = {};
    print.info('Defined a new type:', this.name);
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

  Type.prototype.addExistingResource = function(data) {
    var deferral, newResource;
    if (this.waitingFor(data.id)) {
      print.log('Done waiting for', this.name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      deferral = this.deferrals[data.id];
      this.deferrals[data.id] = null;
      deferral.resolve(newResource);
    } else if (this.has(data.id)) {
      print.log('The', this.name, 'resource', data.id, 'already exists; will update');
      this.get(data.id).then(function(resource) {
        return resource.update(data);
      });
    } else {
      print.log('Accepting', this.name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      this.resourcePromises[data.id] = Promise.resolve(newResource);
    }
    return this.resourcePromises[data.id];
  };

  Type.prototype.createResource = function(data) {
    var resource;
    print.log('Creating a new', this.name, 'resource');
    resource = new Resource({
      _type: this
    });
    resource.update(data);
    return resource;
  };

  Type.prototype._handleResourceEmission = function(resource, signal, payload) {
    return this.emit('change');
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxjQUFBO0VBQUEsa0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxDQUFB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QUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdID89IFtdXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5wdXNoIGNhbGxiYWNrXG5cbiAgc3RvcExpc3RlbmluZzogKHNpZ25hbCwgY2FsbGJhY2spIC0+XG4gICAgaWYgc2lnbmFsP1xuICAgICAgaWYgQF9jYWxsYmFja3Nbc2lnbmFsXT9cbiAgICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgICAgaWYgQXJyYXkuaXNBcnJheSBjYWxsYmFja1xuICAgICAgICAgICAgIyBBcnJheS1zdHlsZSBjYWxsYmFja3MgbmVlZCBub3QgYmUgdGhlIGV4YWN0IHNhbWUgb2JqZWN0LlxuICAgICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgICAgZm9yIGhhbmRsZXIsIGkgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXSBieSAtMSB3aGVuIEFycmF5LmlzQXJyYXkoaGFuZGxlcikgYW5kIGNhbGxiYWNrLmxlbmd0aCBpcyBoYW5kbGVyLmxlbmd0aFxuICAgICAgICAgICAgICBpZiAobnVsbCBmb3IgaXRlbSwgaiBpbiBjYWxsYmFjayB3aGVuIGhhbmRsZXJbal0gaXMgaXRlbSkubGVuZ3RoIGlzIGNhbGxiYWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgICAgdW5sZXNzIGluZGV4IGlzIC0xXG4gICAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSBpbmRleCwgMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgMFxuICAgIGVsc2VcbiAgICAgIEBzdG9wTGlzdGVuaW5nIHNpZ25hbCBmb3Igc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBwcmludC5sb2cgJ0VtaXR0aW5nJywgc2lnbmFsLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSwgQF9jYWxsYmFja3Nbc2lnbmFsXT8ubGVuZ3RoXG4gICAgaWYgc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBAX2NhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG5cbiAgX2NhbGxIYW5kbGVyOiAoaGFuZGxlciwgYXJncykgLT5cbiAgICBpZiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgIFtjb250ZXh0LCBoYW5kbGVyLCBib3VuZEFyZ3MuLi5dID0gaGFuZGxlclxuICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgaGFuZGxlciA9IGNvbnRleHRbaGFuZGxlcl1cbiAgICBlbHNlXG4gICAgICBib3VuZEFyZ3MgPSBbXVxuICAgIGhhbmRsZXIuYXBwbHkgY29udGV4dCwgYm91bmRBcmdzLmNvbmNhdCBhcmdzXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5tYWtlSFRUUFJlcXVlc3QgPSByZXF1aXJlICcuL21ha2UtaHR0cC1yZXF1ZXN0J1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuVHlwZSA9IHJlcXVpcmUgJy4vdHlwZSdcblxuREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQgPVxuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5hcGkranNvbidcbiAgJ0FjY2VwdCc6IFwiYXBwbGljYXRpb24vdm5kLmFwaStqc29uXCJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKU09OQVBJQ2xpZW50XG4gIHJvb3Q6ICcvJ1xuICBoZWFkZXJzOiBudWxsXG5cbiAgdHlwZXM6IG51bGwgIyBUeXBlcyB0aGF0IGhhdmUgYmVlbiBkZWZpbmVkXG5cbiAgY29uc3RydWN0b3I6IChAcm9vdCwgQGhlYWRlcnMgPSB7fSkgLT5cbiAgICBAdHlwZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0NyZWF0ZWQgYSBuZXcgSlNPTi1BUEkgY2xpZW50IGF0JywgQHJvb3RcblxuICByZXF1ZXN0OiAobWV0aG9kLCB1cmwsIGRhdGEsIGFkZGl0aW9uYWxIZWFkZXJzKSAtPlxuICAgIHByaW50LmluZm8gJ01ha2luZyBhJywgbWV0aG9kLCAncmVxdWVzdCB0bycsIHVybFxuICAgIGhlYWRlcnMgPSBtZXJnZUludG8ge30sIERFRkFVTFRfVFlQRV9BTkRfQUNDRVBULCBAaGVhZGVycywgYWRkaXRpb25hbEhlYWRlcnNcbiAgICBtYWtlSFRUUFJlcXVlc3QgbWV0aG9kLCBAcm9vdCArIHVybCwgZGF0YSwgaGVhZGVyc1xuICAgICAgLnRoZW4gQHByb2Nlc3NSZXNwb25zZVRvLmJpbmQgdGhpc1xuICAgICAgLmNhdGNoIEBwcm9jZXNzRXJyb3JSZXNwb25zZVRvLmJpbmQgdGhpc1xuXG4gIGZvciBtZXRob2QgaW4gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJ10gdGhlbiBkbyAobWV0aG9kKSA9PlxuICAgIEA6OlttZXRob2RdID0gLT5cbiAgICAgIEByZXF1ZXN0IG1ldGhvZC50b1VwcGVyQ2FzZSgpLCBhcmd1bWVudHMuLi5cblxuICBwcm9jZXNzUmVzcG9uc2VUbzogKHJlcXVlc3QpIC0+XG4gICAgcmVzcG9uc2UgPSB0cnkgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIHJlc3BvbnNlID89IHt9XG4gICAgcHJpbnQubG9nICdQcm9jZXNzaW5nIHJlc3BvbnNlJywgcmVzcG9uc2VcblxuICAgIGlmICdtZXRhJyBvZiByZXNwb25zZVxuICAgICAgJ1RPRE86IE5vIGlkZWEgeWV0ISdcblxuICAgIGlmICdsaW5rcycgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlQW5kQXR0cmlidXRlLCBsaW5rIG9mIHJlc3BvbnNlLmxpbmtzXG4gICAgICAgIFt0eXBlLCBhdHRyaWJ1dGVdID0gdHlwZUFuZEF0dHJpYnV0ZS5zcGxpdCAnLidcbiAgICAgICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZydcbiAgICAgICAgICBocmVmID0gbGlua1xuICAgICAgICBlbHNlXG4gICAgICAgICAge2hyZWYsIHR5cGU6IGF0dHJpYnV0ZVR5cGV9ID0gbGlua1xuXG4gICAgICAgIEBoYW5kbGVMaW5rIHR5cGUsIGF0dHJpYnV0ZSwgaHJlZiwgYXR0cmlidXRlVHlwZVxuXG4gICAgaWYgJ2xpbmtlZCcgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2UubGlua2VkXG4gICAgICAgIHByaW50LmxvZyAnR290JywgcmVzb3VyY2VzID8gMSwgJ2xpbmtlZCcsIHR5cGUsICdyZXNvdXJjZXMuJ1xuICAgICAgICBAY3JlYXRlVHlwZSB0eXBlXG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgICAgQHR5cGVzW3R5cGVdLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIGlmICdkYXRhJyBvZiByZXNwb25zZVxuICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwgXCJkYXRhXCIgY29sbGVjdGlvbiBvZicsIHJlc3BvbnNlLmRhdGEubGVuZ3RoID8gMVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgQGNyZWF0ZVR5cGUgcmVzcG9uc2UudHlwZVxuICAgICAgICBAdHlwZXNbcmVzcG9uc2UudHlwZV0uYWRkRXhpc3RpbmdSZXNvdXJjZSByZXNvdXJjZVxuICAgIGVsc2VcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gW11cbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2Ugd2hlbiB0eXBlIG5vdCBpbiBbJ2xpbmtzJywgJ2xpbmtlZCcsICdtZXRhJywgJ2RhdGEnXVxuICAgICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCcsIHR5cGUsICdjb2xsZWN0aW9uIG9mJywgcmVzb3VyY2VzLmxlbmd0aCA/IDFcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZVxuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIHByaW1hcnlSZXN1bHRzLnB1c2ggQHR5cGVzW3R5cGVdLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIHByaW50LmluZm8gJ1ByaW1hcnkgcmVzb3VyY2VzOicsIHByaW1hcnlSZXN1bHRzXG4gICAgUHJvbWlzZS5hbGwgcHJpbWFyeVJlc3VsdHNcblxuICBoYW5kbGVMaW5rOiAodHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIGhyZWZUZW1wbGF0ZSwgYXR0cmlidXRlVHlwZU5hbWUpIC0+XG4gICAgdW5sZXNzIEB0eXBlc1t0eXBlTmFtZV0/XG4gICAgICBAY3JlYXRlVHlwZSB0eXBlTmFtZVxuXG4gICAgQHR5cGVzW3R5cGVOYW1lXS5saW5rc1thdHRyaWJ1dGVUeXBlTmFtZV0gPz0ge31cbiAgICBpZiBocmVmVGVtcGxhdGU/XG4gICAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXS5ocmVmID0gaHJlZlRlbXBsYXRlXG4gICAgaWYgYXR0cmlidXRlVHlwZU5hbWU/XG4gICAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXS50eXBlID0gYXR0cmlidXRlTmFtZVxuXG4gIGNyZWF0ZVR5cGU6IChuYW1lKSAtPlxuICAgIEB0eXBlc1tuYW1lXSA/PSBuZXcgVHlwZSBuYW1lLCB0aGlzXG4gICAgQHR5cGVzW25hbWVdXG5cbiAgcHJvY2Vzc0Vycm9yUmVzcG9uc2VUbzogKHJlcXVlc3QpIC0+XG4gICAgUHJvbWlzZS5yZWplY3QgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuXG5tb2R1bGUuZXhwb3J0cy51dGlsID0ge21ha2VIVFRQUmVxdWVzdH1cbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcblxuIyBNYWtlIGEgcmF3LCBub24tQVBJIHNwZWNpZmljIEhUVFAgcmVxdWVzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMsIG1vZGlmeSkgLT5cbiAgcHJpbnQuaW5mbyAnUmVxdWVzdGluZycsIG1ldGhvZCwgdXJsLCBkYXRhXG4gIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICAgIHJlcXVlc3Qub3BlbiBtZXRob2QsIGVuY29kZVVSSSB1cmxcblxuICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuXG4gICAgaWYgaGVhZGVycz9cbiAgICAgIGZvciBoZWFkZXIsIHZhbHVlIG9mIGhlYWRlcnNcbiAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyIGhlYWRlciwgdmFsdWVcblxuICAgIGlmIG1vZGlmeT9cbiAgICAgIG1vZGlmaWNhdGlvbnMgPSBtb2RpZnkgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoZSkgLT5cbiAgICAgIHByaW50LmxvZyAnUmVhZHkgc3RhdGU6JywgKGtleSBmb3Iga2V5LCB2YWx1ZSBvZiByZXF1ZXN0IHdoZW4gdmFsdWUgaXMgcmVxdWVzdC5yZWFkeVN0YXRlIGFuZCBrZXkgaXNudCAncmVhZHlTdGF0ZScpWzBdXG4gICAgICBpZiByZXF1ZXN0LnJlYWR5U3RhdGUgaXMgcmVxdWVzdC5ET05FXG4gICAgICAgIHByaW50LmxvZyAnRG9uZTsgc3RhdHVzIGlzJywgcmVxdWVzdC5zdGF0dXNcbiAgICAgICAgaWYgMjAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgMzAwXG4gICAgICAgICAgcmVzb2x2ZSByZXF1ZXN0XG4gICAgICAgIGVsc2UgIyBpZiA0MDAgPD0gcmVxdWVzdC5zdGF0dXMgPCA2MDBcbiAgICAgICAgICByZWplY3QgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5zZW5kIEpTT04uc3RyaW5naWZ5IGRhdGFcbiIsIiMgVGhpcyBpcyBhIHByZXR0eSBzdGFuZGFyZCBtZXJnZSBmdW5jdGlvbi5cbiMgTWVyZ2UgcHJvcGVydGllcyBvZiBhbGwgYXJndWVtZW50cyBpbnRvIHRoZSBmaXJzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBmb3IgYXJndW1lbnQgaW4gQXJyYXk6OnNsaWNlLmNhbGwgYXJndW1lbnRzLCAxIHdoZW4gYXJndW1lbnQ/XG4gICAgZm9yIGtleSwgdmFsdWUgb2YgYXJndW1lbnRcbiAgICAgIGFyZ3VtZW50c1swXVtrZXldID0gdmFsdWVcbiAgYXJndW1lbnRzWzBdXG4iLCJMT0dfTEVWRUwgPSBwYXJzZUZsb2F0IGxvY2F0aW9uLnNlYXJjaC5tYXRjaCgvanNvbi1hcGktbG9nPShcXGQrKS8pP1sxXSA/IDBcblxucHJpbnQgPSAobGV2ZWwsIGNvbG9yLCBtZXNzYWdlcy4uLikgLT5cbiAgaWYgTE9HX0xFVkVMID49IGxldmVsXG4gICAgY29uc29sZS5sb2cgJyVje2pzb246YXBpfScsIFwiY29sb3I6ICN7Y29sb3J9OyBmb250OiBib2xkIDFlbSBtb25vc3BhY2U7XCIsIG1lc3NhZ2VzLi4uXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgbG9nOiBwcmludC5iaW5kIG51bGwsIDQsICdncmF5J1xuICBpbmZvOiBwcmludC5iaW5kIG51bGwsIDMsICdibHVlJ1xuICB3YXJuOiBwcmludC5iaW5kIG51bGwsIDIsICdvcmFuZ2UnXG4gIGVycm9yOiBwcmludC5iaW5kIG51bGwsIDEsICdyZWQnXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlIGV4dGVuZHMgRW1pdHRlclxuICBfdHlwZTogbnVsbCAjIFRoZSByZXNvdXJjZSB0eXBlIG9iamVjdFxuXG4gIF9yZWFkT25seUtleXM6IFsnaWQnLCAndHlwZScsICdocmVmJywgJ2NyZWF0ZWRfYXQnLCAndXBkYXRlZF9hdCddXG5cbiAgX2NoYW5nZWRLZXlzOiBudWxsICMgRGlydHkga2V5c1xuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlnLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgQF9jaGFuZ2VkS2V5cyA9IFtdXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZy4uLiBpZiBjb25maWc/XG4gICAgQGVtaXQgJ2NyZWF0ZSdcbiAgICBwcmludC5pbmZvIFwiQ29uc3RydWN0ZWQgYSByZXNvdXJjZTogI3tAX3R5cGUubmFtZX0gI3tAaWR9XCIsIHRoaXNcblxuICAjIEdldCBhIHByb21pc2UgZm9yIGFuIGF0dHJpYnV0ZSByZWZlcnJpbmcgdG8gKGFuKW90aGVyIHJlc291cmNlKHMpLlxuICBhdHRyOiAoYXR0cmlidXRlKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcgbGluazonLCBhdHRyaWJ1dGVcbiAgICBpZiBhdHRyaWJ1dGUgb2YgdGhpc1xuICAgICAgcHJpbnQud2FybiBcIk5vIG5lZWQgdG8gYWNjZXNzIGEgbm9uLWxpbmtlZCBhdHRyaWJ1dGUgdmlhIGF0dHI6ICN7YXR0cmlidXRlfVwiLCB0aGlzXG4gICAgICBQcm9taXNlLnJlc29sdmUgQFthdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBAbGlua3M/IGFuZCBhdHRyaWJ1dGUgb2YgQGxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgcmVzb3VyY2UnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAbGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgYXR0cmlidXRlIG9mIEBfdHlwZS5saW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHR5cGUnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAX3R5cGUubGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2VcbiAgICAgIHByaW50LmVycm9yICdOb3QgYSBsaW5rIGF0IGFsbCdcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciBcIk5vIGF0dHJpYnV0ZSAje2F0dHJpYnV0ZX0gb2YgI3tAX3R5cGUubmFtZX0gcmVzb3VyY2VcIlxuXG4gIF9nZXRMaW5rOiAobmFtZSwgbGluaykgLT5cbiAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGxpbmtcbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IElEKHMpJ1xuICAgICAgaWRzID0gbGlua1xuICAgICAge2hyZWYsIHR5cGV9ID0gQF90eXBlLmxpbmtzW25hbWVdXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgaHJlZiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlIGlmIGxpbms/XG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBjb2xsZWN0aW9uIG9iamVjdCcsIGxpbmtcbiAgICAgICMgSXQncyBhIGNvbGxlY3Rpb24gb2JqZWN0LlxuICAgICAge2hyZWYsIGlkcywgdHlwZX0gPSBsaW5rXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgcHJpbnQud2FybiAnSFJFRicsIGhyZWZcbiAgICAgICAgaHJlZiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT8gYW5kIGlkcz9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCwgYnV0IGJsYW5rJ1xuICAgICAgIyBJdCBleGlzdHMsIGJ1dCBpdCdzIGJsYW5rLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlIG51bGxcblxuICAjIFR1cm4gYSBKU09OLUFQSSBcImhyZWZcIiB0ZW1wbGF0ZSBpbnRvIGEgdXNhYmxlIFVSTC5cbiAgUExBQ0VIT0xERVJTX1BBVFRFUk46IC97KC4rPyl9L2dcbiAgYXBwbHlIUkVGOiAoaHJlZiwgY29udGV4dCkgLT5cbiAgICBocmVmLnJlcGxhY2UgQFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcbiAgICAgIHByaW50Lndhcm4gJ1NlZ21lbnRzJywgc2VnbWVudHNcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIHByaW50Lndhcm4gJ1ZhbHVlJywgdmFsdWVcblxuICAgICAgaWYgQXJyYXkuaXNBcnJheSB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4gJywnXG5cbiAgICAgIHVubGVzcyB0eXBlb2YgdmFsdWUgaXMgJ3N0cmluZydcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVmFsdWUgZm9yICcje3BhdGh9JyBpbiAnI3tocmVmfScgc2hvdWxkIGJlIGEgc3RyaW5nLlwiXG5cbiAgICAgIHZhbHVlXG5cbiAgdXBkYXRlOiAoY2hhbmdlU2V0ID0ge30pIC0+XG4gICAgQGVtaXQgJ3dpbGwtY2hhbmdlJ1xuICAgIGFjdHVhbENoYW5nZXMgPSAwXG5cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBjaGFuZ2VTZXQgd2hlbiBAW2tleV0gaXNudCB2YWx1ZVxuICAgICAgQFtrZXldID0gdmFsdWVcbiAgICAgIHVubGVzcyBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgICBAX2NoYW5nZWRLZXlzLnB1c2gga2V5XG4gICAgICBhY3R1YWxDaGFuZ2VzICs9IDFcblxuICAgIHVubGVzcyBhY3R1YWxDaGFuZ2VzIGlzIDBcbiAgICAgIEBlbWl0ICdjaGFuZ2UnXG5cbiAgc2F2ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1zYXZlJ1xuXG4gICAgcGF5bG9hZCA9IHt9XG4gICAgcGF5bG9hZFtAX3R5cGUubmFtZV0gPSBAZ2V0Q2hhbmdlc1NpbmNlU2F2ZSgpXG5cbiAgICBzYXZlID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnB1dCBAZ2V0VVJMKCksIHBheWxvYWRcbiAgICBlbHNlXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnBvc3QgQF90eXBlLmdldFVSTCgpLCBwYXlsb2FkXG5cbiAgICBzYXZlLnRoZW4gKFtyZXN1bHRdKSA9PlxuICAgICAgQHVwZGF0ZSByZXN1bHRcbiAgICAgIEBfY2hhbmdlZEtleXMuc3BsaWNlIDBcbiAgICAgIEBlbWl0ICdzYXZlJ1xuICAgICAgcmVzdWx0XG5cbiAgZ2V0Q2hhbmdlc1NpbmNlU2F2ZTogLT5cbiAgICBjaGFuZ2VzID0ge31cbiAgICBmb3Iga2V5IGluIEBfY2hhbmdlZEtleXNcbiAgICAgIGNoYW5nZXNba2V5XSA9IEBba2V5XVxuICAgIGNoYW5nZXNcblxuICBkZWxldGU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtZGVsZXRlJ1xuICAgIGRlbGV0aW9uID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LmRlbGV0ZSBAZ2V0VVJMKClcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZGVsZXRpb24udGhlbiA9PlxuICAgICAgQGVtaXQgJ2RlbGV0ZSdcblxuICBtYXRjaGVzUXVlcnk6IChxdWVyeSkgLT5cbiAgICBtYXRjaGVzID0gdHJ1ZVxuICAgIGZvciBwYXJhbSwgdmFsdWUgb2YgcXVlcnlcbiAgICAgIGlmIEBbcGFyYW1dIGlzbnQgdmFsdWVcbiAgICAgICAgbWF0Y2hlcyA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG4gICAgbWF0Y2hlc1xuXG4gIGVtaXQ6IChzaWduYWwsIHBheWxvYWQpIC0+XG4gICAgc3VwZXJcbiAgICBAX3R5cGUuX2hhbmRsZVJlc291cmNlRW1pc3Npb24gdGhpcywgYXJndW1lbnRzLi4uXG5cbiAgZ2V0VVJMOiAtPlxuICAgIEBocmVmIHx8IFtAX3R5cGUuZ2V0VVJMKCksIEBpZF0uam9pbiAnLydcblxuICB0b0pTT046IC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICByZXN1bHRbQF90eXBlLm5hbWVdID0ge31cbiAgICBmb3Igb3duIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3QgaW4gQF9yZWFkT25seUtleXNcbiAgICAgIHJlc3VsdFtAX3R5cGUubmFtZV1ba2V5XSA9IHZhbHVlXG4gICAgcmVzdWx0XG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5kZWZlciA9IC0+XG4gIGRlZmVycmFsID0ge31cbiAgZGVmZXJyYWwucHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgZGVmZXJyYWwucmVzb2x2ZSA9IHJlc29sdmVcbiAgICBkZWZlcnJhbC5yZWplY3QgPSByZWplY3RcbiAgZGVmZXJyYWxcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUeXBlIGV4dGVuZHMgRW1pdHRlclxuICBuYW1lOiAnJ1xuICBhcGlDbGllbnQ6IG51bGxcblxuICBsaW5rczogbnVsbCAjIFJlc291cmNlIGxpbmsgZGVmaW5pdGlvbnNcblxuICBkZWZlcnJhbHM6IG51bGwgIyBLZXlzIGFyZSBJRHMgb2Ygc3BlY2lmaWNhbGx5IHJlcXVlc3RlZCByZXNvdXJjZXMuXG4gIHJlc291cmNlUHJvbWlzZXM6IG51bGwgIyBLZXlzIGFyZSBJRHMsIHZhbHVlcyBhcmUgcHJvbWlzZXMgcmVzb2x2aW5nIHRvIHJlc291cmNlcy5cblxuICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAYXBpQ2xpZW50KSAtPlxuICAgIHN1cGVyXG4gICAgQGxpbmtzID0ge31cbiAgICBAZGVmZXJyYWxzID0ge31cbiAgICBAcmVzb3VyY2VQcm9taXNlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5lZCBhIG5ldyB0eXBlOicsIEBuYW1lXG5cbiAgZ2V0VVJMOiAtPlxuICAgICcvJyArIEBuYW1lXG5cbiAgcXVlcnlMb2NhbDogKHF1ZXJ5KSAtPlxuICAgIFByb21pc2UuYWxsKHJlc291cmNlUHJvbWlzZSBmb3IgaWQsIHJlc291cmNlUHJvbWlzZSBvZiBAcmVzb3VyY2VQcm9taXNlcykudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgcmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlPy5tYXRjaGVzUXVlcnkgcXVlcnlcblxuICB3YWl0aW5nRm9yOiAoaWQpIC0+XG4gICAgQGRlZmVycmFsc1tpZF0/XG5cbiAgaGFzOiAoaWQpIC0+XG4gICAgQHJlc291cmNlUHJvbWlzZXNbaWRdPyBhbmQgbm90IEBkZWZlcnJhbHNbaWRdP1xuXG4gIGdldDogLT5cbiAgICBpZiB0eXBlb2YgYXJndW1lbnRzWzBdIGlzICdzdHJpbmcnIG9yIEFycmF5LmlzQXJyYXkgYXJndW1lbnRzWzBdXG4gICAgICBAZ2V0QnlJRHMgYXJndW1lbnRzLi4uXG4gICAgZWxzZVxuICAgICAgQGdldEJ5UXVlcnkgYXJndW1lbnRzLi4uXG5cbiAgIyBHaXZlbiBhIHN0cmluZywgcmV0dXJuIGEgcHJvbWlzZSBmb3IgdGhhdCByZXNvdXJjZS5cbiAgIyBHaXZlbiBhbiBhcnJheSwgcmV0dXJuIGFuIGFycmF5IG9mIHByb21pc2VzIGZvciB0aG9zZSByZXNvdXJjZXMuXG4gIGdldEJ5SURzOiAoaWRzLCBvcHRpb25zKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcnLCBAbmFtZSwgJ2J5IElEKHMpJywgaWRzXG4gICAgaWYgdHlwZW9mIGlkcyBpcyAnc3RyaW5nJ1xuICAgICAgZ2l2ZW5TdHJpbmcgPSB0cnVlXG4gICAgICBpZHMgPSBbaWRzXVxuXG4gICAgIyBPbmx5IHJlcXVlc3QgdGhpbmdzIHdlIGRvbid0IGhhdmUgb3IgZG9uJ3QgYWxyZWFkeSBoYXZlIGEgcmVxdWVzdCBvdXQgZm9yLlxuICAgIGluY29taW5nID0gKGlkIGZvciBpZCBpbiBpZHMgd2hlbiBub3QgQGhhcyhpZCkgYW5kIG5vdCBAd2FpdGluZ0ZvcihpZCkpXG4gICAgcHJpbnQubG9nICdJbmNvbWluZzogJywgaW5jb21pbmdcblxuICAgIHVubGVzcyBpbmNvbWluZy5sZW5ndGggaXMgMFxuICAgICAgZm9yIGlkIGluIGluY29taW5nXG4gICAgICAgIEBkZWZlcnJhbHNbaWRdID0gZGVmZXIoKVxuICAgICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0gPSBAZGVmZXJyYWxzW2lkXS5wcm9taXNlXG5cbiAgICAgIHVybCA9IFtAZ2V0VVJMKCksIGluY29taW5nLmpvaW4gJywnXS5qb2luICcvJ1xuICAgICAgcHJpbnQubG9nICdSZXF1ZXN0IGZvcicsIEBuYW1lLCAnYXQnLCB1cmxcbiAgICAgIEBhcGlDbGllbnQuZ2V0KHVybCwgb3B0aW9ucykudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIEBuYW1lLCByZXNvdXJjZXNcblxuICAgIGlmIGdpdmVuU3RyaW5nXG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZHNbMF1dXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5hbGwgKEByZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSkgLT5cbiAgICBAcXVlcnlMb2NhbChxdWVyeSkudGhlbiAoZXhpc3RpbmcpID0+XG4gICAgICBpZiBleGlzdGluZy5sZW5ndGggPj0gbGltaXRcbiAgICAgICAgZXhpc3RpbmdcbiAgICAgIGVsc2VcbiAgICAgICAgcGFyYW1zID0gbGltaXQ6IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIEBhcGlDbGllbnQuZ2V0KEBnZXRVUkwoKSwgbWVyZ2VJbnRvIHBhcmFtcywgcXVlcnkpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBQcm9taXNlLmFsbCBleGlzdGluZy5jb25jYXQgcmVzb3VyY2VzXG5cbiAgYWRkRXhpc3RpbmdSZXNvdXJjZTogKGRhdGEpIC0+XG4gICAgaWYgQHdhaXRpbmdGb3IgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdEb25lIHdhaXRpbmcgZm9yJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIG5ld1Jlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzLCBkYXRhXG4gICAgICBkZWZlcnJhbCA9IEBkZWZlcnJhbHNbZGF0YS5pZF1cbiAgICAgIEBkZWZlcnJhbHNbZGF0YS5pZF0gPSBudWxsXG4gICAgICBkZWZlcnJhbC5yZXNvbHZlIG5ld1Jlc291cmNlXG5cbiAgICBlbHNlIGlmIEBoYXMgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdUaGUnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2FscmVhZHkgZXhpc3RzOyB3aWxsIHVwZGF0ZSdcbiAgICAgIEBnZXQoZGF0YS5pZCkudGhlbiAocmVzb3VyY2UpIC0+XG4gICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0FjY2VwdGluZycsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkXG4gICAgICBuZXdSZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpcywgZGF0YVxuICAgICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF0gPSBQcm9taXNlLnJlc29sdmUgbmV3UmVzb3VyY2VcblxuICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdXG5cbiAgY3JlYXRlUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIHByaW50LmxvZyAnQ3JlYXRpbmcgYSBuZXcnLCBAbmFtZSwgJ3Jlc291cmNlJ1xuICAgIHJlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzXG4gICAgcmVzb3VyY2UudXBkYXRlIGRhdGFcbiAgICByZXNvdXJjZVxuXG4gIF9oYW5kbGVSZXNvdXJjZUVtaXNzaW9uOiAocmVzb3VyY2UsIHNpZ25hbCwgcGF5bG9hZCkgLT5cbiAgICBAZW1pdCAnY2hhbmdlJ1xuIl19

