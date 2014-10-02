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
          return reject(new Error(request.responseText));
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

  Type.prototype.removeResource = function(resource) {
    if (resource.id && (this.resourcePromises[resource.id] != null)) {
      return this.resourcePromises[resource.id] = null;
    } else {

    }
  };

  Type.prototype._handleResourceEmission = function(resource, signal, payload) {
    return this.emit('change');
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2VtaXR0ZXIuY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvanNvbi1hcGktY2xpZW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL21ha2UtaHR0cC1yZXF1ZXN0LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL21lcmdlLWludG8uY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvcHJpbnQuY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvcmVzb3VyY2UuY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvdHlwZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBLE9BQUE7RUFBQSxrQkFBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxDQUFBLE1BQUEsQ0FBTyxDQUFDLElBQXBCLENBQXlCLFFBQXpCLEVBRk07RUFBQSxDQUxSLENBQUE7O0FBQUEsb0JBU0EsYUFBQSxHQUFlLFNBQUMsTUFBRCxFQUFTLFFBQVQsR0FBQTtBQUNiLFFBQUEsOENBQUE7QUFBQSxJQUFBLElBQUcsY0FBSDtBQUNFLE1BQUEsSUFBRywrQkFBSDtBQUNFLFFBQUEsSUFBRyxnQkFBSDtBQUNFLFVBQUEsSUFBRyxLQUFLLENBQUMsT0FBTixDQUFjLFFBQWQsQ0FBSDtBQUVFLFlBQUEsS0FBQSxHQUFRLENBQUEsQ0FBUixDQUFBO0FBQ0E7QUFBQSxpQkFBQSwrQ0FBQTtnQ0FBQTtrQkFBaUQsS0FBSyxDQUFDLE9BQU4sQ0FBYyxPQUFkLENBQUEsSUFBMkIsUUFBUSxDQUFDLE1BQVQsS0FBbUIsT0FBTyxDQUFDO0FBQ3JHLGdCQUFBLElBQUc7O0FBQUM7dUJBQUEsdURBQUE7dUNBQUE7d0JBQWtDLE9BQVEsQ0FBQSxDQUFBLENBQVIsS0FBYztBQUFoRCxvQ0FBQSxLQUFBO3FCQUFBO0FBQUE7O29CQUFELENBQXNELENBQUMsTUFBdkQsS0FBaUUsUUFBUSxDQUFDLE1BQTdFO0FBQ0Usa0JBQUEsS0FBQSxHQUFRLENBQVIsQ0FBQTtBQUNBLHdCQUZGOztlQURGO0FBQUEsYUFIRjtXQUFBLE1BQUE7QUFRRSxZQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVyxDQUFBLE1BQUEsQ0FBTyxDQUFDLFdBQXBCLENBQWdDLFFBQWhDLENBQVIsQ0FSRjtXQUFBO0FBU0EsVUFBQSxJQUFPLEtBQUEsS0FBUyxDQUFBLENBQWhCO21CQUNFLElBQUMsQ0FBQSxVQUFXLENBQUEsTUFBQSxDQUFPLENBQUMsTUFBcEIsQ0FBMkIsS0FBM0IsRUFBa0MsQ0FBbEMsRUFERjtXQVZGO1NBQUEsTUFBQTtpQkFhRSxJQUFDLENBQUEsVUFBVyxDQUFBLE1BQUEsQ0FBTyxDQUFDLE1BQXBCLENBQTJCLENBQTNCLEVBYkY7U0FERjtPQURGO0tBQUEsTUFBQTtBQWlCRTtXQUFBLHlCQUFBLEdBQUE7QUFBQSxzQkFBQSxJQUFDLENBQUEsYUFBRCxDQUFlLE1BQWYsRUFBQSxDQUFBO0FBQUE7c0JBakJGO0tBRGE7RUFBQSxDQVRmLENBQUE7O0FBQUEsb0JBNkJBLElBQUEsR0FBTSxTQUFBLEdBQUE7QUFDSixRQUFBLDBEQUFBO0FBQUEsSUFESyx1QkFBUSxpRUFDYixDQUFBOztNQUFBLE9BQU8sQ0FBRSxHQUFULENBQWEsVUFBYixFQUF5QixNQUF6QixFQUFpQyxJQUFJLENBQUMsU0FBTCxDQUFlLE9BQWYsQ0FBakMsaURBQTZFLENBQUUsZUFBL0U7S0FBQTtBQUNBLElBQUEsSUFBRyxNQUFBLElBQVUsSUFBQyxDQUFBLFVBQWQ7QUFDRTtBQUFBO1dBQUEsNENBQUE7NkJBQUE7QUFDRSxzQkFBQSxJQUFDLENBQUEsWUFBRCxDQUFjLFFBQWQsRUFBd0IsT0FBeEIsRUFBQSxDQURGO0FBQUE7c0JBREY7S0FGSTtFQUFBLENBN0JOLENBQUE7O0FBQUEsb0JBbUNBLFlBQUEsR0FBYyxTQUFDLE9BQUQsRUFBVSxJQUFWLEdBQUE7QUFDWixRQUFBLHdCQUFBO0FBQUEsSUFBQSxJQUFHLEtBQUssQ0FBQyxPQUFOLENBQWMsT0FBZCxDQUFIO0FBQ0UsTUFBQSxPQUFtQyxPQUFuQyxFQUFDLGlCQUFELEVBQVUsaUJBQVYsRUFBbUIseURBQW5CLENBQUE7QUFDQSxNQUFBLElBQUcsTUFBQSxDQUFBLE9BQUEsS0FBa0IsUUFBckI7QUFDRSxRQUFBLE9BQUEsR0FBVSxPQUFRLENBQUEsT0FBQSxDQUFsQixDQURGO09BRkY7S0FBQSxNQUFBO0FBS0UsTUFBQSxTQUFBLEdBQVksRUFBWixDQUxGO0tBQUE7V0FNQSxPQUFPLENBQUMsS0FBUixDQUFjLE9BQWQsRUFBdUIsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsSUFBakIsQ0FBdkIsRUFQWTtFQUFBLENBbkNkLENBQUE7O2lCQUFBOztJQURGLENBQUE7Ozs7O0FDQUEsSUFBQSwrRUFBQTtFQUFBLGtCQUFBOztBQUFBLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUixDQUFSLENBQUE7O0FBQUEsZUFDQSxHQUFrQixPQUFBLENBQVEscUJBQVIsQ0FEbEIsQ0FBQTs7QUFBQSxTQUVBLEdBQVksT0FBQSxDQUFRLGNBQVIsQ0FGWixDQUFBOztBQUFBLElBR0EsR0FBTyxPQUFBLENBQVEsUUFBUixDQUhQLENBQUE7O0FBQUEsdUJBS0EsR0FDRTtBQUFBLEVBQUEsY0FBQSxFQUFnQiwwQkFBaEI7QUFBQSxFQUNBLFFBQUEsRUFBVSwwQkFEVjtDQU5GLENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBdUI7QUFDckIsTUFBQSwyQkFBQTs7QUFBQSwwQkFBQSxJQUFBLEdBQU0sRUFBTixDQUFBOztBQUFBLDBCQUNBLE9BQUEsR0FBUyxJQURULENBQUE7O0FBQUEsMEJBR0EsS0FBQSxHQUFPLElBSFAsQ0FBQTs7QUFLYSxFQUFBLHVCQUFFLElBQUYsRUFBUyxPQUFULEdBQUE7QUFDWCxJQURZLElBQUMsQ0FBQSxPQUFBLElBQ2IsQ0FBQTtBQUFBLElBRG1CLElBQUMsQ0FBQSxVQUFBLE9BQ3BCLENBQUE7O01BQUEsSUFBQyxDQUFBLFVBQVc7S0FBWjtBQUFBLElBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxFQURULENBQUE7QUFBQSxJQUVBLEtBQUssQ0FBQyxJQUFOLENBQVcsa0NBQVgsRUFBK0MsSUFBQyxDQUFBLElBQWhELENBRkEsQ0FEVztFQUFBLENBTGI7O0FBQUEsMEJBVUEsT0FBQSxHQUFTLFNBQUMsTUFBRCxFQUFTLEdBQVQsRUFBYyxJQUFkLEVBQW9CLGlCQUFwQixHQUFBO0FBQ1AsUUFBQSxPQUFBO0FBQUEsSUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLFVBQVgsRUFBdUIsTUFBdkIsRUFBK0IsWUFBL0IsRUFBNkMsR0FBN0MsQ0FBQSxDQUFBO0FBQUEsSUFDQSxPQUFBLEdBQVUsU0FBQSxDQUFVLEVBQVYsRUFBYyx1QkFBZCxFQUF1QyxJQUFDLENBQUEsT0FBeEMsRUFBaUQsaUJBQWpELENBRFYsQ0FBQTtXQUVBLGVBQUEsQ0FBZ0IsTUFBaEIsRUFBd0IsSUFBQyxDQUFBLElBQUQsR0FBUSxHQUFoQyxFQUFxQyxJQUFyQyxFQUEyQyxPQUEzQyxDQUFtRCxDQUFDLElBQXBELENBQXlELElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxJQUFuQixDQUF3QixJQUF4QixDQUF6RCxFQUhPO0VBQUEsQ0FWVCxDQUFBOztBQWVBO0FBQUEsUUFBdUQsU0FBQyxNQUFELEdBQUE7V0FDckQsYUFBQyxDQUFBLFNBQUcsQ0FBQSxNQUFBLENBQUosR0FBYyxTQUFBLEdBQUE7YUFDWixJQUFDLENBQUEsT0FBRCxhQUFTLENBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBQSxDQUFzQixTQUFBLGFBQUEsU0FBQSxDQUFBLENBQS9CLEVBRFk7SUFBQSxFQUR1QztFQUFBLENBQXZEO0FBQUEsT0FBQSwyQ0FBQTtzQkFBQTtBQUFvRCxRQUFJLE9BQUosQ0FBcEQ7QUFBQSxHQWZBOztBQUFBLDBCQW1CQSxpQkFBQSxHQUFtQixTQUFDLE9BQUQsR0FBQTtBQUNqQixRQUFBLGtMQUFBO0FBQUEsSUFBQSxRQUFBLEdBQVcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFPLENBQUMsWUFBbkIsQ0FBWCxDQUFBO0FBQUEsSUFDQSxLQUFLLENBQUMsR0FBTixDQUFVLHFCQUFWLEVBQWlDLFFBQWpDLENBREEsQ0FBQTtBQUdBLElBQUEsSUFBRyxNQUFBLElBQVUsUUFBYjtBQUNFLE1BQUEsb0JBQUEsQ0FERjtLQUhBO0FBTUEsSUFBQSxJQUFHLE9BQUEsSUFBVyxRQUFkO0FBQ0U7QUFBQSxXQUFBLHlCQUFBO3VDQUFBO0FBQ0UsUUFBQSxRQUFvQixnQkFBZ0IsQ0FBQyxLQUFqQixDQUF1QixHQUF2QixDQUFwQixFQUFDLGVBQUQsRUFBTyxvQkFBUCxDQUFBO0FBQ0EsUUFBQSxJQUFHLE1BQUEsQ0FBQSxJQUFBLEtBQWUsUUFBbEI7QUFDRSxVQUFBLElBQUEsR0FBTyxJQUFQLENBREY7U0FBQSxNQUFBO0FBR0UsVUFBQyxZQUFBLElBQUQsRUFBYSxxQkFBTixJQUFQLENBSEY7U0FEQTtBQUFBLFFBTUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaLEVBQWtCLFNBQWxCLEVBQTZCLElBQTdCLEVBQW1DLGFBQW5DLENBTkEsQ0FERjtBQUFBLE9BREY7S0FOQTtBQWdCQSxJQUFBLElBQUcsUUFBQSxJQUFZLFFBQWY7QUFDRTtBQUFBLFdBQUEsYUFBQTtnQ0FBQTtBQUNFLFFBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFWLHNCQUFpQixZQUFZLENBQTdCLEVBQWdDLFFBQWhDLEVBQTBDLElBQTFDLEVBQWdELFlBQWhELENBQUEsQ0FBQTtBQUNBLFFBQUEsSUFBd0Isd0JBQXhCO0FBQUEsVUFBQSxJQUFDLENBQUEsVUFBRCxDQUFZLElBQVosQ0FBQSxDQUFBO1NBREE7QUFFQTtBQUFBLGFBQUEsOENBQUE7K0JBQUE7QUFDRSxVQUFBLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQSxDQUFLLENBQUMsY0FBYixDQUE0QixRQUE1QixDQUFBLENBREY7QUFBQSxTQUhGO0FBQUEsT0FERjtLQWhCQTtBQXVCQSxJQUFBLElBQUcsTUFBQSxJQUFVLFFBQWI7QUFDRSxNQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsc0NBQVYsbURBQXlFLENBQXpFLENBQUEsQ0FBQTtBQUFBLE1BQ0EsY0FBQTs7QUFBaUI7QUFBQTthQUFBLDhDQUFBOytCQUFBO0FBQ2YsVUFBQSxJQUFpQyxpQ0FBakM7QUFBQSxZQUFBLElBQUMsQ0FBQSxVQUFELENBQVksUUFBUSxDQUFDLElBQXJCLENBQUEsQ0FBQTtXQUFBO0FBQUEsd0JBQ0EsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFBLENBQUssQ0FBQyxjQUFiLENBQTRCLFFBQTVCLEVBREEsQ0FEZTtBQUFBOzttQkFEakIsQ0FERjtLQUFBLE1BQUE7QUFNRSxNQUFBLGNBQUEsR0FBaUIsRUFBakIsQ0FBQTtBQUNBLFdBQUEsZ0JBQUE7bUNBQUE7Y0FBcUMsSUFBQSxLQUFhLE9BQWIsSUFBQSxJQUFBLEtBQXNCLFFBQXRCLElBQUEsSUFBQSxLQUFnQyxNQUFoQyxJQUFBLElBQUEsS0FBd0M7O1NBQzNFO0FBQUEsUUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLGlCQUFWLEVBQTZCLElBQTdCLEVBQW1DLGVBQW5DLCtDQUF1RSxDQUF2RSxDQUFBLENBQUE7QUFDQSxRQUFBLElBQXdCLHdCQUF4QjtBQUFBLFVBQUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaLENBQUEsQ0FBQTtTQURBO0FBRUE7QUFBQSxhQUFBLDhDQUFBOytCQUFBO0FBQ0UsVUFBQSxjQUFjLENBQUMsSUFBZixDQUFvQixJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBSyxDQUFDLGNBQWIsQ0FBNEIsUUFBNUIsRUFBc0MsSUFBdEMsQ0FBcEIsQ0FBQSxDQURGO0FBQUEsU0FIRjtBQUFBLE9BUEY7S0F2QkE7QUFBQSxJQW9DQSxLQUFLLENBQUMsSUFBTixDQUFXLG9CQUFYLEVBQWlDLGNBQWpDLENBcENBLENBQUE7V0FxQ0EsZUF0Q2lCO0VBQUEsQ0FuQm5CLENBQUE7O0FBQUEsMEJBMkRBLFVBQUEsR0FBWSxTQUFDLFFBQUQsRUFBVyxhQUFYLEVBQTBCLFlBQTFCLEVBQXdDLGlCQUF4QyxHQUFBO0FBQ1YsUUFBQSxLQUFBO0FBQUEsSUFBQSxJQUFPLDRCQUFQO0FBQ0UsTUFBQSxJQUFDLENBQUEsVUFBRCxDQUFZLFFBQVosQ0FBQSxDQURGO0tBQUE7O1dBR3VCLENBQUEsaUJBQUEsSUFBc0I7S0FIN0M7QUFJQSxJQUFBLElBQUcsb0JBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxLQUFNLENBQUEsUUFBQSxDQUFTLENBQUMsS0FBTSxDQUFBLGlCQUFBLENBQWtCLENBQUMsSUFBMUMsR0FBaUQsWUFBakQsQ0FERjtLQUpBO0FBTUEsSUFBQSxJQUFHLHlCQUFIO2FBQ0UsSUFBQyxDQUFBLEtBQU0sQ0FBQSxRQUFBLENBQVMsQ0FBQyxLQUFNLENBQUEsaUJBQUEsQ0FBa0IsQ0FBQyxJQUExQyxHQUFpRCxjQURuRDtLQVBVO0VBQUEsQ0EzRFosQ0FBQTs7QUFBQSwwQkFxRUEsVUFBQSxHQUFZLFNBQUMsSUFBRCxHQUFBO1dBQ04sSUFBQSxJQUFBLENBQUs7QUFBQSxNQUFBLElBQUEsRUFBTSxJQUFOO0FBQUEsTUFBWSxTQUFBLEVBQVcsSUFBdkI7S0FBTCxFQURNO0VBQUEsQ0FyRVosQ0FBQTs7dUJBQUE7O0lBVkYsQ0FBQTs7QUFBQSxNQWtGTSxDQUFDLE9BQU8sQ0FBQyxJQUFmLEdBQXNCO0FBQUEsRUFBQyxpQkFBQSxlQUFEO0NBbEZ0QixDQUFBOzs7OztBQ0VBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsTUFBRCxFQUFTLEdBQVQsRUFBYyxJQUFkLEVBQW9CLE9BQXBCLEVBQTZCLE1BQTdCLEdBQUE7U0FDWCxJQUFBLE9BQUEsQ0FBUSxTQUFDLE9BQUQsRUFBVSxNQUFWLEdBQUE7QUFDVixRQUFBLHFDQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsR0FBQSxDQUFBLGNBQVYsQ0FBQTtBQUFBLElBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxNQUFiLEVBQXFCLFNBQUEsQ0FBVSxHQUFWLENBQXJCLENBREEsQ0FBQTtBQUFBLElBR0EsT0FBTyxDQUFDLGVBQVIsR0FBMEIsSUFIMUIsQ0FBQTtBQUtBLElBQUEsSUFBRyxlQUFIO0FBQ0UsV0FBQSxpQkFBQTtnQ0FBQTtBQUNFLFFBQUEsT0FBTyxDQUFDLGdCQUFSLENBQXlCLE1BQXpCLEVBQWlDLEtBQWpDLENBQUEsQ0FERjtBQUFBLE9BREY7S0FMQTtBQVNBLElBQUEsSUFBRyxjQUFIO0FBQ0UsTUFBQSxhQUFBLEdBQWdCLE1BQUEsQ0FBTyxPQUFQLENBQWhCLENBREY7S0FUQTtBQUFBLElBWUEsT0FBTyxDQUFDLGtCQUFSLEdBQTZCLFNBQUMsQ0FBRCxHQUFBO0FBQzNCLFVBQUEsZ0JBQUE7QUFBQSxNQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksY0FBWixFQUE0Qjs7QUFBQzthQUFBLGNBQUE7K0JBQUE7Y0FBbUMsS0FBQSxLQUFTLE9BQU8sQ0FBQyxVQUFqQixJQUFnQyxHQUFBLEtBQVM7QUFBNUUsMEJBQUEsSUFBQTtXQUFBO0FBQUE7O1VBQUQsQ0FBMkYsQ0FBQSxDQUFBLENBQXZILENBQUEsQ0FBQTtBQUNBLE1BQUEsSUFBRyxPQUFPLENBQUMsVUFBUixLQUFzQixPQUFPLENBQUMsSUFBakM7QUFDRSxRQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksaUJBQVosRUFBK0IsT0FBTyxDQUFDLE1BQXZDLENBQUEsQ0FBQTtBQUNBLFFBQUEsSUFBRyxDQUFBLEdBQUEsWUFBTyxPQUFPLENBQUMsT0FBZixRQUFBLEdBQXdCLEdBQXhCLENBQUg7aUJBQ0UsT0FBQSxDQUFRLE9BQVIsRUFERjtTQUFBLE1BRUssSUFBRyxDQUFBLEdBQUEsYUFBTyxPQUFPLENBQUMsT0FBZixTQUFBLEdBQXdCLEdBQXhCLENBQUg7aUJBQ0gsTUFBQSxDQUFXLElBQUEsS0FBQSxDQUFNLE9BQU8sQ0FBQyxZQUFkLENBQVgsRUFERztTQUpQO09BRjJCO0lBQUEsQ0FaN0IsQ0FBQTtXQXFCQSxPQUFPLENBQUMsSUFBUixDQUFhLElBQUksQ0FBQyxTQUFMLENBQWUsSUFBZixDQUFiLEVBdEJVO0VBQUEsQ0FBUixFQURXO0FBQUEsQ0FBakIsQ0FBQTs7Ozs7QUNDQSxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFBLEdBQUE7QUFDZixNQUFBLG9DQUFBO0FBQUE7QUFBQSxPQUFBLDJDQUFBO3dCQUFBO1FBQW9EO0FBQ2xELFdBQUEsZUFBQTs4QkFBQTtBQUNFLFFBQUEsU0FBVSxDQUFBLENBQUEsQ0FBRyxDQUFBLEdBQUEsQ0FBYixHQUFvQixLQUFwQixDQURGO0FBQUE7S0FERjtBQUFBLEdBQUE7U0FHQSxTQUFVLENBQUEsQ0FBQSxFQUpLO0FBQUEsQ0FBakIsQ0FBQTs7Ozs7QUNIQSxJQUFBLEtBQUE7RUFBQSxrQkFBQTs7QUFBQSxLQUFBLEdBQVEsU0FBQSxHQUFBO0FBQ04sTUFBQSxlQUFBO0FBQUEsRUFETyxzQkFBTyxrRUFDZCxDQUFBO1NBQUEsT0FBTyxDQUFDLEdBQVIsZ0JBQVksQ0FBQSxjQUFBLEVBQWlCLFNBQUEsR0FBUyxLQUFULEdBQWUsNkJBQThCLFNBQUEsYUFBQSxRQUFBLENBQUEsQ0FBMUUsRUFETTtBQUFBLENBQVIsQ0FBQTs7QUFBQSxNQUdNLENBQUMsT0FBUCxHQUNFO0FBQUEsRUFBQSxHQUFBLEVBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLE1BQWpCLENBQUw7QUFBQSxFQUNBLElBQUEsRUFBTSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsRUFBaUIsTUFBakIsQ0FETjtBQUFBLEVBRUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQUFpQixRQUFqQixDQUZOO0FBQUEsRUFHQSxLQUFBLEVBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLEtBQWpCLENBSFA7Q0FKRixDQUFBOzs7OztBQ0FBLElBQUEsbUNBQUE7RUFBQTs7b0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxPQUNBLEdBQVUsT0FBQSxDQUFRLFdBQVIsQ0FEVixDQUFBOztBQUFBLFNBRUEsR0FBWSxPQUFBLENBQVEsY0FBUixDQUZaLENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBdUI7QUFDckIsNkJBQUEsQ0FBQTs7QUFBQSxxQkFBQSxFQUFBLEdBQUksRUFBSixDQUFBOztBQUFBLHFCQUNBLElBQUEsR0FBTSxFQUROLENBQUE7O0FBQUEscUJBRUEsSUFBQSxHQUFNLEVBRk4sQ0FBQTs7QUFBQSxxQkFJQSxLQUFBLEdBQU8sSUFKUCxDQUFBOztBQU1hLEVBQUEsa0JBQUEsR0FBQTtBQUNYLFFBQUEsTUFBQTtBQUFBLElBRFksZ0VBQ1osQ0FBQTtBQUFBLElBQUEsMkNBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSxJQUFBLElBQTZCLGNBQTdCO0FBQUEsTUFBQSxTQUFBLGFBQVUsQ0FBQSxJQUFNLFNBQUEsYUFBQSxNQUFBLENBQUEsQ0FBaEIsQ0FBQSxDQUFBO0tBREE7O01BRUEsT0FBTyxDQUFFLEdBQVQsQ0FBYyxvQkFBQSxHQUFvQixJQUFDLENBQUEsS0FBSyxDQUFDLElBQTNCLEdBQWdDLEdBQWhDLEdBQW1DLElBQUMsQ0FBQSxFQUFsRCxFQUF3RCxJQUF4RDtLQUZBO0FBQUEsSUFHQSxJQUFDLENBQUEsSUFBRCxDQUFNLFFBQU4sQ0FIQSxDQUFBO0FBQUEsSUFJQSxPQUFPLENBQUMsR0FBUixDQUFZLFVBQVosQ0FKQSxDQURXO0VBQUEsQ0FOYjs7QUFBQSxxQkFjQSxJQUFBLEdBQU0sU0FBQyxTQUFELEdBQUE7QUFDSixJQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsZUFBWCxFQUE0QixTQUE1QixDQUFBLENBQUE7QUFDQSxJQUFBLElBQUcsU0FBQSxJQUFhLElBQWhCOztRQUNFLE9BQU8sQ0FBRSxJQUFULENBQWUscURBQUEsR0FBcUQsU0FBcEUsRUFBaUYsSUFBakY7T0FBQTthQUNBLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQUUsQ0FBQSxTQUFBLENBQWxCLEVBRkY7S0FBQSxNQUdLLElBQUcsb0JBQUEsSUFBWSxTQUFBLElBQWEsSUFBQyxDQUFBLEtBQTdCO0FBQ0gsTUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLGtCQUFWLENBQUEsQ0FBQTthQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsU0FBVixFQUFxQixJQUFDLENBQUEsS0FBTSxDQUFBLFNBQUEsQ0FBNUIsRUFGRztLQUFBLE1BR0EsSUFBRyxTQUFBLElBQWEsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUF2QjtBQUNILE1BQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxjQUFWLENBQUEsQ0FBQTthQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsU0FBVixFQUFxQixJQUFDLENBQUEsS0FBSyxDQUFDLEtBQU0sQ0FBQSxTQUFBLENBQWxDLEVBRkc7S0FBQSxNQUFBO0FBSUgsTUFBQSxLQUFLLENBQUMsS0FBTixDQUFZLG1CQUFaLENBQUEsQ0FBQTthQUNBLE9BQU8sQ0FBQyxNQUFSLENBQW1CLElBQUEsS0FBQSxDQUFPLGVBQUEsR0FBZSxTQUFmLEdBQXlCLE1BQXpCLEdBQStCLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBdEMsR0FBMkMsV0FBbEQsQ0FBbkIsRUFMRztLQVJEO0VBQUEsQ0FkTixDQUFBOztBQUFBLHFCQTZCQSxRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sSUFBUCxHQUFBO0FBQ1IsUUFBQSw4QkFBQTtBQUFBLElBQUEsSUFBRyxNQUFBLENBQUEsSUFBQSxLQUFlLFFBQWYsSUFBMkIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQTlCO0FBQ0UsTUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLGlCQUFWLENBQUEsQ0FBQTtBQUFBLE1BQ0EsR0FBQSxHQUFNLElBRE4sQ0FBQTtBQUFBLE1BRUEsT0FBZSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQU0sQ0FBQSxJQUFBLENBQTVCLEVBQUMsWUFBQSxJQUFELEVBQU8sWUFBQSxJQUZQLENBQUE7QUFJQSxNQUFBLElBQUcsWUFBSDtBQUNFLFFBQUEsT0FBQSxHQUFVLEVBQVYsQ0FBQTtBQUFBLFFBQ0EsT0FBUSxDQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFSLEdBQXVCLElBRHZCLENBQUE7QUFBQSxRQUVBLElBQUEsR0FBTyxTQUFBLENBQVUsSUFBVixFQUFnQixPQUFoQixDQUZQLENBQUE7ZUFHQSxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFqQixDQUFxQixJQUFyQixFQUpGO09BQUEsTUFNSyxJQUFHLFlBQUg7QUFDSCxRQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFNLENBQUEsSUFBQSxDQUE5QixDQUFBO2VBQ0EsSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFULEVBRkc7T0FYUDtLQUFBLE1BZUssSUFBRyxZQUFIO0FBQ0gsTUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLDZCQUFWLEVBQXlDLElBQXpDLENBQUEsQ0FBQTtBQUFBLE1BRUMsWUFBQSxJQUFELEVBQU8sV0FBQSxHQUFQLEVBQVksWUFBQSxJQUZaLENBQUE7QUFJQSxNQUFBLElBQUcsWUFBSDtBQUNFLFFBQUEsT0FBQSxHQUFVLEVBQVYsQ0FBQTtBQUFBLFFBQ0EsT0FBUSxDQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFSLEdBQXVCLElBRHZCLENBQUE7QUFBQSxRQUVBLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBWCxFQUFtQixJQUFuQixDQUZBLENBQUE7QUFBQSxRQUdBLElBQUEsR0FBTyxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsRUFBaUIsT0FBakIsQ0FIUCxDQUFBO2VBSUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBakIsQ0FBcUIsSUFBckIsRUFMRjtPQUFBLE1BT0ssSUFBRyxjQUFBLElBQVUsYUFBYjtBQUNILFFBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQU0sQ0FBQSxJQUFBLENBQTlCLENBQUE7ZUFDQSxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQVQsRUFGRztPQVpGO0tBQUEsTUFBQTtBQWlCSCxNQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsbUJBQVYsQ0FBQSxDQUFBO2FBRUEsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFuQkc7S0FoQkc7RUFBQSxDQTdCVixDQUFBOztBQUFBLHFCQW1FQSxvQkFBQSxHQUFzQixVQW5FdEIsQ0FBQTs7QUFBQSxxQkFvRUEsU0FBQSxHQUFXLFNBQUMsSUFBRCxFQUFPLE9BQVAsR0FBQTtXQUNULElBQUksQ0FBQyxPQUFMLENBQWEsSUFBQyxDQUFBLG9CQUFkLEVBQW9DLFNBQUMsQ0FBRCxFQUFJLElBQUosR0FBQTtBQUNsQyxVQUFBLHFDQUFBO0FBQUEsTUFBQSxRQUFBLEdBQVcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFYLENBQVgsQ0FBQTtBQUFBLE1BQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxVQUFYLEVBQXVCLFFBQXZCLENBREEsQ0FBQTtBQUFBLE1BR0EsS0FBQSxHQUFRLE9BSFIsQ0FBQTtBQUlBLGFBQU0sUUFBUSxDQUFDLE1BQVQsS0FBbUIsQ0FBekIsR0FBQTtBQUNFLFFBQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxLQUFULENBQUEsQ0FBVixDQUFBO0FBQUEsUUFDQSxLQUFBLGlGQUFzQyxDQUFBLE9BQUEsVUFEdEMsQ0FERjtNQUFBLENBSkE7QUFBQSxNQVFBLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBWCxFQUFvQixLQUFwQixDQVJBLENBQUE7QUFVQSxNQUFBLElBQUcsS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFkLENBQUg7QUFDRSxRQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVgsQ0FBUixDQURGO09BVkE7QUFhQSxNQUFBLElBQU8sTUFBQSxDQUFBLEtBQUEsS0FBZ0IsUUFBdkI7QUFDRSxjQUFVLElBQUEsS0FBQSxDQUFPLGFBQUEsR0FBYSxJQUFiLEdBQWtCLFFBQWxCLEdBQTBCLElBQTFCLEdBQStCLHVCQUF0QyxDQUFWLENBREY7T0FiQTthQWdCQSxNQWpCa0M7SUFBQSxDQUFwQyxFQURTO0VBQUEsQ0FwRVgsQ0FBQTs7QUFBQSxxQkF3RkEsTUFBQSxHQUFRLFNBQUEsR0FBQTtBQUNOLFFBQUEsT0FBQTtBQUFBLElBRE8saUVBQ1AsQ0FBQTtBQUFBLElBQUEsU0FBQSxhQUFVLENBQUEsSUFBTSxTQUFBLGFBQUEsT0FBQSxDQUFBLENBQWhCLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sUUFBTixFQUZNO0VBQUEsQ0F4RlIsQ0FBQTs7QUFBQSxxQkE0RkEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLFFBQUEsSUFBQTtBQUFBLElBQUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxXQUFOLENBQUEsQ0FBQTtBQUFBLElBQ0EsSUFBQSxHQUFVLElBQUMsQ0FBQSxFQUFKLEdBQ0wsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBakIsQ0FBcUIsSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQUFyQixFQUFnQyxJQUFoQyxDQURLLEdBR0wsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBakIsQ0FBc0IsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQUEsQ0FBdEIsRUFBdUMsSUFBdkMsQ0FKRixDQUFBO1dBTUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxPQUFELEdBQUE7QUFDUixRQUFBLEtBQUMsQ0FBQSxNQUFELENBQVEsT0FBUixDQUFBLENBQUE7ZUFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLE1BQU4sRUFGUTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVYsRUFQSTtFQUFBLENBNUZOLENBQUE7O0FBQUEscUJBdUdBLFNBQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixRQUFBLFFBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sYUFBTixDQUFBLENBQUE7QUFBQSxJQUNBLFFBQUEsR0FBYyxJQUFDLENBQUEsRUFBSixHQUNULElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQUQsQ0FBaEIsQ0FBd0IsSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQUF4QixDQURTLEdBSVQsT0FBTyxDQUFDLE9BQVIsQ0FBQSxDQUxGLENBQUE7V0FPQSxRQUFRLENBQUMsSUFBVCxDQUFjLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFBLEdBQUE7ZUFDWixLQUFDLENBQUEsSUFBRCxDQUFNLFFBQU4sRUFEWTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWQsRUFSTTtFQUFBLENBdkdSLENBQUE7O0FBQUEscUJBa0hBLFlBQUEsR0FBYyxTQUFDLEtBQUQsR0FBQTtBQUNaLFFBQUEscUJBQUE7QUFBQSxJQUFBLE9BQUEsR0FBVSxJQUFWLENBQUE7QUFDQSxTQUFBLGNBQUE7MkJBQUE7QUFDRSxNQUFBLElBQUcsSUFBRSxDQUFBLEtBQUEsQ0FBRixLQUFjLEtBQWpCO0FBQ0UsUUFBQSxPQUFBLEdBQVUsS0FBVixDQUFBO0FBQ0EsY0FGRjtPQURGO0FBQUEsS0FEQTtXQUtBLFFBTlk7RUFBQSxDQWxIZCxDQUFBOztBQUFBLHFCQTBIQSxJQUFBLEdBQU0sU0FBQyxNQUFELEVBQVMsT0FBVCxHQUFBO0FBQ0osUUFBQSxJQUFBO0FBQUEsSUFBQSxvQ0FBQSxTQUFBLENBQUEsQ0FBQTtXQUNBLFFBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTSxDQUFDLHVCQUFQLGFBQStCLENBQUEsSUFBTSxTQUFBLGFBQUEsU0FBQSxDQUFBLENBQXJDLEVBRkk7RUFBQSxDQTFITixDQUFBOztBQUFBLHFCQThIQSxNQUFBLEdBQVEsU0FBQSxHQUFBO1dBQ04sSUFBQyxDQUFBLElBQUQsSUFBUyxDQUFDLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFBLENBQUQsRUFBa0IsSUFBQyxDQUFBLEVBQW5CLENBQXNCLENBQUMsSUFBdkIsQ0FBNEIsR0FBNUIsRUFESDtFQUFBLENBOUhSLENBQUE7O0FBQUEscUJBaUlBLE1BQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixRQUFBLGtCQUFBO0FBQUEsSUFBQSxNQUFBLEdBQVMsRUFBVCxDQUFBO0FBQUEsSUFDQSxNQUFPLENBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVAsR0FBc0IsRUFEdEIsQ0FBQTtBQUVBLFNBQUEsV0FBQTt3QkFBQTtVQUE0QixHQUFHLENBQUMsTUFBSixDQUFXLENBQVgsQ0FBQSxLQUFtQixHQUFuQixJQUEyQixDQUFBLENBQUEsR0FBQSxJQUFXLElBQUMsQ0FBQSxXQUFXLENBQUMsU0FBeEI7QUFDckQsUUFBQSxNQUFPLENBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQWEsQ0FBQSxHQUFBLENBQXBCLEdBQTJCLEtBQTNCO09BREY7QUFBQSxLQUZBO1dBSUEsT0FMTTtFQUFBLENBaklSLENBQUE7O2tCQUFBOztHQURzQyxRQUp4QyxDQUFBOzs7OztBQ0FBLElBQUEsZ0RBQUE7RUFBQTs7b0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxPQUNBLEdBQVUsT0FBQSxDQUFRLFdBQVIsQ0FEVixDQUFBOztBQUFBLFNBRUEsR0FBWSxPQUFBLENBQVEsY0FBUixDQUZaLENBQUE7O0FBQUEsUUFHQSxHQUFXLE9BQUEsQ0FBUSxZQUFSLENBSFgsQ0FBQTs7QUFBQSxLQUtBLEdBQVEsU0FBQSxHQUFBO0FBQ04sTUFBQSxRQUFBO0FBQUEsRUFBQSxRQUFBLEdBQVcsRUFBWCxDQUFBO0FBQUEsRUFDQSxRQUFRLENBQUMsT0FBVCxHQUF1QixJQUFBLE9BQUEsQ0FBUSxTQUFDLE9BQUQsRUFBVSxNQUFWLEdBQUE7QUFDN0IsSUFBQSxRQUFRLENBQUMsT0FBVCxHQUFtQixPQUFuQixDQUFBO1dBQ0EsUUFBUSxDQUFDLE1BQVQsR0FBa0IsT0FGVztFQUFBLENBQVIsQ0FEdkIsQ0FBQTtTQUlBLFNBTE07QUFBQSxDQUxSLENBQUE7O0FBQUEsTUFZTSxDQUFDLE9BQVAsR0FBdUI7QUFDckIseUJBQUEsQ0FBQTs7QUFBQSxpQkFBQSxJQUFBLEdBQU0sRUFBTixDQUFBOztBQUFBLGlCQUNBLFNBQUEsR0FBVyxJQURYLENBQUE7O0FBQUEsaUJBR0EsS0FBQSxHQUFPLElBSFAsQ0FBQTs7QUFBQSxpQkFLQSxTQUFBLEdBQVcsSUFMWCxDQUFBOztBQUFBLGlCQU1BLGdCQUFBLEdBQWtCLElBTmxCLENBQUE7O0FBUWEsRUFBQSxjQUFBLEdBQUE7QUFDWCxRQUFBLE9BQUE7QUFBQSxJQURZLGlFQUNaLENBQUE7QUFBQSxJQUFBLHVDQUFBLFNBQUEsQ0FBQSxDQUFBO0FBQ0EsSUFBQSxJQUE4QixlQUE5QjtBQUFBLE1BQUEsU0FBQSxhQUFVLENBQUEsSUFBTSxTQUFBLGFBQUEsT0FBQSxDQUFBLENBQWhCLENBQUEsQ0FBQTtLQURBO0FBQUEsSUFFQSxLQUFLLENBQUMsSUFBTixDQUFXLCtCQUFYLEVBQTRDLElBQUMsQ0FBQSxJQUE3QyxDQUZBLENBQUE7O01BR0EsSUFBQyxDQUFBLFFBQVM7S0FIVjs7TUFJQSxJQUFDLENBQUEsWUFBYTtLQUpkOztNQUtBLElBQUMsQ0FBQSxtQkFBb0I7S0FMckI7QUFBQSxJQU1BLElBQUMsQ0FBQSxTQUFTLENBQUMsS0FBTSxDQUFBLElBQUMsQ0FBQSxJQUFELENBQWpCLEdBQTBCLElBTjFCLENBRFc7RUFBQSxDQVJiOztBQUFBLGlCQWlCQSxNQUFBLEdBQVEsU0FBQSxHQUFBO1dBQ04sR0FBQSxHQUFNLElBQUMsQ0FBQSxLQUREO0VBQUEsQ0FqQlIsQ0FBQTs7QUFBQSxpQkFvQkEsVUFBQSxHQUFZLFNBQUMsS0FBRCxHQUFBO0FBQ1YsUUFBQSxtQkFBQTtXQUFBLE9BQU8sQ0FBQyxHQUFSOztBQUFZO0FBQUE7V0FBQSxVQUFBO21DQUFBO0FBQUEsc0JBQUEsZ0JBQUEsQ0FBQTtBQUFBOztpQkFBWixDQUF5RSxDQUFDLElBQTFFLENBQStFLFNBQUMsU0FBRCxHQUFBO0FBQzdFLFVBQUEsNEJBQUE7QUFBQTtXQUFBLGdEQUFBO2lDQUFBOytCQUF3QyxRQUFRLENBQUUsWUFBVixDQUF1QixLQUF2QjtBQUF4Qyx3QkFBQSxTQUFBO1NBQUE7QUFBQTtzQkFENkU7SUFBQSxDQUEvRSxFQURVO0VBQUEsQ0FwQlosQ0FBQTs7QUFBQSxpQkF3QkEsVUFBQSxHQUFZLFNBQUMsRUFBRCxHQUFBO1dBQ1YsMkJBRFU7RUFBQSxDQXhCWixDQUFBOztBQUFBLGlCQTJCQSxHQUFBLEdBQUssU0FBQyxFQUFELEdBQUE7V0FDSCxtQ0FBQSxJQUErQiw2QkFENUI7RUFBQSxDQTNCTCxDQUFBOztBQUFBLGlCQThCQSxHQUFBLEdBQUssU0FBQSxHQUFBO0FBQ0gsSUFBQSxJQUFHLE1BQUEsQ0FBQSxTQUFpQixDQUFBLENBQUEsQ0FBakIsS0FBdUIsUUFBdkIsSUFBbUMsS0FBSyxDQUFDLE9BQU4sQ0FBYyxTQUFVLENBQUEsQ0FBQSxDQUF4QixDQUF0QzthQUNFLElBQUMsQ0FBQSxRQUFELGFBQVUsU0FBVixFQURGO0tBQUEsTUFBQTthQUdFLElBQUMsQ0FBQSxVQUFELGFBQVksU0FBWixFQUhGO0tBREc7RUFBQSxDQTlCTCxDQUFBOztBQUFBLGlCQXNDQSxRQUFBLEdBQVUsU0FBQyxHQUFELEVBQU0sT0FBTixHQUFBO0FBQ1IsUUFBQSx3Q0FBQTtBQUFBLElBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxTQUFYLEVBQXNCLElBQUMsQ0FBQSxJQUF2QixFQUE2QixVQUE3QixFQUF5QyxHQUF6QyxDQUFBLENBQUE7QUFDQSxJQUFBLElBQUcsTUFBQSxDQUFBLEdBQUEsS0FBYyxRQUFqQjtBQUNFLE1BQUEsV0FBQSxHQUFjLElBQWQsQ0FBQTtBQUFBLE1BQ0EsR0FBQSxHQUFNLENBQUMsR0FBRCxDQUROLENBREY7S0FEQTtBQUFBLElBTUEsUUFBQTs7QUFBWTtXQUFBLDBDQUFBO3FCQUFBO1lBQXNCLENBQUEsSUFBSyxDQUFBLEdBQUQsQ0FBSyxFQUFMLENBQUosSUFBaUIsQ0FBQSxJQUFLLENBQUEsVUFBRCxDQUFZLEVBQVo7QUFBM0Msd0JBQUEsR0FBQTtTQUFBO0FBQUE7O2lCQU5aLENBQUE7QUFBQSxJQU9BLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF3QixRQUF4QixDQVBBLENBQUE7QUFTQSxJQUFBLElBQU8sUUFBUSxDQUFDLE1BQVQsS0FBbUIsQ0FBMUI7QUFDRSxXQUFBLCtDQUFBOzBCQUFBO0FBQ0UsUUFBQSxJQUFDLENBQUEsU0FBVSxDQUFBLEVBQUEsQ0FBWCxHQUFpQixLQUFBLENBQUEsQ0FBakIsQ0FBQTtBQUFBLFFBQ0EsSUFBQyxDQUFBLGdCQUFpQixDQUFBLEVBQUEsQ0FBbEIsR0FBd0IsSUFBQyxDQUFBLFNBQVUsQ0FBQSxFQUFBLENBQUcsQ0FBQyxPQUR2QyxDQURGO0FBQUEsT0FBQTtBQUFBLE1BSUEsR0FBQSxHQUFNLENBQUMsSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQUFELEVBQVksUUFBUSxDQUFDLElBQVQsQ0FBYyxHQUFkLENBQVosQ0FBOEIsQ0FBQyxJQUEvQixDQUFvQyxHQUFwQyxDQUpOLENBQUE7QUFBQSxNQUtBLEtBQUssQ0FBQyxHQUFOLENBQVUsYUFBVixFQUF5QixJQUFDLENBQUEsSUFBMUIsRUFBZ0MsSUFBaEMsRUFBc0MsR0FBdEMsQ0FMQSxDQUFBO0FBQUEsTUFNQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxHQUFmLEVBQW9CLE9BQXBCLENBQTRCLENBQUMsSUFBN0IsQ0FBa0MsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsU0FBRCxHQUFBO2lCQUNoQyxLQUFLLENBQUMsR0FBTixDQUFVLEtBQVYsRUFBaUIsS0FBQyxDQUFBLElBQWxCLEVBQXdCLFNBQXhCLEVBRGdDO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEMsQ0FOQSxDQURGO0tBVEE7QUFtQkEsSUFBQSxJQUFHLFdBQUg7YUFDRSxJQUFDLENBQUEsZ0JBQWlCLENBQUEsR0FBSSxDQUFBLENBQUEsQ0FBSixFQURwQjtLQUFBLE1BQUE7YUFHRSxPQUFPLENBQUMsR0FBUjs7QUFBYTthQUFBLDRDQUFBO3VCQUFBO0FBQUEsd0JBQUEsSUFBQyxDQUFBLGdCQUFpQixDQUFBLEVBQUEsRUFBbEIsQ0FBQTtBQUFBOzttQkFBYixFQUhGO0tBcEJRO0VBQUEsQ0F0Q1YsQ0FBQTs7QUFBQSxpQkErREEsVUFBQSxHQUFZLFNBQUMsS0FBRCxFQUFRLEtBQVIsR0FBQTs7TUFBUSxRQUFRO0tBQzFCO1dBQUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxLQUFaLENBQWtCLENBQUMsSUFBbkIsQ0FBd0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsUUFBRCxHQUFBO0FBQ3RCLFlBQUEsTUFBQTtBQUFBLFFBQUEsSUFBRyxRQUFRLENBQUMsTUFBVCxJQUFtQixLQUF0QjtpQkFDRSxTQURGO1NBQUEsTUFBQTtBQUdFLFVBQUEsTUFBQSxHQUFTO0FBQUEsWUFBQSxLQUFBLEVBQU8sS0FBQSxHQUFRLFFBQVEsQ0FBQyxNQUF4QjtXQUFULENBQUE7aUJBQ0EsS0FBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsS0FBQyxDQUFBLE1BQUQsQ0FBQSxDQUFmLEVBQTBCLFNBQUEsQ0FBVSxNQUFWLEVBQWtCLEtBQWxCLENBQTFCLENBQWtELENBQUMsSUFBbkQsQ0FBd0QsU0FBQyxTQUFELEdBQUE7bUJBQ3RELE9BQU8sQ0FBQyxHQUFSLENBQVksUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsU0FBaEIsQ0FBWixFQURzRDtVQUFBLENBQXhELEVBSkY7U0FEc0I7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF4QixFQURVO0VBQUEsQ0EvRFosQ0FBQTs7QUFBQSxpQkF3RUEsY0FBQSxHQUFnQixTQUFDLElBQUQsR0FBQTtBQUNkLElBQUEsSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFZLElBQUksQ0FBQyxFQUFqQixDQUFIO0FBQ0UsTUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLHFDQUFWLEVBQWlELElBQUMsQ0FBQSxJQUFsRCxFQUF3RCxJQUFJLENBQUMsRUFBN0QsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsU0FBVSxDQUFBLElBQUksQ0FBQyxFQUFMLENBQVEsQ0FBQyxPQUFwQixDQUFnQyxJQUFBLFFBQUEsQ0FBUyxJQUFULEVBQWU7QUFBQSxRQUFBLEtBQUEsRUFBTyxJQUFQO09BQWYsQ0FBaEMsQ0FEQSxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsU0FBVSxDQUFBLElBQUksQ0FBQyxFQUFMLENBQVgsR0FBc0IsSUFGdEIsQ0FERjtLQUFBLE1BSUssSUFBRyxJQUFDLENBQUEsR0FBRCxDQUFLLElBQUksQ0FBQyxFQUFWLENBQUg7QUFDSCxNQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsSUFBbEIsRUFBd0IsVUFBeEIsRUFBb0MsSUFBSSxDQUFDLEVBQXpDLEVBQTZDLHFCQUE3QyxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxHQUFELENBQUssSUFBSSxDQUFDLEVBQVYsQ0FBYSxDQUFDLElBQWQsQ0FBbUIsU0FBQyxRQUFELEdBQUE7ZUFDakIsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsSUFBaEIsRUFEaUI7TUFBQSxDQUFuQixDQURBLENBREc7S0FBQSxNQUFBO0FBS0gsTUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLGNBQVYsRUFBMEIsSUFBQyxDQUFBLElBQTNCLEVBQWlDLFVBQWpDLEVBQTZDLElBQUksQ0FBQyxFQUFsRCxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxnQkFBaUIsQ0FBQSxJQUFJLENBQUMsRUFBTCxDQUFsQixHQUE2QixPQUFPLENBQUMsT0FBUixDQUFvQixJQUFBLFFBQUEsQ0FBUyxJQUFULEVBQWU7QUFBQSxRQUFBLEtBQUEsRUFBTyxJQUFQO09BQWYsQ0FBcEIsQ0FEN0IsQ0FMRztLQUpMO1dBWUEsSUFBQyxDQUFBLGdCQUFpQixDQUFBLElBQUksQ0FBQyxFQUFMLEVBYko7RUFBQSxDQXhFaEIsQ0FBQTs7QUFBQSxpQkF1RkEsY0FBQSxHQUFnQixTQUFDLFFBQUQsR0FBQTtBQUNkLElBQUEsSUFBRyxRQUFRLENBQUMsRUFBVCxJQUFnQiw0Q0FBbkI7YUFDRSxJQUFDLENBQUEsZ0JBQWlCLENBQUEsUUFBUSxDQUFDLEVBQVQsQ0FBbEIsR0FBaUMsS0FEbkM7S0FBQSxNQUFBO0FBQUE7S0FEYztFQUFBLENBdkZoQixDQUFBOztBQUFBLGlCQTZGQSx1QkFBQSxHQUF5QixTQUFDLFFBQUQsRUFBVyxNQUFYLEVBQW1CLE9BQW5CLEdBQUE7V0FDdkIsSUFBQyxDQUFBLElBQUQsQ0FBTSxRQUFOLEVBRHVCO0VBQUEsQ0E3RnpCLENBQUE7O2NBQUE7O0dBRGtDLFFBWnBDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdID89IFtdXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5wdXNoIGNhbGxiYWNrXG5cbiAgc3RvcExpc3RlbmluZzogKHNpZ25hbCwgY2FsbGJhY2spIC0+XG4gICAgaWYgc2lnbmFsP1xuICAgICAgaWYgQF9jYWxsYmFja3Nbc2lnbmFsXT9cbiAgICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgICAgaWYgQXJyYXkuaXNBcnJheSBjYWxsYmFja1xuICAgICAgICAgICAgIyBBcnJheS1zdHlsZSBjYWxsYmFja3MgbmVlZCBub3QgYmUgdGhlIGV4YWN0IHNhbWUgb2JqZWN0LlxuICAgICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgICAgZm9yIGhhbmRsZXIsIGkgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXSBieSAtMSB3aGVuIEFycmF5LmlzQXJyYXkoaGFuZGxlcikgYW5kIGNhbGxiYWNrLmxlbmd0aCBpcyBoYW5kbGVyLmxlbmd0aFxuICAgICAgICAgICAgICBpZiAobnVsbCBmb3IgaXRlbSwgaiBpbiBjYWxsYmFjayB3aGVuIGhhbmRsZXJbal0gaXMgaXRlbSkubGVuZ3RoIGlzIGNhbGxiYWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgICAgdW5sZXNzIGluZGV4IGlzIC0xXG4gICAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSBpbmRleCwgMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgMFxuICAgIGVsc2VcbiAgICAgIEBzdG9wTGlzdGVuaW5nIHNpZ25hbCBmb3Igc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBjb25zb2xlPy5sb2cgJ0VtaXR0aW5nJywgc2lnbmFsLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSwgQF9jYWxsYmFja3Nbc2lnbmFsXT8ubGVuZ3RoXG4gICAgaWYgc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBAX2NhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG5cbiAgX2NhbGxIYW5kbGVyOiAoaGFuZGxlciwgYXJncykgLT5cbiAgICBpZiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgIFtjb250ZXh0LCBoYW5kbGVyLCBib3VuZEFyZ3MuLi5dID0gaGFuZGxlclxuICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgaGFuZGxlciA9IGNvbnRleHRbaGFuZGxlcl1cbiAgICBlbHNlXG4gICAgICBib3VuZEFyZ3MgPSBbXVxuICAgIGhhbmRsZXIuYXBwbHkgY29udGV4dCwgYm91bmRBcmdzLmNvbmNhdCBhcmdzXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5tYWtlSFRUUFJlcXVlc3QgPSByZXF1aXJlICcuL21ha2UtaHR0cC1yZXF1ZXN0J1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuVHlwZSA9IHJlcXVpcmUgJy4vdHlwZSdcblxuREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQgPVxuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5hcGkranNvbidcbiAgJ0FjY2VwdCc6IFwiYXBwbGljYXRpb24vdm5kLmFwaStqc29uXCJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKU09OQVBJQ2xpZW50XG4gIHJvb3Q6ICcnXG4gIGhlYWRlcnM6IG51bGxcblxuICB0eXBlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQHJvb3QsIEBoZWFkZXJzKSAtPlxuICAgIEBoZWFkZXJzID89IHt9XG4gICAgQHR5cGVzID0ge31cbiAgICBwcmludC5pbmZvICdDcmVhdGVkIGEgbmV3IEpTT04tQVBJIGNsaWVudCBhdCcsIEByb290XG5cbiAgcmVxdWVzdDogKG1ldGhvZCwgdXJsLCBkYXRhLCBhZGRpdGlvbmFsSGVhZGVycykgLT5cbiAgICBwcmludC5pbmZvICdNYWtpbmcgYScsIG1ldGhvZCwgJ3JlcXVlc3QgdG8nLCB1cmxcbiAgICBoZWFkZXJzID0gbWVyZ2VJbnRvIHt9LCBERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCwgQGhlYWRlcnMsIGFkZGl0aW9uYWxIZWFkZXJzXG4gICAgbWFrZUhUVFBSZXF1ZXN0KG1ldGhvZCwgQHJvb3QgKyB1cmwsIGRhdGEsIGhlYWRlcnMpLnRoZW4gQHByb2Nlc3NSZXNwb25zZVRvLmJpbmQgdGhpc1xuXG4gIGZvciBtZXRob2QgaW4gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJ10gdGhlbiBkbyAobWV0aG9kKSA9PlxuICAgIEA6OlttZXRob2RdID0gLT5cbiAgICAgIEByZXF1ZXN0IG1ldGhvZC50b1VwcGVyQ2FzZSgpLCBhcmd1bWVudHMuLi5cblxuICBwcm9jZXNzUmVzcG9uc2VUbzogKHJlcXVlc3QpIC0+XG4gICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlIHJlcXVlc3QucmVzcG9uc2VUZXh0XG4gICAgcHJpbnQubG9nICdQcm9jZXNzaW5nIHJlc3BvbnNlJywgcmVzcG9uc2VcblxuICAgIGlmICdtZXRhJyBvZiByZXNwb25zZVxuICAgICAgJ1RPRE86IE5vIGlkZWEgeWV0ISdcblxuICAgIGlmICdsaW5rcycgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlQW5kQXR0cmlidXRlLCBsaW5rIG9mIHJlc3BvbnNlLmxpbmtzXG4gICAgICAgIFt0eXBlLCBhdHRyaWJ1dGVdID0gdHlwZUFuZEF0dHJpYnV0ZS5zcGxpdCAnLidcbiAgICAgICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZydcbiAgICAgICAgICBocmVmID0gbGlua1xuICAgICAgICBlbHNlXG4gICAgICAgICAge2hyZWYsIHR5cGU6IGF0dHJpYnV0ZVR5cGV9ID0gbGlua1xuXG4gICAgICAgIEBoYW5kbGVMaW5rIHR5cGUsIGF0dHJpYnV0ZSwgaHJlZiwgYXR0cmlidXRlVHlwZVxuXG4gICAgaWYgJ2xpbmtlZCcgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2UubGlua2VkXG4gICAgICAgIHByaW50LmxvZyAnR290JywgcmVzb3VyY2VzID8gMSwgJ2xpbmtlZCcsIHR5cGUsICdyZXNvdXJjZXMuJ1xuICAgICAgICBAY3JlYXRlVHlwZSB0eXBlIHVubGVzcyBAdHlwZXNbdHlwZV0/XG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgICAgQHR5cGVzW3R5cGVdLmNyZWF0ZVJlc291cmNlIHJlc291cmNlXG5cbiAgICBpZiAnZGF0YScgb2YgcmVzcG9uc2VcbiAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsIFwiZGF0YVwiIGNvbGxlY3Rpb24gb2YnLCByZXNwb25zZS5kYXRhLmxlbmd0aCA/IDFcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNwb25zZS5kYXRhXG4gICAgICAgIEBjcmVhdGVUeXBlIHJlc3BvbnNlLnR5cGUgdW5sZXNzIEB0eXBlc1tyZXNvdXJjZS50eXBlXT9cbiAgICAgICAgQHR5cGVzW3R5cGVdLmNyZWF0ZVJlc291cmNlIHJlc291cmNlXG4gICAgZWxzZVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBbXVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZSB3aGVuIHR5cGUgbm90IGluIFsnbGlua3MnLCAnbGlua2VkJywgJ21ldGEnLCAnZGF0YSddXG4gICAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsJywgdHlwZSwgJ2NvbGxlY3Rpb24gb2YnLCByZXNvdXJjZXMubGVuZ3RoID8gMVxuICAgICAgICBAY3JlYXRlVHlwZSB0eXBlIHVubGVzcyBAdHlwZXNbdHlwZV0/XG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgICAgcHJpbWFyeVJlc3VsdHMucHVzaCBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2UsIHR5cGVcblxuICAgIHByaW50LmluZm8gJ1ByaW1hcnkgcmVzb3VyY2VzOicsIHByaW1hcnlSZXN1bHRzXG4gICAgcHJpbWFyeVJlc3VsdHNcblxuICBoYW5kbGVMaW5rOiAodHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIGhyZWZUZW1wbGF0ZSwgYXR0cmlidXRlVHlwZU5hbWUpIC0+XG4gICAgdW5sZXNzIEB0eXBlc1t0eXBlTmFtZV0/XG4gICAgICBAY3JlYXRlVHlwZSB0eXBlTmFtZVxuXG4gICAgQHR5cGVzW3R5cGVOYW1lXS5saW5rc1thdHRyaWJ1dGVUeXBlTmFtZV0gPz0ge31cbiAgICBpZiBocmVmVGVtcGxhdGU/XG4gICAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXS5ocmVmID0gaHJlZlRlbXBsYXRlXG4gICAgaWYgYXR0cmlidXRlVHlwZU5hbWU/XG4gICAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXS50eXBlID0gYXR0cmlidXRlTmFtZVxuXG4gIGNyZWF0ZVR5cGU6IChuYW1lKSAtPlxuICAgIG5ldyBUeXBlIG5hbWU6IG5hbWUsIGFwaUNsaWVudDogdGhpc1xuXG5tb2R1bGUuZXhwb3J0cy51dGlsID0ge21ha2VIVFRQUmVxdWVzdH1cbiIsIiMgTWFrZSBhIHJhdywgbm9uLUFQSSBzcGVjaWZpYyBIVFRQIHJlcXVlc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzLCBtb2RpZnkpIC0+XG4gIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICAgIHJlcXVlc3Qub3BlbiBtZXRob2QsIGVuY29kZVVSSSB1cmxcblxuICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuXG4gICAgaWYgaGVhZGVycz9cbiAgICAgIGZvciBoZWFkZXIsIHZhbHVlIG9mIGhlYWRlcnNcbiAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyIGhlYWRlciwgdmFsdWVcblxuICAgIGlmIG1vZGlmeT9cbiAgICAgIG1vZGlmaWNhdGlvbnMgPSBtb2RpZnkgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nICdSZWFkeSBzdGF0ZTonLCAoa2V5IGZvciBrZXksIHZhbHVlIG9mIHJlcXVlc3Qgd2hlbiB2YWx1ZSBpcyByZXF1ZXN0LnJlYWR5U3RhdGUgYW5kIGtleSBpc250ICdyZWFkeVN0YXRlJylbMF1cbiAgICAgIGlmIHJlcXVlc3QucmVhZHlTdGF0ZSBpcyByZXF1ZXN0LkRPTkVcbiAgICAgICAgY29uc29sZS5sb2cgJ0RvbmU7IHN0YXR1cyBpcycsIHJlcXVlc3Quc3RhdHVzXG4gICAgICAgIGlmIDIwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDMwMFxuICAgICAgICAgIHJlc29sdmUgcmVxdWVzdFxuICAgICAgICBlbHNlIGlmIDQwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDYwMFxuICAgICAgICAgIHJlamVjdCBuZXcgRXJyb3IgcmVxdWVzdC5yZXNwb25zZVRleHRcblxuICAgIHJlcXVlc3Quc2VuZCBKU09OLnN0cmluZ2lmeSBkYXRhXG4iLCIjIFRoaXMgaXMgYSBwcmV0dHkgc3RhbmRhcmQgbWVyZ2UgZnVuY3Rpb24uXG4jIE1lcmdlIHByb3BlcnRpZXMgb2YgYWxsIGFyZ3VlbWVudHMgaW50byB0aGUgZmlyc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgZm9yIGFyZ3VtZW50IGluIEFycmF5OjpzbGljZS5jYWxsIGFyZ3VtZW50cywgMSB3aGVuIGFyZ3VtZW50P1xuICAgIGZvciBrZXksIHZhbHVlIG9mIGFyZ3VtZW50XG4gICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IHZhbHVlXG4gIGFyZ3VtZW50c1swXVxuIiwicHJpbnQgPSAoY29sb3IsIG1lc3NhZ2VzLi4uKSAtPlxuICBjb25zb2xlLmxvZyAnJWN7anNvbjphcGl9JywgXCJjb2xvcjogI3tjb2xvcn07IGZvbnQ6IGJvbGQgMWVtIG1vbm9zcGFjZTtcIiwgbWVzc2FnZXMuLi5cblxubW9kdWxlLmV4cG9ydHMgPVxuICBsb2c6IHByaW50LmJpbmQgbnVsbCwgJ2dyYXknXG4gIGluZm86IHByaW50LmJpbmQgbnVsbCwgJ2JsdWUnXG4gIHdhcm46IHByaW50LmJpbmQgbnVsbCwgJ29yYW5nZSdcbiAgZXJyb3I6IHByaW50LmJpbmQgbnVsbCwgJ3JlZCdcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2UgZXh0ZW5kcyBFbWl0dGVyXG4gIGlkOiAnJ1xuICBocmVmOiAnJ1xuICB0eXBlOiAnJ1xuXG4gIF90eXBlOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChjb25maWcuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBtZXJnZUludG8gdGhpcywgY29uZmlnLi4uIGlmIGNvbmZpZz9cbiAgICBjb25zb2xlPy5sb2cgXCJDcmVhdGVkIHJlc291cmNlOiAje0BfdHlwZS5uYW1lfSAje0BpZH1cIiwgdGhpc1xuICAgIEBlbWl0ICdjcmVhdGUnXG4gICAgY29uc29sZS5sb2cgJ0NyZWF0ZWQhJ1xuXG4gICMgR2V0IGEgcHJvbWlzZSBmb3IgYW4gYXR0cmlidXRlIHJlZmVycmluZyB0byAoYW4pb3RoZXIgcmVzb3VyY2UocykuXG4gIGF0dHI6IChhdHRyaWJ1dGUpIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZyBsaW5rOicsIGF0dHJpYnV0ZVxuICAgIGlmIGF0dHJpYnV0ZSBvZiB0aGlzXG4gICAgICBjb25zb2xlPy53YXJuIFwiTm8gbmVlZCB0byBhY2Nlc3MgYSBub24tbGlua2VkIGF0dHJpYnV0ZSB2aWEgYXR0cjogI3thdHRyaWJ1dGV9XCIsIHRoaXNcbiAgICAgIFByb21pc2UucmVzb2x2ZSBAW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIEBsaW5rcz8gYW5kIGF0dHJpYnV0ZSBvZiBAbGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiByZXNvdXJjZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBsaW5rc1thdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBhdHRyaWJ1dGUgb2YgQF90eXBlLmxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgdHlwZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBfdHlwZS5saW5rc1thdHRyaWJ1dGVdXG4gICAgZWxzZVxuICAgICAgcHJpbnQuZXJyb3IgJ05vdCBhIGxpbmsgYXQgYWxsJ1xuICAgICAgUHJvbWlzZS5yZWplY3QgbmV3IEVycm9yIFwiTm8gYXR0cmlidXRlICN7YXR0cmlidXRlfSBvZiAje0BfdHlwZS5uYW1lfSByZXNvdXJjZVwiXG5cbiAgX2dldExpbms6IChuYW1lLCBsaW5rKSAtPlxuICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnIG9yIEFycmF5LmlzQXJyYXkgbGlua1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgSUQocyknXG4gICAgICBpZHMgPSBsaW5rXG4gICAgICB7aHJlZiwgdHlwZX0gPSBAX3R5cGUubGlua3NbbmFtZV1cblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLm5hbWVdID0gdGhpc1xuICAgICAgICBocmVmID0gYXBwbHlIUkVGIGhyZWYsIGNvbnRleHRcbiAgICAgICAgQF90eXBlLmFwaUNsaWVudC5nZXQgaHJlZlxuXG4gICAgICBlbHNlIGlmIHR5cGU/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZSBpZiBsaW5rP1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgY29sbGVjdGlvbiBvYmplY3QnLCBsaW5rXG4gICAgICAjIEl0J3MgYSBjb2xsZWN0aW9uIG9iamVjdC5cbiAgICAgIHtocmVmLCBpZHMsIHR5cGV9ID0gbGlua1xuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIHByaW50Lndhcm4gJ0hSRUYnLCBocmVmXG4gICAgICAgIGhyZWYgPSBAYXBwbHlIUkVGIGhyZWYsIGNvbnRleHRcbiAgICAgICAgQF90eXBlLmFwaUNsaWVudC5nZXQgaHJlZlxuXG4gICAgICBlbHNlIGlmIHR5cGU/IGFuZCBpZHM/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdMaW5rZWQsIGJ1dCBibGFuaydcbiAgICAgICMgSXQgZXhpc3RzLCBidXQgaXQncyBibGFuay5cbiAgICAgIFByb21pc2UucmVzb2x2ZSBudWxsXG5cbiAgIyBUdXJuIGEgSlNPTi1BUEkgXCJocmVmXCIgdGVtcGxhdGUgaW50byBhIHVzYWJsZSBVUkwuXG4gIFBMQUNFSE9MREVSU19QQVRURVJOOiAveyguKz8pfS9nXG4gIGFwcGx5SFJFRjogKGhyZWYsIGNvbnRleHQpIC0+XG4gICAgaHJlZi5yZXBsYWNlIEBQTEFDRUhPTERFUlNfUEFUVEVSTiwgKF8sIHBhdGgpIC0+XG4gICAgICBzZWdtZW50cyA9IHBhdGguc3BsaXQgJy4nXG4gICAgICBwcmludC53YXJuICdTZWdtZW50cycsIHNlZ21lbnRzXG5cbiAgICAgIHZhbHVlID0gY29udGV4dFxuICAgICAgdW50aWwgc2VnbWVudHMubGVuZ3RoIGlzIDBcbiAgICAgICAgc2VnbWVudCA9IHNlZ21lbnRzLnNoaWZ0KClcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtzZWdtZW50XSA/IHZhbHVlLmxpbmtzP1tzZWdtZW50XVxuXG4gICAgICBwcmludC53YXJuICdWYWx1ZScsIHZhbHVlXG5cbiAgICAgIGlmIEFycmF5LmlzQXJyYXkgdmFsdWVcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luICcsJ1xuXG4gICAgICB1bmxlc3MgdHlwZW9mIHZhbHVlIGlzICdzdHJpbmcnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIlZhbHVlIGZvciAnI3twYXRofScgaW4gJyN7aHJlZn0nIHNob3VsZCBiZSBhIHN0cmluZy5cIlxuXG4gICAgICB2YWx1ZVxuXG4gIHVwZGF0ZTogKGNoYW5nZXMuLi4pIC0+XG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNoYW5nZXMuLi5cbiAgICBAZW1pdCAnY2hhbmdlJ1xuXG4gIHNhdmU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtc2F2ZSdcbiAgICBzYXZlID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnB1dCBAZ2V0VVJMKCksIHRoaXNcbiAgICBlbHNlXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnBvc3QgQF90eXBlLmdldFVSTCgpLCB0aGlzXG5cbiAgICBzYXZlLnRoZW4gKHJlc3VsdHMpID0+XG4gICAgICBAdXBkYXRlIHJlc3VsdHNcbiAgICAgIEBlbWl0ICdzYXZlJ1xuXG4gIGRlbGV0ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1kZWxldGUnXG4gICAgZGVsZXRpb24gPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQuZGVsZXRlIEBnZXRVUkwoKVxuICAgIGVsc2VcbiAgICAgICMgQF90eXBlLnJlbW92ZVJlc291cmNlIHRoaXNcbiAgICAgIFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICBkZWxldGlvbi50aGVuID0+XG4gICAgICBAZW1pdCAnZGVsZXRlJ1xuXG4gIG1hdGNoZXNRdWVyeTogKHF1ZXJ5KSAtPlxuICAgIG1hdGNoZXMgPSB0cnVlXG4gICAgZm9yIHBhcmFtLCB2YWx1ZSBvZiBxdWVyeVxuICAgICAgaWYgQFtwYXJhbV0gaXNudCB2YWx1ZVxuICAgICAgICBtYXRjaGVzID0gZmFsc2VcbiAgICAgICAgYnJlYWtcbiAgICBtYXRjaGVzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZCkgLT5cbiAgICBzdXBlclxuICAgIEBfdHlwZS5faGFuZGxlUmVzb3VyY2VFbWlzc2lvbiB0aGlzLCBhcmd1bWVudHMuLi5cblxuICBnZXRVUkw6IC0+XG4gICAgQGhyZWYgfHwgW0BfdHlwZS5nZXRVUkwoKSwgQGlkXS5qb2luICcvJ1xuXG4gIHRvSlNPTjogLT5cbiAgICByZXN1bHQgPSB7fVxuICAgIHJlc3VsdFtAX3R5cGUubmFtZV0gPSB7fVxuICAgIGZvciBrZXksIHZhbHVlIG9mIHRoaXMgd2hlbiBrZXkuY2hhckF0KDApIGlzbnQgJ18nIGFuZCBrZXkgbm90IG9mIEBjb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgICAgIHJlc3VsdFtAX3R5cGUubmFtZV1ba2V5XSA9IHZhbHVlXG4gICAgcmVzdWx0XG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5kZWZlciA9IC0+XG4gIGRlZmVycmFsID0ge31cbiAgZGVmZXJyYWwucHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgZGVmZXJyYWwucmVzb2x2ZSA9IHJlc29sdmVcbiAgICBkZWZlcnJhbC5yZWplY3QgPSByZWplY3RcbiAgZGVmZXJyYWxcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUeXBlIGV4dGVuZHMgRW1pdHRlclxuICBuYW1lOiAnJ1xuICBhcGlDbGllbnQ6IG51bGxcblxuICBsaW5rczogbnVsbFxuXG4gIGRlZmVycmFsczogbnVsbFxuICByZXNvdXJjZVByb21pc2VzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChjb25maWdzLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZ3MuLi4gaWYgY29uZmlncz9cbiAgICBwcmludC5pbmZvICdEZWZpbmluZyBhIG5ldyByZXNvdXJjZSB0eXBlOicsIEBuYW1lXG4gICAgQGxpbmtzID89IHt9XG4gICAgQGRlZmVycmFscyA/PSB7fVxuICAgIEByZXNvdXJjZVByb21pc2VzID89IHt9XG4gICAgQGFwaUNsaWVudC50eXBlc1tAbmFtZV0gPSB0aGlzXG5cbiAgZ2V0VVJMOiAtPlxuICAgICcvJyArIEBuYW1lXG5cbiAgcXVlcnlMb2NhbDogKHF1ZXJ5KSAtPlxuICAgIFByb21pc2UuYWxsKHJlc291cmNlUHJvbWlzZSBmb3IgaWQsIHJlc291cmNlUHJvbWlzZSBvZiBAcmVzb3VyY2VQcm9taXNlcykudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgcmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlPy5tYXRjaGVzUXVlcnkgcXVlcnlcblxuICB3YWl0aW5nRm9yOiAoaWQpIC0+XG4gICAgQGRlZmVycmFsc1tpZF0/XG5cbiAgaGFzOiAoaWQpIC0+XG4gICAgQHJlc291cmNlUHJvbWlzZXNbaWRdPyBhbmQgbm90IEBkZWZlcnJhbHNbaWRdP1xuXG4gIGdldDogLT5cbiAgICBpZiB0eXBlb2YgYXJndW1lbnRzWzBdIGlzICdzdHJpbmcnIG9yIEFycmF5LmlzQXJyYXkgYXJndW1lbnRzWzBdXG4gICAgICBAZ2V0QnlJRHMgYXJndW1lbnRzLi4uXG4gICAgZWxzZVxuICAgICAgQGdldEJ5UXVlcnkgYXJndW1lbnRzLi4uXG5cbiAgIyBHaXZlbiBhIHN0cmluZywgcmV0dXJuIGEgcHJvbWlzZSBmb3IgdGhhdCByZXNvdXJjZS5cbiAgIyBHaXZlbiBhbiBhcnJheSwgcmV0dXJuIGFuIGFycmF5IG9mIHByb21pc2VzIGZvciB0aG9zZSByZXNvdXJjZXMuXG4gIGdldEJ5SURzOiAoaWRzLCBvcHRpb25zKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcnLCBAbmFtZSwgJ2J5IElEKHMpJywgaWRzXG4gICAgaWYgdHlwZW9mIGlkcyBpcyAnc3RyaW5nJ1xuICAgICAgZ2l2ZW5TdHJpbmcgPSB0cnVlXG4gICAgICBpZHMgPSBbaWRzXVxuXG4gICAgIyBPbmx5IHJlcXVlc3QgdGhpbmdzIHdlIGRvbid0IGhhdmUgb3IgZG9uJ3QgYWxyZWFkeSBoYXZlIGEgcmVxdWVzdCBvdXQgZm9yLlxuICAgIGluY29taW5nID0gKGlkIGZvciBpZCBpbiBpZHMgd2hlbiBub3QgQGhhcyhpZCkgYW5kIG5vdCBAd2FpdGluZ0ZvcihpZCkpXG4gICAgcHJpbnQubG9nICdJbmNvbWluZzogJywgaW5jb21pbmdcblxuICAgIHVubGVzcyBpbmNvbWluZy5sZW5ndGggaXMgMFxuICAgICAgZm9yIGlkIGluIGluY29taW5nXG4gICAgICAgIEBkZWZlcnJhbHNbaWRdID0gZGVmZXIoKVxuICAgICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0gPSBAZGVmZXJyYWxzW2lkXS5wcm9taXNlXG5cbiAgICAgIHVybCA9IFtAZ2V0VVJMKCksIGluY29taW5nLmpvaW4gJywnXS5qb2luICcvJ1xuICAgICAgcHJpbnQubG9nICdSZXF1ZXN0IGZvcicsIEBuYW1lLCAnYXQnLCB1cmxcbiAgICAgIEBhcGlDbGllbnQuZ2V0KHVybCwgb3B0aW9ucykudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIEBuYW1lLCByZXNvdXJjZXNcblxuICAgIGlmIGdpdmVuU3RyaW5nXG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZHNbMF1dXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5hbGwgKEByZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSkgLT5cbiAgICBAcXVlcnlMb2NhbChxdWVyeSkudGhlbiAoZXhpc3RpbmcpID0+XG4gICAgICBpZiBleGlzdGluZy5sZW5ndGggPj0gbGltaXRcbiAgICAgICAgZXhpc3RpbmdcbiAgICAgIGVsc2VcbiAgICAgICAgcGFyYW1zID0gbGltaXQ6IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIEBhcGlDbGllbnQuZ2V0KEBnZXRVUkwoKSwgbWVyZ2VJbnRvIHBhcmFtcywgcXVlcnkpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBQcm9taXNlLmFsbCBleGlzdGluZy5jb25jYXQgcmVzb3VyY2VzXG5cbiAgY3JlYXRlUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIGlmIEB3YWl0aW5nRm9yIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnUmVzb2x2aW5nIGFuZCByZW1vdmluZyBkZWZlcnJhbCBmb3InLCBAbmFtZSwgZGF0YS5pZFxuICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXS5yZXNvbHZlIG5ldyBSZXNvdXJjZSBkYXRhLCBfdHlwZTogdGhpc1xuICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXSA9IG51bGxcbiAgICBlbHNlIGlmIEBoYXMgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdUaGUnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2V4aXN0czsgd2lsbCB1cGRhdGUnXG4gICAgICBAZ2V0KGRhdGEuaWQpLnRoZW4gKHJlc291cmNlKSAtPlxuICAgICAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnQ3JlYXRpbmcgbmV3JywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdID0gUHJvbWlzZS5yZXNvbHZlIG5ldyBSZXNvdXJjZSBkYXRhLCBfdHlwZTogdGhpc1xuXG4gICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF1cblxuICByZW1vdmVSZXNvdXJjZTogKHJlc291cmNlKSAtPlxuICAgIGlmIHJlc291cmNlLmlkIGFuZCBAcmVzb3VyY2VQcm9taXNlc1tyZXNvdXJjZS5pZF0/XG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tyZXNvdXJjZS5pZF0gPSBudWxsXG4gICAgZWxzZVxuICAgICAgIyBIb3cnZCB3ZSBnZXQgaGVyZT9cblxuICBfaGFuZGxlUmVzb3VyY2VFbWlzc2lvbjogKHJlc291cmNlLCBzaWduYWwsIHBheWxvYWQpIC0+XG4gICAgQGVtaXQgJ2NoYW5nZSdcbiJdfQ==

