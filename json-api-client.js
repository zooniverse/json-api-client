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
var DEFAULT_TYPE_AND_ACCEPT, JSONAPIClient, RESERVED_TOP_LEVEL_KEYS, Resource, Type, makeHTTPRequest, mergeInto,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

makeHTTPRequest = _dereq_('./make-http-request');

mergeInto = _dereq_('./merge-into');

Type = _dereq_('./type');

Resource = _dereq_('./resource');

DEFAULT_TYPE_AND_ACCEPT = {
  'Content-Type': 'application/vnd.api+json',
  'Accept': 'application/vnd.api+json'
};

RESERVED_TOP_LEVEL_KEYS = ['meta', 'links', 'linked', 'data'];

module.exports = JSONAPIClient = (function() {
  var method, _fn, _i, _len, _ref;

  JSONAPIClient.prototype.root = '/';

  JSONAPIClient.prototype.headers = null;

  JSONAPIClient.prototype._types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers != null ? headers : {};
    this._types = {};
  }

  JSONAPIClient.prototype.request = function(method, url, payload, headers) {
    var allHeaders, fullURL;
    fullURL = this.root + url;
    allHeaders = mergeInto({}, DEFAULT_TYPE_AND_ACCEPT, this.headers, headers);
    return makeHTTPRequest(method, fullURL, payload, allHeaders).then(this.processResponseTo.bind(this))["catch"](this.processErrorResponseTo.bind(this));
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

  JSONAPIClient.prototype.processResponseTo = function(request) {
    var headers, linked, resourceData, resources, response, results, type, typeName, _j, _k, _l, _len1, _len2, _len3, _ref1, _ref2, _ref3, _ref4;
    response = (function() {
      try {
        return JSON.parse(request.responseText);
      } catch (_error) {
        return {};
      }
    })();
    headers = this._getHeadersFor(request);
    if ('links' in response) {
      this._handleLinks(response.links);
    }
    if ('linked' in response) {
      _ref1 = response.linked;
      for (type in _ref1) {
        linked = _ref1[type];
        _ref2 = [].concat(linked);
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          resourceData = _ref2[_j];
          this.type(type).create(resourceData, headers);
        }
      }
    }
    results = [];
    if ('data' in response) {
      _ref3 = [].concat(response.data);
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        resourceData = _ref3[_k];
        results.push(this.type(resourceData.type).create(resourceData, headers));
      }
    }
    for (typeName in response) {
      resources = response[typeName];
      if (__indexOf.call(RESERVED_TOP_LEVEL_KEYS, typeName) < 0) {
        _ref4 = [].concat(resources);
        for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
          resourceData = _ref4[_l];
          results.push(this.type(typeName).create(resourceData, headers));
        }
      }
    }
    return results;
  };

  JSONAPIClient.prototype._getHeadersFor = function(request) {
    var headers, key, pair, value, _j, _len1, _ref1, _ref2;
    headers = {};
    _ref1 = request.getAllResponseHeaders().split('\n');
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      pair = _ref1[_j];
      if (!(pair !== '')) {
        continue;
      }
      _ref2 = pair.split(':'), key = _ref2[0], value = 2 <= _ref2.length ? __slice.call(_ref2, 1) : [];
      headers[key.trim()] = value.join(':').trim();
    }
    return headers;
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

  JSONAPIClient.prototype.processErrorResponseTo = function(request) {
    return Promise.reject(request);
  };

  JSONAPIClient.prototype.createType = function() {
    console.warn.apply(console, ['Use JSONAPIClient::type, not ::createType'].concat(__slice.call(arguments)));
    return this.type.apply(this, arguments);
  };

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};

module.exports.Type = Type;

module.exports.Resource = Resource;



},{"./make-http-request":3,"./merge-into":4,"./resource":5,"./type":6}],3:[function(_dereq_,module,exports){
module.exports = function(method, url, data, headers, modify) {
  return new Promise(function(resolve, reject) {
    var header, key, request, value, _ref;
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
      if (request.readyState === request.DONE) {
        if ((200 <= (_ref = request.status) && _ref < 300)) {
          return resolve(request);
        } else {
          return reject(request);
        }
      }
    };
    if ((headers != null ? (_ref = headers['Content-Type']) != null ? _ref.indexOf('json') : void 0 : void 0) !== -1) {
      data = JSON.stringify(data);
    }
    return request.send(data);
  });
};



},{}],4:[function(_dereq_,module,exports){
var __hasProp = {}.hasOwnProperty;

module.exports = function() {
  var argument, key, value, _i, _len, _ref;
  _ref = Array.prototype.slice.call(arguments, 1);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    argument = _ref[_i];
    if (argument != null) {
      for (key in argument) {
        if (!__hasProp.call(argument, key)) continue;
        value = argument[key];
        arguments[0][key] = value;
      }
    }
  }
  return arguments[0];
};



},{}],5:[function(_dereq_,module,exports){
var Emitter, PLACEHOLDERS_PATTERN, Resource, mergeInto,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

PLACEHOLDERS_PATTERN = /{(.+?)}/g;

module.exports = Resource = (function(_super) {
  __extends(Resource, _super);

  Resource.prototype._type = null;

  Resource.prototype._headers = null;

  Resource.prototype._changedKeys = null;

  Resource.prototype._readOnlyKeys = ['id', 'type', 'href', 'created_at', 'updated_at'];

  function Resource() {
    var configs;
    configs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Resource.__super__.constructor.apply(this, arguments);
    this._changedKeys = [];
    mergeInto.apply(null, [this].concat(__slice.call(configs)));
    this.emit('create');
    this._type.emit('change');
  }

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
    var headers, payload, save;
    this.emit('will-save');
    payload = {};
    payload[this._type._name] = this.getChangesSinceSave();
    save = this.id ? (headers = {}, 'Last-Modified' in this._headers ? headers['If-Unmodified-Since'] = this._headers['Last-Modified'] : void 0, this._type._client.put(this._getURL(), payload, headers)) : this._type._client.post(this._type._getURL(), payload);
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

  Resource.prototype.hasUnsavedChanges = function() {
    return this._changedKeys.length !== 0;
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

  Resource.prototype.getFresh = function() {
    if (this.id) {
      return this._type.get(this.id);
    } else {
      return Promise.reject(new Error('Can\'t get fresh copy of a resource with no ID'));
    }
  };

  Resource.prototype["delete"] = function() {
    var deletion, headers;
    this.emit('will-delete');
    deletion = this.id ? (headers = {}, 'Last-Modified' in this._headers ? headers['If-Unmodified-Since'] = this._headers['Last-Modified'] : void 0, this._type._client["delete"](this._getURL(), null, headers).then((function(_this) {
      return function() {
        _this._type.emit('change');
        return null;
      };
    })(this))) : Promise.resolve();
    return deletion.then((function(_this) {
      return function() {
        return _this.emit('delete');
      };
    })(this));
  };

  Resource.prototype.link = function(name) {
    var link, _ref, _ref1;
    link = (_ref = (_ref1 = this.links) != null ? _ref1[name] : void 0) != null ? _ref : this._type._links[name];
    if (link != null) {
      return this._getLink(name, link);
    } else {
      throw new Error("No link '" + name + "' defined for " + this._type.name + " " + this.id);
    }
  };

  Resource.prototype._getLink = function(name, link) {
    var href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      _ref = this._type._links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        return this._type._client.get(this._applyHREF(href)).then((function(_this) {
          return function(resources) {
            if (typeof _this.links[name] === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
      } else if (type != null) {
        type = this._type._client._types[type];
        return type.get(link);
      } else {
        throw new Error("No HREF or type for link '" + name + "' of " + this._type.name + " " + this.id);
      }
    } else {
      href = link.href, ids = link.ids, type = link.type;
      if (href != null) {
        return this._type._client.get(this._applyHREF(href)).then((function(_this) {
          return function(resources) {
            if (typeof _this.links[name] === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
      } else if ((type != null) && (ids != null)) {
        type = this._type._client._types[type];
        return type.get(ids);
      } else {
        throw new Error("No HREF, type, or IDs for link '" + name + "' of " + this._type.name + " " + this.id);
      }
    }
  };

  Resource.prototype._applyHREF = function(href) {
    var context;
    context = {};
    context[this._type._name] = this;
    return href.replace(PLACEHOLDERS_PATTERN, function(_, path) {
      var segment, segments, value, _ref, _ref1;
      segments = path.split('.');
      value = context;
      while (segments.length !== 0) {
        segment = segments.shift();
        value = (_ref = value[segment]) != null ? _ref : (_ref1 = value.links) != null ? _ref1[segment] : void 0;
      }
      if (Array.isArray(value)) {
        value = value.join(',');
      }
      if (typeof value !== 'string') {
        throw new Error("Value for '" + path + "' in '" + href + "' should be a string.");
      }
      return value;
    });
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

  Resource.prototype.attr = function() {
    console.warn.apply(console, ['Use Resource::link, not ::attr'].concat(__slice.call(arguments)));
    return this.link.apply(this, arguments);
  };

  return Resource;

})(Emitter);



},{"./emitter":1,"./merge-into":4}],6:[function(_dereq_,module,exports){
var Emitter, Resource, Type,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Emitter = _dereq_('./emitter');

Resource = _dereq_('./resource');

module.exports = Type = (function(_super) {
  __extends(Type, _super);

  Type.prototype._name = '';

  Type.prototype._client = null;

  Type.prototype._links = null;

  function Type(_name, _client) {
    this._name = _name;
    this._client = _client;
    Type.__super__.constructor.apply(this, arguments);
    this._links = {};
  }

  Type.prototype.create = function(data, headers) {
    if (headers == null) {
      headers = {};
    }
    return new Resource(data, {
      _type: this,
      _headers: headers
    });
  };

  Type.prototype.get = function() {
    if (typeof arguments[0] === 'string') {
      return this._getByID.apply(this, arguments);
    } else if (Array.isArray(arguments[0])) {
      return this._getByIDs.apply(this, arguments);
    } else {
      return this._getByQuery.apply(this, arguments);
    }
  };

  Type.prototype._getByID = function() {
    var id, otherArgs;
    id = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return this._getByIDs.apply(this, [[id]].concat(__slice.call(otherArgs))).then(function(_arg) {
      var resource;
      resource = _arg[0];
      return resource;
    });
  };

  Type.prototype._getByIDs = function() {
    var ids, otherArgs, url, _ref;
    ids = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    url = this._getURL(ids.join(','));
    return (_ref = this._client).get.apply(_ref, [url].concat(__slice.call(otherArgs)));
  };

  Type.prototype._getByQuery = function() {
    var otherArgs, query, _ref;
    query = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (_ref = this._client).get.apply(_ref, [this._getURL(), query].concat(__slice.call(otherArgs)));
  };

  Type.prototype._getURL = function() {
    return ['', this._name].concat(__slice.call(arguments)).join('/');
  };

  Type.prototype.createResource = function() {
    console.warn.apply(console, ['Use Type::create, not ::createResource'].concat(__slice.call(arguments)));
    return this.create.apply(this, arguments);
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./resource":5}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxpREFBQTtFQUFBLGtCQUFBOztBQUFBLGNBQUEsR0FBaUIsUUFBakIsQ0FBQTs7QUFBQSxXQUVBLEdBQWMsU0FBQyxNQUFELEVBQVMsTUFBVCxHQUFBO0FBQ1osTUFBQSxzQkFBQTtBQUFBLEVBQUEsT0FBQTs7QUFBVztTQUFBLHFEQUFBO3VCQUFBO1VBQTZCLE1BQU8sQ0FBQSxDQUFBLENBQVAsS0FBYTtBQUExQyxzQkFBQSxFQUFBO09BQUE7QUFBQTs7TUFBWCxDQUFBO1NBQ0EsQ0FBQSxNQUFNLENBQUMsTUFBUCxhQUFpQixNQUFNLENBQUMsT0FBeEIsUUFBQSxLQUFrQyxPQUFPLENBQUMsTUFBMUMsRUFGWTtBQUFBLENBRmQsQ0FBQTs7QUFBQSxXQU1BLEdBQWMsU0FBQyxPQUFELEVBQVUsT0FBVixHQUFBO0FBRVosTUFBQSx3QkFBQTtBQUFB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QUEsSUFBQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBUyxHQUFHLENBQUMsSUFBSixDQUFTLEdBQVQsQ0FBVCxDQUFOLENBQUE7V0FDQSxRQUFBLElBQUMsQ0FBQSxPQUFELENBQVEsQ0FBQyxHQUFULGFBQWEsQ0FBQSxHQUFLLFNBQUEsYUFBQSxTQUFBLENBQUEsQ0FBbEIsRUFGUztFQUFBLENBeEJYLENBQUE7O0FBQUEsaUJBNEJBLFdBQUEsR0FBYSxTQUFBLEdBQUE7QUFDWCxRQUFBLHNCQUFBO0FBQUEsSUFEWSxzQkFBTyxtRUFDbkIsQ0FBQTtXQUFBLFFBQUEsSUFBQyxDQUFBLE9BQUQsQ0FBUSxDQUFDLEdBQVQsYUFBYSxDQUFBLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxFQUFZLEtBQU8sU0FBQSxhQUFBLFNBQUEsQ0FBQSxDQUFoQyxFQURXO0VBQUEsQ0E1QmIsQ0FBQTs7QUFBQSxpQkErQkEsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNOLENBQUEsRUFBQSxFQUFJLElBQUMsQ0FBQSxLQUFPLFNBQUEsYUFBQSxTQUFBLENBQUEsQ0FBYSxDQUFDLElBQTNCLENBQWdDLEdBQWhDLEVBRE87RUFBQSxDQS9CVCxDQUFBOztBQUFBLGlCQWtDQSxjQUFBLEdBQWdCLFNBQUEsR0FBQTtBQUNkLElBQUEsT0FBTyxDQUFDLElBQVIsZ0JBQWEsQ0FBQSx3Q0FBMEMsU0FBQSxhQUFBLFNBQUEsQ0FBQSxDQUF2RCxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsTUFBRCxhQUFRLFNBQVIsRUFGYztFQUFBLENBbENoQixDQUFBOztjQUFBOztHQURrQyxRQUhwQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIkRFRkFVTFRfU0lHTkFMID0gJ2NoYW5nZSdcblxuYXJyYXlzTWF0Y2ggPSAoYXJyYXkxLCBhcnJheTIpIC0+XG4gIG1hdGNoZXMgPSAoaSBmb3IgaXRlbSwgaSBpbiBhcnJheTEgd2hlbiBhcnJheTJbaV0gaXMgaXRlbSlcbiAgYXJyYXkxLmxlbmd0aCBpcyBhcnJheTIubGVuZ3RoIGlzIG1hdGNoZXMubGVuZ3RoXG5cbmNhbGxIYW5kbGVyID0gKGhhbmRsZXIsIHBheWxvYWQpIC0+XG4gICMgSGFuZGxlcnMgY2FuIGJlIGluIHRoZSBmb3JtIFtjb250ZXh0LCBmdW5jdGlvbiBvciBtZXRob2QgbmFtZSwgYm91bmQgYXJndW1lbnRzLi4uXVxuICBpZiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICBbY29udGV4dCwgaGFuZGxlciwgYm91bmRBcmdzLi4uXSA9IGhhbmRsZXJcbiAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgaGFuZGxlciA9IGNvbnRleHRbaGFuZGxlcl1cbiAgZWxzZVxuICAgIGJvdW5kQXJncyA9IFtdXG4gIGhhbmRsZXIuYXBwbHkgY29udGV4dCwgYm91bmRBcmdzLmNvbmNhdCBwYXlsb2FkXG4gIHJldHVyblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVtaXR0ZXJcbiAgX2NhbGxiYWNrczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBfY2FsbGJhY2tzID0ge31cblxuICBsaXN0ZW46IChbc2lnbmFsXS4uLiwgY2FsbGJhY2spIC0+XG4gICAgc2lnbmFsID89IERFRkFVTFRfU0lHTkFMXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXSA/PSBbXVxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0ucHVzaCBjYWxsYmFja1xuICAgIHRoaXNcblxuICBzdG9wTGlzdGVuaW5nOiAoW3NpZ25hbF0uLi4sIGNhbGxiYWNrKSAtPlxuICAgIHNpZ25hbCA/PSBERUZBVUxUX1NJR05BTFxuICAgIGlmIEBfY2FsbGJhY2tzW3NpZ25hbF0/XG4gICAgICBpZiBjYWxsYmFjaz9cbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheSBjYWxsYmFja1xuICAgICAgICAgICMgQXJyYXktc3R5bGUgY2FsbGJhY2tzIG5lZWQgbm90IGJlIHRoZSBleGFjdCBzYW1lIG9iamVjdC5cbiAgICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgICAgZm9yIGhhbmRsZXIsIGkgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXSBieSAtMSB3aGVuIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgICAgICAgaWYgYXJyYXlzTWF0Y2ggY2FsbGJhY2ssIGhhbmRsZXJcbiAgICAgICAgICAgICAgaW5kZXggPSBpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpbmRleCA9IEBfY2FsbGJhY2tzW3NpZ25hbF0ubGFzdEluZGV4T2YgY2FsbGJhY2tcbiAgICAgICAgdW5sZXNzIGluZGV4IGlzIC0xXG4gICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgaW5kZXgsIDFcbiAgICAgIGVsc2VcbiAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgMFxuICAgIHRoaXNcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkLi4uKSAtPlxuICAgIHNpZ25hbCA/PSBERUZBVUxUX1NJR05BTFxuICAgIGlmIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuICAgICAgZm9yIGNhbGxiYWNrIGluIEBfY2FsbGJhY2tzW3NpZ25hbF1cbiAgICAgICAgY2FsbEhhbmRsZXIgY2FsbGJhY2ssIHBheWxvYWRcbiAgICB0aGlzXG5cbiAgZGVzdHJveTogLT5cbiAgICBmb3Igc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBAc3RvcExpc3RlbmluZyBzaWduYWwsIGNhbGxiYWNrXG4gICAgcmV0dXJuXG4iLCJtYWtlSFRUUFJlcXVlc3QgPSByZXF1aXJlICcuL21ha2UtaHR0cC1yZXF1ZXN0J1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuVHlwZSA9IHJlcXVpcmUgJy4vdHlwZSdcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxuREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQgPVxuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5hcGkranNvbidcbiAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi92bmQuYXBpK2pzb24nXG5cblJFU0VSVkVEX1RPUF9MRVZFTF9LRVlTID0gWydtZXRhJywgJ2xpbmtzJywgJ2xpbmtlZCcsICdkYXRhJ11cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKU09OQVBJQ2xpZW50XG4gIHJvb3Q6ICcvJ1xuICBoZWFkZXJzOiBudWxsXG5cbiAgX3R5cGVzOiBudWxsICMgVHlwZXMgdGhhdCBoYXZlIGJlZW4gZGVmaW5lZFxuXG4gIGNvbnN0cnVjdG9yOiAoQHJvb3QsIEBoZWFkZXJzID0ge30pIC0+XG4gICAgQF90eXBlcyA9IHt9XG5cbiAgcmVxdWVzdDogKG1ldGhvZCwgdXJsLCBwYXlsb2FkLCBoZWFkZXJzKSAtPlxuICAgIGZ1bGxVUkwgPSBAcm9vdCArIHVybFxuICAgIGFsbEhlYWRlcnMgPSBtZXJnZUludG8ge30sIERFRkFVTFRfVFlQRV9BTkRfQUNDRVBULCBAaGVhZGVycywgaGVhZGVyc1xuXG4gICAgbWFrZUhUVFBSZXF1ZXN0IG1ldGhvZCwgZnVsbFVSTCwgcGF5bG9hZCwgYWxsSGVhZGVyc1xuICAgICAgLnRoZW4gQHByb2Nlc3NSZXNwb25zZVRvLmJpbmQgdGhpc1xuICAgICAgLmNhdGNoIEBwcm9jZXNzRXJyb3JSZXNwb25zZVRvLmJpbmQgdGhpc1xuXG4gIGZvciBtZXRob2QgaW4gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJ10gdGhlbiBkbyAobWV0aG9kKSA9PlxuICAgIEA6OlttZXRob2RdID0gLT5cbiAgICAgIEByZXF1ZXN0IG1ldGhvZCwgYXJndW1lbnRzLi4uXG5cbiAgcHJvY2Vzc1Jlc3BvbnNlVG86IChyZXF1ZXN0KSAtPlxuICAgIHJlc3BvbnNlID0gdHJ5IEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHQgY2F0Y2ggdGhlbiB7fVxuICAgIGhlYWRlcnMgPSBAX2dldEhlYWRlcnNGb3IgcmVxdWVzdFxuXG4gICAgaWYgJ2xpbmtzJyBvZiByZXNwb25zZVxuICAgICAgQF9oYW5kbGVMaW5rcyByZXNwb25zZS5saW5rc1xuXG4gICAgaWYgJ2xpbmtlZCcgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlLCBsaW5rZWQgb2YgcmVzcG9uc2UubGlua2VkXG4gICAgICAgIGZvciByZXNvdXJjZURhdGEgaW4gW10uY29uY2F0IGxpbmtlZFxuICAgICAgICAgIEB0eXBlKHR5cGUpLmNyZWF0ZSByZXNvdXJjZURhdGEsIGhlYWRlcnNcblxuICAgIHJlc3VsdHMgPSBbXVxuICAgIGlmICdkYXRhJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHJlc291cmNlRGF0YSBpbiBbXS5jb25jYXQgcmVzcG9uc2UuZGF0YVxuICAgICAgICByZXN1bHRzLnB1c2ggQHR5cGUocmVzb3VyY2VEYXRhLnR5cGUpLmNyZWF0ZSByZXNvdXJjZURhdGEsIGhlYWRlcnNcbiAgICBmb3IgdHlwZU5hbWUsIHJlc291cmNlcyBvZiByZXNwb25zZSB3aGVuIHR5cGVOYW1lIG5vdCBpbiBSRVNFUlZFRF9UT1BfTEVWRUxfS0VZU1xuICAgICAgZm9yIHJlc291cmNlRGF0YSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgIHJlc3VsdHMucHVzaCBAdHlwZSh0eXBlTmFtZSkuY3JlYXRlIHJlc291cmNlRGF0YSwgaGVhZGVyc1xuICAgIHJlc3VsdHNcblxuICBfZ2V0SGVhZGVyc0ZvcjogKHJlcXVlc3QpIC0+XG4gICAgaGVhZGVycyA9IHt9XG4gICAgZm9yIHBhaXIgaW4gcmVxdWVzdC5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKS5zcGxpdCAnXFxuJyB3aGVuIHBhaXIgaXNudCAnJ1xuICAgICAgW2tleSwgdmFsdWUuLi5dID0gcGFpci5zcGxpdCAnOidcbiAgICAgIGhlYWRlcnNba2V5LnRyaW0oKV0gPSB2YWx1ZS5qb2luKCc6JykudHJpbSgpXG4gICAgaGVhZGVyc1xuXG4gIF9oYW5kbGVMaW5rczogKGxpbmtzKSAtPlxuICAgIGZvciB0eXBlQW5kQXR0cmlidXRlLCBsaW5rIG9mIGxpbmtzXG4gICAgICBbdHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWVdID0gdHlwZUFuZEF0dHJpYnV0ZS5zcGxpdCAnLidcbiAgICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnXG4gICAgICAgIGhyZWYgPSBsaW5rXG4gICAgICBlbHNlXG4gICAgICAgIHtocmVmLCB0eXBlfSA9IGxpbmtcbiAgICAgIEBfaGFuZGxlTGluayB0eXBlTmFtZSwgYXR0cmlidXRlTmFtZSwgaHJlZiwgdHlwZVxuXG4gIF9oYW5kbGVMaW5rOiAodHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIGhyZWZUZW1wbGF0ZSwgYXR0cmlidXRlVHlwZU5hbWUpIC0+XG4gICAgdHlwZSA9IEB0eXBlIHR5cGVOYW1lXG5cbiAgICB0eXBlLl9saW5rc1thdHRyaWJ1dGVOYW1lXSA/PSB7fVxuICAgIGlmIGhyZWZUZW1wbGF0ZT9cbiAgICAgIHR5cGUuX2xpbmtzW2F0dHJpYnV0ZU5hbWVdLmhyZWYgPSBocmVmVGVtcGxhdGVcbiAgICBpZiBhdHRyaWJ1dGVUeXBlTmFtZT9cbiAgICAgIHR5cGUuX2xpbmtzW2F0dHJpYnV0ZU5hbWVdLnR5cGUgPSBhdHRyaWJ1dGVUeXBlTmFtZVxuXG4gIHR5cGU6IChuYW1lKSAtPlxuICAgIEBfdHlwZXNbbmFtZV0gPz0gbmV3IFR5cGUgbmFtZSwgdGhpc1xuICAgIEBfdHlwZXNbbmFtZV1cblxuICBwcm9jZXNzRXJyb3JSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICBQcm9taXNlLnJlamVjdCByZXF1ZXN0XG5cbiAgY3JlYXRlVHlwZTogLT5cbiAgICBjb25zb2xlLndhcm4gJ1VzZSBKU09OQVBJQ2xpZW50Ojp0eXBlLCBub3QgOjpjcmVhdGVUeXBlJywgYXJndW1lbnRzLi4uXG4gICAgQHR5cGUgYXJndW1lbnRzLi4uXG5cbm1vZHVsZS5leHBvcnRzLnV0aWwgPSB7bWFrZUhUVFBSZXF1ZXN0fVxubW9kdWxlLmV4cG9ydHMuVHlwZSA9IFR5cGVcbm1vZHVsZS5leHBvcnRzLlJlc291cmNlID0gUmVzb3VyY2VcbiIsIm1vZHVsZS5leHBvcnRzID0gKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzLCBtb2RpZnkpIC0+XG4gIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgbWV0aG9kID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcblxuICAgIGlmIGRhdGE/IGFuZCBtZXRob2QgaXMgJ0dFVCdcbiAgICAgIHVybCArPSAnPycgKyAoW2tleSwgdmFsdWVdLmpvaW4gJz0nIGZvciBrZXksIHZhbHVlIG9mIGRhdGEpLmpvaW4gJyYnXG4gICAgICBkYXRhID0gbnVsbFxuXG4gICAgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICAgIHJlcXVlc3Qub3BlbiBtZXRob2QsIGVuY29kZVVSSSB1cmxcblxuICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuXG4gICAgaWYgaGVhZGVycz9cbiAgICAgIGZvciBoZWFkZXIsIHZhbHVlIG9mIGhlYWRlcnNcbiAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyIGhlYWRlciwgdmFsdWVcblxuICAgIGlmIG1vZGlmeT9cbiAgICAgIG1vZGlmeSByZXF1ZXN0XG5cbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChlKSAtPlxuICAgICAgaWYgcmVxdWVzdC5yZWFkeVN0YXRlIGlzIHJlcXVlc3QuRE9ORVxuICAgICAgICBpZiAyMDAgPD0gcmVxdWVzdC5zdGF0dXMgPCAzMDBcbiAgICAgICAgICByZXNvbHZlIHJlcXVlc3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlamVjdCByZXF1ZXN0XG5cbiAgICB1bmxlc3MgaGVhZGVycz9bJ0NvbnRlbnQtVHlwZSddPy5pbmRleE9mKCdqc29uJykgaXMgLTFcbiAgICAgIGRhdGEgPSBKU09OLnN0cmluZ2lmeSBkYXRhXG5cbiAgICByZXF1ZXN0LnNlbmQgZGF0YVxuIiwibW9kdWxlLmV4cG9ydHMgPSAtPlxuICBmb3IgYXJndW1lbnQgaW4gQXJyYXk6OnNsaWNlLmNhbGwgYXJndW1lbnRzLCAxIHdoZW4gYXJndW1lbnQ/XG4gICAgZm9yIG93biBrZXksIHZhbHVlIG9mIGFyZ3VtZW50XG4gICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IHZhbHVlXG4gIGFyZ3VtZW50c1swXVxuIiwiRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblxuIyBUdXJuIGEgSlNPTi1BUEkgXCJocmVmXCIgdGVtcGxhdGUgaW50byBhIHVzYWJsZSBVUkwuXG5QTEFDRUhPTERFUlNfUEFUVEVSTiA9IC97KC4rPyl9L2dcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNvdXJjZSBleHRlbmRzIEVtaXR0ZXJcbiAgX3R5cGU6IG51bGxcbiAgX2hlYWRlcnM6IG51bGxcblxuICBfY2hhbmdlZEtleXM6IG51bGxcblxuICBfcmVhZE9ubHlLZXlzOiBbJ2lkJywgJ3R5cGUnLCAnaHJlZicsICdjcmVhdGVkX2F0JywgJ3VwZGF0ZWRfYXQnXVxuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlncy4uLikgLT5cbiAgICBzdXBlclxuICAgIEBfY2hhbmdlZEtleXMgPSBbXVxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWdzLi4uXG4gICAgQGVtaXQgJ2NyZWF0ZSdcbiAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuXG4gIHVwZGF0ZTogKGNoYW5nZVNldCA9IHt9KSAtPlxuICAgIEBlbWl0ICd3aWxsLWNoYW5nZSdcbiAgICBhY3R1YWxDaGFuZ2VzID0gMFxuXG4gICAgZm9yIGtleSwgdmFsdWUgb2YgY2hhbmdlU2V0IHdoZW4gQFtrZXldIGlzbnQgdmFsdWVcbiAgICAgIEBba2V5XSA9IHZhbHVlXG4gICAgICB1bmxlc3Mga2V5IGluIEBfY2hhbmdlZEtleXNcbiAgICAgICAgQF9jaGFuZ2VkS2V5cy5wdXNoIGtleVxuICAgICAgYWN0dWFsQ2hhbmdlcyArPSAxXG5cbiAgICB1bmxlc3MgYWN0dWFsQ2hhbmdlcyBpcyAwXG4gICAgICBAZW1pdCAnY2hhbmdlJ1xuICAgICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcblxuICBzYXZlOiAtPlxuICAgIEBlbWl0ICd3aWxsLXNhdmUnXG5cbiAgICBwYXlsb2FkID0ge31cbiAgICBwYXlsb2FkW0BfdHlwZS5fbmFtZV0gPSBAZ2V0Q2hhbmdlc1NpbmNlU2F2ZSgpXG5cbiAgICBzYXZlID0gaWYgQGlkXG4gICAgICBoZWFkZXJzID0ge31cbiAgICAgIGlmICdMYXN0LU1vZGlmaWVkJyBvZiBAX2hlYWRlcnNcbiAgICAgICAgaGVhZGVyc1snSWYtVW5tb2RpZmllZC1TaW5jZSddID0gQF9oZWFkZXJzWydMYXN0LU1vZGlmaWVkJ11cbiAgICAgIEBfdHlwZS5fY2xpZW50LnB1dCBAX2dldFVSTCgpLCBwYXlsb2FkLCBoZWFkZXJzXG4gICAgZWxzZVxuICAgICAgQF90eXBlLl9jbGllbnQucG9zdCBAX3R5cGUuX2dldFVSTCgpLCBwYXlsb2FkXG5cbiAgICBzYXZlLnRoZW4gKFtyZXN1bHRdKSA9PlxuICAgICAgQHVwZGF0ZSByZXN1bHRcbiAgICAgIEBfY2hhbmdlZEtleXMuc3BsaWNlIDBcbiAgICAgIEBlbWl0ICdzYXZlJ1xuICAgICAgcmVzdWx0XG5cbiAgaGFzVW5zYXZlZENoYW5nZXM6IC0+XG4gICAgQF9jaGFuZ2VkS2V5cy5sZW5ndGggaXNudCAwXG5cbiAgZ2V0Q2hhbmdlc1NpbmNlU2F2ZTogLT5cbiAgICBjaGFuZ2VzID0ge31cbiAgICBmb3Iga2V5IGluIEBfY2hhbmdlZEtleXNcbiAgICAgIGNoYW5nZXNba2V5XSA9IEBba2V5XVxuICAgIGNoYW5nZXNcblxuICBnZXRGcmVzaDogLT5cbiAgICBpZiBAaWRcbiAgICAgIEBfdHlwZS5nZXQgQGlkXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZWplY3QgbmV3IEVycm9yICdDYW5cXCd0IGdldCBmcmVzaCBjb3B5IG9mIGEgcmVzb3VyY2Ugd2l0aCBubyBJRCdcblxuICBkZWxldGU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtZGVsZXRlJ1xuICAgIGRlbGV0aW9uID0gaWYgQGlkXG4gICAgICBoZWFkZXJzID0ge31cbiAgICAgIGlmICdMYXN0LU1vZGlmaWVkJyBvZiBAX2hlYWRlcnNcbiAgICAgICAgaGVhZGVyc1snSWYtVW5tb2RpZmllZC1TaW5jZSddID0gQF9oZWFkZXJzWydMYXN0LU1vZGlmaWVkJ11cbiAgICAgIEBfdHlwZS5fY2xpZW50LmRlbGV0ZShAX2dldFVSTCgpLCBudWxsLCBoZWFkZXJzKS50aGVuID0+XG4gICAgICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG4gICAgICAgIG51bGxcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZGVsZXRpb24udGhlbiA9PlxuICAgICAgQGVtaXQgJ2RlbGV0ZSdcblxuICBsaW5rOiAobmFtZSkgLT5cbiAgICBsaW5rID0gQGxpbmtzP1tuYW1lXSA/IEBfdHlwZS5fbGlua3NbbmFtZV1cbiAgICBpZiBsaW5rP1xuICAgICAgQF9nZXRMaW5rIG5hbWUsIGxpbmtcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJObyBsaW5rICcje25hbWV9JyBkZWZpbmVkIGZvciAje0BfdHlwZS5uYW1lfSAje0BpZH1cIlxuXG4gIF9nZXRMaW5rOiAobmFtZSwgbGluaykgLT5cbiAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGxpbmtcbiAgICAgIHtocmVmLCB0eXBlfSA9IEBfdHlwZS5fbGlua3NbbmFtZV1cblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgQF90eXBlLl9jbGllbnQuZ2V0KEBfYXBwbHlIUkVGIGhyZWYpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBpZiB0eXBlb2YgQGxpbmtzW25hbWVdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXNvdXJjZXNbMF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXNvdXJjZXNcblxuICAgICAgZWxzZSBpZiB0eXBlP1xuICAgICAgICB0eXBlID0gQF90eXBlLl9jbGllbnQuX3R5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGxpbmtcblxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJObyBIUkVGIG9yIHR5cGUgZm9yIGxpbmsgJyN7bmFtZX0nIG9mICN7QF90eXBlLm5hbWV9ICN7QGlkfVwiXG5cbiAgICBlbHNlICMgSXQncyBhIGNvbGxlY3Rpb24gb2JqZWN0LlxuICAgICAge2hyZWYsIGlkcywgdHlwZX0gPSBsaW5rXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIEBfdHlwZS5fY2xpZW50LmdldChAX2FwcGx5SFJFRiBocmVmKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rc1tuYW1lXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmVzb3VyY2VzWzBdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb3VyY2VzXG5cbiAgICAgIGVsc2UgaWYgdHlwZT8gYW5kIGlkcz9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5fY2xpZW50Ll90eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJObyBIUkVGLCB0eXBlLCBvciBJRHMgZm9yIGxpbmsgJyN7bmFtZX0nIG9mICN7QF90eXBlLm5hbWV9ICN7QGlkfVwiXG5cbiAgX2FwcGx5SFJFRjogKGhyZWYpIC0+XG4gICAgY29udGV4dCA9IHt9XG4gICAgY29udGV4dFtAX3R5cGUuX25hbWVdID0gdGhpc1xuXG4gICAgaHJlZi5yZXBsYWNlIFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIGlmIEFycmF5LmlzQXJyYXkgdmFsdWVcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luICcsJ1xuXG4gICAgICB1bmxlc3MgdHlwZW9mIHZhbHVlIGlzICdzdHJpbmcnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIlZhbHVlIGZvciAnI3twYXRofScgaW4gJyN7aHJlZn0nIHNob3VsZCBiZSBhIHN0cmluZy5cIlxuXG4gICAgICB2YWx1ZVxuXG4gIF9nZXRVUkw6IC0+XG4gICAgQGhyZWYgfHwgQF90eXBlLl9nZXRVUkwgQGlkLCBhcmd1bWVudHMuLi5cblxuICB0b0pTT046IC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICBmb3Igb3duIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3QgaW4gQF9yZWFkT25seUtleXNcbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcblxuICBhdHRyOiAtPlxuICAgIGNvbnNvbGUud2FybiAnVXNlIFJlc291cmNlOjpsaW5rLCBub3QgOjphdHRyJywgYXJndW1lbnRzLi4uXG4gICAgQGxpbmsgYXJndW1lbnRzLi4uXG4iLCJFbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGUgZXh0ZW5kcyBFbWl0dGVyXG4gIF9uYW1lOiAnJ1xuICBfY2xpZW50OiBudWxsXG5cbiAgX2xpbmtzOiBudWxsICMgUmVzb3VyY2UgbGluayBkZWZpbml0aW9uc1xuXG4gIGNvbnN0cnVjdG9yOiAoQF9uYW1lLCBAX2NsaWVudCkgLT5cbiAgICBzdXBlclxuICAgIEBfbGlua3MgPSB7fVxuXG4gIGNyZWF0ZTogKGRhdGEsIGhlYWRlcnMgPSB7fSkgLT5cbiAgICBuZXcgUmVzb3VyY2UgZGF0YSwgX3R5cGU6IHRoaXMsIF9oZWFkZXJzOiBoZWFkZXJzXG5cbiAgZ2V0OiAtPlxuICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZydcbiAgICAgIEBfZ2V0QnlJRCBhcmd1bWVudHMuLi5cbiAgICBlbHNlIGlmIEFycmF5LmlzQXJyYXkgYXJndW1lbnRzWzBdXG4gICAgICBAX2dldEJ5SURzIGFyZ3VtZW50cy4uLlxuICAgIGVsc2VcbiAgICAgIEBfZ2V0QnlRdWVyeSBhcmd1bWVudHMuLi5cblxuICBfZ2V0QnlJRDogKGlkLCBvdGhlckFyZ3MuLi4pIC0+XG4gICAgQF9nZXRCeUlEcyhbaWRdLCBvdGhlckFyZ3MuLi4pLnRoZW4gKFtyZXNvdXJjZV0pIC0+XG4gICAgICByZXNvdXJjZVxuXG4gIF9nZXRCeUlEczogKGlkcywgb3RoZXJBcmdzLi4uKSAtPlxuICAgIHVybCA9IEBfZ2V0VVJMIGlkcy5qb2luICcsJ1xuICAgIEBfY2xpZW50LmdldCB1cmwsIG90aGVyQXJncy4uLlxuXG4gIF9nZXRCeVF1ZXJ5OiAocXVlcnksIG90aGVyQXJncy4uLikgLT5cbiAgICBAX2NsaWVudC5nZXQgQF9nZXRVUkwoKSwgcXVlcnksIG90aGVyQXJncy4uLlxuXG4gIF9nZXRVUkw6IC0+XG4gICAgWycnLCBAX25hbWUsIGFyZ3VtZW50cy4uLl0uam9pbiAnLydcblxuICBjcmVhdGVSZXNvdXJjZTogLT5cbiAgICBjb25zb2xlLndhcm4gJ1VzZSBUeXBlOjpjcmVhdGUsIG5vdCA6OmNyZWF0ZVJlc291cmNlJywgYXJndW1lbnRzLi4uXG4gICAgQGNyZWF0ZSBhcmd1bWVudHMuLi5cbiJdfQ==

