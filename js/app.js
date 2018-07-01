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
