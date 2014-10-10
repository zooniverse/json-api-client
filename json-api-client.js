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
      var key, _ref;
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
        } else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxPQUFBO0VBQUEsa0JBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBdUI7QUFDckIsb0JBQUEsVUFBQSxHQUFZLElBQVosQ0FBQTs7QUFFYSxFQUFBLGlCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQURXO0VBQUEsQ0FGYjs7QUFBQSxvQkFLQSxNQUFBLEdBQVEsU0FBQyxNQUFELEVBQVMsUUFBVCxHQUFBO0FBQ04sUUFBQSxLQUFBOztXQUFZLENBQUEsTUFBQSxJQUFXO0tBQXZCO1dBQ0EsSUFBQyxDQUFBLFVBQVcsQ0FBQSxNQUFBLENBQU8sQ0FBQyxJQUFwQixDQUF5QixRQUF6QixFQUZNO0VB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S0FKTDtXQVlBLElBQUMsQ0FBQSxnQkFBaUIsQ0FBQSxJQUFJLENBQUMsRUFBTCxFQWJKO0VBQUEsQ0F4RWhCLENBQUE7O0FBQUEsaUJBdUZBLHVCQUFBLEdBQXlCLFNBQUMsUUFBRCxFQUFXLE1BQVgsRUFBbUIsT0FBbkIsR0FBQTtXQUN2QixJQUFDLENBQUEsSUFBRCxDQUFNLFFBQU4sRUFEdUI7RUFBQSxDQXZGekIsQ0FBQTs7Y0FBQTs7R0FEa0MsUUFacEMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVtaXR0ZXJcbiAgX2NhbGxiYWNrczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBfY2FsbGJhY2tzID0ge31cblxuICBsaXN0ZW46IChzaWduYWwsIGNhbGxiYWNrKSAtPlxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0gPz0gW11cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnB1c2ggY2FsbGJhY2tcblxuICBzdG9wTGlzdGVuaW5nOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBpZiBzaWduYWw/XG4gICAgICBpZiBAX2NhbGxiYWNrc1tzaWduYWxdP1xuICAgICAgICBpZiBjYWxsYmFjaz9cbiAgICAgICAgICBpZiBBcnJheS5pc0FycmF5IGNhbGxiYWNrXG4gICAgICAgICAgICAjIEFycmF5LXN0eWxlIGNhbGxiYWNrcyBuZWVkIG5vdCBiZSB0aGUgZXhhY3Qgc2FtZSBvYmplY3QuXG4gICAgICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgICAgICBmb3IgaGFuZGxlciwgaSBpbiBAX2NhbGxiYWNrc1tzaWduYWxdIGJ5IC0xIHdoZW4gQXJyYXkuaXNBcnJheShoYW5kbGVyKSBhbmQgY2FsbGJhY2subGVuZ3RoIGlzIGhhbmRsZXIubGVuZ3RoXG4gICAgICAgICAgICAgIGlmIChudWxsIGZvciBpdGVtLCBqIGluIGNhbGxiYWNrIHdoZW4gaGFuZGxlcltqXSBpcyBpdGVtKS5sZW5ndGggaXMgY2FsbGJhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmRleCA9IEBfY2FsbGJhY2tzW3NpZ25hbF0ubGFzdEluZGV4T2YgY2FsbGJhY2tcbiAgICAgICAgICB1bmxlc3MgaW5kZXggaXMgLTFcbiAgICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIGluZGV4LCAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSAwXG4gICAgZWxzZVxuICAgICAgQHN0b3BMaXN0ZW5pbmcgc2lnbmFsIGZvciBzaWduYWwgb2YgQF9jYWxsYmFja3NcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkLi4uKSAtPlxuICAgIGNvbnNvbGU/LmxvZyAnRW1pdHRpbmcnLCBzaWduYWwsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLCBAX2NhbGxiYWNrc1tzaWduYWxdPy5sZW5ndGhcbiAgICBpZiBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIEBfY2FsbEhhbmRsZXIgY2FsbGJhY2ssIHBheWxvYWRcblxuICBfY2FsbEhhbmRsZXI6IChoYW5kbGVyLCBhcmdzKSAtPlxuICAgIGlmIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgW2NvbnRleHQsIGhhbmRsZXIsIGJvdW5kQXJncy4uLl0gPSBoYW5kbGVyXG4gICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICBoYW5kbGVyID0gY29udGV4dFtoYW5kbGVyXVxuICAgIGVsc2VcbiAgICAgIGJvdW5kQXJncyA9IFtdXG4gICAgaGFuZGxlci5hcHBseSBjb250ZXh0LCBib3VuZEFyZ3MuY29uY2F0IGFyZ3NcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbm1ha2VIVFRQUmVxdWVzdCA9IHJlcXVpcmUgJy4vbWFrZS1odHRwLXJlcXVlc3QnXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5UeXBlID0gcmVxdWlyZSAnLi90eXBlJ1xuXG5ERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCA9XG4gICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vdm5kLmFwaStqc29uJ1xuICAnQWNjZXB0JzogXCJhcHBsaWNhdGlvbi92bmQuYXBpK2pzb25cIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEpTT05BUElDbGllbnRcbiAgcm9vdDogJydcbiAgaGVhZGVyczogbnVsbFxuXG4gIHR5cGVzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAcm9vdCwgQGhlYWRlcnMpIC0+XG4gICAgQGhlYWRlcnMgPz0ge31cbiAgICBAdHlwZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0NyZWF0ZWQgYSBuZXcgSlNPTi1BUEkgY2xpZW50IGF0JywgQHJvb3RcblxuICByZXF1ZXN0OiAobWV0aG9kLCB1cmwsIGRhdGEsIGFkZGl0aW9uYWxIZWFkZXJzKSAtPlxuICAgIHByaW50LmluZm8gJ01ha2luZyBhJywgbWV0aG9kLCAncmVxdWVzdCB0bycsIHVybFxuICAgIGhlYWRlcnMgPSBtZXJnZUludG8ge30sIERFRkFVTFRfVFlQRV9BTkRfQUNDRVBULCBAaGVhZGVycywgYWRkaXRpb25hbEhlYWRlcnNcbiAgICBtYWtlSFRUUFJlcXVlc3QobWV0aG9kLCBAcm9vdCArIHVybCwgZGF0YSwgaGVhZGVycykudGhlbiBAcHJvY2Vzc1Jlc3BvbnNlVG8uYmluZCB0aGlzXG5cbiAgZm9yIG1ldGhvZCBpbiBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnXSB0aGVuIGRvIChtZXRob2QpID0+XG4gICAgQDo6W21ldGhvZF0gPSAtPlxuICAgICAgQHJlcXVlc3QgbWV0aG9kLnRvVXBwZXJDYXNlKCksIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICByZXNwb25zZSA9IEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICBwcmludC5sb2cgJ1Byb2Nlc3NpbmcgcmVzcG9uc2UnLCByZXNwb25zZVxuXG4gICAgaWYgJ21ldGEnIG9mIHJlc3BvbnNlXG4gICAgICAnVE9ETzogTm8gaWRlYSB5ZXQhJ1xuXG4gICAgaWYgJ2xpbmtzJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGVBbmRBdHRyaWJ1dGUsIGxpbmsgb2YgcmVzcG9uc2UubGlua3NcbiAgICAgICAgW3R5cGUsIGF0dHJpYnV0ZV0gPSB0eXBlQW5kQXR0cmlidXRlLnNwbGl0ICcuJ1xuICAgICAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJ1xuICAgICAgICAgIGhyZWYgPSBsaW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB7aHJlZiwgdHlwZTogYXR0cmlidXRlVHlwZX0gPSBsaW5rXG5cbiAgICAgICAgQGhhbmRsZUxpbmsgdHlwZSwgYXR0cmlidXRlLCBocmVmLCBhdHRyaWJ1dGVUeXBlXG5cbiAgICBpZiAnbGlua2VkJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZS5saW5rZWRcbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCByZXNvdXJjZXMgPyAxLCAnbGlua2VkJywgdHlwZSwgJ3Jlc291cmNlcy4nXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIGlmICdkYXRhJyBvZiByZXNwb25zZVxuICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwgXCJkYXRhXCIgY29sbGVjdGlvbiBvZicsIHJlc3BvbnNlLmRhdGEubGVuZ3RoID8gMVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgQGNyZWF0ZVR5cGUgcmVzcG9uc2UudHlwZSB1bmxlc3MgQHR5cGVzW3Jlc291cmNlLnR5cGVdP1xuICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcbiAgICBlbHNlXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IFtdXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlIHdoZW4gdHlwZSBub3QgaW4gWydsaW5rcycsICdsaW5rZWQnLCAnbWV0YScsICdkYXRhJ11cbiAgICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwnLCB0eXBlLCAnY29sbGVjdGlvbiBvZicsIHJlc291cmNlcy5sZW5ndGggPyAxXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBwcmltYXJ5UmVzdWx0cy5wdXNoIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZSwgdHlwZVxuXG4gICAgcHJpbnQuaW5mbyAnUHJpbWFyeSByZXNvdXJjZXM6JywgcHJpbWFyeVJlc3VsdHNcbiAgICBQcm9taXNlLmFsbCBwcmltYXJ5UmVzdWx0c1xuXG4gIGhhbmRsZUxpbms6ICh0eXBlTmFtZSwgYXR0cmlidXRlTmFtZSwgaHJlZlRlbXBsYXRlLCBhdHRyaWJ1dGVUeXBlTmFtZSkgLT5cbiAgICB1bmxlc3MgQHR5cGVzW3R5cGVOYW1lXT9cbiAgICAgIEBjcmVhdGVUeXBlIHR5cGVOYW1lXG5cbiAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXSA/PSB7fVxuICAgIGlmIGhyZWZUZW1wbGF0ZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLmhyZWYgPSBocmVmVGVtcGxhdGVcbiAgICBpZiBhdHRyaWJ1dGVUeXBlTmFtZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLnR5cGUgPSBhdHRyaWJ1dGVOYW1lXG5cbiAgY3JlYXRlVHlwZTogKG5hbWUpIC0+XG4gICAgbmV3IFR5cGUgbmFtZTogbmFtZSwgYXBpQ2xpZW50OiB0aGlzXG5cbm1vZHVsZS5leHBvcnRzLnV0aWwgPSB7bWFrZUhUVFBSZXF1ZXN0fVxuIiwiIyBNYWtlIGEgcmF3LCBub24tQVBJIHNwZWNpZmljIEhUVFAgcmVxdWVzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMsIG1vZGlmeSkgLT5cbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gICAgcmVxdWVzdC5vcGVuIG1ldGhvZCwgZW5jb2RlVVJJIHVybFxuXG4gICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG5cbiAgICBpZiBoZWFkZXJzP1xuICAgICAgZm9yIGhlYWRlciwgdmFsdWUgb2YgaGVhZGVyc1xuICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIgaGVhZGVyLCB2YWx1ZVxuXG4gICAgaWYgbW9kaWZ5P1xuICAgICAgbW9kaWZpY2F0aW9ucyA9IG1vZGlmeSByZXF1ZXN0XG5cbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChlKSAtPlxuICAgICAgY29uc29sZS5sb2cgJ1JlYWR5IHN0YXRlOicsIChrZXkgZm9yIGtleSwgdmFsdWUgb2YgcmVxdWVzdCB3aGVuIHZhbHVlIGlzIHJlcXVlc3QucmVhZHlTdGF0ZSBhbmQga2V5IGlzbnQgJ3JlYWR5U3RhdGUnKVswXVxuICAgICAgaWYgcmVxdWVzdC5yZWFkeVN0YXRlIGlzIHJlcXVlc3QuRE9ORVxuICAgICAgICBjb25zb2xlLmxvZyAnRG9uZTsgc3RhdHVzIGlzJywgcmVxdWVzdC5zdGF0dXNcbiAgICAgICAgaWYgMjAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgMzAwXG4gICAgICAgICAgcmVzb2x2ZSByZXF1ZXN0XG4gICAgICAgIGVsc2UgIyBpZiA0MDAgPD0gcmVxdWVzdC5zdGF0dXMgPCA2MDBcbiAgICAgICAgICByZWplY3QgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5zZW5kIEpTT04uc3RyaW5naWZ5IGRhdGFcbiIsIiMgVGhpcyBpcyBhIHByZXR0eSBzdGFuZGFyZCBtZXJnZSBmdW5jdGlvbi5cbiMgTWVyZ2UgcHJvcGVydGllcyBvZiBhbGwgYXJndWVtZW50cyBpbnRvIHRoZSBmaXJzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBmb3IgYXJndW1lbnQgaW4gQXJyYXk6OnNsaWNlLmNhbGwgYXJndW1lbnRzLCAxIHdoZW4gYXJndW1lbnQ/XG4gICAgZm9yIGtleSwgdmFsdWUgb2YgYXJndW1lbnRcbiAgICAgIGFyZ3VtZW50c1swXVtrZXldID0gdmFsdWVcbiAgYXJndW1lbnRzWzBdXG4iLCJwcmludCA9IChjb2xvciwgbWVzc2FnZXMuLi4pIC0+XG4gIGNvbnNvbGUubG9nICclY3tqc29uOmFwaX0nLCBcImNvbG9yOiAje2NvbG9yfTsgZm9udDogYm9sZCAxZW0gbW9ub3NwYWNlO1wiLCBtZXNzYWdlcy4uLlxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGxvZzogcHJpbnQuYmluZCBudWxsLCAnZ3JheSdcbiAgaW5mbzogcHJpbnQuYmluZCBudWxsLCAnYmx1ZSdcbiAgd2FybjogcHJpbnQuYmluZCBudWxsLCAnb3JhbmdlJ1xuICBlcnJvcjogcHJpbnQuYmluZCBudWxsLCAncmVkJ1xuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNvdXJjZSBleHRlbmRzIEVtaXR0ZXJcbiAgaWQ6ICcnXG4gIGhyZWY6ICcnXG4gIHR5cGU6ICcnXG5cbiAgX3R5cGU6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKGNvbmZpZy4uLikgLT5cbiAgICBzdXBlclxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWcuLi4gaWYgY29uZmlnP1xuICAgIGNvbnNvbGU/LmxvZyBcIkNyZWF0ZWQgcmVzb3VyY2U6ICN7QF90eXBlLm5hbWV9ICN7QGlkfVwiLCB0aGlzXG4gICAgQGVtaXQgJ2NyZWF0ZSdcbiAgICBjb25zb2xlLmxvZyAnQ3JlYXRlZCEnXG5cbiAgIyBHZXQgYSBwcm9taXNlIGZvciBhbiBhdHRyaWJ1dGUgcmVmZXJyaW5nIHRvIChhbilvdGhlciByZXNvdXJjZShzKS5cbiAgYXR0cjogKGF0dHJpYnV0ZSkgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nIGxpbms6JywgYXR0cmlidXRlXG4gICAgaWYgYXR0cmlidXRlIG9mIHRoaXNcbiAgICAgIGNvbnNvbGU/Lndhcm4gXCJObyBuZWVkIHRvIGFjY2VzcyBhIG5vbi1saW5rZWQgYXR0cmlidXRlIHZpYSBhdHRyOiAje2F0dHJpYnV0ZX1cIiwgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlIEBbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgQGxpbmtzPyBhbmQgYXR0cmlidXRlIG9mIEBsaW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHJlc291cmNlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQGxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIGF0dHJpYnV0ZSBvZiBAX3R5cGUubGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiB0eXBlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQF90eXBlLmxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlXG4gICAgICBwcmludC5lcnJvciAnTm90IGEgbGluayBhdCBhbGwnXG4gICAgICBQcm9taXNlLnJlamVjdCBuZXcgRXJyb3IgXCJObyBhdHRyaWJ1dGUgI3thdHRyaWJ1dGV9IG9mICN7QF90eXBlLm5hbWV9IHJlc291cmNlXCJcblxuICBfZ2V0TGluazogKG5hbWUsIGxpbmspIC0+XG4gICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBsaW5rXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBJRChzKSdcbiAgICAgIGlkcyA9IGxpbmtcbiAgICAgIHtocmVmLCB0eXBlfSA9IEBfdHlwZS5saW5rc1tuYW1lXVxuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIGhyZWYgPSBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlIGlmIGxpbms/XG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBjb2xsZWN0aW9uIG9iamVjdCcsIGxpbmtcbiAgICAgICMgSXQncyBhIGNvbGxlY3Rpb24gb2JqZWN0LlxuICAgICAge2hyZWYsIGlkcywgdHlwZX0gPSBsaW5rXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgcHJpbnQud2FybiAnSFJFRicsIGhyZWZcbiAgICAgICAgaHJlZiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT8gYW5kIGlkcz9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCwgYnV0IGJsYW5rJ1xuICAgICAgIyBJdCBleGlzdHMsIGJ1dCBpdCdzIGJsYW5rLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlIG51bGxcblxuICAjIFR1cm4gYSBKU09OLUFQSSBcImhyZWZcIiB0ZW1wbGF0ZSBpbnRvIGEgdXNhYmxlIFVSTC5cbiAgUExBQ0VIT0xERVJTX1BBVFRFUk46IC97KC4rPyl9L2dcbiAgYXBwbHlIUkVGOiAoaHJlZiwgY29udGV4dCkgLT5cbiAgICBocmVmLnJlcGxhY2UgQFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcbiAgICAgIHByaW50Lndhcm4gJ1NlZ21lbnRzJywgc2VnbWVudHNcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIHByaW50Lndhcm4gJ1ZhbHVlJywgdmFsdWVcblxuICAgICAgaWYgQXJyYXkuaXNBcnJheSB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4gJywnXG5cbiAgICAgIHVubGVzcyB0eXBlb2YgdmFsdWUgaXMgJ3N0cmluZydcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVmFsdWUgZm9yICcje3BhdGh9JyBpbiAnI3tocmVmfScgc2hvdWxkIGJlIGEgc3RyaW5nLlwiXG5cbiAgICAgIHZhbHVlXG5cbiAgdXBkYXRlOiAoY2hhbmdlcy4uLikgLT5cbiAgICBtZXJnZUludG8gdGhpcywgY2hhbmdlcy4uLlxuICAgIEBlbWl0ICdjaGFuZ2UnXG5cbiAgc2F2ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1zYXZlJ1xuICAgIHNhdmUgPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucHV0IEBnZXRVUkwoKSwgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucG9zdCBAX3R5cGUuZ2V0VVJMKCksIHRoaXNcblxuICAgIHNhdmUudGhlbiAocmVzdWx0cykgPT5cbiAgICAgIEB1cGRhdGUgcmVzdWx0c1xuICAgICAgQGVtaXQgJ3NhdmUnXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBlbWl0ICd3aWxsLWRlbGV0ZSdcbiAgICBkZWxldGlvbiA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5kZWxldGUgQGdldFVSTCgpXG4gICAgZWxzZVxuICAgICAgIyBAX3R5cGUucmVtb3ZlUmVzb3VyY2UgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGRlbGV0aW9uLnRoZW4gPT5cbiAgICAgIEBlbWl0ICdkZWxldGUnXG5cbiAgbWF0Y2hlc1F1ZXJ5OiAocXVlcnkpIC0+XG4gICAgbWF0Y2hlcyA9IHRydWVcbiAgICBmb3IgcGFyYW0sIHZhbHVlIG9mIHF1ZXJ5XG4gICAgICBpZiBAW3BhcmFtXSBpc250IHZhbHVlXG4gICAgICAgIG1hdGNoZXMgPSBmYWxzZVxuICAgICAgICBicmVha1xuICAgIG1hdGNoZXNcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkKSAtPlxuICAgIHN1cGVyXG4gICAgQF90eXBlLl9oYW5kbGVSZXNvdXJjZUVtaXNzaW9uIHRoaXMsIGFyZ3VtZW50cy4uLlxuXG4gIGdldFVSTDogLT5cbiAgICBAaHJlZiB8fCBbQF90eXBlLmdldFVSTCgpLCBAaWRdLmpvaW4gJy8nXG5cbiAgdG9KU09OOiAtPlxuICAgIHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W0BfdHlwZS5uYW1lXSA9IHt9XG4gICAgZm9yIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3Qgb2YgQGNvbnN0cnVjdG9yLnByb3RvdHlwZVxuICAgICAgcmVzdWx0W0BfdHlwZS5uYW1lXVtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbmRlZmVyID0gLT5cbiAgZGVmZXJyYWwgPSB7fVxuICBkZWZlcnJhbC5wcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBkZWZlcnJhbC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgIGRlZmVycmFsLnJlamVjdCA9IHJlamVjdFxuICBkZWZlcnJhbFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGUgZXh0ZW5kcyBFbWl0dGVyXG4gIG5hbWU6ICcnXG4gIGFwaUNsaWVudDogbnVsbFxuXG4gIGxpbmtzOiBudWxsXG5cbiAgZGVmZXJyYWxzOiBudWxsXG4gIHJlc291cmNlUHJvbWlzZXM6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKGNvbmZpZ3MuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBtZXJnZUludG8gdGhpcywgY29uZmlncy4uLiBpZiBjb25maWdzP1xuICAgIHByaW50LmluZm8gJ0RlZmluaW5nIGEgbmV3IHJlc291cmNlIHR5cGU6JywgQG5hbWVcbiAgICBAbGlua3MgPz0ge31cbiAgICBAZGVmZXJyYWxzID89IHt9XG4gICAgQHJlc291cmNlUHJvbWlzZXMgPz0ge31cbiAgICBAYXBpQ2xpZW50LnR5cGVzW0BuYW1lXSA9IHRoaXNcblxuICBnZXRVUkw6IC0+XG4gICAgJy8nICsgQG5hbWVcblxuICBxdWVyeUxvY2FsOiAocXVlcnkpIC0+XG4gICAgUHJvbWlzZS5hbGwocmVzb3VyY2VQcm9taXNlIGZvciBpZCwgcmVzb3VyY2VQcm9taXNlIG9mIEByZXNvdXJjZVByb21pc2VzKS50aGVuIChyZXNvdXJjZXMpIC0+XG4gICAgICByZXNvdXJjZSBmb3IgcmVzb3VyY2UgaW4gcmVzb3VyY2VzIHdoZW4gcmVzb3VyY2U/Lm1hdGNoZXNRdWVyeSBxdWVyeVxuXG4gIHdhaXRpbmdGb3I6IChpZCkgLT5cbiAgICBAZGVmZXJyYWxzW2lkXT9cblxuICBoYXM6IChpZCkgLT5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0/IGFuZCBub3QgQGRlZmVycmFsc1tpZF0/XG5cbiAgZ2V0OiAtPlxuICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBhcmd1bWVudHNbMF1cbiAgICAgIEBnZXRCeUlEcyBhcmd1bWVudHMuLi5cbiAgICBlbHNlXG4gICAgICBAZ2V0QnlRdWVyeSBhcmd1bWVudHMuLi5cblxuICAjIEdpdmVuIGEgc3RyaW5nLCByZXR1cm4gYSBwcm9taXNlIGZvciB0aGF0IHJlc291cmNlLlxuICAjIEdpdmVuIGFuIGFycmF5LCByZXR1cm4gYW4gYXJyYXkgb2YgcHJvbWlzZXMgZm9yIHRob3NlIHJlc291cmNlcy5cbiAgZ2V0QnlJRHM6IChpZHMsIG9wdGlvbnMpIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZycsIEBuYW1lLCAnYnkgSUQocyknLCBpZHNcbiAgICBpZiB0eXBlb2YgaWRzIGlzICdzdHJpbmcnXG4gICAgICBnaXZlblN0cmluZyA9IHRydWVcbiAgICAgIGlkcyA9IFtpZHNdXG5cbiAgICAjIE9ubHkgcmVxdWVzdCB0aGluZ3Mgd2UgZG9uJ3QgaGF2ZSBvciBkb24ndCBhbHJlYWR5IGhhdmUgYSByZXF1ZXN0IG91dCBmb3IuXG4gICAgaW5jb21pbmcgPSAoaWQgZm9yIGlkIGluIGlkcyB3aGVuIG5vdCBAaGFzKGlkKSBhbmQgbm90IEB3YWl0aW5nRm9yKGlkKSlcbiAgICBwcmludC5sb2cgJ0luY29taW5nOiAnLCBpbmNvbWluZ1xuXG4gICAgdW5sZXNzIGluY29taW5nLmxlbmd0aCBpcyAwXG4gICAgICBmb3IgaWQgaW4gaW5jb21pbmdcbiAgICAgICAgQGRlZmVycmFsc1tpZF0gPSBkZWZlcigpXG4gICAgICAgIEByZXNvdXJjZVByb21pc2VzW2lkXSA9IEBkZWZlcnJhbHNbaWRdLnByb21pc2VcblxuICAgICAgdXJsID0gW0BnZXRVUkwoKSwgaW5jb21pbmcuam9pbiAnLCddLmpvaW4gJy8nXG4gICAgICBwcmludC5sb2cgJ1JlcXVlc3QgZm9yJywgQG5hbWUsICdhdCcsIHVybFxuICAgICAgQGFwaUNsaWVudC5nZXQodXJsLCBvcHRpb25zKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgIHByaW50LmxvZyAnR290JywgQG5hbWUsIHJlc291cmNlc1xuXG4gICAgaWYgZ2l2ZW5TdHJpbmdcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2lkc1swXV1cbiAgICBlbHNlXG4gICAgICBQcm9taXNlLmFsbCAoQHJlc291cmNlUHJvbWlzZXNbaWRdIGZvciBpZCBpbiBpZHMpXG5cbiAgZ2V0QnlRdWVyeTogKHF1ZXJ5LCBsaW1pdCA9IEluZmluaXR5KSAtPlxuICAgIEBxdWVyeUxvY2FsKHF1ZXJ5KS50aGVuIChleGlzdGluZykgPT5cbiAgICAgIGlmIGV4aXN0aW5nLmxlbmd0aCA+PSBsaW1pdFxuICAgICAgICBleGlzdGluZ1xuICAgICAgZWxzZVxuICAgICAgICBwYXJhbXMgPSBsaW1pdDogbGltaXQgLSBleGlzdGluZy5sZW5ndGhcbiAgICAgICAgQGFwaUNsaWVudC5nZXQoQGdldFVSTCgpLCBtZXJnZUludG8gcGFyYW1zLCBxdWVyeSkudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICAgIFByb21pc2UuYWxsIGV4aXN0aW5nLmNvbmNhdCByZXNvdXJjZXNcblxuICBjcmVhdGVSZXNvdXJjZTogKGRhdGEpIC0+XG4gICAgaWYgQHdhaXRpbmdGb3IgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdSZXNvbHZpbmcgYW5kIHJlbW92aW5nIGRlZmVycmFsIGZvcicsIEBuYW1lLCBkYXRhLmlkXG4gICAgICBAZGVmZXJyYWxzW2RhdGEuaWRdLnJlc29sdmUgbmV3IFJlc291cmNlIGRhdGEsIF90eXBlOiB0aGlzXG4gICAgICBAZGVmZXJyYWxzW2RhdGEuaWRdID0gbnVsbFxuICAgIGVsc2UgaWYgQGhhcyBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ1RoZScsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkLCAnZXhpc3RzOyB3aWxsIHVwZGF0ZSdcbiAgICAgIEBnZXQoZGF0YS5pZCkudGhlbiAocmVzb3VyY2UpIC0+XG4gICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdDcmVhdGluZyBuZXcnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZFxuICAgICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF0gPSBQcm9taXNlLnJlc29sdmUgbmV3IFJlc291cmNlIGRhdGEsIF90eXBlOiB0aGlzXG5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXVxuXG4gIF9oYW5kbGVSZXNvdXJjZUVtaXNzaW9uOiAocmVzb3VyY2UsIHNpZ25hbCwgcGF5bG9hZCkgLT5cbiAgICBAZW1pdCAnY2hhbmdlJ1xuIl19

