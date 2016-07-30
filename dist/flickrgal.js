var flickrApiKey = '35ca9893a15649318240594ad7dd98e7'; // Change to your flickr api key
var flickrApiSecret = 'c440757b04345ffe'; // Change to your flickr api secret
var flickrUserId = '141088533@N02'; // Change to your flickr User ID

// Endpoint url and params
var endpoint = 'https://api.flickr.com/services/rest/?method=';
var params = '&format=json'
	+ '&nojsoncallback=1' 
	+ '&api_key=' 
	+ flickrApiKey 
	+ '&user_id=' 
	+ flickrUserId;

// Request methods
var methodCollection = 'flickr.collections.getTree';
var methodPhotos = 'flickr.photosets.getPhotos';

var albums = []; // Stores full album / photoset information
var lightboxSet = []; // Stores the set of images open in lightbox
var prevState = []; // Stores objects to be re-inserted later

// Lightbox Template
var lightboxTemplate = document.createElement('div');
	lightboxTemplate.id = 'lightbox';
	lightboxTemplate.className = 'hide';
var lightboxUi = document.createElement('div');
	lightboxUi.id = 'lightbox-ui';
var imageStageEl = document.createElement('div');
	imageStageEl.id = 'stage';

var	lightboxControls = '<div class="close" title="Close (Esc)"></div>'
	+ '<div id="controls"><div id="arrow-left" class="prev" title="Prev"></div>'
	+ '<div id="arrow-right" class="next" title="Next"></div></div>'; 
var	infoEl = '<div id="info_container"><div id="info"><div id="title"></div>'
	+ '<div id="description"></div></div></div>';
var imageBoxEl = '<div id="image-box-container"><div><div id="image-box"></div></div></div>';

lightboxUi.innerHTML = lightboxControls + infoEl;
imageStageEl.innerHTML = imageBoxEl;
lightboxTemplate.appendChild(lightboxUi);
lightboxTemplate.appendChild(imageStageEl);
// End Lightbox Template

// FUNCTIONS
//Event Handlers
function handle_click(event){
	var el = event.currentTarget;
	var type = el.className;
	switch(type){
		case 'album':
			var requestedAlbum = el.id;
			backButton.classList.remove('hide');
			insert_images(requestedAlbum);
			break;
		case 'image': 
			var	requestedImage = el.id;
			var album = el.getAttribute('album-id');
			insert_lightbox(requestedImage, album);
			lightbox.classList.remove('hide');
			break;
		case 'navigate-back':
			imageGrid.innerHTML = "";
			for(var element in prevState) {
				imageGrid.appendChild(prevState[element]);	
			}

			backButton.classList.add('hide');
			loadingMessage.style.display = 'none';
			break;
		case 'close':
			lightbox.classList.add('hide');
			break;
		case 'prev':
			prev();
			break;
		case 'next':
			next();
			break;
	}
}
function handle_keys(event){
	var key = event.keyCode;
	switch(key){
		case 39:
			next();
			break;
		case 37:
			prev();
			break;
		case 27:
			lightbox.classList.add('hide');
			break;
	}
}
//End Event Handlers
function prev(){
	var focus = document.getElementById(lightboxSet[0]);
		focus.classList.add('hide-stage-image');
	var move = lightboxSet.pop();
	lightboxSet.unshift(move); 
	focus = document.getElementById(lightboxSet[0])
	focus.classList.remove('hide-stage-image');
	lightboxTitle.innerHTML = focus.getAttribute('data-title');
	lightboxDesc.innerHTML = focus.getAttribute('data-description');
}
function next(){
	var focus = document.getElementById(lightboxSet[0]);
		focus.classList.add('hide-stage-image');
	var move = lightboxSet.shift();
	lightboxSet.push(move);
	focus = document.getElementById(lightboxSet[0])
	focus.classList.remove('hide-stage-image');
	lightboxTitle.innerHTML = focus.getAttribute('data-title');
	lightboxDesc.innerHTML = focus.getAttribute('data-description');
}
// Create New blank elements
function Element(type){
	this.el = document.createElement('div'); 
	this.el.className = type;
	this.loading = document.createElement('div'); 
	this.loading.className = 'image-loading';
	this.inner = document.createElement('div'); 
	this.inner.className = 'inner';
	this.dummy = document.createElement('div'); 
	this.dummy.className = 'dummy';
	this.title = document.createElement('div');	
	this.desc = document.createElement('div');	
}
// Send new requests to flickr
function make_request(requestUrl, type, id){
	var flickrRequest = new XMLHttpRequest();
		flickrRequest.open('GET', requestUrl, true);
		flickrRequest.requestType = type;
		flickrRequest.requestID = id;
		flickrRequest.onload = handle_request;
		flickrRequest.send();
}
// Handle flickr requests
function handle_request(event) {
	var request = event.target;
	var	responseData = JSON.parse(request.responseText);
	var	type = request.requestType;
	var	targetID = request.requestID;
	if (request.readyState === XMLHttpRequest.DONE) {
		if (request.status === 200) {
			console.log(type + ' request succeed');
			console.log('Response JSON:');
			console.log(responseData);

			switch (type){
				case 'collections':
					build_collections(responseData);
					var currentState = imageGrid.childNodes;
					Array.prototype.forEach.call(currentState, function(node) {
						prevState.push(node);
					});
					console.log(prevState);
					break;
				case 'photosets':
					insert_albums(responseData, targetID);
					break;
			}
		}else{
			console.log('Flickr ' + requestType + ' request failed!');
		}
	}
};
// Finds position in albums array for a given id
function get_album_pos(id){	
	var position = "";
	for (var album in albums){
		albums[album].id == id ? position = album : false 
	}
	return position;
}
function to_lower_case(array){
	for(name in array){
			array[name] = array[name].toString().toLowerCase();
	}
	return array;
}
// Appends background images and fades them in
function fade_in_image(id, url){
	var newElement = document.getElementById(id);
		newElement.style.backgroundImage = 'url(' + url + ')';
	var isLoading = newElement.querySelector('.image-loading');
		isLoading ? isLoading.style.opacity = 0 : false;
}
function build_image_url(image, size){
	var url = 	'https://farm' 
				+ image.farm
				+ '.staticflickr.com/' 
				+ image.server 
				+ '/' 
				+ image.id 
				+ '_' 
				+ image.secret
				+ '_' 
				+ size
				+ '.jpg';
	return url;
}
function build_album(collection, collectionName, collectionID) {
	var sets = collection.set
	for(set in sets){
		albums.push({
			id: sets[set].id,
			collectionName: collectionName,
			collectionID: collectionID, // Not hooked up yet
			title: sets[set].title,
			description: sets[set].description,
			images: []
		});
	}
	if (collectionTitles) {
		imageGrid.insertAdjacentHTML('beforeend', '<h3 class="collection-title">' 
			+ collectionName 
			+ '</h3><div class="collection '
			+ 'collection-' 
			+ collectionID 
			+ '"></div>');
	}
}
// 	Builds collections of albums from flickr 'photosets'
function build_collections(data) {
		var allCollections = data.collections.collection;
		for(collection in allCollections){
			var collectionObject = allCollections[collection];
			var collectionName = collectionObject.title;
			var collectionID = collectionObject.id;

			if (getAll) {
				build_album(collectionObject, collectionName, collectionID);
			}else if (collectionsRequested.indexOf(collectionName.toLowerCase()) >= 0) {
				build_album(collectionObject, collectionName, collectionID);
			}

		}

		loadingMessage.style.display = 'none';

		// Build the albums for a collection
		Array.prototype.forEach.call(albums, function(album) {
			var newAlbum = new Element('album');		

			newAlbum.el.id = album.id;
			newAlbum.title.innerHTML = album.title;
			newAlbum.el.setAttribute('collection-name', album.collectionName);
			newAlbum.el.setAttribute('collection-id', album.collectionID);

			// Todo, hook up descriptions somewhere
			newAlbum.inner.appendChild(newAlbum.title);
			newAlbum.el.appendChild(newAlbum.loading);
			newAlbum.el.appendChild(newAlbum.dummy);
			newAlbum.el.appendChild(newAlbum.inner);
			newAlbum.el.addEventListener('click', handle_click);
			
			if (collectionTitles) {
				imageGrid.querySelector('.collection-' + newAlbum.el.getAttribute('collection-id')).appendChild(newAlbum.el);
			}else{
				imageGrid.appendChild(newAlbum.el);
			}			
		});
		// Request images for albums
		Array.prototype.forEach.call(albums, function(album) {
			var url = endpoint 
				+ methodPhotos 
				+ '&photoset_id=' 
				+ album.id
				+ params
				+ '&extras=description';

			make_request(url, 'photosets', album.id);
		});
		// Initial gallery fade in
		gallery.classList.remove('hide');
};
function insert_albums(data, id){
	// Organise and push image data to albums array
	var position = get_album_pos(id);
	var allImages = data.photoset.photo;
	Array.prototype.forEach.call(allImages, function(image) {
		var imageObject = {};
		var primaryImageUrl;
		imageObject.id = image.id;
		imageObject.farm = image.farm;
		imageObject.server = image.server;
		imageObject.secret = image.secret;
		imageObject.title = image.title;
		imageObject.description = image.description;
		imageObject.is_primary = image.isprimary;
		albums[position].images.push(imageObject);

		// Set album cover image
		if (imageObject.is_primary == 1) {
			primaryImageUrl = build_image_url(imageObject, 'z');
			// Append image and fade it in
			fade_in_image(id, primaryImageUrl);
		}else{
			// Fallback to set the primary photo to the first photo returned in the album is isprimary is not set
			primaryImageUrl = build_image_url(albums[position].images[0], 'z');
			fade_in_image(id, primaryImageUrl);
		}
	});
}
function insert_images(id){
	imageGrid.innerHTML = "";

	var position = get_album_pos(id);
	var images = albums[position].images
	var size = 'z';
	
	Array.prototype.forEach.call(images, function(image) {
		var imageUrl = build_image_url(image, 'z'); 
		var newImage = new Element('image');
		var imageID = image.id;

		newImage.el.id = imageID;
		newImage.el.setAttribute('album-id', id);

		newImage.el.appendChild(newImage.dummy);
		newImage.el.appendChild(newImage.inner);
		newImage.el.addEventListener('click', handle_click);
		imageGrid.appendChild(newImage.el);
		
		// Append image and fade it in
		fade_in_image(imageID, imageUrl);
	});
}
function insert_lightbox(id, album){	
	lightboxSet = [];
	var position = get_album_pos(album);
	var callingAlbum = albums[position].images;
	var stageID = 'stage-' + id;

	imageBox.innerHTML = '';
	Array.prototype.forEach.call(callingAlbum, function(image) {	
		var currentImage = document.getElementById(image.id);
		var initialUrl = currentImage.style.backgroundImage;
		var newImage = document.createElement('div');
			newImage.id = 'stage-' + image.id;
			newImage.classList.add('hide-stage-image');
			newImage.style.backgroundImage = initialUrl;
			newImage.setAttribute('data-title', image.title);
			newImage.setAttribute('data-description', image.description._content);
			
			// Append divs with large image inserts
			largeImageUrl = build_image_url(image, 'b')
			newImage.innerHTML = '<div style="background-image: url(' 
				+ largeImageUrl 
				+ ')"></div>';
			
			imageBox.appendChild(newImage);
			lightboxSet.push(newImage.id);
	});

	var activePos = lightboxSet.indexOf(stageID);
	var top = lightboxSet.slice(activePos);
	var bottom = lightboxSet.slice(0, activePos);

	lightboxSet = top.concat(bottom);

	// Set the selected image title and description in the lightbox
	lightboxTitle.innerHTML = document.getElementById(lightboxSet[0]).getAttribute('data-title');
	lightboxDesc.innerHTML = document.getElementById(lightboxSet[0]).getAttribute('data-description');

	document.getElementById(stageID).classList.remove('hide-stage-image');
}

// Begin Loading Gallery if one is defined
var gallery = document.querySelector('#flickrgal'); 
if (gallery) {
	gallery.className = 'hide';
	
	var	galleryNavigation = '<div id="navigation-container"><div class="navigate-back hide"><div>Back</div></div></div>';
	var	loadingGallery = '<div id="loading-gallery"><div>Loading...</div></div>';
	var imageGridBox = '<div id="image-grid"></div>';

	// Get the collection names
	var getAll = false;
	var collectionSet = gallery.getAttribute('data-collections');
		collectionSet = JSON.parse(collectionSet);
		collectionsRequested = to_lower_case(collectionSet);
		collectionsRequested.indexOf('all') >= 0 ? getAll = true : getAll = false;
	var collectionTitles = gallery.hasAttribute('data-titles') ? true : false;
		
	// Defining vars and events for all elements inserted dynamically on page load
	gallery.insertAdjacentHTML('afterbegin', galleryNavigation);
	gallery.insertAdjacentHTML('afterbegin', loadingGallery);
	gallery.insertAdjacentHTML('beforeend', imageGridBox);
	gallery.appendChild(lightboxTemplate);

	var imageGrid = document.querySelector('#image-grid');
	var lightbox = document.querySelector('#lightbox');
	var imageBox = document.querySelector('#image-box');
	var lightboxTitle = document.querySelector('#info > #title');
	var lightboxDesc = document.querySelector('#info > #description');
	var loadingMessage = document.querySelector('#loading-gallery');
	
	var closeButton = document.querySelector('.close');
		closeButton.addEventListener('click', handle_click);
	var backButton = document.querySelector('.navigate-back');
		backButton.addEventListener('click', handle_click);
	var prevButton = document.querySelector('.prev');
		prevButton.addEventListener('click', handle_click);
	var nextButton = document.querySelector('.next');
		nextButton.addEventListener('click', handle_click);

	window.addEventListener('keydown', handle_keys);

	// Start Loading the gallery
	console.log('Requested Collections: ' + collectionsRequested);
	// Make a collection request
	var url = endpoint
		+ methodCollection
		+ params;

	make_request(url, 'collections');	
}