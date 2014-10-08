!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.JSONAPIClient=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Emitter,
  __slice = [].slice;

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
    if (typeof console !== "undefined" && console !== null) {
      console.log('Emitting', signal, JSON.stringify(payload), (_ref = this._callbacks[signal]) != null ? _ref.length : void 0);
    }
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



},{}],2:[function(_dereq_,module,exports){
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
    return makeHTTPRequest(method, this.root + url, data, headers).then(this.processResponseTo.bind(this));
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
    response = JSON.parse(request.responseText);
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
    return primaryResults;
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

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};



},{"./make-http-request":3,"./merge-into":4,"./print":5,"./type":7}],3:[function(_dereq_,module,exports){
module.exports = function(method, url, data, headers, modify) {
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
      var key, _ref, _ref1;
      console.log('Ready state:', ((function() {
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
        console.log('Done; status is', request.status);
        if ((200 <= (_ref = request.status) && _ref < 300)) {
          return resolve(request);
        } else if ((400 <= (_ref1 = request.status) && _ref1 < 600)) {
          return reject(request);
        }
      }
    };
    return request.send(JSON.stringify(data));
  });
};



},{}],4:[function(_dereq_,module,exports){
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
  var color, messages;
  color = arguments[0], messages = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  return console.log.apply(console, ['%c{json:api}', "color: " + color + "; font: bold 1em monospace;"].concat(__slice.call(messages)));
};

module.exports = {
  log: print.bind(null, 'gray'),
  info: print.bind(null, 'blue'),
  warn: print.bind(null, 'orange'),
  error: print.bind(null, 'red')
};



},{}],6:[function(_dereq_,module,exports){
var Emitter, Resource, mergeInto, print,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

print = _dereq_('./print');

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

module.exports = Resource = (function(_super) {
  __extends(Resource, _super);

  Resource.prototype.id = '';

  Resource.prototype.href = '';

  Resource.prototype.type = '';

  Resource.prototype._type = null;

  function Resource() {
    var config;
    config = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Resource.__super__.constructor.apply(this, arguments);
    if (config != null) {
      mergeInto.apply(null, [this].concat(__slice.call(config)));
    }
    if (typeof console !== "undefined" && console !== null) {
      console.log("Created resource: " + this._type.name + " " + this.id, this);
    }
    this.emit('create');
    console.log('Created!');
  }

  Resource.prototype.attr = function(attribute) {
    print.info('Getting link:', attribute);
    if (attribute in this) {
      if (typeof console !== "undefined" && console !== null) {
        console.warn("No need to access a non-linked attribute via attr: " + attribute, this);
      }
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
        href = applyHREF(href, context);
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

  Resource.prototype.update = function() {
    var changes;
    changes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    mergeInto.apply(null, [this].concat(__slice.call(changes)));
    return this.emit('change');
  };

  Resource.prototype.save = function() {
    var save;
    this.emit('will-save');
    save = this.id ? this._type.apiClient.put(this.getURL(), this) : this._type.apiClient.post(this._type.getURL(), this);
    return save.then((function(_this) {
      return function(results) {
        _this.update(results);
        return _this.emit('save');
      };
    })(this));
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
      value = this[key];
      if (key.charAt(0) !== '_' && !(key in this.constructor.prototype)) {
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
    if (this.waitingFor(data.id)) {
      print.log('Resolving and removing deferral for', this.name, data.id);
      this.deferrals[data.id].resolve(new Resource(data, {
        _type: this
      }));
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
  };

  Type.prototype._handleResourceEmission = function(resource, signal, payload) {
    return this.emit('change');
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxPQUFBO0VBQUEsa0JBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBdUI7QUFDckIsb0JBQUEsVUFBQSxHQUFZLElBQVosQ0FBQTs7QUFFYSxFQUFBLGlCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQURXO0VBQUEsQ0FGYjs7QUFBQSxvQkFLQSxNQUFBLEdBQVEsU0FBQyxNQUFELEVBQVMsUUFBVCxHQUFBO0FBQ04sUUFBQSxLQUFBOztXQUFZLENBQUEsTUFBQSxJQUFXO0tBQXZCO1dBQ0EsSUFBQyxDQUFBLFVBQVcsQ0FBQSxNQUFBLENBQU8sQ0FBQyxJQUFwQixDQUF5QixRQUF6QixFQUZNO0VB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LEVBQU8sSUFBUDtPQUFmLENBQXBCLENBRDdCLENBTEc7S0FKTDtXQVlBLElBQUMsQ0FBQSxnQkFBaUIsQ0FBQSxJQUFJLENBQUMsRUFBTCxFQWJKO0VBQUEsQ0F4RWhCLENBQUE7O0FBQUEsaUJBdUZBLHVCQUFBLEdBQXlCLFNBQUMsUUFBRCxFQUFXLE1BQVgsRUFBbUIsT0FBbkIsR0FBQTtXQUN2QixJQUFDLENBQUEsSUFBRCxDQUFNLFFBQU4sRUFEdUI7RUFBQSxDQXZGekIsQ0FBQTs7Y0FBQTs7R0FEa0MsUUFacEMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVtaXR0ZXJcbiAgX2NhbGxiYWNrczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBfY2FsbGJhY2tzID0ge31cblxuICBsaXN0ZW46IChzaWduYWwsIGNhbGxiYWNrKSAtPlxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0gPz0gW11cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnB1c2ggY2FsbGJhY2tcblxuICBzdG9wTGlzdGVuaW5nOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBpZiBzaWduYWw/XG4gICAgICBpZiBAX2NhbGxiYWNrc1tzaWduYWxdP1xuICAgICAgICBpZiBjYWxsYmFjaz9cbiAgICAgICAgICBpZiBBcnJheS5pc0FycmF5IGNhbGxiYWNrXG4gICAgICAgICAgICAjIEFycmF5LXN0eWxlIGNhbGxiYWNrcyBuZWVkIG5vdCBiZSB0aGUgZXhhY3Qgc2FtZSBvYmplY3QuXG4gICAgICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgICAgICBmb3IgaGFuZGxlciwgaSBpbiBAX2NhbGxiYWNrc1tzaWduYWxdIGJ5IC0xIHdoZW4gQXJyYXkuaXNBcnJheShoYW5kbGVyKSBhbmQgY2FsbGJhY2subGVuZ3RoIGlzIGhhbmRsZXIubGVuZ3RoXG4gICAgICAgICAgICAgIGlmIChudWxsIGZvciBpdGVtLCBqIGluIGNhbGxiYWNrIHdoZW4gaGFuZGxlcltqXSBpcyBpdGVtKS5sZW5ndGggaXMgY2FsbGJhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmRleCA9IEBfY2FsbGJhY2tzW3NpZ25hbF0ubGFzdEluZGV4T2YgY2FsbGJhY2tcbiAgICAgICAgICB1bmxlc3MgaW5kZXggaXMgLTFcbiAgICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIGluZGV4LCAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSAwXG4gICAgZWxzZVxuICAgICAgQHN0b3BMaXN0ZW5pbmcgc2lnbmFsIGZvciBzaWduYWwgb2YgQF9jYWxsYmFja3NcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkLi4uKSAtPlxuICAgIGNvbnNvbGU/LmxvZyAnRW1pdHRpbmcnLCBzaWduYWwsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLCBAX2NhbGxiYWNrc1tzaWduYWxdPy5sZW5ndGhcbiAgICBpZiBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIEBfY2FsbEhhbmRsZXIgY2FsbGJhY2ssIHBheWxvYWRcblxuICBfY2FsbEhhbmRsZXI6IChoYW5kbGVyLCBhcmdzKSAtPlxuICAgIGlmIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgW2NvbnRleHQsIGhhbmRsZXIsIGJvdW5kQXJncy4uLl0gPSBoYW5kbGVyXG4gICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICBoYW5kbGVyID0gY29udGV4dFtoYW5kbGVyXVxuICAgIGVsc2VcbiAgICAgIGJvdW5kQXJncyA9IFtdXG4gICAgaGFuZGxlci5hcHBseSBjb250ZXh0LCBib3VuZEFyZ3MuY29uY2F0IGFyZ3NcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbm1ha2VIVFRQUmVxdWVzdCA9IHJlcXVpcmUgJy4vbWFrZS1odHRwLXJlcXVlc3QnXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5UeXBlID0gcmVxdWlyZSAnLi90eXBlJ1xuXG5ERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCA9XG4gICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vdm5kLmFwaStqc29uJ1xuICAnQWNjZXB0JzogXCJhcHBsaWNhdGlvbi92bmQuYXBpK2pzb25cIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEpTT05BUElDbGllbnRcbiAgcm9vdDogJydcbiAgaGVhZGVyczogbnVsbFxuXG4gIHR5cGVzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAcm9vdCwgQGhlYWRlcnMpIC0+XG4gICAgQGhlYWRlcnMgPz0ge31cbiAgICBAdHlwZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0NyZWF0ZWQgYSBuZXcgSlNPTi1BUEkgY2xpZW50IGF0JywgQHJvb3RcblxuICByZXF1ZXN0OiAobWV0aG9kLCB1cmwsIGRhdGEsIGFkZGl0aW9uYWxIZWFkZXJzKSAtPlxuICAgIHByaW50LmluZm8gJ01ha2luZyBhJywgbWV0aG9kLCAncmVxdWVzdCB0bycsIHVybFxuICAgIGhlYWRlcnMgPSBtZXJnZUludG8ge30sIERFRkFVTFRfVFlQRV9BTkRfQUNDRVBULCBAaGVhZGVycywgYWRkaXRpb25hbEhlYWRlcnNcbiAgICBtYWtlSFRUUFJlcXVlc3QobWV0aG9kLCBAcm9vdCArIHVybCwgZGF0YSwgaGVhZGVycykudGhlbiBAcHJvY2Vzc1Jlc3BvbnNlVG8uYmluZCB0aGlzXG5cbiAgZm9yIG1ldGhvZCBpbiBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnXSB0aGVuIGRvIChtZXRob2QpID0+XG4gICAgQDo6W21ldGhvZF0gPSAtPlxuICAgICAgQHJlcXVlc3QgbWV0aG9kLnRvVXBwZXJDYXNlKCksIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICByZXNwb25zZSA9IEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICBwcmludC5sb2cgJ1Byb2Nlc3NpbmcgcmVzcG9uc2UnLCByZXNwb25zZVxuXG4gICAgaWYgJ21ldGEnIG9mIHJlc3BvbnNlXG4gICAgICAnVE9ETzogTm8gaWRlYSB5ZXQhJ1xuXG4gICAgaWYgJ2xpbmtzJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGVBbmRBdHRyaWJ1dGUsIGxpbmsgb2YgcmVzcG9uc2UubGlua3NcbiAgICAgICAgW3R5cGUsIGF0dHJpYnV0ZV0gPSB0eXBlQW5kQXR0cmlidXRlLnNwbGl0ICcuJ1xuICAgICAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJ1xuICAgICAgICAgIGhyZWYgPSBsaW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB7aHJlZiwgdHlwZTogYXR0cmlidXRlVHlwZX0gPSBsaW5rXG5cbiAgICAgICAgQGhhbmRsZUxpbmsgdHlwZSwgYXR0cmlidXRlLCBocmVmLCBhdHRyaWJ1dGVUeXBlXG5cbiAgICBpZiAnbGlua2VkJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZS5saW5rZWRcbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCByZXNvdXJjZXMgPyAxLCAnbGlua2VkJywgdHlwZSwgJ3Jlc291cmNlcy4nXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIGlmICdkYXRhJyBvZiByZXNwb25zZVxuICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwgXCJkYXRhXCIgY29sbGVjdGlvbiBvZicsIHJlc3BvbnNlLmRhdGEubGVuZ3RoID8gMVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgQGNyZWF0ZVR5cGUgcmVzcG9uc2UudHlwZSB1bmxlc3MgQHR5cGVzW3Jlc291cmNlLnR5cGVdP1xuICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcbiAgICBlbHNlXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IFtdXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlIHdoZW4gdHlwZSBub3QgaW4gWydsaW5rcycsICdsaW5rZWQnLCAnbWV0YScsICdkYXRhJ11cbiAgICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwnLCB0eXBlLCAnY29sbGVjdGlvbiBvZicsIHJlc291cmNlcy5sZW5ndGggPyAxXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBwcmltYXJ5UmVzdWx0cy5wdXNoIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZSwgdHlwZVxuXG4gICAgcHJpbnQuaW5mbyAnUHJpbWFyeSByZXNvdXJjZXM6JywgcHJpbWFyeVJlc3VsdHNcbiAgICBwcmltYXJ5UmVzdWx0c1xuXG4gIGhhbmRsZUxpbms6ICh0eXBlTmFtZSwgYXR0cmlidXRlTmFtZSwgaHJlZlRlbXBsYXRlLCBhdHRyaWJ1dGVUeXBlTmFtZSkgLT5cbiAgICB1bmxlc3MgQHR5cGVzW3R5cGVOYW1lXT9cbiAgICAgIEBjcmVhdGVUeXBlIHR5cGVOYW1lXG5cbiAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXSA/PSB7fVxuICAgIGlmIGhyZWZUZW1wbGF0ZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLmhyZWYgPSBocmVmVGVtcGxhdGVcbiAgICBpZiBhdHRyaWJ1dGVUeXBlTmFtZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLnR5cGUgPSBhdHRyaWJ1dGVOYW1lXG5cbiAgY3JlYXRlVHlwZTogKG5hbWUpIC0+XG4gICAgbmV3IFR5cGUgbmFtZTogbmFtZSwgYXBpQ2xpZW50OiB0aGlzXG5cbm1vZHVsZS5leHBvcnRzLnV0aWwgPSB7bWFrZUhUVFBSZXF1ZXN0fVxuIiwiIyBNYWtlIGEgcmF3LCBub24tQVBJIHNwZWNpZmljIEhUVFAgcmVxdWVzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMsIG1vZGlmeSkgLT5cbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gICAgcmVxdWVzdC5vcGVuIG1ldGhvZCwgZW5jb2RlVVJJIHVybFxuXG4gICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG5cbiAgICBpZiBoZWFkZXJzP1xuICAgICAgZm9yIGhlYWRlciwgdmFsdWUgb2YgaGVhZGVyc1xuICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIgaGVhZGVyLCB2YWx1ZVxuXG4gICAgaWYgbW9kaWZ5P1xuICAgICAgbW9kaWZpY2F0aW9ucyA9IG1vZGlmeSByZXF1ZXN0XG5cbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChlKSAtPlxuICAgICAgY29uc29sZS5sb2cgJ1JlYWR5IHN0YXRlOicsIChrZXkgZm9yIGtleSwgdmFsdWUgb2YgcmVxdWVzdCB3aGVuIHZhbHVlIGlzIHJlcXVlc3QucmVhZHlTdGF0ZSBhbmQga2V5IGlzbnQgJ3JlYWR5U3RhdGUnKVswXVxuICAgICAgaWYgcmVxdWVzdC5yZWFkeVN0YXRlIGlzIHJlcXVlc3QuRE9ORVxuICAgICAgICBjb25zb2xlLmxvZyAnRG9uZTsgc3RhdHVzIGlzJywgcmVxdWVzdC5zdGF0dXNcbiAgICAgICAgaWYgMjAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgMzAwXG4gICAgICAgICAgcmVzb2x2ZSByZXF1ZXN0XG4gICAgICAgIGVsc2UgaWYgNDAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgNjAwXG4gICAgICAgICAgcmVqZWN0IHJlcXVlc3RcblxuICAgIHJlcXVlc3Quc2VuZCBKU09OLnN0cmluZ2lmeSBkYXRhXG4iLCIjIFRoaXMgaXMgYSBwcmV0dHkgc3RhbmRhcmQgbWVyZ2UgZnVuY3Rpb24uXG4jIE1lcmdlIHByb3BlcnRpZXMgb2YgYWxsIGFyZ3VlbWVudHMgaW50byB0aGUgZmlyc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgZm9yIGFyZ3VtZW50IGluIEFycmF5OjpzbGljZS5jYWxsIGFyZ3VtZW50cywgMSB3aGVuIGFyZ3VtZW50P1xuICAgIGZvciBrZXksIHZhbHVlIG9mIGFyZ3VtZW50XG4gICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IHZhbHVlXG4gIGFyZ3VtZW50c1swXVxuIiwicHJpbnQgPSAoY29sb3IsIG1lc3NhZ2VzLi4uKSAtPlxuICBjb25zb2xlLmxvZyAnJWN7anNvbjphcGl9JywgXCJjb2xvcjogI3tjb2xvcn07IGZvbnQ6IGJvbGQgMWVtIG1vbm9zcGFjZTtcIiwgbWVzc2FnZXMuLi5cblxubW9kdWxlLmV4cG9ydHMgPVxuICBsb2c6IHByaW50LmJpbmQgbnVsbCwgJ2dyYXknXG4gIGluZm86IHByaW50LmJpbmQgbnVsbCwgJ2JsdWUnXG4gIHdhcm46IHByaW50LmJpbmQgbnVsbCwgJ29yYW5nZSdcbiAgZXJyb3I6IHByaW50LmJpbmQgbnVsbCwgJ3JlZCdcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2UgZXh0ZW5kcyBFbWl0dGVyXG4gIGlkOiAnJ1xuICBocmVmOiAnJ1xuICB0eXBlOiAnJ1xuXG4gIF90eXBlOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChjb25maWcuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBtZXJnZUludG8gdGhpcywgY29uZmlnLi4uIGlmIGNvbmZpZz9cbiAgICBjb25zb2xlPy5sb2cgXCJDcmVhdGVkIHJlc291cmNlOiAje0BfdHlwZS5uYW1lfSAje0BpZH1cIiwgdGhpc1xuICAgIEBlbWl0ICdjcmVhdGUnXG4gICAgY29uc29sZS5sb2cgJ0NyZWF0ZWQhJ1xuXG4gICMgR2V0IGEgcHJvbWlzZSBmb3IgYW4gYXR0cmlidXRlIHJlZmVycmluZyB0byAoYW4pb3RoZXIgcmVzb3VyY2UocykuXG4gIGF0dHI6IChhdHRyaWJ1dGUpIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZyBsaW5rOicsIGF0dHJpYnV0ZVxuICAgIGlmIGF0dHJpYnV0ZSBvZiB0aGlzXG4gICAgICBjb25zb2xlPy53YXJuIFwiTm8gbmVlZCB0byBhY2Nlc3MgYSBub24tbGlua2VkIGF0dHJpYnV0ZSB2aWEgYXR0cjogI3thdHRyaWJ1dGV9XCIsIHRoaXNcbiAgICAgIFByb21pc2UucmVzb2x2ZSBAW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIEBsaW5rcz8gYW5kIGF0dHJpYnV0ZSBvZiBAbGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiByZXNvdXJjZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBsaW5rc1thdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBhdHRyaWJ1dGUgb2YgQF90eXBlLmxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgdHlwZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBfdHlwZS5saW5rc1thdHRyaWJ1dGVdXG4gICAgZWxzZVxuICAgICAgcHJpbnQuZXJyb3IgJ05vdCBhIGxpbmsgYXQgYWxsJ1xuICAgICAgUHJvbWlzZS5yZWplY3QgbmV3IEVycm9yIFwiTm8gYXR0cmlidXRlICN7YXR0cmlidXRlfSBvZiAje0BfdHlwZS5uYW1lfSByZXNvdXJjZVwiXG5cbiAgX2dldExpbms6IChuYW1lLCBsaW5rKSAtPlxuICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnIG9yIEFycmF5LmlzQXJyYXkgbGlua1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgSUQocyknXG4gICAgICBpZHMgPSBsaW5rXG4gICAgICB7aHJlZiwgdHlwZX0gPSBAX3R5cGUubGlua3NbbmFtZV1cblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLm5hbWVdID0gdGhpc1xuICAgICAgICBocmVmID0gYXBwbHlIUkVGIGhyZWYsIGNvbnRleHRcbiAgICAgICAgQF90eXBlLmFwaUNsaWVudC5nZXQgaHJlZlxuXG4gICAgICBlbHNlIGlmIHR5cGU/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZSBpZiBsaW5rP1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgY29sbGVjdGlvbiBvYmplY3QnLCBsaW5rXG4gICAgICAjIEl0J3MgYSBjb2xsZWN0aW9uIG9iamVjdC5cbiAgICAgIHtocmVmLCBpZHMsIHR5cGV9ID0gbGlua1xuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIHByaW50Lndhcm4gJ0hSRUYnLCBocmVmXG4gICAgICAgIGhyZWYgPSBAYXBwbHlIUkVGIGhyZWYsIGNvbnRleHRcbiAgICAgICAgQF90eXBlLmFwaUNsaWVudC5nZXQgaHJlZlxuXG4gICAgICBlbHNlIGlmIHR5cGU/IGFuZCBpZHM/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdMaW5rZWQsIGJ1dCBibGFuaydcbiAgICAgICMgSXQgZXhpc3RzLCBidXQgaXQncyBibGFuay5cbiAgICAgIFByb21pc2UucmVzb2x2ZSBudWxsXG5cbiAgIyBUdXJuIGEgSlNPTi1BUEkgXCJocmVmXCIgdGVtcGxhdGUgaW50byBhIHVzYWJsZSBVUkwuXG4gIFBMQUNFSE9MREVSU19QQVRURVJOOiAveyguKz8pfS9nXG4gIGFwcGx5SFJFRjogKGhyZWYsIGNvbnRleHQpIC0+XG4gICAgaHJlZi5yZXBsYWNlIEBQTEFDRUhPTERFUlNfUEFUVEVSTiwgKF8sIHBhdGgpIC0+XG4gICAgICBzZWdtZW50cyA9IHBhdGguc3BsaXQgJy4nXG4gICAgICBwcmludC53YXJuICdTZWdtZW50cycsIHNlZ21lbnRzXG5cbiAgICAgIHZhbHVlID0gY29udGV4dFxuICAgICAgdW50aWwgc2VnbWVudHMubGVuZ3RoIGlzIDBcbiAgICAgICAgc2VnbWVudCA9IHNlZ21lbnRzLnNoaWZ0KClcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtzZWdtZW50XSA/IHZhbHVlLmxpbmtzP1tzZWdtZW50XVxuXG4gICAgICBwcmludC53YXJuICdWYWx1ZScsIHZhbHVlXG5cbiAgICAgIGlmIEFycmF5LmlzQXJyYXkgdmFsdWVcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luICcsJ1xuXG4gICAgICB1bmxlc3MgdHlwZW9mIHZhbHVlIGlzICdzdHJpbmcnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIlZhbHVlIGZvciAnI3twYXRofScgaW4gJyN7aHJlZn0nIHNob3VsZCBiZSBhIHN0cmluZy5cIlxuXG4gICAgICB2YWx1ZVxuXG4gIHVwZGF0ZTogKGNoYW5nZXMuLi4pIC0+XG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNoYW5nZXMuLi5cbiAgICBAZW1pdCAnY2hhbmdlJ1xuXG4gIHNhdmU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtc2F2ZSdcbiAgICBzYXZlID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnB1dCBAZ2V0VVJMKCksIHRoaXNcbiAgICBlbHNlXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnBvc3QgQF90eXBlLmdldFVSTCgpLCB0aGlzXG5cbiAgICBzYXZlLnRoZW4gKHJlc3VsdHMpID0+XG4gICAgICBAdXBkYXRlIHJlc3VsdHNcbiAgICAgIEBlbWl0ICdzYXZlJ1xuXG4gIGRlbGV0ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1kZWxldGUnXG4gICAgZGVsZXRpb24gPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQuZGVsZXRlIEBnZXRVUkwoKVxuICAgIGVsc2VcbiAgICAgICMgQF90eXBlLnJlbW92ZVJlc291cmNlIHRoaXNcbiAgICAgIFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICBkZWxldGlvbi50aGVuID0+XG4gICAgICBAZW1pdCAnZGVsZXRlJ1xuXG4gIG1hdGNoZXNRdWVyeTogKHF1ZXJ5KSAtPlxuICAgIG1hdGNoZXMgPSB0cnVlXG4gICAgZm9yIHBhcmFtLCB2YWx1ZSBvZiBxdWVyeVxuICAgICAgaWYgQFtwYXJhbV0gaXNudCB2YWx1ZVxuICAgICAgICBtYXRjaGVzID0gZmFsc2VcbiAgICAgICAgYnJlYWtcbiAgICBtYXRjaGVzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZCkgLT5cbiAgICBzdXBlclxuICAgIEBfdHlwZS5faGFuZGxlUmVzb3VyY2VFbWlzc2lvbiB0aGlzLCBhcmd1bWVudHMuLi5cblxuICBnZXRVUkw6IC0+XG4gICAgQGhyZWYgfHwgW0BfdHlwZS5nZXRVUkwoKSwgQGlkXS5qb2luICcvJ1xuXG4gIHRvSlNPTjogLT5cbiAgICByZXN1bHQgPSB7fVxuICAgIHJlc3VsdFtAX3R5cGUubmFtZV0gPSB7fVxuICAgIGZvciBrZXksIHZhbHVlIG9mIHRoaXMgd2hlbiBrZXkuY2hhckF0KDApIGlzbnQgJ18nIGFuZCBrZXkgbm90IG9mIEBjb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgICAgIHJlc3VsdFtAX3R5cGUubmFtZV1ba2V5XSA9IHZhbHVlXG4gICAgcmVzdWx0XG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5kZWZlciA9IC0+XG4gIGRlZmVycmFsID0ge31cbiAgZGVmZXJyYWwucHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgZGVmZXJyYWwucmVzb2x2ZSA9IHJlc29sdmVcbiAgICBkZWZlcnJhbC5yZWplY3QgPSByZWplY3RcbiAgZGVmZXJyYWxcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUeXBlIGV4dGVuZHMgRW1pdHRlclxuICBuYW1lOiAnJ1xuICBhcGlDbGllbnQ6IG51bGxcblxuICBsaW5rczogbnVsbFxuXG4gIGRlZmVycmFsczogbnVsbFxuICByZXNvdXJjZVByb21pc2VzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChjb25maWdzLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZ3MuLi4gaWYgY29uZmlncz9cbiAgICBwcmludC5pbmZvICdEZWZpbmluZyBhIG5ldyByZXNvdXJjZSB0eXBlOicsIEBuYW1lXG4gICAgQGxpbmtzID89IHt9XG4gICAgQGRlZmVycmFscyA/PSB7fVxuICAgIEByZXNvdXJjZVByb21pc2VzID89IHt9XG4gICAgQGFwaUNsaWVudC50eXBlc1tAbmFtZV0gPSB0aGlzXG5cbiAgZ2V0VVJMOiAtPlxuICAgICcvJyArIEBuYW1lXG5cbiAgcXVlcnlMb2NhbDogKHF1ZXJ5KSAtPlxuICAgIFByb21pc2UuYWxsKHJlc291cmNlUHJvbWlzZSBmb3IgaWQsIHJlc291cmNlUHJvbWlzZSBvZiBAcmVzb3VyY2VQcm9taXNlcykudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgcmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlPy5tYXRjaGVzUXVlcnkgcXVlcnlcblxuICB3YWl0aW5nRm9yOiAoaWQpIC0+XG4gICAgQGRlZmVycmFsc1tpZF0/XG5cbiAgaGFzOiAoaWQpIC0+XG4gICAgQHJlc291cmNlUHJvbWlzZXNbaWRdPyBhbmQgbm90IEBkZWZlcnJhbHNbaWRdP1xuXG4gIGdldDogLT5cbiAgICBpZiB0eXBlb2YgYXJndW1lbnRzWzBdIGlzICdzdHJpbmcnIG9yIEFycmF5LmlzQXJyYXkgYXJndW1lbnRzWzBdXG4gICAgICBAZ2V0QnlJRHMgYXJndW1lbnRzLi4uXG4gICAgZWxzZVxuICAgICAgQGdldEJ5UXVlcnkgYXJndW1lbnRzLi4uXG5cbiAgIyBHaXZlbiBhIHN0cmluZywgcmV0dXJuIGEgcHJvbWlzZSBmb3IgdGhhdCByZXNvdXJjZS5cbiAgIyBHaXZlbiBhbiBhcnJheSwgcmV0dXJuIGFuIGFycmF5IG9mIHByb21pc2VzIGZvciB0aG9zZSByZXNvdXJjZXMuXG4gIGdldEJ5SURzOiAoaWRzLCBvcHRpb25zKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcnLCBAbmFtZSwgJ2J5IElEKHMpJywgaWRzXG4gICAgaWYgdHlwZW9mIGlkcyBpcyAnc3RyaW5nJ1xuICAgICAgZ2l2ZW5TdHJpbmcgPSB0cnVlXG4gICAgICBpZHMgPSBbaWRzXVxuXG4gICAgIyBPbmx5IHJlcXVlc3QgdGhpbmdzIHdlIGRvbid0IGhhdmUgb3IgZG9uJ3QgYWxyZWFkeSBoYXZlIGEgcmVxdWVzdCBvdXQgZm9yLlxuICAgIGluY29taW5nID0gKGlkIGZvciBpZCBpbiBpZHMgd2hlbiBub3QgQGhhcyhpZCkgYW5kIG5vdCBAd2FpdGluZ0ZvcihpZCkpXG4gICAgcHJpbnQubG9nICdJbmNvbWluZzogJywgaW5jb21pbmdcblxuICAgIHVubGVzcyBpbmNvbWluZy5sZW5ndGggaXMgMFxuICAgICAgZm9yIGlkIGluIGluY29taW5nXG4gICAgICAgIEBkZWZlcnJhbHNbaWRdID0gZGVmZXIoKVxuICAgICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0gPSBAZGVmZXJyYWxzW2lkXS5wcm9taXNlXG5cbiAgICAgIHVybCA9IFtAZ2V0VVJMKCksIGluY29taW5nLmpvaW4gJywnXS5qb2luICcvJ1xuICAgICAgcHJpbnQubG9nICdSZXF1ZXN0IGZvcicsIEBuYW1lLCAnYXQnLCB1cmxcbiAgICAgIEBhcGlDbGllbnQuZ2V0KHVybCwgb3B0aW9ucykudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIEBuYW1lLCByZXNvdXJjZXNcblxuICAgIGlmIGdpdmVuU3RyaW5nXG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZHNbMF1dXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5hbGwgKEByZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSkgLT5cbiAgICBAcXVlcnlMb2NhbChxdWVyeSkudGhlbiAoZXhpc3RpbmcpID0+XG4gICAgICBpZiBleGlzdGluZy5sZW5ndGggPj0gbGltaXRcbiAgICAgICAgZXhpc3RpbmdcbiAgICAgIGVsc2VcbiAgICAgICAgcGFyYW1zID0gbGltaXQ6IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIEBhcGlDbGllbnQuZ2V0KEBnZXRVUkwoKSwgbWVyZ2VJbnRvIHBhcmFtcywgcXVlcnkpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBQcm9taXNlLmFsbCBleGlzdGluZy5jb25jYXQgcmVzb3VyY2VzXG5cbiAgY3JlYXRlUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIGlmIEB3YWl0aW5nRm9yIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnUmVzb2x2aW5nIGFuZCByZW1vdmluZyBkZWZlcnJhbCBmb3InLCBAbmFtZSwgZGF0YS5pZFxuICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXS5yZXNvbHZlIG5ldyBSZXNvdXJjZSBkYXRhLCBfdHlwZTogdGhpc1xuICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXSA9IG51bGxcbiAgICBlbHNlIGlmIEBoYXMgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdUaGUnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2V4aXN0czsgd2lsbCB1cGRhdGUnXG4gICAgICBAZ2V0KGRhdGEuaWQpLnRoZW4gKHJlc291cmNlKSAtPlxuICAgICAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnQ3JlYXRpbmcgbmV3JywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdID0gUHJvbWlzZS5yZXNvbHZlIG5ldyBSZXNvdXJjZSBkYXRhLCBfdHlwZTogdGhpc1xuXG4gICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF1cblxuICBfaGFuZGxlUmVzb3VyY2VFbWlzc2lvbjogKHJlc291cmNlLCBzaWduYWwsIHBheWxvYWQpIC0+XG4gICAgQGVtaXQgJ2NoYW5nZSdcbiJdfQ==

