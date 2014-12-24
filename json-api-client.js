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
    var data, linked, primaryResults, resource, resources, response, type, typeName, _j, _k, _len1, _len2, _ref1;
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
      this._handleLinks(response.links);
    }
    if ('linked' in response) {
      _ref1 = response.linked;
      for (type in _ref1) {
        linked = _ref1[type];
        linked = [].concat(linked);
        print.log('Got', linked.length, 'linked', type, 'resource(s)');
        for (_j = 0, _len1 = linked.length; _j < _len1; _j++) {
          resource = linked[_j];
          this.type(type).addExistingResource(resource);
        }
      }
    }
    if ('data' in response) {
      data = [].concat(response.data);
      print.log('Got a top-level "data" collection of', data.length, 'resource(s)');
      primaryResults = (function() {
        var _k, _len2, _results;
        _results = [];
        for (_k = 0, _len2 = data.length; _k < _len2; _k++) {
          resource = data[_k];
          _results.push(this.type(resource.type).addExistingResource(resource));
        }
        return _results;
      }).call(this);
    } else {
      primaryResults = [];
      for (typeName in response) {
        resources = response[typeName];
        if (!(typeName !== 'meta' && typeName !== 'links' && typeName !== 'linked' && typeName !== 'data')) {
          continue;
        }
        type = this.type(typeName);
        resources = [].concat(resources);
        print.log('Got a top-level', type, 'collection of', resources.length, 'resource(s)');
        for (_k = 0, _len2 = resources.length; _k < _len2; _k++) {
          resource = resources[_k];
          primaryResults.push(type.addExistingResource(resource));
        }
      }
    }
    print.info('Primary resources:', primaryResults);
    if (typeof callback === "function") {
      callback(request, response);
    }
    return Promise.all(primaryResults);
  };

  JSONAPIClient.prototype._handleLinks = function(links) {
    var attributeName, href, link, type, typeAndAttribute, typeName, _ref1, _results;
    _results = [];
    for (typeAndAttribute in links) {
      link = links[typeAndAttribute];
      _ref1 = typeAndAttribute.split('.'), typeName = _ref1[0], attributeName = _ref1[1];
      if (typeof link === 'string') {
        href = link;
      } else {
        href = link.href, type = link.type;
      }
      _results.push(this._handleLink(typeName, attributeName, href, type));
    }
    return _results;
  };

  JSONAPIClient.prototype._handleLink = function(typeName, attributeName, hrefTemplate, attributeTypeName) {
    var type, _base;
    type = this.type(typeName);
    if ((_base = type._links)[attributeName] == null) {
      _base[attributeName] = {};
    }
    if (hrefTemplate != null) {
      type._links[attributeName].href = hrefTemplate;
    }
    if (attributeTypeName != null) {
      return type._links[attributeName].type = attributeTypeName;
    }
  };

  JSONAPIClient.prototype.type = function(name) {
    var _base;
    if ((_base = this._types)[name] == null) {
      _base[name] = new Type(name, this);
    }
    return this._types[name];
  };

  JSONAPIClient.prototype.createType = function() {
    console.warn.apply(console, ['Use JSONAPIClient::type, not ::createType'].concat(__slice.call(arguments)));
    return this.type.apply(this, arguments);
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
    mergeInto.apply(null, [this].concat(__slice.call(config)));
    this.emit('create');
    this._type.emit('change');
    print.info("Constructed a resource: " + this._type._name + " " + this.id, this);
  }

  Resource.prototype.link = function(attribute) {
    print.info('Getting link:', attribute);
    if (attribute in this) {
      print.warn("No need to access a non-linked attribute via attr: " + attribute, this);
      return Promise.resolve(this[attribute]);
    } else if ((this.links != null) && attribute in this.links) {
      print.log('Link of resource');
      return this._getLink(attribute, this.links[attribute]);
    } else if (attribute in this._type._links) {
      print.log('Link of type');
      return this._getLink(attribute, this._type._links[attribute]);
    } else {
      print.error('Not a link at all');
      return Promise.reject(new Error("No attribute " + attribute + " of " + this._type._name + " resource"));
    }
  };

  Resource.prototype.attr = function() {
    console.warn.apply(console, ['Use Resource::link, not ::attr'].concat(__slice.call(arguments)));
    return this.link.apply(this, arguments);
  };

  Resource.prototype._getLink = function(name, link) {
    var appliedHREF, context, href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      print.log('Linked by ID(s)');
      ids = link;
      _ref = this._type._links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        context = {};
        context[this._type._name] = this;
        appliedHREF = this.applyHREF(href, context);
        return this._type._apiClient.get(appliedHREF).then((function(_this) {
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
        type = this._type._apiClient._types[type];
        return type.get(ids);
      }
    } else if (link != null) {
      print.log('Linked by collection object', link);
      href = link.href, ids = link.ids, type = link.type;
      if (href != null) {
        context = {};
        context[this._type._name] = this;
        print.warn('HREF', href);
        appliedHREF = this.applyHREF(href, context);
        return this._type._apiClient.get(appliedHREF).then((function(_this) {
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
        type = this._type._apiClient._types[type];
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
    payload[this._type._name] = this.getChangesSinceSave();
    save = this.id ? this._type._apiClient.put(this._getURL(), payload) : this._type._apiClient.post(this._type._getURL(), payload);
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
    deletion = this.id ? this._type._apiClient["delete"](this._getURL()).then((function(_this) {
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

  Resource.prototype._getURL = function() {
    var _ref;
    return this.href || (_ref = this._type)._getURL.apply(_ref, [this.id].concat(__slice.call(arguments)));
  };

  Resource.prototype.toJSON = function() {
    var key, result, value;
    result = {};
    for (key in this) {
      if (!__hasProp.call(this, key)) continue;
      value = this[key];
      if (key.charAt(0) !== '_' && __indexOf.call(this._readOnlyKeys, key) < 0) {
        result[key] = value;
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

  Type.prototype._name = '';

  Type.prototype._apiClient = null;

  Type.prototype._links = null;

  Type.prototype._deferrals = null;

  Type.prototype._resourcePromises = null;

  function Type(_name, _apiClient) {
    this._name = _name;
    this._apiClient = _apiClient;
    Type.__super__.constructor.apply(this, arguments);
    this._links = {};
    this._deferrals = {};
    this._resourcePromises = {};
    print.info('Defined a new type:', this._name);
  }

  Type.prototype._getURL = function() {
    return [null, this._name].concat(__slice.call(arguments)).join('/');
  };

  Type.prototype.queryLocal = function(query) {
    var existLocally, id, promise;
    existLocally = (function() {
      var _ref, _results;
      _ref = this._resourcePromises;
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
    return this._deferrals[id] != null;
  };

  Type.prototype.has = function(id) {
    return (this._resourcePromises[id] != null) && (this._deferrals[id] == null);
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
    print.info('Getting', this._name, 'by ID(s)', ids);
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      this._deferrals[id] = defer();
      this._resourcePromises[id] = this._deferrals[id].promise;
    }
    url = [this._getURL(), ids.join(',')].join('/');
    print.log('Request for', this._name, 'at', url);
    this._apiClient.get(url, options, null, callback);
    return Promise.all((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
        id = ids[_j];
        _results.push(this._resourcePromises[id]);
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
          return _this._apiClient.get(_this._getURL(), params, null, callback).then(function(resources) {
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
      print.log('Done waiting for', this._name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      deferral = this._deferrals[data.id];
      this._deferrals[data.id] = null;
      deferral.resolve(newResource);
    } else if (this.has(data.id)) {
      print.log('The', this._name, 'resource', data.id, 'already exists; will update');
      this.get(data.id).then(function(resource) {
        return resource.update(data);
      });
    } else {
      print.log('Accepting', this._name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      this._resourcePromises[data.id] = Promise.resolve(newResource);
    }
    return this._resourcePromises[data.id];
  };

  Type.prototype.create = function(data) {
    var resource;
    print.log('Creating a new', this._name, 'resource');
    resource = new Resource({
      _type: this
    });
    resource.update(data);
    return resource;
  };

  Type.prototype.createResource = function() {
    console.warn.apply(console, ['Use Type::create, not ::createResource'].concat(__slice.call(arguments)));
    return this.create.apply(this, arguments);
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxpREFBQTtFQUFBLGtCQUFBOztBQUFBLGNBQUEsR0FBaUIsUUFBakIsQ0FBQTs7QUFBQSxXQUVBLEdBQWMsU0FBQyxNQUFELEVBQVMsTUFBVCxHQUFBO0FBQ1osTUFBQSxzQkFBQTtBQUFBLEVBQUEsT0FBQTs7QUFBVztTQUFBLHFEQUFBO3VCQUFBO1VBQTZCLE1BQU8sQ0FBQSxDQUFBLENBQVAsS0FBYTtBQUExQyxzQkFBQSxFQUFBO09BQUE7QUFBQTs7TUFBWCxDQUFBO1NBQ0EsQ0FBQSxNQUFNLENBQUMsTUFBUCxhQUFpQixNQUFNLENBQUMsT0FBeEIsUUFBQSxLQUFrQyxPQUFPLENBQUMsTUFBMUMsRUFGWTtBQUFBLENBRmQsQ0FB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QkEsSUFBQyxDQUFBLGlCQUFrQixDQUFBLElBQUksQ0FBQyxFQUFMLEVBbEJBO0VBQUEsQ0FwRXJCLENBQUE7O0FBQUEsaUJBd0ZBLE1BQUEsR0FBUSxTQUFDLElBQUQsR0FBQTtBQUNOLFFBQUEsUUFBQTtBQUFBLElBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxnQkFBVixFQUE0QixJQUFDLENBQUEsS0FBN0IsRUFBb0MsVUFBcEMsQ0FBQSxDQUFBO0FBQUEsSUFDQSxRQUFBLEdBQWUsSUFBQSxRQUFBLENBQVM7QUFBQSxNQUFBLEtBQUEsRUFBTyxJQUFQO0tBQVQsQ0FEZixDQUFBO0FBQUEsSUFFQSxRQUFRLENBQUMsTUFBVCxDQUFnQixJQUFoQixDQUZBLENBQUE7V0FHQSxTQUpNO0VBQUEsQ0F4RlIsQ0FBQTs7QUFBQSxpQkE4RkEsY0FBQSxHQUFnQixTQUFBLEdBQUE7QUFDZCxJQUFBLE9BQU8sQ0FBQyxJQUFSLGdCQUFhLENBQUEsd0NBQTBDLFNBQUEsYUFBQSxTQUFBLENBQUEsQ0FBdkQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLE1BQUQsYUFBUSxTQUFSLEVBRmM7RUFBQSxDQTlGaEIsQ0FBQTs7Y0FBQTs7R0FEa0MsUUFacEMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJERUZBVUxUX1NJR05BTCA9ICdjaGFuZ2UnXG5cbmFycmF5c01hdGNoID0gKGFycmF5MSwgYXJyYXkyKSAtPlxuICBtYXRjaGVzID0gKGkgZm9yIGl0ZW0sIGkgaW4gYXJyYXkxIHdoZW4gYXJyYXkyW2ldIGlzIGl0ZW0pXG4gIGFycmF5MS5sZW5ndGggaXMgYXJyYXkyLmxlbmd0aCBpcyBtYXRjaGVzLmxlbmd0aFxuXG5jYWxsSGFuZGxlciA9IChoYW5kbGVyLCBwYXlsb2FkKSAtPlxuICAjIEhhbmRsZXJzIGNhbiBiZSBpbiB0aGUgZm9ybSBbY29udGV4dCwgZnVuY3Rpb24gb3IgbWV0aG9kIG5hbWUsIGJvdW5kIGFyZ3VtZW50cy4uLl1cbiAgaWYgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgW2NvbnRleHQsIGhhbmRsZXIsIGJvdW5kQXJncy4uLl0gPSBoYW5kbGVyXG4gICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgIGhhbmRsZXIgPSBjb250ZXh0W2hhbmRsZXJdXG4gIGVsc2VcbiAgICBib3VuZEFyZ3MgPSBbXVxuICBoYW5kbGVyLmFwcGx5IGNvbnRleHQsIGJvdW5kQXJncy5jb25jYXQgcGF5bG9hZFxuICByZXR1cm5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoW3NpZ25hbF0uLi4sIGNhbGxiYWNrKSAtPlxuICAgIHNpZ25hbCA/PSBERUZBVUxUX1NJR05BTFxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0gPz0gW11cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnB1c2ggY2FsbGJhY2tcbiAgICB0aGlzXG5cbiAgc3RvcExpc3RlbmluZzogKFtzaWduYWxdLi4uLCBjYWxsYmFjaykgLT5cbiAgICBzaWduYWwgPz0gREVGQVVMVF9TSUdOQUxcbiAgICBpZiBAX2NhbGxiYWNrc1tzaWduYWxdP1xuICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkgY2FsbGJhY2tcbiAgICAgICAgICAjIEFycmF5LXN0eWxlIGNhbGxiYWNrcyBuZWVkIG5vdCBiZSB0aGUgZXhhY3Qgc2FtZSBvYmplY3QuXG4gICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgIGZvciBoYW5kbGVyLCBpIGluIEBfY2FsbGJhY2tzW3NpZ25hbF0gYnkgLTEgd2hlbiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgICAgICAgIGlmIGFycmF5c01hdGNoIGNhbGxiYWNrLCBoYW5kbGVyXG4gICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICBlbHNlXG4gICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgIHVubGVzcyBpbmRleCBpcyAtMVxuICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIGluZGV4LCAxXG4gICAgICBlbHNlXG4gICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIDBcbiAgICB0aGlzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBzaWduYWwgPz0gREVGQVVMVF9TSUdOQUxcbiAgICBpZiBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIGNhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG4gICAgdGhpc1xuXG4gIGRlc3Ryb3k6IC0+XG4gICAgZm9yIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuICAgICAgZm9yIGNhbGxiYWNrIGluIEBfY2FsbGJhY2tzW3NpZ25hbF1cbiAgICAgICAgQHN0b3BMaXN0ZW5pbmcgc2lnbmFsLCBjYWxsYmFja1xuICAgIHJldHVyblxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xubWFrZUhUVFBSZXF1ZXN0ID0gcmVxdWlyZSAnLi9tYWtlLWh0dHAtcmVxdWVzdCdcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblR5cGUgPSByZXF1aXJlICcuL3R5cGUnXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbkRFRkFVTFRfVFlQRV9BTkRfQUNDRVBUID1cbiAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi92bmQuYXBpK2pzb24nXG4gICdBY2NlcHQnOiBcImFwcGxpY2F0aW9uL3ZuZC5hcGkranNvblwiXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSlNPTkFQSUNsaWVudFxuICByb290OiAnLydcbiAgaGVhZGVyczogbnVsbFxuXG4gIF90eXBlczogbnVsbCAjIFR5cGVzIHRoYXQgaGF2ZSBiZWVuIGRlZmluZWRcblxuICBjb25zdHJ1Y3RvcjogKEByb290LCBAaGVhZGVycyA9IHt9KSAtPlxuICAgIEBfdHlwZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0NyZWF0ZWQgYSBuZXcgSlNPTi1BUEkgY2xpZW50IGF0JywgQHJvb3RcblxuICByZXF1ZXN0OiAobWV0aG9kLCB1cmwsIGRhdGEsIGFkZGl0aW9uYWxIZWFkZXJzLCBjYWxsYmFjaykgLT5cbiAgICBoZWFkZXJzID0gbWVyZ2VJbnRvIHt9LCBERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCwgQGhlYWRlcnMsIGFkZGl0aW9uYWxIZWFkZXJzXG4gICAgbWFrZUhUVFBSZXF1ZXN0IG1ldGhvZCwgQHJvb3QgKyB1cmwsIGRhdGEsIGhlYWRlcnNcbiAgICAgIC50aGVuIChyZXF1ZXN0KSA9PlxuICAgICAgICBAcHJvY2Vzc1Jlc3BvbnNlVG8gcmVxdWVzdCwgY2FsbGJhY2tcbiAgICAgIC5jYXRjaCAocmVxdWVzdCkgPT5cbiAgICAgICAgQHByb2Nlc3NFcnJvclJlc3BvbnNlVG8gcmVxdWVzdFxuXG4gIGZvciBtZXRob2QgaW4gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJ10gdGhlbiBkbyAobWV0aG9kKSA9PlxuICAgIEA6OlttZXRob2RdID0gLT5cbiAgICAgIEByZXF1ZXN0IG1ldGhvZCwgYXJndW1lbnRzLi4uXG5cbiAgcHJvY2Vzc1Jlc3BvbnNlVG86IChyZXF1ZXN0LCBjYWxsYmFjaykgLT5cbiAgICByZXNwb25zZSA9IHRyeSBKU09OLnBhcnNlIHJlcXVlc3QucmVzcG9uc2VUZXh0XG4gICAgcmVzcG9uc2UgPz0ge31cbiAgICBwcmludC5sb2cgJ1Byb2Nlc3NpbmcgcmVzcG9uc2UnLCByZXNwb25zZVxuXG4gICAgaWYgJ2xpbmtzJyBvZiByZXNwb25zZVxuICAgICAgQF9oYW5kbGVMaW5rcyByZXNwb25zZS5saW5rc1xuXG4gICAgaWYgJ2xpbmtlZCcgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlLCBsaW5rZWQgb2YgcmVzcG9uc2UubGlua2VkXG4gICAgICAgIGxpbmtlZCA9IFtdLmNvbmNhdCBsaW5rZWRcbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCBsaW5rZWQubGVuZ3RoLCAnbGlua2VkJywgdHlwZSwgJ3Jlc291cmNlKHMpJ1xuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gbGlua2VkXG4gICAgICAgICAgQHR5cGUodHlwZSkuYWRkRXhpc3RpbmdSZXNvdXJjZSByZXNvdXJjZVxuXG4gICAgaWYgJ2RhdGEnIG9mIHJlc3BvbnNlXG4gICAgICBkYXRhID0gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsIFwiZGF0YVwiIGNvbGxlY3Rpb24gb2YnLCBkYXRhLmxlbmd0aCwgJ3Jlc291cmNlKHMpJ1xuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBmb3IgcmVzb3VyY2UgaW4gZGF0YVxuICAgICAgICBAdHlwZShyZXNvdXJjZS50eXBlKS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG4gICAgZWxzZVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBbXVxuICAgICAgZm9yIHR5cGVOYW1lLCByZXNvdXJjZXMgb2YgcmVzcG9uc2Ugd2hlbiB0eXBlTmFtZSBub3QgaW4gWydtZXRhJywgJ2xpbmtzJywgJ2xpbmtlZCcsICdkYXRhJ11cbiAgICAgICAgdHlwZSA9IEB0eXBlIHR5cGVOYW1lXG4gICAgICAgIHJlc291cmNlcyA9IFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwnLCB0eXBlLCAnY29sbGVjdGlvbiBvZicsIHJlc291cmNlcy5sZW5ndGgsICdyZXNvdXJjZShzKSdcbiAgICAgICAgZm9yIHJlc291cmNlIGluIHJlc291cmNlc1xuICAgICAgICAgIHByaW1hcnlSZXN1bHRzLnB1c2ggdHlwZS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG5cbiAgICBwcmludC5pbmZvICdQcmltYXJ5IHJlc291cmNlczonLCBwcmltYXJ5UmVzdWx0c1xuICAgIGNhbGxiYWNrPyByZXF1ZXN0LCByZXNwb25zZVxuICAgIFByb21pc2UuYWxsIHByaW1hcnlSZXN1bHRzXG5cbiAgX2hhbmRsZUxpbmtzOiAobGlua3MpIC0+XG4gICAgZm9yIHR5cGVBbmRBdHRyaWJ1dGUsIGxpbmsgb2YgbGlua3NcbiAgICAgIFt0eXBlTmFtZSwgYXR0cmlidXRlTmFtZV0gPSB0eXBlQW5kQXR0cmlidXRlLnNwbGl0ICcuJ1xuICAgICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZydcbiAgICAgICAgaHJlZiA9IGxpbmtcbiAgICAgIGVsc2VcbiAgICAgICAge2hyZWYsIHR5cGV9ID0gbGlua1xuICAgICAgQF9oYW5kbGVMaW5rIHR5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBocmVmLCB0eXBlXG5cbiAgX2hhbmRsZUxpbms6ICh0eXBlTmFtZSwgYXR0cmlidXRlTmFtZSwgaHJlZlRlbXBsYXRlLCBhdHRyaWJ1dGVUeXBlTmFtZSkgLT5cbiAgICB0eXBlID0gQHR5cGUgdHlwZU5hbWVcblxuICAgIHR5cGUuX2xpbmtzW2F0dHJpYnV0ZU5hbWVdID89IHt9XG4gICAgaWYgaHJlZlRlbXBsYXRlP1xuICAgICAgdHlwZS5fbGlua3NbYXR0cmlidXRlTmFtZV0uaHJlZiA9IGhyZWZUZW1wbGF0ZVxuICAgIGlmIGF0dHJpYnV0ZVR5cGVOYW1lP1xuICAgICAgdHlwZS5fbGlua3NbYXR0cmlidXRlTmFtZV0udHlwZSA9IGF0dHJpYnV0ZVR5cGVOYW1lXG5cbiAgdHlwZTogKG5hbWUpIC0+XG4gICAgQF90eXBlc1tuYW1lXSA/PSBuZXcgVHlwZSBuYW1lLCB0aGlzXG4gICAgQF90eXBlc1tuYW1lXVxuXG4gIGNyZWF0ZVR5cGU6IC0+XG4gICAgY29uc29sZS53YXJuICdVc2UgSlNPTkFQSUNsaWVudDo6dHlwZSwgbm90IDo6Y3JlYXRlVHlwZScsIGFyZ3VtZW50cy4uLlxuICAgIEB0eXBlIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NFcnJvclJlc3BvbnNlVG86IChyZXF1ZXN0KSAtPlxuICAgIFByb21pc2UucmVqZWN0IHRyeVxuICAgICAgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIGNhdGNoXG4gICAgICBuZXcgRXJyb3IgcmVxdWVzdC5yZXNwb25zZVRleHQgfHwgcmVxdWVzdC5zdGF0dXNcblxubW9kdWxlLmV4cG9ydHMudXRpbCA9IHttYWtlSFRUUFJlcXVlc3R9XG5tb2R1bGUuZXhwb3J0cy5UeXBlID0gVHlwZVxubW9kdWxlLmV4cG9ydHMuUmVzb3VyY2UgPSBSZXNvdXJjZVxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuXG4jIE1ha2UgYSByYXcsIG5vbi1BUEkgc3BlY2lmaWMgSFRUUCByZXF1ZXN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycywgbW9kaWZ5KSAtPlxuICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIG1ldGhvZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpXG4gICAgaWYgZGF0YT8gYW5kIG1ldGhvZCBpcyAnR0VUJ1xuICAgICAgdXJsICs9ICc/JyArIChba2V5LCB2YWx1ZV0uam9pbiAnPScgZm9yIGtleSwgdmFsdWUgb2YgZGF0YSkuam9pbiAnJidcbiAgICAgIGRhdGEgPSBudWxsXG5cbiAgICBwcmludC5pbmZvICdSZXF1ZXN0aW5nJywgbWV0aG9kLCB1cmwsIGRhdGFcblxuICAgIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3RcbiAgICByZXF1ZXN0Lm9wZW4gbWV0aG9kLCBlbmNvZGVVUkkgdXJsXG5cbiAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWVcblxuICAgIGlmIGhlYWRlcnM/XG4gICAgICBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBoZWFkZXJzXG4gICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlciBoZWFkZXIsIHZhbHVlXG5cbiAgICBpZiBtb2RpZnk/XG4gICAgICBtb2RpZnkgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoZSkgLT5cbiAgICAgIHByaW50LmxvZyAnUmVhZHkgc3RhdGU6JywgKGtleSBmb3Iga2V5LCB2YWx1ZSBvZiByZXF1ZXN0IHdoZW4gdmFsdWUgaXMgcmVxdWVzdC5yZWFkeVN0YXRlIGFuZCBrZXkgaXNudCAncmVhZHlTdGF0ZScpWzBdXG4gICAgICBpZiByZXF1ZXN0LnJlYWR5U3RhdGUgaXMgcmVxdWVzdC5ET05FXG4gICAgICAgIHByaW50LmxvZyAnRG9uZTsgc3RhdHVzIGlzJywgcmVxdWVzdC5zdGF0dXNcbiAgICAgICAgaWYgMjAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgMzAwXG4gICAgICAgICAgcmVzb2x2ZSByZXF1ZXN0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZWplY3QgcmVxdWVzdFxuXG4gICAgaWYgaGVhZGVycz9bJ0NvbnRlbnQtVHlwZSddLmluZGV4T2YoJ2pzb24nKSBpc250IC0xXG4gICAgICBkYXRhID0gSlNPTi5zdHJpbmdpZnkgZGF0YVxuXG4gICAgcmVxdWVzdC5zZW5kIGRhdGFcbiIsIiMgVGhpcyBpcyBhIHByZXR0eSBzdGFuZGFyZCBtZXJnZSBmdW5jdGlvbi5cbiMgTWVyZ2UgcHJvcGVydGllcyBvZiBhbGwgYXJndWVtZW50cyBpbnRvIHRoZSBmaXJzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBmb3IgYXJndW1lbnQgaW4gQXJyYXk6OnNsaWNlLmNhbGwgYXJndW1lbnRzLCAxIHdoZW4gYXJndW1lbnQ/XG4gICAgZm9yIGtleSwgdmFsdWUgb2YgYXJndW1lbnRcbiAgICAgIGFyZ3VtZW50c1swXVtrZXldID0gdmFsdWVcbiAgYXJndW1lbnRzWzBdXG4iLCJwcmludCA9IChsZXZlbCwgY29sb3IsIG1lc3NhZ2VzLi4uKSAtPlxuICAjIFNldCB0aGUgbG9nIGxldmVsIHdpdGggYSBnbG9iYWwgdmFyaWFibGUgb3IgYSBxdWVyeSBwYXJhbSBpbiB0aGUgcGFnZSdzIFVSTC5cbiAgc2V0dGluZyA9IEpTT05fQVBJX0xPR19MRVZFTCA/IHBhcnNlRmxvYXQgbG9jYXRpb24/LnNlYXJjaC5tYXRjaCgvanNvbi1hcGktbG9nPShcXGQrKS8pP1sxXSA/IDBcblxuICBpZiBzZXR0aW5nID49IGxldmVsXG4gICAgIyBXZSBjYW4gc3R5bGUgdGV4dCBpbiB0aGUgYnJvd3NlciBjb25zb2xlLCBidXQgbm90IGFzIGVhc2lseSBpbiBOb2RlLlxuICAgIHByZWZpeCA9IGlmIGxvY2F0aW9uP1xuICAgICAgWyclY3tqc29uOmFwaX0nLCBcImNvbG9yOiAje2NvbG9yfTsgZm9udDogYm9sZCAxZW0gbW9ub3NwYWNlO1wiXVxuICAgIGVsc2VcbiAgICAgIFsne2pzb246YXBpfSddXG5cbiAgICBjb25zb2xlPy5sb2cgcHJlZml4Li4uLCBtZXNzYWdlcy4uLlxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGxvZzogcHJpbnQuYmluZCBudWxsLCA0LCAnZ3JheSdcbiAgaW5mbzogcHJpbnQuYmluZCBudWxsLCAzLCAnYmx1ZSdcbiAgd2FybjogcHJpbnQuYmluZCBudWxsLCAyLCAnb3JhbmdlJ1xuICBlcnJvcjogcHJpbnQuYmluZCBudWxsLCAxLCAncmVkJ1xuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNvdXJjZSBleHRlbmRzIEVtaXR0ZXJcbiAgX3R5cGU6IG51bGwgIyBUaGUgcmVzb3VyY2UgdHlwZSBvYmplY3RcblxuICBfcmVhZE9ubHlLZXlzOiBbJ2lkJywgJ3R5cGUnLCAnaHJlZicsICdjcmVhdGVkX2F0JywgJ3VwZGF0ZWRfYXQnXVxuXG4gIF9jaGFuZ2VkS2V5czogbnVsbCAjIERpcnR5IGtleXNcblxuICBjb25zdHJ1Y3RvcjogKGNvbmZpZy4uLikgLT5cbiAgICBzdXBlclxuICAgIEBfY2hhbmdlZEtleXMgPSBbXVxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWcuLi5cbiAgICBAZW1pdCAnY3JlYXRlJ1xuICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG4gICAgcHJpbnQuaW5mbyBcIkNvbnN0cnVjdGVkIGEgcmVzb3VyY2U6ICN7QF90eXBlLl9uYW1lfSAje0BpZH1cIiwgdGhpc1xuXG4gICMgR2V0IGEgcHJvbWlzZSBmb3IgYW4gYXR0cmlidXRlIHJlZmVycmluZyB0byAoYW4pb3RoZXIgcmVzb3VyY2UocykuXG4gIGxpbms6IChhdHRyaWJ1dGUpIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZyBsaW5rOicsIGF0dHJpYnV0ZVxuICAgIGlmIGF0dHJpYnV0ZSBvZiB0aGlzXG4gICAgICBwcmludC53YXJuIFwiTm8gbmVlZCB0byBhY2Nlc3MgYSBub24tbGlua2VkIGF0dHJpYnV0ZSB2aWEgYXR0cjogI3thdHRyaWJ1dGV9XCIsIHRoaXNcbiAgICAgIFByb21pc2UucmVzb2x2ZSBAW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIEBsaW5rcz8gYW5kIGF0dHJpYnV0ZSBvZiBAbGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiByZXNvdXJjZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBsaW5rc1thdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBhdHRyaWJ1dGUgb2YgQF90eXBlLl9saW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHR5cGUnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAX3R5cGUuX2xpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlXG4gICAgICBwcmludC5lcnJvciAnTm90IGEgbGluayBhdCBhbGwnXG4gICAgICBQcm9taXNlLnJlamVjdCBuZXcgRXJyb3IgXCJObyBhdHRyaWJ1dGUgI3thdHRyaWJ1dGV9IG9mICN7QF90eXBlLl9uYW1lfSByZXNvdXJjZVwiXG5cbiAgYXR0cjogLT5cbiAgICBjb25zb2xlLndhcm4gJ1VzZSBSZXNvdXJjZTo6bGluaywgbm90IDo6YXR0cicsIGFyZ3VtZW50cy4uLlxuICAgIEBsaW5rIGFyZ3VtZW50cy4uLlxuXG4gIF9nZXRMaW5rOiAobmFtZSwgbGluaykgLT5cbiAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGxpbmtcbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IElEKHMpJ1xuICAgICAgaWRzID0gbGlua1xuICAgICAge2hyZWYsIHR5cGV9ID0gQF90eXBlLl9saW5rc1tuYW1lXVxuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUuX25hbWVdID0gdGhpc1xuICAgICAgICBhcHBsaWVkSFJFRiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuX2FwaUNsaWVudC5nZXQoYXBwbGllZEhSRUYpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBpZiB0eXBlb2YgQGxpbmtzP1tuYW1lXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmVzb3VyY2VzWzBdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb3VyY2VzXG5cbiAgICAgIGVsc2UgaWYgdHlwZT9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5fYXBpQ2xpZW50Ll90eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2UgaWYgbGluaz9cbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IGNvbGxlY3Rpb24gb2JqZWN0JywgbGlua1xuICAgICAgIyBJdCdzIGEgY29sbGVjdGlvbiBvYmplY3QuXG4gICAgICB7aHJlZiwgaWRzLCB0eXBlfSA9IGxpbmtcblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLl9uYW1lXSA9IHRoaXNcbiAgICAgICAgcHJpbnQud2FybiAnSFJFRicsIGhyZWZcbiAgICAgICAgYXBwbGllZEhSRUYgPSBAYXBwbHlIUkVGIGhyZWYsIGNvbnRleHRcbiAgICAgICAgQF90eXBlLl9hcGlDbGllbnQuZ2V0KGFwcGxpZWRIUkVGKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rcz9bbmFtZV0gaXMgJ3N0cmluZydcbiAgICAgICAgICAgIHJlc291cmNlc1swXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc291cmNlc1xuXG4gICAgICBlbHNlIGlmIHR5cGU/IGFuZCBpZHM/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuX2FwaUNsaWVudC5fdHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCwgYnV0IGJsYW5rJ1xuICAgICAgIyBJdCBleGlzdHMsIGJ1dCBpdCdzIGJsYW5rLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlIG51bGxcblxuICAjIFR1cm4gYSBKU09OLUFQSSBcImhyZWZcIiB0ZW1wbGF0ZSBpbnRvIGEgdXNhYmxlIFVSTC5cbiAgUExBQ0VIT0xERVJTX1BBVFRFUk46IC97KC4rPyl9L2dcbiAgYXBwbHlIUkVGOiAoaHJlZiwgY29udGV4dCkgLT5cbiAgICBocmVmLnJlcGxhY2UgQFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcbiAgICAgIHByaW50Lndhcm4gJ1NlZ21lbnRzJywgc2VnbWVudHNcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIHByaW50Lndhcm4gJ1ZhbHVlJywgdmFsdWVcblxuICAgICAgaWYgQXJyYXkuaXNBcnJheSB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4gJywnXG5cbiAgICAgIHVubGVzcyB0eXBlb2YgdmFsdWUgaXMgJ3N0cmluZydcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVmFsdWUgZm9yICcje3BhdGh9JyBpbiAnI3tocmVmfScgc2hvdWxkIGJlIGEgc3RyaW5nLlwiXG5cbiAgICAgIHZhbHVlXG5cbiAgdXBkYXRlOiAoY2hhbmdlU2V0ID0ge30pIC0+XG4gICAgQGVtaXQgJ3dpbGwtY2hhbmdlJ1xuICAgIGFjdHVhbENoYW5nZXMgPSAwXG5cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBjaGFuZ2VTZXQgd2hlbiBAW2tleV0gaXNudCB2YWx1ZVxuICAgICAgQFtrZXldID0gdmFsdWVcbiAgICAgIHVubGVzcyBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgICBAX2NoYW5nZWRLZXlzLnB1c2gga2V5XG4gICAgICBhY3R1YWxDaGFuZ2VzICs9IDFcblxuICAgIHVubGVzcyBhY3R1YWxDaGFuZ2VzIGlzIDBcbiAgICAgIEBlbWl0ICdjaGFuZ2UnXG4gICAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuXG4gIHNhdmU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtc2F2ZSdcblxuICAgIHBheWxvYWQgPSB7fVxuICAgIHBheWxvYWRbQF90eXBlLl9uYW1lXSA9IEBnZXRDaGFuZ2VzU2luY2VTYXZlKClcblxuICAgIHNhdmUgPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5fYXBpQ2xpZW50LnB1dCBAX2dldFVSTCgpLCBwYXlsb2FkXG4gICAgZWxzZVxuICAgICAgQF90eXBlLl9hcGlDbGllbnQucG9zdCBAX3R5cGUuX2dldFVSTCgpLCBwYXlsb2FkXG5cbiAgICBzYXZlLnRoZW4gKFtyZXN1bHRdKSA9PlxuICAgICAgQHVwZGF0ZSByZXN1bHRcbiAgICAgIEBfY2hhbmdlZEtleXMuc3BsaWNlIDBcbiAgICAgIEBlbWl0ICdzYXZlJ1xuICAgICAgcmVzdWx0XG5cbiAgcmVmcmVzaDogLT5cbiAgICBpZiBAaWRcbiAgICAgIEBfdHlwZS5nZXQgQGlkXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZWplY3QgbmV3IEVycm9yICdDYW5cXCd0IHJlZnJlc2ggYSByZXNvdXJjZSB3aXRoIG5vIElEJ1xuXG4gIGdldENoYW5nZXNTaW5jZVNhdmU6IC0+XG4gICAgY2hhbmdlcyA9IHt9XG4gICAgZm9yIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICBjaGFuZ2VzW2tleV0gPSBAW2tleV1cbiAgICBjaGFuZ2VzXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBlbWl0ICd3aWxsLWRlbGV0ZSdcbiAgICBkZWxldGlvbiA9IGlmIEBpZFxuICAgICAgQF90eXBlLl9hcGlDbGllbnQuZGVsZXRlKEBfZ2V0VVJMKCkpLnRoZW4gPT5cbiAgICAgICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZGVsZXRpb24udGhlbiA9PlxuICAgICAgQGVtaXQgJ2RlbGV0ZSdcblxuICBtYXRjaGVzUXVlcnk6IChxdWVyeSkgLT5cbiAgICBtYXRjaGVzID0gdHJ1ZVxuICAgIGZvciBwYXJhbSwgdmFsdWUgb2YgcXVlcnlcbiAgICAgIGlmIEBbcGFyYW1dIGlzbnQgdmFsdWVcbiAgICAgICAgbWF0Y2hlcyA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG4gICAgbWF0Y2hlc1xuXG4gIF9nZXRVUkw6IC0+XG4gICAgQGhyZWYgfHwgQF90eXBlLl9nZXRVUkwgQGlkLCBhcmd1bWVudHMuLi5cblxuICB0b0pTT046IC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICBmb3Igb3duIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3QgaW4gQF9yZWFkT25seUtleXNcbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbmRlZmVyID0gLT5cbiAgZGVmZXJyYWwgPSB7fVxuICBkZWZlcnJhbC5wcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBkZWZlcnJhbC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgIGRlZmVycmFsLnJlamVjdCA9IHJlamVjdFxuICBkZWZlcnJhbFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGUgZXh0ZW5kcyBFbWl0dGVyXG4gIF9uYW1lOiAnJ1xuICBfYXBpQ2xpZW50OiBudWxsXG5cbiAgX2xpbmtzOiBudWxsICMgUmVzb3VyY2UgbGluayBkZWZpbml0aW9uc1xuXG4gIF9kZWZlcnJhbHM6IG51bGwgIyBLZXlzIGFyZSBJRHMgb2Ygc3BlY2lmaWNhbGx5IHJlcXVlc3RlZCByZXNvdXJjZXMuXG4gIF9yZXNvdXJjZVByb21pc2VzOiBudWxsICMgS2V5cyBhcmUgSURzLCB2YWx1ZXMgYXJlIHByb21pc2VzIHJlc29sdmluZyB0byByZXNvdXJjZXMuXG5cbiAgY29uc3RydWN0b3I6IChAX25hbWUsIEBfYXBpQ2xpZW50KSAtPlxuICAgIHN1cGVyXG4gICAgQF9saW5rcyA9IHt9XG4gICAgQF9kZWZlcnJhbHMgPSB7fVxuICAgIEBfcmVzb3VyY2VQcm9taXNlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5lZCBhIG5ldyB0eXBlOicsIEBfbmFtZVxuXG4gIF9nZXRVUkw6IC0+XG4gICAgW251bGwsIEBfbmFtZSwgYXJndW1lbnRzLi4uXS5qb2luICcvJ1xuXG4gIHF1ZXJ5TG9jYWw6IChxdWVyeSkgLT5cbiAgICBleGlzdExvY2FsbHkgPSAocHJvbWlzZSBmb3IgaWQsIHByb21pc2Ugb2YgQF9yZXNvdXJjZVByb21pc2VzIHdoZW4gbm90IEB3YWl0aW5nRm9yIGlkKVxuICAgIFByb21pc2UuYWxsKGV4aXN0TG9jYWxseSkudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgcmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlLm1hdGNoZXNRdWVyeSBxdWVyeVxuXG4gIHdhaXRpbmdGb3I6IChpZCkgLT5cbiAgICBAX2RlZmVycmFsc1tpZF0/XG5cbiAgaGFzOiAoaWQpIC0+XG4gICAgQF9yZXNvdXJjZVByb21pc2VzW2lkXT8gYW5kIG5vdCBAX2RlZmVycmFsc1tpZF0/XG5cbiAgZ2V0OiAtPlxuICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZydcbiAgICAgIEBnZXRCeUlEIGFyZ3VtZW50cy4uLlxuICAgIGVsc2UgaWYgQXJyYXkuaXNBcnJheSBhcmd1bWVudHNbMF1cbiAgICAgIEBnZXRCeUlEcyBhcmd1bWVudHMuLi5cbiAgICBlbHNlXG4gICAgICBAZ2V0QnlRdWVyeSBhcmd1bWVudHMuLi5cblxuICBnZXRCeUlEOiAoaWQsIG90aGVyQXJncy4uLikgLT5cbiAgICBAZ2V0QnlJRHMoW2lkXSwgb3RoZXJBcmdzLi4uKS50aGVuIChbcmVzb3VyY2VdKSAtPlxuICAgICAgcmVzb3VyY2VcblxuICBnZXRCeUlEczogKGlkcywgb3B0aW9ucywgY2FsbGJhY2spIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZycsIEBfbmFtZSwgJ2J5IElEKHMpJywgaWRzXG4gICAgZm9yIGlkIGluIGlkc1xuICAgICAgQF9kZWZlcnJhbHNbaWRdID0gZGVmZXIoKVxuICAgICAgQF9yZXNvdXJjZVByb21pc2VzW2lkXSA9IEBfZGVmZXJyYWxzW2lkXS5wcm9taXNlXG5cbiAgICB1cmwgPSBbQF9nZXRVUkwoKSwgaWRzLmpvaW4gJywnXS5qb2luICcvJ1xuICAgIHByaW50LmxvZyAnUmVxdWVzdCBmb3InLCBAX25hbWUsICdhdCcsIHVybFxuICAgIEBfYXBpQ2xpZW50LmdldCB1cmwsIG9wdGlvbnMsIG51bGwsIGNhbGxiYWNrXG5cbiAgICBQcm9taXNlLmFsbCAoQF9yZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSwgY2FsbGJhY2spIC0+XG4gICAgQHF1ZXJ5TG9jYWwocXVlcnkpLnRoZW4gKGV4aXN0aW5nKSA9PlxuICAgICAgaWYgZXhpc3RpbmcubGVuZ3RoID49IGxpbWl0XG4gICAgICAgIGV4aXN0aW5nXG4gICAgICBlbHNlXG4gICAgICAgIGV4aXN0aW5nSURzID0gKGlkIGZvciB7aWR9IGluIGV4aXN0aW5nKVxuICAgICAgICBwYXJhbXMgPSB7fVxuICAgICAgICBpZiBpc0Zpbml0ZSBsaW1pdFxuICAgICAgICAgIHBhcmFtcy5saW1pdCA9IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIG1lcmdlSW50byBwYXJhbXMsIHF1ZXJ5XG5cbiAgICAgICAgQF9hcGlDbGllbnQuZ2V0KEBfZ2V0VVJMKCksIHBhcmFtcywgbnVsbCwgY2FsbGJhY2spLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgICAgICBmZXRjaGVkID0gKHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZS5pZCBub3QgaW4gZXhpc3RpbmdJRHMpXG4gICAgICAgICAgUHJvbWlzZS5hbGwgZXhpc3RpbmcuY29uY2F0IGZldGNoZWRcblxuICBhZGRFeGlzdGluZ1Jlc291cmNlOiAoZGF0YSkgLT5cbiAgICBpZiBAd2FpdGluZ0ZvciBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ0RvbmUgd2FpdGluZyBmb3InLCBAX25hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIG5ld1Jlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzLCBkYXRhXG4gICAgICBkZWZlcnJhbCA9IEBfZGVmZXJyYWxzW2RhdGEuaWRdXG4gICAgICBAX2RlZmVycmFsc1tkYXRhLmlkXSA9IG51bGxcbiAgICAgIGRlZmVycmFsLnJlc29sdmUgbmV3UmVzb3VyY2VcblxuICAgIGVsc2UgaWYgQGhhcyBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ1RoZScsIEBfbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2FscmVhZHkgZXhpc3RzOyB3aWxsIHVwZGF0ZSdcbiAgICAgIEBnZXQoZGF0YS5pZCkudGhlbiAocmVzb3VyY2UpIC0+XG4gICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0FjY2VwdGluZycsIEBfbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZFxuICAgICAgbmV3UmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXMsIGRhdGFcbiAgICAgIEBfcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXSA9IFByb21pc2UucmVzb2x2ZSBuZXdSZXNvdXJjZVxuXG4gICAgQF9yZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdXG5cbiAgY3JlYXRlOiAoZGF0YSkgLT5cbiAgICBwcmludC5sb2cgJ0NyZWF0aW5nIGEgbmV3JywgQF9uYW1lLCAncmVzb3VyY2UnXG4gICAgcmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXNcbiAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuICAgIHJlc291cmNlXG5cbiAgY3JlYXRlUmVzb3VyY2U6IC0+XG4gICAgY29uc29sZS53YXJuICdVc2UgVHlwZTo6Y3JlYXRlLCBub3QgOjpjcmVhdGVSZXNvdXJjZScsIGFyZ3VtZW50cy4uLlxuICAgIEBjcmVhdGUgYXJndW1lbnRzLi4uXG4iXX0=

