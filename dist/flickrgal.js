if (typeof window !== 'undefined') window.addEventListener("load", function(event) {
	FlickrGal.init();
});

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
						build_collections(responseData, options);
						var currentState = gallery.imageGrid.childNodes;
						Array.prototype.forEach.call(currentState, function(node) {
							FlickrGal.prevState.push(node);
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
					+ '&extras=description%2Curl_z%2Curl_c%2Curl_h%2Curl_k'
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

if (typeof window !== 'undefined') window.FlickrGal = {
	init: function() {

			this.albums = []; // Stores full album / photoset information
			this.lightboxSet = []; // Stores the set of images open in lightbox
			this.prevState = []; // Stores objects to be re-inserted later

			window.gallery = document.querySelector('#flickrgal');

		  if (gallery) {
				// FlickrGal template
				gallery.className = 'hide';

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

				var	loadingGallery = '<div id="loading-gallery"><div>Loading...</div></div>';
				var imageGridBox = '<div id="image-grid"></div>';

				gallery.insertAdjacentHTML('afterbegin', loadingGallery);
				gallery.insertAdjacentHTML('beforeend', imageGridBox);
				gallery.appendChild(lightboxTemplate);

				gallery.imageGrid = document.querySelector('#image-grid');
				var lightbox = document.querySelector('#lightbox');

				lightbox.image = document.querySelector('#image-box');
				lightbox.imageTitle = document.querySelector('#info > #title');
				lightbox.imageDesc = document.querySelector('#info > #description');
				gallery.loading = document.querySelector('#loading-gallery');
				// End FlickrGal template
		  }

			this.loadGallery({
				apiKey: gallery.getAttribute('data-apikey'),
				userId: gallery.getAttribute('data-userid')
			});
	},
	loadGallery: function(options) {
		if(!options.apiKey) throw "Api key not set";
	  if(!options.userId) throw "User ID not set";

		// Get the collection names
		options.set = to_lower_case(JSON.parse(gallery.getAttribute('data-collections')));
		options.set.indexOf('all') >= 0 ? options.getAll = true : options.getAll = false;
		options.setHasTitles = gallery.hasAttribute('data-titles') ? true : false;

		[].forEach.call(
			document.querySelectorAll(".close,.prev,.next"),
			function(el) {
				el.addEventListener("click", handle_click);
			}
		)

		window.addEventListener('keydown', handle_keys);

		this.gallery = new Flickr({
			apiKey: options.apiKey,
			userId: options.userId,
			getAll: options.getAll,
			set: options.set,
			setHasTitles: options.setHasTitles
		});

		this.gallery.makeApiRequest('collections');
	}
}

// FUNCTIONS
//Event Handlers
function handle_click(event){
	var el = event.currentTarget;
	var type = el.className;
	console.log(type)

	switch(type){
		case 'navigate-back':
		gallery.imageGrid.innerHTML = "";
		for(var element in FlickrGal.prevState) {
			gallery.imageGrid.appendChild(FlickrGal.prevState[element]);
		}

		gallery.loading.style.display = 'none';
		break;
		case 'album':
    if (typeof window !== 'undefined') window.pageYOffset = document.documentElement.scrollTop = document.body.scrollTop = 0;
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
	var focus = document.getElementById(FlickrGal.lightboxSet[0]);
	focus.classList.add('hide-stage-image');
	var move = FlickrGal.lightboxSet.pop();
	FlickrGal.lightboxSet.unshift(move);
	focus = document.getElementById(FlickrGal.lightboxSet[0])
	focus.classList.remove('hide-stage-image');
	lightbox.imageTitle.innerHTML = focus.getAttribute('data-title');
	lightbox.imageDesc.innerHTML = focus.getAttribute('data-description');
}
function next(){
	var focus = document.getElementById(FlickrGal.lightboxSet[0]);
	focus.classList.add('hide-stage-image');
	var move = FlickrGal.lightboxSet.shift();
	FlickrGal.lightboxSet.push(move);
	focus = document.getElementById(FlickrGal.lightboxSet[0])
	focus.classList.remove('hide-stage-image');
	lightbox.imageTitle.innerHTML = focus.getAttribute('data-title');
	lightbox.imageDesc.innerHTML = focus.getAttribute('data-description');
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
	for (var album in FlickrGal.albums){
		FlickrGal.albums[album].id == id ? position = album : false
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

function build_album(collection, collectionName, collectionID, options) {
	var sets = collection.set
	for(var set in sets){
		FlickrGal.albums.push({
			id: sets[set].id,
			collectionName: collectionName,
			collectionID: collectionID, // Not hooked up yet
			title: sets[set].title,
			description: sets[set].description,
			images: []
		});
	}
	if (options.setHasTitles) {
		gallery.imageGrid.insertAdjacentHTML('beforeend', '<h3 class="collection-title">'
			+ collectionName
			+ '</h3><div class="collection '
			+ 'collection-'
			+ collectionID
			+ '"></div>');
	}
}
// 	Builds collections of albums from flickr 'photosets'
function build_collections(data, options) {
		var allCollections = data.collections.collection;
		for(var collection in allCollections){
			var collectionObject = allCollections[collection];
			var collectionName = collectionObject.title;
			var collectionID = collectionObject.id;

			if (options.getAll) {
				build_album(collectionObject, collectionName, collectionID, options);
			}else if (options.set.indexOf(collectionName.toLowerCase()) >= 0) {
				build_album(collectionObject, collectionName, collectionID, options);
			}
		}

		gallery.loading.style.display = 'none';

		// Build the albums for a collection
		Array.prototype.forEach.call(FlickrGal.albums, function(album) {
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

			if (options.setHasTitles) {
				gallery.imageGrid.querySelector('.collection-' + newAlbum.el.getAttribute('collection-id')).appendChild(newAlbum.el);
			}else{
				gallery.imageGrid.appendChild(newAlbum.el);
			}
		});
		// Request images for albums
		Array.prototype.forEach.call(FlickrGal.albums, function(album) {
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
		imageObject.urlZ = image.url_z;
		imageObject.urlC = image.url_c;
		imageObject.urlH = image.url_h;
		imageObject.urlK = image.url_k;
		imageObject.title = image.title;
		imageObject.description = image.description;
		imageObject.is_primary = image.isprimary;
		FlickrGal.albums[position].images.push(imageObject);

		// Set album cover image
		if (imageObject.is_primary == 1) {
			primaryImageUrl = imageObject.urlZ;
			// Append image and fade it in
			fade_in_image(id, primaryImageUrl);
		} else {
			// Fallback to set the primary photo to the first photo returned in the album is isprimary is not set
			primaryImageUrl = FlickrGal.albums[position].images[0].urlZ;
			fade_in_image(id, primaryImageUrl);
		}
	});
}
function insert_images(id){
	gallery.imageGrid.innerHTML = "";

	var navigateBack = new Element('image');
			navigateBack.inner.classList.remove('inner');
			navigateBack.inner.classList.add('navigate-back');
			navigateBack.inner.innerHTML = '<div>Back</div>';
			navigateBack.inner.addEventListener('click', handle_click);
			navigateBack.el.appendChild(navigateBack.dummy);
			navigateBack.el.appendChild(navigateBack.inner);
			gallery.imageGrid.appendChild(navigateBack.el);

	var position = get_album_pos(id);
	var images = FlickrGal.albums[position].images
	var size = 'z';

	Array.prototype.forEach.call(images, function(image) {
		var imageUrl = image.urlZ;
		var newImage = new Element('image');
		var imageID = image.id;

		newImage.el.id = imageID;
		newImage.el.setAttribute('album-id', id);

		newImage.el.appendChild(newImage.dummy);
		newImage.el.appendChild(newImage.inner);
		newImage.el.addEventListener('click', handle_click);
		gallery.imageGrid.appendChild(newImage.el);

		// Append image and fade it in
		fade_in_image(imageID, imageUrl);
	});
}
function insert_lightbox(id, album){
	FlickrGal.lightboxSet = [];
	var position = get_album_pos(album);
	var callingAlbum = FlickrGal.albums[position].images;
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
			// Falls back through a few different sizes if high res ones aren't available
			var largeImageUrl = image.urlK || image.urlH || image.urlC;
			newImage.innerHTML = '<div style="background-image: url('
				+ largeImageUrl
				+ ')"></div>';

			lightbox.image.appendChild(newImage);
			FlickrGal.lightboxSet.push(newImage.id);
	});

	var activePos = FlickrGal.lightboxSet.indexOf(stageID);
	var top = FlickrGal.lightboxSet.slice(activePos);
	var bottom = FlickrGal.lightboxSet.slice(0, activePos);

	FlickrGal.lightboxSet = top.concat(bottom);

	// Set the selected image title and description in the lightbox
	lightbox.imageTitle.innerHTML = document.getElementById(FlickrGal.lightboxSet[0]).getAttribute('data-title');
	lightbox.imageDesc.innerHTML = document.getElementById(FlickrGal.lightboxSet[0]).getAttribute('data-description');

	document.getElementById(stageID).classList.remove('hide-stage-image');
}
