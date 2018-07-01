(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  $(document).ready(function() {
    $.ajax({
      type: "GET",
      url: "data/allstations.json",
      dataType: "json",
      success: function(file) {
        main(file);
      }
    });
  });

  var that = this; // app.js
  var ngeohash = require("ngeohash");
  var gmap = require("./gmap.js");

  function main(file) {
    var example_location = geoToHash(gmap.lat, gmap.lng);
    that.json_data = file;
    that.formatted_json = formatJSON(that.json_data);
    that.hash_table = extractHash(that.formatted_json);
    that.hash_matches = hashMatching(example_location,that.hash_table);

    $.ajax({
      type: "GET",
      url: "data/MLBR.json",
      dataType: "json",
      success: function(file) {
        main_two(file);
      }
    });
  }

  function main_two(json) {
    var etd = json.root.station[0].etd;
    that.destinations = [];
    var times = [];
    etd.forEach(function(destination) {
      var abbr = destination.abbreviation[0];
      var dest = destination.destination[0];
      var est = destination.estimate;
      est.forEach(function(estimate) {
        var min = estimate.minutes[0];
        times.push(min);
      });
      that.destinations.push({"destination": dest, "abbreviation": abbr, "times": times});
    });
  }

  function formatJSON(json) {
    var stations = json.root.stations[0].station;
    var stations_formatted = [];
    stations.forEach(function(station) {
      var lat = station.gtfs_latitude[0];
      var lng = station.gtfs_longitude[0];
      var name = station.name[0];
      var abbr = station.abbr[0];
      new_station = {"lat": lat,"lng": lng,"name": name, "abbr": abbr};
      stations_formatted.push(new_station);
    });
    return stations_formatted;
  }

  function extractHash(formatted_json) {
    var hash_table = [];
    formatted_json.forEach(function(station) {
      geohash_string = geoToHash(station.lat,station.lng);
      hash_table.push(geohash_string);
    });
    return hash_table;
  }

  function geoToHash(lat,lng) {
    // set digits to 6, this is +/-0.61km error (wikipedia)
    return ngeohash.encode(lat,lng,4);
  }

  function hashMatching(user_hash, hash_table) {
    var matches = [];
    hash_table.forEach(function(value,i) {
      var value_hash = value.substring(0,6);
      if (value_hash === user_hash) {
        value_object = {"hash": value_hash, "index": i};
        matches.push(value_object);
      }
    });
    return matches;
  }
}).call(this);

},{"./gmap.js":2,"ngeohash":3}],2:[function(require,module,exports){
(function() {
  var map, user_marker;
  var that = this; // gmap.js
  // example location 42.361001, -71.064112
  that.lat = 35.6;
  that.lng = -77.51;
  var lat = that.lat;
  var lng = that.lng;
  var lineCoordinatesArray = [];

  var app = require("./app.js");

  var json_data, hash_table, hash_matches;

    // sets your location as default
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var locationMarker = null;
        if (locationMarker){
          // return if there is a locationMarker bug
          return;
        }

        // // used to retrieve lat and lng from IP
        //that.lat = position.coords.latitude;
        //that.lng = position.coords.longitude;
        // // resets the lat and lng variables
        //lat = that.lat;
        //lng = that.lng;

        json_data_formatted = app.formatted_json;
        hash_table = app.hash_table;
        hash_matches = app.hash_matches;
        destinations = app.destinations;

        // calls PubNub
        pubs();

        // initialize google maps
        google.maps.event.addDomListener(window, 'load', initialize());
      },
      function(error) {
        console.log("Error: ", error);
      },
      {
        enableHighAccuracy: true
      }
      );
    }

    function initialize() {
      console.log("Google Maps Initialized");
      map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 13,
        center: {lat: lat, lng : lng, alt: 0}
      });

      hash_matches.forEach(function(hash_match) {
        var match_index, json_match, match_lat, match_lng, BusinessName, dest_string = "";
        match_index = hash_match.index;
        json_match = json_data_formatted[match_index];
        match_lat = Number(json_match.lat);
        match_lng = Number(json_match.lng);
        match_abbr = json_match.abbr;
        BusinessName = json_match.name;

        if (BusinessName === "Millbrae") {
          destinations.forEach(function(destination) {
            var times = destination.times;
            dest_string = dest_string + "<p><i>" + destination.abbreviation + ":" + "</i><p>";
            times.forEach(function(time) {
              dest_string = dest_string + " " + time;
            });
          });
        }

        var business_marker = new google.maps.Marker({position: {lat: match_lat, lng: match_lng}, map: map});
        business_marker.setMap(map);
        var infowindow = new google.maps.InfoWindow({
          content: "<b>" + BusinessName + "</b>" +
                   "<p>" + dest_string + "</p></p></p>"
        });
        google.maps.event.addListener(business_marker, 'mouseover', function() {
          infowindow.open(map,business_marker);
        });
        google.maps.event.addListener(business_marker, 'mouseout', function() {
          infowindow.close(map,business_marker);
        });
      });

      user_marker = new google.maps.Marker({
        position: {lat: lat, lng: lng},
        map: map,
        icon: '../images/GoogleMapsMarkers/blue_MarkerU.png',
        zIndex: google.maps.Marker.MAX_ZINDEX + 1,
        title: "you"
      });
      user_marker.setMap(map);

      var infowindow = new google.maps.InfoWindow({
        content: "Hello World!",
        maxWidth: 750
      });

      google.maps.event.addListener(user_marker, 'click', function() {
        infowindow.open(map,user_marker);
      });
    }

    // moves the marker and center of map
    function redraw() {
      map.setCenter({lat: lat, lng : lng, alt: 0});
      user_marker.setPosition({lat: lat, lng : lng, alt: 0});
      pushCoordToArray(lat, lng);

      var lineCoordinatesPath = new google.maps.Polyline({
        path: lineCoordinatesArray,
        geodesic: true,
        strokeColor: '#2E10FF',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      lineCoordinatesPath.setMap(map);
    }

    function pushCoordToArray(latIn, lngIn) {
      lineCoordinatesArray.push(new google.maps.LatLng(latIn, lngIn));
    }

    function pubs() {
      pubnub = PUBNUB.init({
        publish_key: 'demo',
        subscribe_key: 'demo'
      });

      pubnub.subscribe({
        channel: "mymaps",
        message: function(message, channel) {
          console.log(message);
          lat = message.lat;
          lng = message.lng;
          //custom method
          redraw();
        },
        connect: function() {console.log("PubNub Connected");}
      });
    }
}).call(this);

},{"./app.js":1}],3:[function(require,module,exports){
/**
 * Copyright (c) 2011, Sun Ning.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

var BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
var BASE32_CODES_DICT = {};
for (var i = 0; i < BASE32_CODES.length; i++) {
  BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
}

var ENCODE_AUTO = 'auto';
/**
 * Significant Figure Hash Length
 *
 * This is a quick and dirty lookup to figure out how long our hash
 * should be in order to guarantee a certain amount of trailing
 * significant figures. This was calculated by determining the error:
 * 45/2^(n-1) where n is the number of bits for a latitude or
 * longitude. Key is # of desired sig figs, value is minimum length of
 * the geohash.
 * @type Array
 */
//     Desired sig figs:  0  1  2  3  4   5   6   7   8   9  10
var SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];
/**
 * Encode
 *
 * Create a Geohash out of a latitude and longitude that is
 * `numberOfChars` long.
 *
 * @param {Number|String} latitude
 * @param {Number|String} longitude
 * @param {Number} numberOfChars
 * @returns {String}
 */
var encode = function (latitude, longitude, numberOfChars) {
  if (numberOfChars === ENCODE_AUTO) {
    if (typeof(latitude) === 'number' || typeof(longitude) === 'number') {
      throw new Error('string notation required for auto precision.');
    }
    var decSigFigsLat = latitude.split('.')[1].length;
    var decSigFigsLong = longitude.split('.')[1].length;
    var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
    numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
  } else if (numberOfChars === undefined) {
    numberOfChars = 9;
  }

  var chars = [],
  bits = 0,
  bitsTotal = 0,
  hash_value = 0,
  maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180,
  mid;
  while (chars.length < numberOfChars) {
    if (bitsTotal % 2 === 0) {
      mid = (maxLon + minLon) / 2;
      if (longitude > mid) {
        hash_value = (hash_value << 1) + 1;
        minLon = mid;
      } else {
        hash_value = (hash_value << 1) + 0;
        maxLon = mid;
      }
    } else {
      mid = (maxLat + minLat) / 2;
      if (latitude > mid) {
        hash_value = (hash_value << 1) + 1;
        minLat = mid;
      } else {
        hash_value = (hash_value << 1) + 0;
        maxLat = mid;
      }
    }

    bits++;
    bitsTotal++;
    if (bits === 5) {
      var code = BASE32_CODES[hash_value];
      chars.push(code);
      bits = 0;
      hash_value = 0;
    }
  }
  return chars.join('');
};

/**
 * Encode Integer
 *
 * Create a Geohash out of a latitude and longitude that is of 'bitDepth'.
 *
 * @param {Number} latitude
 * @param {Number} longitude
 * @param {Number} bitDepth
 * @returns {Number}
 */
var encode_int = function (latitude, longitude, bitDepth) {

  bitDepth = bitDepth || 52;

  var bitsTotal = 0,
  maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180,
  mid,
  combinedBits = 0;

  while (bitsTotal < bitDepth) {
    combinedBits *= 2;
    if (bitsTotal % 2 === 0) {
      mid = (maxLon + minLon) / 2;
      if (longitude > mid) {
        combinedBits += 1;
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      mid = (maxLat + minLat) / 2;
      if (latitude > mid) {
        combinedBits += 1;
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    bitsTotal++;
  }
  return combinedBits;
};

/**
 * Decode Bounding Box
 *
 * Decode hashString into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {String} hash_string
 * @returns {Array}
 */
var decode_bbox = function (hash_string) {
  var isLon = true,
  maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180,
  mid;

  var hashValue = 0;
  for (var i = 0, l = hash_string.length; i < l; i++) {
    var code = hash_string[i].toLowerCase();
    hashValue = BASE32_CODES_DICT[code];

    for (var bits = 4; bits >= 0; bits--) {
      var bit = (hashValue >> bits) & 1;
      if (isLon) {
        mid = (maxLon + minLon) / 2;
        if (bit === 1) {
          minLon = mid;
        } else {
          maxLon = mid;
        }
      } else {
        mid = (maxLat + minLat) / 2;
        if (bit === 1) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      isLon = !isLon;
    }
  }
  return [minLat, minLon, maxLat, maxLon];
};

/**
 * Decode Bounding Box Integer
 *
 * Decode hash number into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {Number} hashInt
 * @param {Number} bitDepth
 * @returns {Array}
 */
var decode_bbox_int = function (hashInt, bitDepth) {

  bitDepth = bitDepth || 52;

  var maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180;

  var latBit = 0, lonBit = 0;
  var step = bitDepth / 2;

  for (var i = 0; i < step; i++) {

    lonBit = get_bit(hashInt, ((step - i) * 2) - 1);
    latBit = get_bit(hashInt, ((step - i) * 2) - 2);

    if (latBit === 0) {
      maxLat = (maxLat + minLat) / 2;
    }
    else {
      minLat = (maxLat + minLat) / 2;
    }

    if (lonBit === 0) {
      maxLon = (maxLon + minLon) / 2;
    }
    else {
      minLon = (maxLon + minLon) / 2;
    }
  }
  return [minLat, minLon, maxLat, maxLon];
};

function get_bit(bits, position) {
  return (bits / Math.pow(2, position)) & 0x01;
}

/**
 * Decode
 *
 * Decode a hash string into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {String} hashString
 * @returns {Object}
 */
var decode = function (hashString) {
  var bbox = decode_bbox(hashString);
  var lat = (bbox[0] + bbox[2]) / 2;
  var lon = (bbox[1] + bbox[3]) / 2;
  var latErr = bbox[2] - lat;
  var lonErr = bbox[3] - lon;
  return {latitude: lat, longitude: lon,
          error: {latitude: latErr, longitude: lonErr}};
};

/**
 * Decode Integer
 *
 * Decode a hash number into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {Number} hash_int
 * @param {Number} bitDepth
 * @returns {Object}
 */
var decode_int = function (hash_int, bitDepth) {
  var bbox = decode_bbox_int(hash_int, bitDepth);
  var lat = (bbox[0] + bbox[2]) / 2;
  var lon = (bbox[1] + bbox[3]) / 2;
  var latErr = bbox[2] - lat;
  var lonErr = bbox[3] - lon;
  return {latitude: lat, longitude: lon,
          error: {latitude: latErr, longitude: lonErr}};
};

/**
 * Neighbor
 *
 * Find neighbor of a geohash string in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hashString
 * @param {Array} Direction as a 2D normalized vector.
 * @returns {String}
 */
var neighbor = function (hashString, direction) {
  var lonLat = decode(hashString);
  var neighborLat = lonLat.latitude
    + direction[0] * lonLat.error.latitude * 2;
  var neighborLon = lonLat.longitude
    + direction[1] * lonLat.error.longitude * 2;
  return encode(neighborLat, neighborLon, hashString.length);
};

/**
 * Neighbor Integer
 *
 * Find neighbor of a geohash integer in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hash_string
 * @returns {Array}
*/
var neighbor_int = function(hash_int, direction, bitDepth) {
    bitDepth = bitDepth || 52;
    var lonlat = decode_int(hash_int, bitDepth);
    var neighbor_lat = lonlat.latitude + direction[0] * lonlat.error.latitude * 2;
    var neighbor_lon = lonlat.longitude + direction[1] * lonlat.error.longitude * 2;
    return encode_int(neighbor_lat, neighbor_lon, bitDepth);
};

/**
 * Neighbors
 *
 * Returns all neighbors' hashstrings clockwise from north around to northwest
 * 7 0 1
 * 6 x 2
 * 5 4 3
 * @param {String} hash_string
 * @returns {encoded neighborHashList|Array}
 */
var neighbors = function(hash_string){

    var hashstringLength = hash_string.length;

    var lonlat = decode(hash_string);
    var lat = lonlat.latitude;
    var lon = lonlat.longitude;
    var latErr = lonlat.error.latitude * 2;
    var lonErr = lonlat.error.longitude * 2;

    var neighbor_lat,
        neighbor_lon;

    var neighborHashList = [
                            encodeNeighbor(1,0),
                            encodeNeighbor(1,1),
                            encodeNeighbor(0,1),
                            encodeNeighbor(-1,1),
                            encodeNeighbor(-1,0),
                            encodeNeighbor(-1,-1),
                            encodeNeighbor(0,-1),
                            encodeNeighbor(1,-1)
                            ];

    function encodeNeighbor(neighborLatDir, neighborLonDir){
        neighbor_lat = lat + neighborLatDir * latErr;
        neighbor_lon = lon + neighborLonDir * lonErr;
        return encode(neighbor_lat, neighbor_lon, hashstringLength);
    }

    return neighborHashList;
};

/**
 * Neighbors Integer
 *
 * Returns all neighbors' hash integers clockwise from north around to northwest
 * 7 0 1
 * 6 x 2
 * 5 4 3
 * @param {Number} hash_int
 * @param {Number} bitDepth
 * @returns {encode_int'd neighborHashIntList|Array}
 */
var neighbors_int = function(hash_int, bitDepth){

    bitDepth = bitDepth || 52;

    var lonlat = decode_int(hash_int, bitDepth);
    var lat = lonlat.latitude;
    var lon = lonlat.longitude;
    var latErr = lonlat.error.latitude * 2;
    var lonErr = lonlat.error.longitude * 2;

    var neighbor_lat,
        neighbor_lon;

    var neighborHashIntList = [
                            encodeNeighbor_int(1,0),
                            encodeNeighbor_int(1,1),
                            encodeNeighbor_int(0,1),
                            encodeNeighbor_int(-1,1),
                            encodeNeighbor_int(-1,0),
                            encodeNeighbor_int(-1,-1),
                            encodeNeighbor_int(0,-1),
                            encodeNeighbor_int(1,-1)
                            ];

    function encodeNeighbor_int(neighborLatDir, neighborLonDir){
        neighbor_lat = lat + neighborLatDir * latErr;
        neighbor_lon = lon + neighborLonDir * lonErr;
        return encode_int(neighbor_lat, neighbor_lon, bitDepth);
    }

    return neighborHashIntList;
};


/**
 * Bounding Boxes
 *
 * Return all the hashString between minLat, minLon, maxLat, maxLon in numberOfChars
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} numberOfChars
 * @returns {bboxes.hashList|Array}
 */
var bboxes = function (minLat, minLon, maxLat, maxLon, numberOfChars) {
  numberOfChars = numberOfChars || 9;

  var hashSouthWest = encode(minLat, minLon, numberOfChars);
  var hashNorthEast = encode(maxLat, maxLon, numberOfChars);

  var latLon = decode(hashSouthWest);

  var perLat = latLon.error.latitude * 2;
  var perLon = latLon.error.longitude * 2;

  var boxSouthWest = decode_bbox(hashSouthWest);
  var boxNorthEast = decode_bbox(hashNorthEast);

  var latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
  var lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);

  var hashList = [];

  for (var lat = 0; lat <= latStep; lat++) {
    for (var lon = 0; lon <= lonStep; lon++) {
      hashList.push(neighbor(hashSouthWest, [lat, lon]));
    }
  }

  return hashList;
};

/**
 * Bounding Boxes Integer
 *
 * Return all the hash integers between minLat, minLon, maxLat, maxLon in bitDepth
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} bitDepth
 * @returns {bboxes_int.hashList|Array}
 */
var bboxes_int = function(minLat, minLon, maxLat, maxLon, bitDepth){
    bitDepth = bitDepth || 52;

    var hashSouthWest = encode_int(minLat, minLon, bitDepth);
    var hashNorthEast = encode_int(maxLat, maxLon, bitDepth);

    var latlon = decode_int(hashSouthWest, bitDepth);

    var perLat = latlon.error.latitude * 2;
    var perLon = latlon.error.longitude * 2;

    var boxSouthWest = decode_bbox_int(hashSouthWest, bitDepth);
    var boxNorthEast = decode_bbox_int(hashNorthEast, bitDepth);

    var latStep = Math.round((boxNorthEast[0] - boxSouthWest[0])/perLat);
    var lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1])/perLon);

    var hashList = [];

    for(var lat = 0; lat <= latStep; lat++){
        for(var lon = 0; lon <= lonStep; lon++){
            hashList.push(neighbor_int(hashSouthWest,[lat, lon], bitDepth));
        }
    }

    return hashList;
};

var geohash = {
  'ENCODE_AUTO': ENCODE_AUTO,
  'encode': encode,
  'encode_uint64': encode_int, // keeping for backwards compatibility, will deprecate
  'encode_int': encode_int,
  'decode': decode,
  'decode_int': decode_int,
  'decode_uint64': decode_int, // keeping for backwards compatibility, will deprecate
  'decode_bbox': decode_bbox,
  'decode_bbox_uint64': decode_bbox_int, // keeping for backwards compatibility, will deprecate
  'decode_bbox_int': decode_bbox_int,
  'neighbor': neighbor,
  'neighbor_int': neighbor_int,
  'neighbors': neighbors,
  'neighbors_int': neighbors_int,
  'bboxes': bboxes,
  'bboxes_int': bboxes_int
};

module.exports = geohash;

},{}]},{},[1]);
