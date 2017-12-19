function Flickr(options) {
	var APIKEY = options.apiKey;
	var USERID = options.userId;
	
	function handleRequest(event) {
		var request = event.target;
		var	responseData = JSON.parse(request.responseText);

		if (request.readyState === XMLHttpRequest.DONE) {
			if (request.status === 200) {

				switch (request.type){
					case 'collections':
						build_collections(responseData);
						var currentState = imageGrid.childNodes;
						Array.prototype.forEach.call(currentState, function(node) {
							prevState.push(node);
						});
						break;

					case 'photosets':
						insert_albums(responseData, request.id);
						break;
				}
			} else {
				console.log('Flickr ' + request.type + ' request failed!');
			}
		}
	}

	function makeUrl(type, id) {
		var endpoint = 'https://api.flickr.com/services/rest/?method=';

		// Request methods
		switch(type) {
			case 'collections':
				endpoint += 'flickr.collections.getTree'
				break;
			case 'photosets':
				endpoint += 'flickr.photosets.getPhotos'
					+ '&photoset_id='
					+ id
					+ '&extras=description'
				break;
		}

		// Common params
		endpoint += '&format=json'
			+ '&nojsoncallback=1'
			+ '&api_key='
			+ APIKEY
			+ '&user_id='
			+ USERID;

		return endpoint;
	}

	function makeApiRequest(type, id) {
		var request 	= new XMLHttpRequest();

		request.open('GET', makeUrl(type, id), true);
		request.type = type;
		request.id = id;
		request.onload = handleRequest;
		request.send();
	}
	
	return {
		makeApiRequest: makeApiRequest
	}
}

var FlickrGal = {
	loadGallery: function(options) {
		if(!options.apiKey) throw "Api key not set";
	  if(!options.userId) throw "User ID not set";
		
		this.gallery = new Flickr({
			apiKey: options.apiKey,
			userId: options.userId
		});

		this.gallery.makeApiRequest('collections');
	}
}

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
// Selectors
function $(el){
		return document.querySelector(el);
}
//Event Handlers
function handle_click(event){
	var el = event.currentTarget;
	var type = el.className;
	console.log(type)

	switch(type){
		case 'navigate-back':
		imageGrid.innerHTML = "";
		for(var element in prevState) {
			imageGrid.appendChild(prevState[element]);
		}
		console.log('yip')

		loading.style.display = 'none';
		break;
		case 'album':
			var requestedAlbum = el.id;
			insert_images(requestedAlbum);
			break;
		case 'image':
			var	requestedImage = el.id;
			var album = el.getAttribute('album-id');
			insert_lightbox(requestedImage, album);
			lightbox.classList.remove('hide');
			console.log('yip')
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
	lightbox.title.innerHTML = focus.getAttribute('data-title');
	lightbox.desc.innerHTML = focus.getAttribute('data-description');
}
function next(){
	var focus = document.getElementById(lightboxSet[0]);
		focus.classList.add('hide-stage-image');
	var move = lightboxSet.shift();
	lightboxSet.push(move);
	focus = document.getElementById(lightboxSet[0])
	focus.classList.remove('hide-stage-image');
	lightbox.title.innerHTML = focus.getAttribute('data-title');
	lightbox.desc.innerHTML = focus.getAttribute('data-description');
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
	if (setHasTitles) {
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
			}else if (set.indexOf(collectionName.toLowerCase()) >= 0) {
				build_album(collectionObject, collectionName, collectionID);
			}

		}

		loading.style.display = 'none';

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

			if (setHasTitles) {
				imageGrid.querySelector('.collection-' + newAlbum.el.getAttribute('collection-id')).appendChild(newAlbum.el);
			}else{
				imageGrid.appendChild(newAlbum.el);
			}
		});
		// Request images for albums
		Array.prototype.forEach.call(albums, function(album) {
			FlickrGal.gallery.makeApiRequest('photosets', album.id);
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

	var navigateBack = new Element('image');
			navigateBack.inner.classList.remove('inner');
			navigateBack.inner.classList.add('navigate-back');
			navigateBack.inner.innerHTML = '<div>Back</div>';
			navigateBack.inner.addEventListener('click', handle_click);
			navigateBack.el.appendChild(navigateBack.dummy);
			navigateBack.el.appendChild(navigateBack.inner);
			imageGrid.appendChild(navigateBack.el);

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

	lightbox.image.innerHTML = '';
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

			lightbox.image.appendChild(newImage);
			lightboxSet.push(newImage.id);
	});

	var activePos = lightboxSet.indexOf(stageID);
	var top = lightboxSet.slice(activePos);
	var bottom = lightboxSet.slice(0, activePos);

	lightboxSet = top.concat(bottom);

	// Set the selected image title and description in the lightbox
	lightbox.title.innerHTML = document.getElementById(lightboxSet[0]).getAttribute('data-title');
	lightbox.desc.innerHTML = document.getElementById(lightboxSet[0]).getAttribute('data-description');

	document.getElementById(stageID).classList.remove('hide-stage-image');
}

// Begin Loading Gallery if one is defined
var gallery = $('#flickrgal');
if (gallery) {
	gallery.className = 'hide';

	var	loadingGallery = '<div id="loading-gallery"><div>Loading...</div></div>';
	var imageGridBox = '<div id="image-grid"></div>';

	// Get the collection names
	var getAll;
	var	set = to_lower_case(JSON.parse(gallery.getAttribute('data-collections')));
		set.indexOf('all') >= 0 ? getAll = true : getAll = false;
	var	setHasTitles = gallery.hasAttribute('data-titles') ? true : false;

	// Defining vars and events for all elements inserted dynamically on page load
	gallery.insertAdjacentHTML('afterbegin', loadingGallery);
	gallery.insertAdjacentHTML('beforeend', imageGridBox);
	gallery.appendChild(lightboxTemplate);

	var imageGrid = $('#image-grid');
	var lightbox = $('#lightbox');
		lightbox.image = $('#image-box');
		lightbox.title = $('#info > #title');
		lightbox.desc = $('#info > #description');
	var loading = $('#loading-gallery');

	[].forEach.call(
		document.querySelectorAll(".close,.prev,.next"),
		function(el) {
			el.addEventListener("click", handle_click);
		}
	)

	window.addEventListener('keydown', handle_keys);

	// Start Loading the gallery
	console.log('Requested Collections: ' + set);
	
	FlickrGal.loadGallery({
		apiKey: gallery.getAttribute('data-apikey'),
		userId: gallery.getAttribute('data-userid')
	});
}
