var map;
var centerLocation = {
	zoom: 13, location: { lat: 40.7413549, lng: -73.9980244}
};
var nyTimesArticle="https://api.nytimes.com/svc/search/v2/articlesearch.json";
var nyTimesKey="f6f3ef39721041c1b8d1bacdaad183ec";

var dataLocation = [
	{ title: 'Park Ave Penthouse', location: {lat: 40.7713024,lng: -73.9632393} },
	{ title: 'Chelsea Loft', location: { lat: 40.7444883, lng: -73.9949465 } },
	{ title: 'Union Square Open Floor Plan', location: { lat: 40.7347062, lng: -73.9895759 } },
	{ title: 'East Village Hip Studio',	location: {	lat: 40.7281777, lng: -73.984377 } },
	{ title: 'Chinatown Homey Space', location: { lat: 40.7180628, lng: -73.9961237 } }
];

//Function to retrieve data from New York Times
var getNYTimes = function(marker,infoWindow) {

	var content = '<strong>'+ marker.title+'</strong> in NY Times<br>';

	console.log(nyTimesArticle);
	// ref: https://stackoverflow.com/questions/32133078/new-york-times-api-ajax-jquery-call
	$.ajax({
		type: 'GET',
		url: nyTimesArticle,
		data: {
			'q' : marker.title,
			'response-format': "jsonp",
			'api-key': nyTimesKey,
			'callback' : 'svc_search_v2_articlesearch'
		},
		success: function(data, textStats, XMLHttpRequest) {
			var articles = data.response.docs;
			var aItem = '';
			if (articles.length !==0) {
				for(var i=0 ; i<articles.length; i++) {
					if (i == 5) break;
					var article = articles[i];
					aItem = '<li class="article"><a href="'+ article.web_url +'">'+
							article.headline.main.substring(1,24)+' ... </a></li>';
					content = content.concat(aItem);
				}
			} else {
				aItem = '<p class="article">No Articles found on'+ marker.title +'</p>';
				content = content.concat(aItem);
			}
			infoWindow.setContent(content);
			populateInfoWindow(marker, infoWindow);
		},
		error: function(jqXHR, error, errorThrown) {
			content += 'could not be loaded';
			infoWindow.setContent(content);
			populateInfoWindow(marker, infoWindow);
		}
	});
};

// Reference : http://jsfiddle.net/rniemeyer/FcSmA/
var LocationMarker = function(data) {

	var marker;
	var infoWindow = new google.maps.InfoWindow();

	this.isSameWithFilter = ko.observable(true);
	this.lmTitle = data.title;
	this.lmPosition = data.location;

	// Create a marker per location,
	marker = new google.maps.Marker({
		position: this.lmPosition,
		title: this.lmTitle,
		map: map,
		animation: google.maps.Animation.DROP,
	}, function(results, status) {
    	if (status != 'OK') {
    		alert('Marker creating failed with the following reason:' + status);
    	}
    });

	marker.addListener('click', function() {
		getNYTimes(marker, infoWindow);
	});

	this.isSameWithFilter.subscribe(function(state) {
		if(state) {
			console.log("true marker:" + marker.title);
			marker.setMap(map);
		} else {
			console.log("false marker:" + marker.title);
			marker.setMap(null);
		}
	});
	this.isSameWithFilter(true);

	this.popInfoWin = function() {
		getNYTimes(marker, infoWindow);
	};

};

// This function populates the infowindow when the marker is clicked
function populateInfoWindow(marker, infowindow) {

	// Check to make sure the infowindow is not already opened
	if ( infowindow.maker != marker ) {
		infowindow.marker = marker;
		infowindow.open(map, marker);
		infowindow.marker.setAnimation(google.maps.Animation.BOUNCE);

		// Make sure the marker property is cleared if the infowindow is closed
		infowindow.addListener('closeclick', function() {
			var self = this;
			if ( marker.getAnimation() !== null)
				self.marker.setAnimation(null);
			self.marker = null;
		});
	}
}

var ViewModel = function() {

	var self = this;
	// initialize filterText
	self.filterText = ko.observable("");
	// initialize bounds
	self.bounds = new google.maps.LatLngBounds();

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
		center : {
			lat: centerLocation.location.lat,
			lng: centerLocation.location.lng
		},
		zoom: centerLocation.zoom
    }, function(results, status) {
    	if (status != 'OK') {
    		alert('Map Loadings failed with the following reason:' + status);
    	}
    });

	// initialzie markerList
	self.markerList = ko.observableArray([]);
	dataLocation.forEach(function(dataItem) {

		// Push the marker to array of markers
		self.markerList.push(new LocationMarker(dataItem));

		self.bounds.extend(dataItem.location);
	});


    self.filteredMarkerList = ko.computed(function() {
    	var filter = self.filterText().toLowerCase();
    	if(!filter || 0 === filter.length ) {
    		ko.utils.arrayFilter(self.markerList(), function(item) {
    			item.isSameWithFilter(true);
    			self.bounds.extend(item.lmPosition);
    		});
    		return self.markerList();
    	} else {
			return ko.utils.arrayFilter(self.markerList(), function(item) {
				var isTrue;
				if ( item.lmTitle.toLowerCase().indexOf(filter) !== -1 ) {
					item.isSameWithFilter(true);
					self.bounds.extend(item.lmPosition);
					isTrue = true;
				} else {
					item.isSameWithFilter(false);
					isTrue = false;
				}
				return isTrue;
			});
    	}
    }, self);

    google.maps.event.addDomListener(window,'resize', function() {
		map.fitBounds(self.bounds);
    });
};


function initMap() {
	ko.applyBindings(new ViewModel());
}