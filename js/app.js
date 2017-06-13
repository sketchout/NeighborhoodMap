
var map;
var centerLocation = {
	zoom: 13, location: { lat: 40.7413549, lng: -73.9980244}
}
var $nyTimesArticle="https://api.nytimes.com/svc/search/v2/articlesearch.json";
var $nyTimesKey="f6f3ef39721041c1b8d1bacdaad183ec";

var dataLocation = [
	{ title: 'Park Ave Penthouse', location: {lat: 40.7713024,lng: -73.9632393} },
	{ title: 'Chelsea Loft', location: { lat: 40.7444883, lng: -73.9949465 } },
	{ title: 'Union Square Open Floor Plan', location: { lat: 40.7347062, lng: -73.9895759 } },
	{ title: 'East Village Hip Studio',	location: {	lat: 40.7281777, lng: -73.984377 } },
	{ title: 'Chinatown Homey Space', location: { lat: 40.7180628, lng: -73.9961237 } }
]

//Function to retrieve data from New York Times
var getNYTimes = function(marker,infoWindow) {

	$nyTimesArticle += '?' + $.param({ 'q': marker.title });
	$nyTimesArticle += '&' + $.param({ 'sort': 'newest' });
	$nyTimesArticle += '&' + $.param({ 'api-key': $nyTimesKey });

	var nytimesUrl = $nyTimesArticle ;

	var articleContent = '<div><strong>'+ marker.title+' in NYT article</strong></div><br>';

	console.log(nytimesUrl);

	$.getJSON( nytimesUrl, {
	}).done(function(data) {
		console.log(data);
		var articles = data.response.docs;
		console.log(articles.length);
		if (articles.length !==0) {
			for(var i=0 ; i<articles.length; i++) {
				var article = articles[i];
				var art = '<li class="article"><a href="'+ article.web_url +'">'+
						article.headline.main+'</a></li>';
				articleContent = articleContent.concat(art);
			}
		} else {
			art = '<p class="article">No Articles found on'+ marker.title +'</p>';
			articleContent = articleContent.concat(art);
		}
		console.log(articleContent);
		populateInfoWindow(marker, infoWindow, articleContent);
	}).fail( function() {
		//$('#nyt-header').text('New York Times article could not be loaded');
		articleContent += 'could not be loaded';
		console.log(articleContent);
		populateInfoWindow(marker, infoWindow, articleContent);
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
	});

	// var content='<div><strong>'+this.lmTitle+'</strong></div>';
	// content += '<br> GeoLocation (' + this.lmPosition.lat;
	// content += ', '+ this.lmPosition.lat +')<br>'  ;

	marker.addListener('click', function() {

		getNYTimes(marker, infoWindow);
		// populateInfoWindow(this, infoWindow, content);
	});

	this.isSameWithFilter.subscribe(function(state) {
		if(state) {
			console.log("true marker:" + marker.title);
			marker.setMap(map);
		} else {
			console.log("false marker:" + marker.title)
			marker.setMap(null);
		}
	});
	this.isSameWithFilter(true);

	this.popInfoWin = function() {
		getNYTimes(marker, infoWindow);
		//populateInfoWindow(marker,infoWindow,content);
	}

}

// This function populates the infowindow when the marker is clicked
function populateInfoWindow(marker, infowindow, content) {

	// Check to make sure the infowindow is not already opened
	if ( infowindow.maker != marker ) {
		infowindow.marker = marker;
		infowindow.setContent(content);
		infowindow.open(map, marker);
		infowindow.marker.setAnimation(google.maps.Animation.BOUNCE);

		// Make sure the marker property is cleared if the infowindow is closed
		infowindow.addListener('closeclick', function() {
			var self = this
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
    	if(!filter || 0 == filter.length ) {
    		ko.utils.arrayFilter(self.markerList(), function(item) {
    			item.isSameWithFilter(true);
    			self.bounds.extend(item.lmPosition);
    		});
    		map.fitBounds(self.bounds);
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
				map.fitBounds(self.bounds);
				return isTrue;
			});
    	}
    }, self);

	// this.currentLocation = ko.observable(this.markerList()[0].marker.position);
	// this.setLocation = function(clickedLocation) {
	// 	self.currentLocation(clickedLocation);
	// }
	map.fitBounds(self.bounds);
}


function initMap() {
	ko.applyBindings(new ViewModel());
}