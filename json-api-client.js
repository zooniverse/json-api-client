!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.JSONAPIClient=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var DEFAULT_SIGNAL, Emitter, arraysMatch, callHandler,
  __slice = [].slice;

DEFAULT_SIGNAL = 'change';

arraysMatch = function(array1, array2) {
  var i, item, matches, _ref;
  matches = (function() {
    var _i, _len, _results;
    _results = [];
    for (i = _i = 0, _len = array1.length; _i < _len; i = ++_i) {
      item = array1[i];
      if (array2[i] === item) {
        _results.push(i);
      }
    }
    return _results;
  })();
  return (array1.length === (_ref = array2.length) && _ref === matches.length);
};

callHandler = function(handler, payload) {
  var boundArgs, context, _ref;
  if (Array.isArray(handler)) {
    _ref = handler, context = _ref[0], handler = _ref[1], boundArgs = 3 <= _ref.length ? __slice.call(_ref, 2) : [];
    if (typeof handler === 'string') {
      handler = context[handler];
    }
  } else {
    boundArgs = [];
  }
  handler.apply(context, boundArgs.concat(payload));
};

module.exports = Emitter = (function() {
  Emitter.prototype._callbacks = null;

  function Emitter() {
    this._callbacks = {};
  }

  Emitter.prototype.listen = function() {
    var callback, signal, _arg, _base, _i;
    _arg = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    signal = _arg[0];
    if (signal == null) {
      signal = DEFAULT_SIGNAL;
    }
    if ((_base = this._callbacks)[signal] == null) {
      _base[signal] = [];
    }
    this._callbacks[signal].push(callback);
    return this;
  };

  Emitter.prototype.stopListening = function() {
    var callback, handler, i, index, signal, _arg, _i, _j, _ref;
    _arg = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    signal = _arg[0];
    if (signal == null) {
      signal = DEFAULT_SIGNAL;
    }
    if (this._callbacks[signal] != null) {
      if (callback != null) {
        if (Array.isArray(callback)) {
          index = -1;
          _ref = this._callbacks[signal];
          for (i = _j = _ref.length - 1; _j >= 0; i = _j += -1) {
            handler = _ref[i];
            if (Array.isArray(handler)) {
              if (arraysMatch(callback, handler)) {
                index = i;
                break;
              }
            }
          }
        } else {
          index = this._callbacks[signal].lastIndexOf(callback);
        }
        if (index !== -1) {
          this._callbacks[signal].splice(index, 1);
        }
      } else {
        this._callbacks[signal].splice(0);
      }
    }
    return this;
  };

  Emitter.prototype.emit = function() {
    var callback, payload, signal, _i, _len, _ref;
    signal = arguments[0], payload = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (signal == null) {
      signal = DEFAULT_SIGNAL;
    }
    if (signal in this._callbacks) {
      _ref = this._callbacks[signal];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        callHandler(callback, payload);
      }
    }
    return this;
  };

  Emitter.prototype.destroy = function() {
    var callback, signal, _i, _len, _ref;
    for (signal in this._callbacks) {
      _ref = this._callbacks[signal];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        this.stopListening(signal, callback);
      }
    }
  };

  return Emitter;

})();



},{}],2:[function(_dereq_,module,exports){
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

  JSONAPIClient.prototype._types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers != null ? headers : {};
    this._types = {};
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
      return this.request.apply(this, [method].concat(__slice.call(arguments)));
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
          this._types[type].addExistingResource(resource);
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
          _results.push(this._types[response.type].addExistingResource(resource));
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
          primaryResults.push(this._types[type].addExistingResource(resource));
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
    if ((_base = this._types)[name] == null) {
      _base[name] = new Type(name, this);
    }
    return this._types[name];
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
  return new Promise(function(resolve, reject) {
    var header, key, request, value;
    method = method.toUpperCase();
    if ((data != null) && method === 'GET') {
      url += '?' + ((function() {
        var _results;
        _results = [];
        for (key in data) {
          value = data[key];
          _results.push([key, value].join('='));
        }
        return _results;
      })()).join('&');
      data = null;
    }
    print.info('Requesting', method, url, data);
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
      modify(request);
    }
    request.onreadystatechange = function(e) {
      var _ref;
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
    if ((headers != null ? headers['Content-Type'].indexOf('json') : void 0) !== -1) {
      data = JSON.stringify(data);
    }
    return request.send(data);
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
var print,
  __slice = [].slice;

print = function() {
  var color, level, messages, prefix, setting, _ref, _ref1;
  level = arguments[0], color = arguments[1], messages = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  setting = typeof JSON_API_LOG_LEVEL !== "undefined" && JSON_API_LOG_LEVEL !== null ? JSON_API_LOG_LEVEL : parseFloat((_ref = typeof location !== "undefined" && location !== null ? (_ref1 = location.search.match(/json-api-log=(\d+)/)) != null ? _ref1[1] : void 0 : void 0) != null ? _ref : 0);
  if (setting >= level) {
    prefix = typeof location !== "undefined" && location !== null ? ['%c{json:api}', "color: " + color + "; font: bold 1em monospace;"] : ['{json:api}'];
    return typeof console !== "undefined" && console !== null ? console.log.apply(console, __slice.call(prefix).concat(__slice.call(messages))) : void 0;
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
        type = this._type.apiClient._types[type];
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
        type = this._type.apiClient._types[type];
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

  Resource.prototype.refresh = function() {
    if (this.id) {
      return this._type.get(this.id);
    } else {
      return Promise.reject(new Error('Can\'t refresh a resource with no ID'));
    }
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
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
    var id, url, _i, _len;
    print.info('Getting', this.name, 'by ID(s)', ids);
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      this.deferrals[id] = defer();
      this.resourcePromises[id] = this.deferrals[id].promise;
    }
    url = [this.getURL(), ids.join(',')].join('/');
    print.log('Request for', this.name, 'at', url);
    this.apiClient.get(url, options, null, callback);
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
        var existingIDs, id, params;
        if (existing.length >= limit) {
          return existing;
        } else {
          existingIDs = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = existing.length; _i < _len; _i++) {
              id = existing[_i].id;
              _results.push(id);
            }
            return _results;
          })();
          params = {};
          if (isFinite(limit)) {
            params.limit = limit - existing.length;
          }
          mergeInto(params, query);
          return _this.apiClient.get(_this.getURL(), params, null, callback).then(function(resources) {
            var fetched, resource;
            fetched = (function() {
              var _i, _len, _ref, _results;
              _results = [];
              for (_i = 0, _len = resources.length; _i < _len; _i++) {
                resource = resources[_i];
                if (_ref = resource.id, __indexOf.call(existingIDs, _ref) < 0) {
                  _results.push(resource);
                }
              }
              return _results;
            })();
            return Promise.all(existing.concat(fetched));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxpREFBQTtFQUFBLGtCQUFBOztBQUFBLGNBQUEsR0FBaUIsUUFBakIsQ0FBQTs7QUFBQSxXQUVBLEdBQWMsU0FBQyxNQUFELEVBQVMsTUFBVCxHQUFBO0FBQ1osTUFBQSxzQkFBQTtBQUFBLEVBQUEsT0FBQTs7QUFBVztTQUFBLHFEQUFBO3VCQUFBO1VBQTZCLE1BQU8sQ0FBQSxDQUFBLENBQVAsS0FBYTtBQUExQyxzQkFBQSxFQUFBO09BQUE7QUFBQTs7TUFBWCxDQUFBO1NBQ0EsQ0FBQSxNQUFNLENBQUMsTUFBUCxhQUFpQixNQUFNLENBQUMsT0FBeEIsUUFBQSxLQUFrQyxPQUFPLENBQUMsTUFBMUMsRUFGWTtBQUFBLENBRmQsQ0FB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Um9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiREVGQVVMVF9TSUdOQUwgPSAnY2hhbmdlJ1xuXG5hcnJheXNNYXRjaCA9IChhcnJheTEsIGFycmF5MikgLT5cbiAgbWF0Y2hlcyA9IChpIGZvciBpdGVtLCBpIGluIGFycmF5MSB3aGVuIGFycmF5MltpXSBpcyBpdGVtKVxuICBhcnJheTEubGVuZ3RoIGlzIGFycmF5Mi5sZW5ndGggaXMgbWF0Y2hlcy5sZW5ndGhcblxuY2FsbEhhbmRsZXIgPSAoaGFuZGxlciwgcGF5bG9hZCkgLT5cbiAgIyBIYW5kbGVycyBjYW4gYmUgaW4gdGhlIGZvcm0gW2NvbnRleHQsIGZ1bmN0aW9uIG9yIG1ldGhvZCBuYW1lLCBib3VuZCBhcmd1bWVudHMuLi5dXG4gIGlmIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgIFtjb250ZXh0LCBoYW5kbGVyLCBib3VuZEFyZ3MuLi5dID0gaGFuZGxlclxuICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICBoYW5kbGVyID0gY29udGV4dFtoYW5kbGVyXVxuICBlbHNlXG4gICAgYm91bmRBcmdzID0gW11cbiAgaGFuZGxlci5hcHBseSBjb250ZXh0LCBib3VuZEFyZ3MuY29uY2F0IHBheWxvYWRcbiAgcmV0dXJuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRW1pdHRlclxuICBfY2FsbGJhY2tzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQF9jYWxsYmFja3MgPSB7fVxuXG4gIGxpc3RlbjogKFtzaWduYWxdLi4uLCBjYWxsYmFjaykgLT5cbiAgICBzaWduYWwgPz0gREVGQVVMVF9TSUdOQUxcbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdID89IFtdXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5wdXNoIGNhbGxiYWNrXG4gICAgdGhpc1xuXG4gIHN0b3BMaXN0ZW5pbmc6IChbc2lnbmFsXS4uLiwgY2FsbGJhY2spIC0+XG4gICAgc2lnbmFsID89IERFRkFVTFRfU0lHTkFMXG4gICAgaWYgQF9jYWxsYmFja3Nbc2lnbmFsXT9cbiAgICAgIGlmIGNhbGxiYWNrP1xuICAgICAgICBpZiBBcnJheS5pc0FycmF5IGNhbGxiYWNrXG4gICAgICAgICAgIyBBcnJheS1zdHlsZSBjYWxsYmFja3MgbmVlZCBub3QgYmUgdGhlIGV4YWN0IHNhbWUgb2JqZWN0LlxuICAgICAgICAgIGluZGV4ID0gLTFcbiAgICAgICAgICBmb3IgaGFuZGxlciwgaSBpbiBAX2NhbGxiYWNrc1tzaWduYWxdIGJ5IC0xIHdoZW4gQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICAgICAgICBpZiBhcnJheXNNYXRjaCBjYWxsYmFjaywgaGFuZGxlclxuICAgICAgICAgICAgICBpbmRleCA9IGlcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGluZGV4ID0gQF9jYWxsYmFja3Nbc2lnbmFsXS5sYXN0SW5kZXhPZiBjYWxsYmFja1xuICAgICAgICB1bmxlc3MgaW5kZXggaXMgLTFcbiAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSBpbmRleCwgMVxuICAgICAgZWxzZVxuICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSAwXG4gICAgdGhpc1xuXG4gIGVtaXQ6IChzaWduYWwsIHBheWxvYWQuLi4pIC0+XG4gICAgc2lnbmFsID89IERFRkFVTFRfU0lHTkFMXG4gICAgaWYgc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBjYWxsSGFuZGxlciBjYWxsYmFjaywgcGF5bG9hZFxuICAgIHRoaXNcblxuICBkZXN0cm95OiAtPlxuICAgIGZvciBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIEBzdG9wTGlzdGVuaW5nIHNpZ25hbCwgY2FsbGJhY2tcbiAgICByZXR1cm5cbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbm1ha2VIVFRQUmVxdWVzdCA9IHJlcXVpcmUgJy4vbWFrZS1odHRwLXJlcXVlc3QnXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5UeXBlID0gcmVxdWlyZSAnLi90eXBlJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5ERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCA9XG4gICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vdm5kLmFwaStqc29uJ1xuICAnQWNjZXB0JzogXCJhcHBsaWNhdGlvbi92bmQuYXBpK2pzb25cIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEpTT05BUElDbGllbnRcbiAgcm9vdDogJy8nXG4gIGhlYWRlcnM6IG51bGxcblxuICBfdHlwZXM6IG51bGwgIyBUeXBlcyB0aGF0IGhhdmUgYmVlbiBkZWZpbmVkXG5cbiAgY29uc3RydWN0b3I6IChAcm9vdCwgQGhlYWRlcnMgPSB7fSkgLT5cbiAgICBAX3R5cGVzID0ge31cbiAgICBwcmludC5pbmZvICdDcmVhdGVkIGEgbmV3IEpTT04tQVBJIGNsaWVudCBhdCcsIEByb290XG5cbiAgcmVxdWVzdDogKG1ldGhvZCwgdXJsLCBkYXRhLCBhZGRpdGlvbmFsSGVhZGVycywgY2FsbGJhY2spIC0+XG4gICAgcHJpbnQuaW5mbyAnTWFraW5nIGEnLCBtZXRob2QsICdyZXF1ZXN0IHRvJywgdXJsXG4gICAgaGVhZGVycyA9IG1lcmdlSW50byB7fSwgREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQsIEBoZWFkZXJzLCBhZGRpdGlvbmFsSGVhZGVyc1xuICAgIG1ha2VIVFRQUmVxdWVzdCBtZXRob2QsIEByb290ICsgdXJsLCBkYXRhLCBoZWFkZXJzXG4gICAgICAudGhlbiAocmVxdWVzdCkgPT5cbiAgICAgICAgQHByb2Nlc3NSZXNwb25zZVRvIHJlcXVlc3QsIGNhbGxiYWNrXG4gICAgICAuY2F0Y2ggKHJlcXVlc3QpID0+XG4gICAgICAgIEBwcm9jZXNzRXJyb3JSZXNwb25zZVRvIHJlcXVlc3RcblxuICBmb3IgbWV0aG9kIGluIFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2RlbGV0ZSddIHRoZW4gZG8gKG1ldGhvZCkgPT5cbiAgICBAOjpbbWV0aG9kXSA9IC0+XG4gICAgICBAcmVxdWVzdCBtZXRob2QsIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NSZXNwb25zZVRvOiAocmVxdWVzdCwgY2FsbGJhY2spIC0+XG4gICAgcmVzcG9uc2UgPSB0cnkgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIHJlc3BvbnNlID89IHt9XG4gICAgcHJpbnQubG9nICdQcm9jZXNzaW5nIHJlc3BvbnNlJywgcmVzcG9uc2VcblxuICAgIGlmICdsaW5rcycgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlQW5kQXR0cmlidXRlLCBsaW5rIG9mIHJlc3BvbnNlLmxpbmtzXG4gICAgICAgIFt0eXBlLCBhdHRyaWJ1dGVdID0gdHlwZUFuZEF0dHJpYnV0ZS5zcGxpdCAnLidcbiAgICAgICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZydcbiAgICAgICAgICBocmVmID0gbGlua1xuICAgICAgICBlbHNlXG4gICAgICAgICAge2hyZWYsIHR5cGU6IGF0dHJpYnV0ZVR5cGV9ID0gbGlua1xuXG4gICAgICAgIEBoYW5kbGVMaW5rIHR5cGUsIGF0dHJpYnV0ZSwgaHJlZiwgYXR0cmlidXRlVHlwZVxuXG4gICAgaWYgJ2xpbmtlZCcgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2UubGlua2VkXG4gICAgICAgIHByaW50LmxvZyAnR290JywgcmVzb3VyY2VzID8gMSwgJ2xpbmtlZCcsIHR5cGUsICdyZXNvdXJjZXMuJ1xuICAgICAgICBAY3JlYXRlVHlwZSB0eXBlXG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgICAgQF90eXBlc1t0eXBlXS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG5cbiAgICBpZiAnZGF0YScgb2YgcmVzcG9uc2VcbiAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsIFwiZGF0YVwiIGNvbGxlY3Rpb24gb2YnLCByZXNwb25zZS5kYXRhLmxlbmd0aCA/IDFcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNwb25zZS5kYXRhXG4gICAgICAgIEBjcmVhdGVUeXBlIHJlc3BvbnNlLnR5cGVcbiAgICAgICAgQF90eXBlc1tyZXNwb25zZS50eXBlXS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG4gICAgZWxzZVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBbXVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZSB3aGVuIHR5cGUgbm90IGluIFsnbGlua3MnLCAnbGlua2VkJywgJ21ldGEnLCAnZGF0YSddXG4gICAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsJywgdHlwZSwgJ2NvbGxlY3Rpb24gb2YnLCByZXNvdXJjZXMubGVuZ3RoID8gMVxuICAgICAgICBAY3JlYXRlVHlwZSB0eXBlXG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgICAgcHJpbWFyeVJlc3VsdHMucHVzaCBAX3R5cGVzW3R5cGVdLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIHByaW50LmluZm8gJ1ByaW1hcnkgcmVzb3VyY2VzOicsIHByaW1hcnlSZXN1bHRzXG4gICAgY2FsbGJhY2s/IHJlcXVlc3QsIHJlc3BvbnNlXG4gICAgUHJvbWlzZS5hbGwgcHJpbWFyeVJlc3VsdHNcblxuICBoYW5kbGVMaW5rOiAodHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIGhyZWZUZW1wbGF0ZSwgYXR0cmlidXRlVHlwZU5hbWUpIC0+XG4gICAgdHlwZSA9IEBjcmVhdGVUeXBlIHR5cGVOYW1lXG5cbiAgICB0eXBlLmxpbmtzW2F0dHJpYnV0ZU5hbWVdID89IHt9XG4gICAgaWYgaHJlZlRlbXBsYXRlP1xuICAgICAgdHlwZS5saW5rc1thdHRyaWJ1dGVOYW1lXS5ocmVmID0gaHJlZlRlbXBsYXRlXG4gICAgaWYgYXR0cmlidXRlVHlwZU5hbWU/XG4gICAgICB0eXBlLmxpbmtzW2F0dHJpYnV0ZU5hbWVdLnR5cGUgPSBhdHRyaWJ1dGVUeXBlTmFtZVxuXG4gIGNyZWF0ZVR5cGU6IChuYW1lKSAtPlxuICAgIEBfdHlwZXNbbmFtZV0gPz0gbmV3IFR5cGUgbmFtZSwgdGhpc1xuICAgIEBfdHlwZXNbbmFtZV1cblxuICBwcm9jZXNzRXJyb3JSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICBQcm9taXNlLnJlamVjdCB0cnlcbiAgICAgIEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICBjYXRjaFxuICAgICAgbmV3IEVycm9yIHJlcXVlc3QucmVzcG9uc2VUZXh0IHx8IHJlcXVlc3Quc3RhdHVzXG5cbm1vZHVsZS5leHBvcnRzLnV0aWwgPSB7bWFrZUhUVFBSZXF1ZXN0fVxubW9kdWxlLmV4cG9ydHMuVHlwZSA9IFR5cGVcbm1vZHVsZS5leHBvcnRzLlJlc291cmNlID0gUmVzb3VyY2VcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcblxuIyBNYWtlIGEgcmF3LCBub24tQVBJIHNwZWNpZmljIEhUVFAgcmVxdWVzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMsIG1vZGlmeSkgLT5cbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBtZXRob2QgPSBtZXRob2QudG9VcHBlckNhc2UoKVxuICAgIGlmIGRhdGE/IGFuZCBtZXRob2QgaXMgJ0dFVCdcbiAgICAgIHVybCArPSAnPycgKyAoW2tleSwgdmFsdWVdLmpvaW4gJz0nIGZvciBrZXksIHZhbHVlIG9mIGRhdGEpLmpvaW4gJyYnXG4gICAgICBkYXRhID0gbnVsbFxuXG4gICAgcHJpbnQuaW5mbyAnUmVxdWVzdGluZycsIG1ldGhvZCwgdXJsLCBkYXRhXG5cbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gICAgcmVxdWVzdC5vcGVuIG1ldGhvZCwgZW5jb2RlVVJJIHVybFxuXG4gICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG5cbiAgICBpZiBoZWFkZXJzP1xuICAgICAgZm9yIGhlYWRlciwgdmFsdWUgb2YgaGVhZGVyc1xuICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIgaGVhZGVyLCB2YWx1ZVxuXG4gICAgaWYgbW9kaWZ5P1xuICAgICAgbW9kaWZ5IHJlcXVlc3RcblxuICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKGUpIC0+XG4gICAgICBwcmludC5sb2cgJ1JlYWR5IHN0YXRlOicsIChrZXkgZm9yIGtleSwgdmFsdWUgb2YgcmVxdWVzdCB3aGVuIHZhbHVlIGlzIHJlcXVlc3QucmVhZHlTdGF0ZSBhbmQga2V5IGlzbnQgJ3JlYWR5U3RhdGUnKVswXVxuICAgICAgaWYgcmVxdWVzdC5yZWFkeVN0YXRlIGlzIHJlcXVlc3QuRE9ORVxuICAgICAgICBwcmludC5sb2cgJ0RvbmU7IHN0YXR1cyBpcycsIHJlcXVlc3Quc3RhdHVzXG4gICAgICAgIGlmIDIwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDMwMFxuICAgICAgICAgIHJlc29sdmUgcmVxdWVzdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVqZWN0IHJlcXVlc3RcblxuICAgIGlmIGhlYWRlcnM/WydDb250ZW50LVR5cGUnXS5pbmRleE9mKCdqc29uJykgaXNudCAtMVxuICAgICAgZGF0YSA9IEpTT04uc3RyaW5naWZ5IGRhdGFcblxuICAgIHJlcXVlc3Quc2VuZCBkYXRhXG4iLCIjIFRoaXMgaXMgYSBwcmV0dHkgc3RhbmRhcmQgbWVyZ2UgZnVuY3Rpb24uXG4jIE1lcmdlIHByb3BlcnRpZXMgb2YgYWxsIGFyZ3VlbWVudHMgaW50byB0aGUgZmlyc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgZm9yIGFyZ3VtZW50IGluIEFycmF5OjpzbGljZS5jYWxsIGFyZ3VtZW50cywgMSB3aGVuIGFyZ3VtZW50P1xuICAgIGZvciBrZXksIHZhbHVlIG9mIGFyZ3VtZW50XG4gICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IHZhbHVlXG4gIGFyZ3VtZW50c1swXVxuIiwicHJpbnQgPSAobGV2ZWwsIGNvbG9yLCBtZXNzYWdlcy4uLikgLT5cbiAgIyBTZXQgdGhlIGxvZyBsZXZlbCB3aXRoIGEgZ2xvYmFsIHZhcmlhYmxlIG9yIGEgcXVlcnkgcGFyYW0gaW4gdGhlIHBhZ2UncyBVUkwuXG4gIHNldHRpbmcgPSBKU09OX0FQSV9MT0dfTEVWRUwgPyBwYXJzZUZsb2F0IGxvY2F0aW9uPy5zZWFyY2gubWF0Y2goL2pzb24tYXBpLWxvZz0oXFxkKykvKT9bMV0gPyAwXG5cbiAgaWYgc2V0dGluZyA+PSBsZXZlbFxuICAgICMgV2UgY2FuIHN0eWxlIHRleHQgaW4gdGhlIGJyb3dzZXIgY29uc29sZSwgYnV0IG5vdCBhcyBlYXNpbHkgaW4gTm9kZS5cbiAgICBwcmVmaXggPSBpZiBsb2NhdGlvbj9cbiAgICAgIFsnJWN7anNvbjphcGl9JywgXCJjb2xvcjogI3tjb2xvcn07IGZvbnQ6IGJvbGQgMWVtIG1vbm9zcGFjZTtcIl1cbiAgICBlbHNlXG4gICAgICBbJ3tqc29uOmFwaX0nXVxuXG4gICAgY29uc29sZT8ubG9nIHByZWZpeC4uLiwgbWVzc2FnZXMuLi5cblxubW9kdWxlLmV4cG9ydHMgPVxuICBsb2c6IHByaW50LmJpbmQgbnVsbCwgNCwgJ2dyYXknXG4gIGluZm86IHByaW50LmJpbmQgbnVsbCwgMywgJ2JsdWUnXG4gIHdhcm46IHByaW50LmJpbmQgbnVsbCwgMiwgJ29yYW5nZSdcbiAgZXJyb3I6IHByaW50LmJpbmQgbnVsbCwgMSwgJ3JlZCdcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2UgZXh0ZW5kcyBFbWl0dGVyXG4gIF90eXBlOiBudWxsICMgVGhlIHJlc291cmNlIHR5cGUgb2JqZWN0XG5cbiAgX3JlYWRPbmx5S2V5czogWydpZCcsICd0eXBlJywgJ2hyZWYnLCAnY3JlYXRlZF9hdCcsICd1cGRhdGVkX2F0J11cblxuICBfY2hhbmdlZEtleXM6IG51bGwgIyBEaXJ0eSBrZXlzXG5cbiAgY29uc3RydWN0b3I6IChjb25maWcuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBAX2NoYW5nZWRLZXlzID0gW11cbiAgICBtZXJnZUludG8gdGhpcywgY29uZmlnLi4uIGlmIGNvbmZpZz9cbiAgICBAZW1pdCAnY3JlYXRlJ1xuICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG4gICAgcHJpbnQuaW5mbyBcIkNvbnN0cnVjdGVkIGEgcmVzb3VyY2U6ICN7QF90eXBlLm5hbWV9ICN7QGlkfVwiLCB0aGlzXG5cbiAgIyBHZXQgYSBwcm9taXNlIGZvciBhbiBhdHRyaWJ1dGUgcmVmZXJyaW5nIHRvIChhbilvdGhlciByZXNvdXJjZShzKS5cbiAgYXR0cjogKGF0dHJpYnV0ZSkgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nIGxpbms6JywgYXR0cmlidXRlXG4gICAgaWYgYXR0cmlidXRlIG9mIHRoaXNcbiAgICAgIHByaW50Lndhcm4gXCJObyBuZWVkIHRvIGFjY2VzcyBhIG5vbi1saW5rZWQgYXR0cmlidXRlIHZpYSBhdHRyOiAje2F0dHJpYnV0ZX1cIiwgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlIEBbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgQGxpbmtzPyBhbmQgYXR0cmlidXRlIG9mIEBsaW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHJlc291cmNlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQGxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIGF0dHJpYnV0ZSBvZiBAX3R5cGUubGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiB0eXBlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQF90eXBlLmxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlXG4gICAgICBwcmludC5lcnJvciAnTm90IGEgbGluayBhdCBhbGwnXG4gICAgICBQcm9taXNlLnJlamVjdCBuZXcgRXJyb3IgXCJObyBhdHRyaWJ1dGUgI3thdHRyaWJ1dGV9IG9mICN7QF90eXBlLm5hbWV9IHJlc291cmNlXCJcblxuICBfZ2V0TGluazogKG5hbWUsIGxpbmspIC0+XG4gICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBsaW5rXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBJRChzKSdcbiAgICAgIGlkcyA9IGxpbmtcbiAgICAgIHtocmVmLCB0eXBlfSA9IEBfdHlwZS5saW5rc1tuYW1lXVxuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIGFwcGxpZWRIUkVGID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0KGFwcGxpZWRIUkVGKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rcz9bbmFtZV0gaXMgJ3N0cmluZydcbiAgICAgICAgICAgIHJlc291cmNlc1swXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc291cmNlc1xuXG4gICAgICBlbHNlIGlmIHR5cGU/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50Ll90eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2UgaWYgbGluaz9cbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IGNvbGxlY3Rpb24gb2JqZWN0JywgbGlua1xuICAgICAgIyBJdCdzIGEgY29sbGVjdGlvbiBvYmplY3QuXG4gICAgICB7aHJlZiwgaWRzLCB0eXBlfSA9IGxpbmtcblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLm5hbWVdID0gdGhpc1xuICAgICAgICBwcmludC53YXJuICdIUkVGJywgaHJlZlxuICAgICAgICBhcHBsaWVkSFJFRiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldChhcHBsaWVkSFJFRikudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICAgIGlmIHR5cGVvZiBAbGlua3M/W25hbWVdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXNvdXJjZXNbMF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXNvdXJjZXNcblxuICAgICAgZWxzZSBpZiB0eXBlPyBhbmQgaWRzP1xuICAgICAgICB0eXBlID0gQF90eXBlLmFwaUNsaWVudC5fdHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCwgYnV0IGJsYW5rJ1xuICAgICAgIyBJdCBleGlzdHMsIGJ1dCBpdCdzIGJsYW5rLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlIG51bGxcblxuICAjIFR1cm4gYSBKU09OLUFQSSBcImhyZWZcIiB0ZW1wbGF0ZSBpbnRvIGEgdXNhYmxlIFVSTC5cbiAgUExBQ0VIT0xERVJTX1BBVFRFUk46IC97KC4rPyl9L2dcbiAgYXBwbHlIUkVGOiAoaHJlZiwgY29udGV4dCkgLT5cbiAgICBocmVmLnJlcGxhY2UgQFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcbiAgICAgIHByaW50Lndhcm4gJ1NlZ21lbnRzJywgc2VnbWVudHNcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIHByaW50Lndhcm4gJ1ZhbHVlJywgdmFsdWVcblxuICAgICAgaWYgQXJyYXkuaXNBcnJheSB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4gJywnXG5cbiAgICAgIHVubGVzcyB0eXBlb2YgdmFsdWUgaXMgJ3N0cmluZydcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVmFsdWUgZm9yICcje3BhdGh9JyBpbiAnI3tocmVmfScgc2hvdWxkIGJlIGEgc3RyaW5nLlwiXG5cbiAgICAgIHZhbHVlXG5cbiAgdXBkYXRlOiAoY2hhbmdlU2V0ID0ge30pIC0+XG4gICAgQGVtaXQgJ3dpbGwtY2hhbmdlJ1xuICAgIGFjdHVhbENoYW5nZXMgPSAwXG5cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBjaGFuZ2VTZXQgd2hlbiBAW2tleV0gaXNudCB2YWx1ZVxuICAgICAgQFtrZXldID0gdmFsdWVcbiAgICAgIHVubGVzcyBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgICBAX2NoYW5nZWRLZXlzLnB1c2gga2V5XG4gICAgICBhY3R1YWxDaGFuZ2VzICs9IDFcblxuICAgIHVubGVzcyBhY3R1YWxDaGFuZ2VzIGlzIDBcbiAgICAgIEBlbWl0ICdjaGFuZ2UnXG4gICAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuXG4gIHNhdmU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtc2F2ZSdcblxuICAgIHBheWxvYWQgPSB7fVxuICAgIHBheWxvYWRbQF90eXBlLm5hbWVdID0gQGdldENoYW5nZXNTaW5jZVNhdmUoKVxuXG4gICAgc2F2ZSA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5wdXQgQGdldFVSTCgpLCBwYXlsb2FkXG4gICAgZWxzZVxuICAgICAgQF90eXBlLmFwaUNsaWVudC5wb3N0IEBfdHlwZS5nZXRVUkwoKSwgcGF5bG9hZFxuXG4gICAgc2F2ZS50aGVuIChbcmVzdWx0XSkgPT5cbiAgICAgIEB1cGRhdGUgcmVzdWx0XG4gICAgICBAX2NoYW5nZWRLZXlzLnNwbGljZSAwXG4gICAgICBAZW1pdCAnc2F2ZSdcbiAgICAgIHJlc3VsdFxuXG4gIHJlZnJlc2g6IC0+XG4gICAgaWYgQGlkXG4gICAgICBAX3R5cGUuZ2V0IEBpZFxuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciAnQ2FuXFwndCByZWZyZXNoIGEgcmVzb3VyY2Ugd2l0aCBubyBJRCdcblxuICBnZXRDaGFuZ2VzU2luY2VTYXZlOiAtPlxuICAgIGNoYW5nZXMgPSB7fVxuICAgIGZvciBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgY2hhbmdlc1trZXldID0gQFtrZXldXG4gICAgY2hhbmdlc1xuXG4gIGRlbGV0ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1kZWxldGUnXG4gICAgZGVsZXRpb24gPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQuZGVsZXRlKEBnZXRVUkwoKSkudGhlbiA9PlxuICAgICAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICBkZWxldGlvbi50aGVuID0+XG4gICAgICBAZW1pdCAnZGVsZXRlJ1xuXG4gIG1hdGNoZXNRdWVyeTogKHF1ZXJ5KSAtPlxuICAgIG1hdGNoZXMgPSB0cnVlXG4gICAgZm9yIHBhcmFtLCB2YWx1ZSBvZiBxdWVyeVxuICAgICAgaWYgQFtwYXJhbV0gaXNudCB2YWx1ZVxuICAgICAgICBtYXRjaGVzID0gZmFsc2VcbiAgICAgICAgYnJlYWtcbiAgICBtYXRjaGVzXG5cbiAgZ2V0VVJMOiAtPlxuICAgIEBocmVmIHx8IFtAX3R5cGUuZ2V0VVJMKCksIEBpZF0uam9pbiAnLydcblxuICB0b0pTT046IC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICByZXN1bHRbQF90eXBlLm5hbWVdID0ge31cbiAgICBmb3Igb3duIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3QgaW4gQF9yZWFkT25seUtleXNcbiAgICAgIHJlc3VsdFtAX3R5cGUubmFtZV1ba2V5XSA9IHZhbHVlXG4gICAgcmVzdWx0XG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5kZWZlciA9IC0+XG4gIGRlZmVycmFsID0ge31cbiAgZGVmZXJyYWwucHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgZGVmZXJyYWwucmVzb2x2ZSA9IHJlc29sdmVcbiAgICBkZWZlcnJhbC5yZWplY3QgPSByZWplY3RcbiAgZGVmZXJyYWxcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUeXBlIGV4dGVuZHMgRW1pdHRlclxuICBuYW1lOiAnJ1xuICBhcGlDbGllbnQ6IG51bGxcblxuICBsaW5rczogbnVsbCAjIFJlc291cmNlIGxpbmsgZGVmaW5pdGlvbnNcblxuICBkZWZlcnJhbHM6IG51bGwgIyBLZXlzIGFyZSBJRHMgb2Ygc3BlY2lmaWNhbGx5IHJlcXVlc3RlZCByZXNvdXJjZXMuXG4gIHJlc291cmNlUHJvbWlzZXM6IG51bGwgIyBLZXlzIGFyZSBJRHMsIHZhbHVlcyBhcmUgcHJvbWlzZXMgcmVzb2x2aW5nIHRvIHJlc291cmNlcy5cblxuICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAYXBpQ2xpZW50KSAtPlxuICAgIHN1cGVyXG4gICAgQGxpbmtzID0ge31cbiAgICBAZGVmZXJyYWxzID0ge31cbiAgICBAcmVzb3VyY2VQcm9taXNlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5lZCBhIG5ldyB0eXBlOicsIEBuYW1lXG5cbiAgZ2V0VVJMOiAtPlxuICAgICcvJyArIEBuYW1lXG5cbiAgcXVlcnlMb2NhbDogKHF1ZXJ5KSAtPlxuICAgIGV4aXN0TG9jYWxseSA9IChwcm9taXNlIGZvciBpZCwgcHJvbWlzZSBvZiBAcmVzb3VyY2VQcm9taXNlcyB3aGVuIG5vdCBAd2FpdGluZ0ZvciBpZClcbiAgICBQcm9taXNlLmFsbChleGlzdExvY2FsbHkpLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgIHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZS5tYXRjaGVzUXVlcnkgcXVlcnlcblxuICB3YWl0aW5nRm9yOiAoaWQpIC0+XG4gICAgQGRlZmVycmFsc1tpZF0/XG5cbiAgaGFzOiAoaWQpIC0+XG4gICAgQHJlc291cmNlUHJvbWlzZXNbaWRdPyBhbmQgbm90IEBkZWZlcnJhbHNbaWRdP1xuXG4gIGdldDogLT5cbiAgICBpZiB0eXBlb2YgYXJndW1lbnRzWzBdIGlzICdzdHJpbmcnXG4gICAgICBAZ2V0QnlJRCBhcmd1bWVudHMuLi5cbiAgICBlbHNlIGlmIEFycmF5LmlzQXJyYXkgYXJndW1lbnRzWzBdXG4gICAgICBAZ2V0QnlJRHMgYXJndW1lbnRzLi4uXG4gICAgZWxzZVxuICAgICAgQGdldEJ5UXVlcnkgYXJndW1lbnRzLi4uXG5cbiAgZ2V0QnlJRDogKGlkLCBvdGhlckFyZ3MuLi4pIC0+XG4gICAgQGdldEJ5SURzKFtpZF0sIG90aGVyQXJncy4uLikudGhlbiAoW3Jlc291cmNlXSkgLT5cbiAgICAgIHJlc291cmNlXG5cbiAgZ2V0QnlJRHM6IChpZHMsIG9wdGlvbnMsIGNhbGxiYWNrKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcnLCBAbmFtZSwgJ2J5IElEKHMpJywgaWRzXG4gICAgZm9yIGlkIGluIGlkc1xuICAgICAgQGRlZmVycmFsc1tpZF0gPSBkZWZlcigpXG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0gPSBAZGVmZXJyYWxzW2lkXS5wcm9taXNlXG5cbiAgICB1cmwgPSBbQGdldFVSTCgpLCBpZHMuam9pbiAnLCddLmpvaW4gJy8nXG4gICAgcHJpbnQubG9nICdSZXF1ZXN0IGZvcicsIEBuYW1lLCAnYXQnLCB1cmxcbiAgICBAYXBpQ2xpZW50LmdldCB1cmwsIG9wdGlvbnMsIG51bGwsIGNhbGxiYWNrXG5cbiAgICBQcm9taXNlLmFsbCAoQHJlc291cmNlUHJvbWlzZXNbaWRdIGZvciBpZCBpbiBpZHMpXG5cbiAgZ2V0QnlRdWVyeTogKHF1ZXJ5LCBsaW1pdCA9IEluZmluaXR5LCBjYWxsYmFjaykgLT5cbiAgICBAcXVlcnlMb2NhbChxdWVyeSkudGhlbiAoZXhpc3RpbmcpID0+XG4gICAgICBpZiBleGlzdGluZy5sZW5ndGggPj0gbGltaXRcbiAgICAgICAgZXhpc3RpbmdcbiAgICAgIGVsc2VcbiAgICAgICAgZXhpc3RpbmdJRHMgPSAoaWQgZm9yIHtpZH0gaW4gZXhpc3RpbmcpXG4gICAgICAgIHBhcmFtcyA9IHt9XG4gICAgICAgIGlmIGlzRmluaXRlIGxpbWl0XG4gICAgICAgICAgcGFyYW1zLmxpbWl0ID0gbGltaXQgLSBleGlzdGluZy5sZW5ndGhcbiAgICAgICAgbWVyZ2VJbnRvIHBhcmFtcywgcXVlcnlcblxuICAgICAgICBAYXBpQ2xpZW50LmdldChAZ2V0VVJMKCksIHBhcmFtcywgbnVsbCwgY2FsbGJhY2spLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgICAgICBmZXRjaGVkID0gKHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZS5pZCBub3QgaW4gZXhpc3RpbmdJRHMpXG4gICAgICAgICAgUHJvbWlzZS5hbGwgZXhpc3RpbmcuY29uY2F0IGZldGNoZWRcblxuICBhZGRFeGlzdGluZ1Jlc291cmNlOiAoZGF0YSkgLT5cbiAgICBpZiBAd2FpdGluZ0ZvciBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ0RvbmUgd2FpdGluZyBmb3InLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZFxuICAgICAgbmV3UmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXMsIGRhdGFcbiAgICAgIGRlZmVycmFsID0gQGRlZmVycmFsc1tkYXRhLmlkXVxuICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXSA9IG51bGxcbiAgICAgIGRlZmVycmFsLnJlc29sdmUgbmV3UmVzb3VyY2VcblxuICAgIGVsc2UgaWYgQGhhcyBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ1RoZScsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkLCAnYWxyZWFkeSBleGlzdHM7IHdpbGwgdXBkYXRlJ1xuICAgICAgQGdldChkYXRhLmlkKS50aGVuIChyZXNvdXJjZSkgLT5cbiAgICAgICAgcmVzb3VyY2UudXBkYXRlIGRhdGFcblxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnQWNjZXB0aW5nJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIG5ld1Jlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzLCBkYXRhXG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXSA9IFByb21pc2UucmVzb2x2ZSBuZXdSZXNvdXJjZVxuXG4gICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF1cblxuICBjcmVhdGVSZXNvdXJjZTogKGRhdGEpIC0+XG4gICAgcHJpbnQubG9nICdDcmVhdGluZyBhIG5ldycsIEBuYW1lLCAncmVzb3VyY2UnXG4gICAgcmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXNcbiAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuICAgIHJlc291cmNlXG4iXX0=

