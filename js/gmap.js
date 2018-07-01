(function() {
  var map, user_marker;
  var that = this; // gmap.js
  // example location 42.361001, -71.064112
  that.lat = 35.6028518;
  that.lng = -77.517439;
  var lat = that.lat;
  var lng = that.lng;
  var lineCoordinatesArray = [];

  var app = require("./app.js");

  var json_data, hash_table, hash_matches, destinations;

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
        zoom: 15,
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
