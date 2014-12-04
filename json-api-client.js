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
var DEFAULT_TYPE_AND_ACCEPT, JSONAPIClient, Resource, Type, makeHTTPRequest, mergeInto, print,
  __slice = [].slice;

print = _dereq_('./print');

makeHTTPRequest = _dereq_('./make-http-request');

mergeInto = _dereq_('./merge-into');

Type = _dereq_('./type');

Resource = _dereq_('./resource');

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

  JSONAPIClient.prototype.request = function(method, url, data, additionalHeaders, callback) {
    var headers;
    print.info('Making a', method, 'request to', url);
    headers = mergeInto({}, DEFAULT_TYPE_AND_ACCEPT, this.headers, additionalHeaders);
    return makeHTTPRequest(method, this.root + url, data, headers).then((function(_this) {
      return function(request) {
        return _this.processResponseTo(request, callback);
      };
    })(this))["catch"]((function(_this) {
      return function(request) {
        return _this.processErrorResponseTo(request);
      };
    })(this));
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

  JSONAPIClient.prototype.processResponseTo = function(request, callback) {
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
    if (typeof callback === "function") {
      callback(request, response);
    }
    return Promise.all(primaryResults);
  };

  JSONAPIClient.prototype.handleLink = function(typeName, attributeName, hrefTemplate, attributeTypeName) {
    var type, _base;
    type = this.createType(typeName);
    if ((_base = type.links)[attributeName] == null) {
      _base[attributeName] = {};
    }
    if (hrefTemplate != null) {
      type.links[attributeName].href = hrefTemplate;
    }
    if (attributeTypeName != null) {
      return type.links[attributeName].type = attributeTypeName;
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
    return Promise.reject((function() {
      try {
        return JSON.parse(request.responseText);
      } catch (_error) {
        return new Error(request.responseText || request.status);
      }
    })());
  };

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};

module.exports.Type = Type;

module.exports.Resource = Resource;



},{"./make-http-request":3,"./merge-into":4,"./print":5,"./resource":6,"./type":7}],3:[function(_dereq_,module,exports){
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
    if (data instanceof Blob) {
      return request.send(data);
    } else {
      return request.send(JSON.stringify(data));
    }
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
    this._type.emit('change');
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
    var appliedHREF, context, href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      print.log('Linked by ID(s)');
      ids = link;
      _ref = this._type.links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        context = {};
        context[this._type.name] = this;
        appliedHREF = this.applyHREF(href, context);
        return this._type.apiClient.get(appliedHREF).then((function(_this) {
          return function(resources) {
            var _ref1;
            if (typeof ((_ref1 = _this.links) != null ? _ref1[name] : void 0) === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
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
        appliedHREF = this.applyHREF(href, context);
        return this._type.apiClient.get(appliedHREF).then((function(_this) {
          return function(resources) {
            var _ref1;
            if (typeof ((_ref1 = _this.links) != null ? _ref1[name] : void 0) === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
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
      this.emit('change');
      return this._type.emit('change');
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
    deletion = this.id ? this._type.apiClient["delete"](this.getURL()).then((function(_this) {
      return function() {
        return _this._type.emit('change');
      };
    })(this)) : Promise.resolve();
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
    var existLocally, id, promise;
    existLocally = (function() {
      var _ref, _results;
      _ref = this.resourcePromises;
      _results = [];
      for (id in _ref) {
        promise = _ref[id];
        if (!this.waitingFor(id)) {
          _results.push(promise);
        }
      }
      return _results;
    }).call(this);
    return Promise.all(existLocally).then(function(resources) {
      var resource, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = resources.length; _i < _len; _i++) {
        resource = resources[_i];
        if (resource.matchesQuery(query)) {
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
    if (typeof arguments[0] === 'string') {
      return this.getByID.apply(this, arguments);
    } else if (Array.isArray(arguments[0])) {
      return this.getByIDs.apply(this, arguments);
    } else {
      return this.getByQuery.apply(this, arguments);
    }
  };

  Type.prototype.getByID = function() {
    var id, otherArgs;
    id = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return this.getByIDs.apply(this, [[id]].concat(__slice.call(otherArgs))).then(function(_arg) {
      var resource;
      resource = _arg[0];
      return resource;
    });
  };

  Type.prototype.getByIDs = function(ids, options, callback) {
    var id, incoming, url, _i, _len;
    print.info('Getting', this.name, 'by ID(s)', ids);
    incoming = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        if (!this.waitingFor(id)) {
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
      this.apiClient.get(url, options, null, callback);
    }
    return Promise.all((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
        id = ids[_j];
        _results.push(this.resourcePromises[id]);
      }
      return _results;
    }).call(this));
  };

  Type.prototype.getByQuery = function(query, limit, callback) {
    if (limit == null) {
      limit = Infinity;
    }
    return this.queryLocal(query).then((function(_this) {
      return function(existing) {
        var params;
        if (existing.length >= limit) {
          return existing;
        } else {
          params = {};
          if (isFinite(limit)) {
            params.limit = limit - existing.length;
          }
          mergeInto(params, query);
          return _this.apiClient.get(_this.getURL(), params).then(function(resources) {
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

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxjQUFBO0VBQUEsa0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxDQUFB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dXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdID89IFtdXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5wdXNoIGNhbGxiYWNrXG5cbiAgc3RvcExpc3RlbmluZzogKHNpZ25hbCwgY2FsbGJhY2spIC0+XG4gICAgaWYgc2lnbmFsP1xuICAgICAgaWYgQF9jYWxsYmFja3Nbc2lnbmFsXT9cbiAgICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgICAgaWYgQXJyYXkuaXNBcnJheSBjYWxsYmFja1xuICAgICAgICAgICAgIyBBcnJheS1zdHlsZSBjYWxsYmFja3MgbmVlZCBub3QgYmUgdGhlIGV4YWN0IHNhbWUgb2JqZWN0LlxuICAgICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgICAgZm9yIGhhbmRsZXIsIGkgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXSBieSAtMSB3aGVuIEFycmF5LmlzQXJyYXkoaGFuZGxlcikgYW5kIGNhbGxiYWNrLmxlbmd0aCBpcyBoYW5kbGVyLmxlbmd0aFxuICAgICAgICAgICAgICBpZiAobnVsbCBmb3IgaXRlbSwgaiBpbiBjYWxsYmFjayB3aGVuIGhhbmRsZXJbal0gaXMgaXRlbSkubGVuZ3RoIGlzIGNhbGxiYWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgICAgdW5sZXNzIGluZGV4IGlzIC0xXG4gICAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSBpbmRleCwgMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgMFxuICAgIGVsc2VcbiAgICAgIEBzdG9wTGlzdGVuaW5nIHNpZ25hbCBmb3Igc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBwcmludC5sb2cgJ0VtaXR0aW5nJywgc2lnbmFsLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSwgQF9jYWxsYmFja3Nbc2lnbmFsXT8ubGVuZ3RoXG4gICAgaWYgc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBAX2NhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG5cbiAgX2NhbGxIYW5kbGVyOiAoaGFuZGxlciwgYXJncykgLT5cbiAgICBpZiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgIFtjb250ZXh0LCBoYW5kbGVyLCBib3VuZEFyZ3MuLi5dID0gaGFuZGxlclxuICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgaGFuZGxlciA9IGNvbnRleHRbaGFuZGxlcl1cbiAgICBlbHNlXG4gICAgICBib3VuZEFyZ3MgPSBbXVxuICAgIGhhbmRsZXIuYXBwbHkgY29udGV4dCwgYm91bmRBcmdzLmNvbmNhdCBhcmdzXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5tYWtlSFRUUFJlcXVlc3QgPSByZXF1aXJlICcuL21ha2UtaHR0cC1yZXF1ZXN0J1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuVHlwZSA9IHJlcXVpcmUgJy4vdHlwZSdcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxuREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQgPVxuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5hcGkranNvbidcbiAgJ0FjY2VwdCc6IFwiYXBwbGljYXRpb24vdm5kLmFwaStqc29uXCJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKU09OQVBJQ2xpZW50XG4gIHJvb3Q6ICcvJ1xuICBoZWFkZXJzOiBudWxsXG5cbiAgdHlwZXM6IG51bGwgIyBUeXBlcyB0aGF0IGhhdmUgYmVlbiBkZWZpbmVkXG5cbiAgY29uc3RydWN0b3I6IChAcm9vdCwgQGhlYWRlcnMgPSB7fSkgLT5cbiAgICBAdHlwZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0NyZWF0ZWQgYSBuZXcgSlNPTi1BUEkgY2xpZW50IGF0JywgQHJvb3RcblxuICByZXF1ZXN0OiAobWV0aG9kLCB1cmwsIGRhdGEsIGFkZGl0aW9uYWxIZWFkZXJzLCBjYWxsYmFjaykgLT5cbiAgICBwcmludC5pbmZvICdNYWtpbmcgYScsIG1ldGhvZCwgJ3JlcXVlc3QgdG8nLCB1cmxcbiAgICBoZWFkZXJzID0gbWVyZ2VJbnRvIHt9LCBERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCwgQGhlYWRlcnMsIGFkZGl0aW9uYWxIZWFkZXJzXG4gICAgbWFrZUhUVFBSZXF1ZXN0IG1ldGhvZCwgQHJvb3QgKyB1cmwsIGRhdGEsIGhlYWRlcnNcbiAgICAgIC50aGVuIChyZXF1ZXN0KSA9PlxuICAgICAgICBAcHJvY2Vzc1Jlc3BvbnNlVG8gcmVxdWVzdCwgY2FsbGJhY2tcbiAgICAgIC5jYXRjaCAocmVxdWVzdCkgPT5cbiAgICAgICAgQHByb2Nlc3NFcnJvclJlc3BvbnNlVG8gcmVxdWVzdFxuXG4gIGZvciBtZXRob2QgaW4gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJ10gdGhlbiBkbyAobWV0aG9kKSA9PlxuICAgIEA6OlttZXRob2RdID0gLT5cbiAgICAgIEByZXF1ZXN0IG1ldGhvZC50b1VwcGVyQ2FzZSgpLCBhcmd1bWVudHMuLi5cblxuICBwcm9jZXNzUmVzcG9uc2VUbzogKHJlcXVlc3QsIGNhbGxiYWNrKSAtPlxuICAgIHJlc3BvbnNlID0gdHJ5IEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICByZXNwb25zZSA/PSB7fVxuICAgIHByaW50LmxvZyAnUHJvY2Vzc2luZyByZXNwb25zZScsIHJlc3BvbnNlXG5cbiAgICBpZiAnbGlua3MnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZUFuZEF0dHJpYnV0ZSwgbGluayBvZiByZXNwb25zZS5saW5rc1xuICAgICAgICBbdHlwZSwgYXR0cmlidXRlXSA9IHR5cGVBbmRBdHRyaWJ1dGUuc3BsaXQgJy4nXG4gICAgICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnXG4gICAgICAgICAgaHJlZiA9IGxpbmtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHtocmVmLCB0eXBlOiBhdHRyaWJ1dGVUeXBlfSA9IGxpbmtcblxuICAgICAgICBAaGFuZGxlTGluayB0eXBlLCBhdHRyaWJ1dGUsIGhyZWYsIGF0dHJpYnV0ZVR5cGVcblxuICAgIGlmICdsaW5rZWQnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlLmxpbmtlZFxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIHJlc291cmNlcyA/IDEsICdsaW5rZWQnLCB0eXBlLCAncmVzb3VyY2VzLidcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZVxuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIEB0eXBlc1t0eXBlXS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG5cbiAgICBpZiAnZGF0YScgb2YgcmVzcG9uc2VcbiAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsIFwiZGF0YVwiIGNvbGxlY3Rpb24gb2YnLCByZXNwb25zZS5kYXRhLmxlbmd0aCA/IDFcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNwb25zZS5kYXRhXG4gICAgICAgIEBjcmVhdGVUeXBlIHJlc3BvbnNlLnR5cGVcbiAgICAgICAgQHR5cGVzW3Jlc3BvbnNlLnR5cGVdLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcbiAgICBlbHNlXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IFtdXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlIHdoZW4gdHlwZSBub3QgaW4gWydsaW5rcycsICdsaW5rZWQnLCAnbWV0YScsICdkYXRhJ11cbiAgICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwnLCB0eXBlLCAnY29sbGVjdGlvbiBvZicsIHJlc291cmNlcy5sZW5ndGggPyAxXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGVcbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBwcmltYXJ5UmVzdWx0cy5wdXNoIEB0eXBlc1t0eXBlXS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG5cbiAgICBwcmludC5pbmZvICdQcmltYXJ5IHJlc291cmNlczonLCBwcmltYXJ5UmVzdWx0c1xuICAgIGNhbGxiYWNrPyByZXF1ZXN0LCByZXNwb25zZVxuICAgIFByb21pc2UuYWxsIHByaW1hcnlSZXN1bHRzXG5cbiAgaGFuZGxlTGluazogKHR5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBocmVmVGVtcGxhdGUsIGF0dHJpYnV0ZVR5cGVOYW1lKSAtPlxuICAgIHR5cGUgPSBAY3JlYXRlVHlwZSB0eXBlTmFtZVxuXG4gICAgdHlwZS5saW5rc1thdHRyaWJ1dGVOYW1lXSA/PSB7fVxuICAgIGlmIGhyZWZUZW1wbGF0ZT9cbiAgICAgIHR5cGUubGlua3NbYXR0cmlidXRlTmFtZV0uaHJlZiA9IGhyZWZUZW1wbGF0ZVxuICAgIGlmIGF0dHJpYnV0ZVR5cGVOYW1lP1xuICAgICAgdHlwZS5saW5rc1thdHRyaWJ1dGVOYW1lXS50eXBlID0gYXR0cmlidXRlVHlwZU5hbWVcblxuICBjcmVhdGVUeXBlOiAobmFtZSkgLT5cbiAgICBAdHlwZXNbbmFtZV0gPz0gbmV3IFR5cGUgbmFtZSwgdGhpc1xuICAgIEB0eXBlc1tuYW1lXVxuXG4gIHByb2Nlc3NFcnJvclJlc3BvbnNlVG86IChyZXF1ZXN0KSAtPlxuICAgIFByb21pc2UucmVqZWN0IHRyeVxuICAgICAgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIGNhdGNoXG4gICAgICBuZXcgRXJyb3IgcmVxdWVzdC5yZXNwb25zZVRleHQgfHwgcmVxdWVzdC5zdGF0dXNcblxubW9kdWxlLmV4cG9ydHMudXRpbCA9IHttYWtlSFRUUFJlcXVlc3R9XG5tb2R1bGUuZXhwb3J0cy5UeXBlID0gVHlwZVxubW9kdWxlLmV4cG9ydHMuUmVzb3VyY2UgPSBSZXNvdXJjZVxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuXG4jIE1ha2UgYSByYXcsIG5vbi1BUEkgc3BlY2lmaWMgSFRUUCByZXF1ZXN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycywgbW9kaWZ5KSAtPlxuICBwcmludC5pbmZvICdSZXF1ZXN0aW5nJywgbWV0aG9kLCB1cmwsIGRhdGFcbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gICAgcmVxdWVzdC5vcGVuIG1ldGhvZCwgZW5jb2RlVVJJIHVybFxuXG4gICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG5cbiAgICBpZiBoZWFkZXJzP1xuICAgICAgZm9yIGhlYWRlciwgdmFsdWUgb2YgaGVhZGVyc1xuICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIgaGVhZGVyLCB2YWx1ZVxuXG4gICAgaWYgbW9kaWZ5P1xuICAgICAgbW9kaWZpY2F0aW9ucyA9IG1vZGlmeSByZXF1ZXN0XG5cbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChlKSAtPlxuICAgICAgcHJpbnQubG9nICdSZWFkeSBzdGF0ZTonLCAoa2V5IGZvciBrZXksIHZhbHVlIG9mIHJlcXVlc3Qgd2hlbiB2YWx1ZSBpcyByZXF1ZXN0LnJlYWR5U3RhdGUgYW5kIGtleSBpc250ICdyZWFkeVN0YXRlJylbMF1cbiAgICAgIGlmIHJlcXVlc3QucmVhZHlTdGF0ZSBpcyByZXF1ZXN0LkRPTkVcbiAgICAgICAgcHJpbnQubG9nICdEb25lOyBzdGF0dXMgaXMnLCByZXF1ZXN0LnN0YXR1c1xuICAgICAgICBpZiAyMDAgPD0gcmVxdWVzdC5zdGF0dXMgPCAzMDBcbiAgICAgICAgICByZXNvbHZlIHJlcXVlc3RcbiAgICAgICAgZWxzZSAjIGlmIDQwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDYwMFxuICAgICAgICAgIHJlamVjdCByZXF1ZXN0XG5cbiAgICBpZiBkYXRhIGluc3RhbmNlb2YgQmxvYlxuICAgICAgcmVxdWVzdC5zZW5kIGRhdGFcbiAgICBlbHNlXG4gICAgICByZXF1ZXN0LnNlbmQgSlNPTi5zdHJpbmdpZnkgZGF0YVxuIiwiIyBUaGlzIGlzIGEgcHJldHR5IHN0YW5kYXJkIG1lcmdlIGZ1bmN0aW9uLlxuIyBNZXJnZSBwcm9wZXJ0aWVzIG9mIGFsbCBhcmd1ZW1lbnRzIGludG8gdGhlIGZpcnN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGZvciBhcmd1bWVudCBpbiBBcnJheTo6c2xpY2UuY2FsbCBhcmd1bWVudHMsIDEgd2hlbiBhcmd1bWVudD9cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBhcmd1bWVudFxuICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSB2YWx1ZVxuICBhcmd1bWVudHNbMF1cbiIsIkxPR19MRVZFTCA9IHBhcnNlRmxvYXQgbG9jYXRpb24uc2VhcmNoLm1hdGNoKC9qc29uLWFwaS1sb2c9KFxcZCspLyk/WzFdID8gMFxuXG5wcmludCA9IChsZXZlbCwgY29sb3IsIG1lc3NhZ2VzLi4uKSAtPlxuICBpZiBMT0dfTEVWRUwgPj0gbGV2ZWxcbiAgICBjb25zb2xlLmxvZyAnJWN7anNvbjphcGl9JywgXCJjb2xvcjogI3tjb2xvcn07IGZvbnQ6IGJvbGQgMWVtIG1vbm9zcGFjZTtcIiwgbWVzc2FnZXMuLi5cblxubW9kdWxlLmV4cG9ydHMgPVxuICBsb2c6IHByaW50LmJpbmQgbnVsbCwgNCwgJ2dyYXknXG4gIGluZm86IHByaW50LmJpbmQgbnVsbCwgMywgJ2JsdWUnXG4gIHdhcm46IHByaW50LmJpbmQgbnVsbCwgMiwgJ29yYW5nZSdcbiAgZXJyb3I6IHByaW50LmJpbmQgbnVsbCwgMSwgJ3JlZCdcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2UgZXh0ZW5kcyBFbWl0dGVyXG4gIF90eXBlOiBudWxsICMgVGhlIHJlc291cmNlIHR5cGUgb2JqZWN0XG5cbiAgX3JlYWRPbmx5S2V5czogWydpZCcsICd0eXBlJywgJ2hyZWYnLCAnY3JlYXRlZF9hdCcsICd1cGRhdGVkX2F0J11cblxuICBfY2hhbmdlZEtleXM6IG51bGwgIyBEaXJ0eSBrZXlzXG5cbiAgY29uc3RydWN0b3I6IChjb25maWcuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBAX2NoYW5nZWRLZXlzID0gW11cbiAgICBtZXJnZUludG8gdGhpcywgY29uZmlnLi4uIGlmIGNvbmZpZz9cbiAgICBAZW1pdCAnY3JlYXRlJ1xuICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG4gICAgcHJpbnQuaW5mbyBcIkNvbnN0cnVjdGVkIGEgcmVzb3VyY2U6ICN7QF90eXBlLm5hbWV9ICN7QGlkfVwiLCB0aGlzXG5cbiAgIyBHZXQgYSBwcm9taXNlIGZvciBhbiBhdHRyaWJ1dGUgcmVmZXJyaW5nIHRvIChhbilvdGhlciByZXNvdXJjZShzKS5cbiAgYXR0cjogKGF0dHJpYnV0ZSkgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nIGxpbms6JywgYXR0cmlidXRlXG4gICAgaWYgYXR0cmlidXRlIG9mIHRoaXNcbiAgICAgIHByaW50Lndhcm4gXCJObyBuZWVkIHRvIGFjY2VzcyBhIG5vbi1saW5rZWQgYXR0cmlidXRlIHZpYSBhdHRyOiAje2F0dHJpYnV0ZX1cIiwgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlIEBbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgQGxpbmtzPyBhbmQgYXR0cmlidXRlIG9mIEBsaW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHJlc291cmNlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQGxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIGF0dHJpYnV0ZSBvZiBAX3R5cGUubGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiB0eXBlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQF90eXBlLmxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlXG4gICAgICBwcmludC5lcnJvciAnTm90IGEgbGluayBhdCBhbGwnXG4gICAgICBQcm9taXNlLnJlamVjdCBuZXcgRXJyb3IgXCJObyBhdHRyaWJ1dGUgI3thdHRyaWJ1dGV9IG9mICN7QF90eXBlLm5hbWV9IHJlc291cmNlXCJcblxuICBfZ2V0TGluazogKG5hbWUsIGxpbmspIC0+XG4gICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBsaW5rXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBJRChzKSdcbiAgICAgIGlkcyA9IGxpbmtcbiAgICAgIHtocmVmLCB0eXBlfSA9IEBfdHlwZS5saW5rc1tuYW1lXVxuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIGFwcGxpZWRIUkVGID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0KGFwcGxpZWRIUkVGKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rcz9bbmFtZV0gaXMgJ3N0cmluZydcbiAgICAgICAgICAgIHJlc291cmNlc1swXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc291cmNlc1xuXG4gICAgICBlbHNlIGlmIHR5cGU/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZSBpZiBsaW5rP1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgY29sbGVjdGlvbiBvYmplY3QnLCBsaW5rXG4gICAgICAjIEl0J3MgYSBjb2xsZWN0aW9uIG9iamVjdC5cbiAgICAgIHtocmVmLCBpZHMsIHR5cGV9ID0gbGlua1xuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIHByaW50Lndhcm4gJ0hSRUYnLCBocmVmXG4gICAgICAgIGFwcGxpZWRIUkVGID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0KGFwcGxpZWRIUkVGKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rcz9bbmFtZV0gaXMgJ3N0cmluZydcbiAgICAgICAgICAgIHJlc291cmNlc1swXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc291cmNlc1xuXG4gICAgICBlbHNlIGlmIHR5cGU/IGFuZCBpZHM/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdMaW5rZWQsIGJ1dCBibGFuaydcbiAgICAgICMgSXQgZXhpc3RzLCBidXQgaXQncyBibGFuay5cbiAgICAgIFByb21pc2UucmVzb2x2ZSBudWxsXG5cbiAgIyBUdXJuIGEgSlNPTi1BUEkgXCJocmVmXCIgdGVtcGxhdGUgaW50byBhIHVzYWJsZSBVUkwuXG4gIFBMQUNFSE9MREVSU19QQVRURVJOOiAveyguKz8pfS9nXG4gIGFwcGx5SFJFRjogKGhyZWYsIGNvbnRleHQpIC0+XG4gICAgaHJlZi5yZXBsYWNlIEBQTEFDRUhPTERFUlNfUEFUVEVSTiwgKF8sIHBhdGgpIC0+XG4gICAgICBzZWdtZW50cyA9IHBhdGguc3BsaXQgJy4nXG4gICAgICBwcmludC53YXJuICdTZWdtZW50cycsIHNlZ21lbnRzXG5cbiAgICAgIHZhbHVlID0gY29udGV4dFxuICAgICAgdW50aWwgc2VnbWVudHMubGVuZ3RoIGlzIDBcbiAgICAgICAgc2VnbWVudCA9IHNlZ21lbnRzLnNoaWZ0KClcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtzZWdtZW50XSA/IHZhbHVlLmxpbmtzP1tzZWdtZW50XVxuXG4gICAgICBwcmludC53YXJuICdWYWx1ZScsIHZhbHVlXG5cbiAgICAgIGlmIEFycmF5LmlzQXJyYXkgdmFsdWVcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luICcsJ1xuXG4gICAgICB1bmxlc3MgdHlwZW9mIHZhbHVlIGlzICdzdHJpbmcnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIlZhbHVlIGZvciAnI3twYXRofScgaW4gJyN7aHJlZn0nIHNob3VsZCBiZSBhIHN0cmluZy5cIlxuXG4gICAgICB2YWx1ZVxuXG4gIHVwZGF0ZTogKGNoYW5nZVNldCA9IHt9KSAtPlxuICAgIEBlbWl0ICd3aWxsLWNoYW5nZSdcbiAgICBhY3R1YWxDaGFuZ2VzID0gMFxuXG4gICAgZm9yIGtleSwgdmFsdWUgb2YgY2hhbmdlU2V0IHdoZW4gQFtrZXldIGlzbnQgdmFsdWVcbiAgICAgIEBba2V5XSA9IHZhbHVlXG4gICAgICB1bmxlc3Mga2V5IGluIEBfY2hhbmdlZEtleXNcbiAgICAgICAgQF9jaGFuZ2VkS2V5cy5wdXNoIGtleVxuICAgICAgYWN0dWFsQ2hhbmdlcyArPSAxXG5cbiAgICB1bmxlc3MgYWN0dWFsQ2hhbmdlcyBpcyAwXG4gICAgICBAZW1pdCAnY2hhbmdlJ1xuICAgICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcblxuICBzYXZlOiAtPlxuICAgIEBlbWl0ICd3aWxsLXNhdmUnXG5cbiAgICBwYXlsb2FkID0ge31cbiAgICBwYXlsb2FkW0BfdHlwZS5uYW1lXSA9IEBnZXRDaGFuZ2VzU2luY2VTYXZlKClcblxuICAgIHNhdmUgPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucHV0IEBnZXRVUkwoKSwgcGF5bG9hZFxuICAgIGVsc2VcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucG9zdCBAX3R5cGUuZ2V0VVJMKCksIHBheWxvYWRcblxuICAgIHNhdmUudGhlbiAoW3Jlc3VsdF0pID0+XG4gICAgICBAdXBkYXRlIHJlc3VsdFxuICAgICAgQF9jaGFuZ2VkS2V5cy5zcGxpY2UgMFxuICAgICAgQGVtaXQgJ3NhdmUnXG4gICAgICByZXN1bHRcblxuICBnZXRDaGFuZ2VzU2luY2VTYXZlOiAtPlxuICAgIGNoYW5nZXMgPSB7fVxuICAgIGZvciBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgY2hhbmdlc1trZXldID0gQFtrZXldXG4gICAgY2hhbmdlc1xuXG4gIGRlbGV0ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1kZWxldGUnXG4gICAgZGVsZXRpb24gPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQuZGVsZXRlKEBnZXRVUkwoKSkudGhlbiA9PlxuICAgICAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICBkZWxldGlvbi50aGVuID0+XG4gICAgICBAZW1pdCAnZGVsZXRlJ1xuXG4gIG1hdGNoZXNRdWVyeTogKHF1ZXJ5KSAtPlxuICAgIG1hdGNoZXMgPSB0cnVlXG4gICAgZm9yIHBhcmFtLCB2YWx1ZSBvZiBxdWVyeVxuICAgICAgaWYgQFtwYXJhbV0gaXNudCB2YWx1ZVxuICAgICAgICBtYXRjaGVzID0gZmFsc2VcbiAgICAgICAgYnJlYWtcbiAgICBtYXRjaGVzXG5cbiAgZ2V0VVJMOiAtPlxuICAgIEBocmVmIHx8IFtAX3R5cGUuZ2V0VVJMKCksIEBpZF0uam9pbiAnLydcblxuICB0b0pTT046IC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICByZXN1bHRbQF90eXBlLm5hbWVdID0ge31cbiAgICBmb3Igb3duIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3QgaW4gQF9yZWFkT25seUtleXNcbiAgICAgIHJlc3VsdFtAX3R5cGUubmFtZV1ba2V5XSA9IHZhbHVlXG4gICAgcmVzdWx0XG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5kZWZlciA9IC0+XG4gIGRlZmVycmFsID0ge31cbiAgZGVmZXJyYWwucHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgZGVmZXJyYWwucmVzb2x2ZSA9IHJlc29sdmVcbiAgICBkZWZlcnJhbC5yZWplY3QgPSByZWplY3RcbiAgZGVmZXJyYWxcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUeXBlIGV4dGVuZHMgRW1pdHRlclxuICBuYW1lOiAnJ1xuICBhcGlDbGllbnQ6IG51bGxcblxuICBsaW5rczogbnVsbCAjIFJlc291cmNlIGxpbmsgZGVmaW5pdGlvbnNcblxuICBkZWZlcnJhbHM6IG51bGwgIyBLZXlzIGFyZSBJRHMgb2Ygc3BlY2lmaWNhbGx5IHJlcXVlc3RlZCByZXNvdXJjZXMuXG4gIHJlc291cmNlUHJvbWlzZXM6IG51bGwgIyBLZXlzIGFyZSBJRHMsIHZhbHVlcyBhcmUgcHJvbWlzZXMgcmVzb2x2aW5nIHRvIHJlc291cmNlcy5cblxuICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAYXBpQ2xpZW50KSAtPlxuICAgIHN1cGVyXG4gICAgQGxpbmtzID0ge31cbiAgICBAZGVmZXJyYWxzID0ge31cbiAgICBAcmVzb3VyY2VQcm9taXNlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5lZCBhIG5ldyB0eXBlOicsIEBuYW1lXG5cbiAgZ2V0VVJMOiAtPlxuICAgICcvJyArIEBuYW1lXG5cbiAgcXVlcnlMb2NhbDogKHF1ZXJ5KSAtPlxuICAgIGV4aXN0TG9jYWxseSA9IChwcm9taXNlIGZvciBpZCwgcHJvbWlzZSBvZiBAcmVzb3VyY2VQcm9taXNlcyB3aGVuIG5vdCBAd2FpdGluZ0ZvciBpZClcbiAgICBQcm9taXNlLmFsbChleGlzdExvY2FsbHkpLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgIHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZS5tYXRjaGVzUXVlcnkgcXVlcnlcblxuICB3YWl0aW5nRm9yOiAoaWQpIC0+XG4gICAgQGRlZmVycmFsc1tpZF0/XG5cbiAgaGFzOiAoaWQpIC0+XG4gICAgQHJlc291cmNlUHJvbWlzZXNbaWRdPyBhbmQgbm90IEBkZWZlcnJhbHNbaWRdP1xuXG4gIGdldDogLT5cbiAgICBpZiB0eXBlb2YgYXJndW1lbnRzWzBdIGlzICdzdHJpbmcnXG4gICAgICBAZ2V0QnlJRCBhcmd1bWVudHMuLi5cbiAgICBlbHNlIGlmIEFycmF5LmlzQXJyYXkgYXJndW1lbnRzWzBdXG4gICAgICBAZ2V0QnlJRHMgYXJndW1lbnRzLi4uXG4gICAgZWxzZVxuICAgICAgQGdldEJ5UXVlcnkgYXJndW1lbnRzLi4uXG5cbiAgZ2V0QnlJRDogKGlkLCBvdGhlckFyZ3MuLi4pIC0+XG4gICAgQGdldEJ5SURzKFtpZF0sIG90aGVyQXJncy4uLikudGhlbiAoW3Jlc291cmNlXSkgLT5cbiAgICAgIHJlc291cmNlXG5cbiAgZ2V0QnlJRHM6IChpZHMsIG9wdGlvbnMsIGNhbGxiYWNrKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcnLCBAbmFtZSwgJ2J5IElEKHMpJywgaWRzXG4gICAgIyBPbmx5IHJlcXVlc3QgdGhpbmdzIHdlIGRvbid0IGFscmVhZHkgaGF2ZSBhIHJlcXVlc3Qgb3V0IGZvci5cbiAgICBpbmNvbWluZyA9IChpZCBmb3IgaWQgaW4gaWRzIHdoZW4gbm90IEB3YWl0aW5nRm9yIGlkKVxuICAgIHByaW50LmxvZyAnSW5jb21pbmc6ICcsIGluY29taW5nXG5cbiAgICB1bmxlc3MgaW5jb21pbmcubGVuZ3RoIGlzIDBcbiAgICAgIGZvciBpZCBpbiBpbmNvbWluZ1xuICAgICAgICBAZGVmZXJyYWxzW2lkXSA9IGRlZmVyKClcbiAgICAgICAgQHJlc291cmNlUHJvbWlzZXNbaWRdID0gQGRlZmVycmFsc1tpZF0ucHJvbWlzZVxuXG4gICAgICB1cmwgPSBbQGdldFVSTCgpLCBpbmNvbWluZy5qb2luICcsJ10uam9pbiAnLydcbiAgICAgIHByaW50LmxvZyAnUmVxdWVzdCBmb3InLCBAbmFtZSwgJ2F0JywgdXJsXG4gICAgICBAYXBpQ2xpZW50LmdldCB1cmwsIG9wdGlvbnMsIG51bGwsIGNhbGxiYWNrXG5cbiAgICBQcm9taXNlLmFsbCAoQHJlc291cmNlUHJvbWlzZXNbaWRdIGZvciBpZCBpbiBpZHMpXG5cbiAgZ2V0QnlRdWVyeTogKHF1ZXJ5LCBsaW1pdCA9IEluZmluaXR5LCBjYWxsYmFjaykgLT5cbiAgICBAcXVlcnlMb2NhbChxdWVyeSkudGhlbiAoZXhpc3RpbmcpID0+XG4gICAgICBpZiBleGlzdGluZy5sZW5ndGggPj0gbGltaXRcbiAgICAgICAgZXhpc3RpbmdcbiAgICAgIGVsc2VcbiAgICAgICAgcGFyYW1zID0ge31cbiAgICAgICAgaWYgaXNGaW5pdGUgbGltaXRcbiAgICAgICAgICBwYXJhbXMubGltaXQgPSBsaW1pdCAtIGV4aXN0aW5nLmxlbmd0aFxuICAgICAgICBtZXJnZUludG8gcGFyYW1zLCBxdWVyeVxuXG4gICAgICAgIEBhcGlDbGllbnQuZ2V0KEBnZXRVUkwoKSwgcGFyYW1zKS50aGVuIChyZXNvdXJjZXMpIC0+XG4gICAgICAgICAgUHJvbWlzZS5hbGwgZXhpc3RpbmcuY29uY2F0IHJlc291cmNlc1xuXG4gIGFkZEV4aXN0aW5nUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIGlmIEB3YWl0aW5nRm9yIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnRG9uZSB3YWl0aW5nIGZvcicsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkXG4gICAgICBuZXdSZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpcywgZGF0YVxuICAgICAgZGVmZXJyYWwgPSBAZGVmZXJyYWxzW2RhdGEuaWRdXG4gICAgICBAZGVmZXJyYWxzW2RhdGEuaWRdID0gbnVsbFxuICAgICAgZGVmZXJyYWwucmVzb2x2ZSBuZXdSZXNvdXJjZVxuXG4gICAgZWxzZSBpZiBAaGFzIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnVGhlJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWQsICdhbHJlYWR5IGV4aXN0czsgd2lsbCB1cGRhdGUnXG4gICAgICBAZ2V0KGRhdGEuaWQpLnRoZW4gKHJlc291cmNlKSAtPlxuICAgICAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdBY2NlcHRpbmcnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZFxuICAgICAgbmV3UmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXMsIGRhdGFcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdID0gUHJvbWlzZS5yZXNvbHZlIG5ld1Jlc291cmNlXG5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXVxuXG4gIGNyZWF0ZVJlc291cmNlOiAoZGF0YSkgLT5cbiAgICBwcmludC5sb2cgJ0NyZWF0aW5nIGEgbmV3JywgQG5hbWUsICdyZXNvdXJjZSdcbiAgICByZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpc1xuICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG4gICAgcmVzb3VyY2VcbiJdfQ==

