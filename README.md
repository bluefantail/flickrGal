# flickrGal

flickrGal is a fully responsive, easy to use gallery utilising the flickr api. It pulls specified image collections from a flickr account.

The primary goal of flickrGal is to provide a super fast flickr gallery that can be painlessly integrated and configured.

It's perfect for Photographers, Artists, or anyone wanting to showcase their work on a website with minimal hassle.

Written purely in javascript, with no external dependencies.

![flickrGal Demo](https://raw.githubusercontent.com/bluefantail/flickrGal/master/preview.jpg)

[Download flickGal](https://raw.githubusercontent.com/bluefantail/flickrGal/master/dist/flickrgal.zip)

[View Demo](http://bluefantail.github.io/flickrGal)

# Usage

To get going with flickrGal, set `flickrApiKey`, and `flickrUserId` in flickrgal.js to the values obtained by requesting your flickr api key. See [flickr's instructions](https://www.flickr.com/services/apps/create) for info on how to request that.

``` javascript
var flickrApiKey = '35ca9893a15649318240594ad7dd98e7'; // Change to your flickr api key
var flickrUserId = '141088533@N02'; // Change to your flickr User ID
```

> Note - remember not to use your api key for anything important in production, I haven't provided any method for storing api keys here. That bit's up to you.

Then simply add the flickrGal div somewhere on your page.
``` html
<div id="flickrgal" data-collections='["all"]'></div>
```

Use the collections data attribute to specify which collections you want to load. `all` will load every photoset from every collection.
Collections can also be specified individually like so:

``` html
<div id="flickrgal" data-collections='["My Collection", "Another Collection"]'></div>
```

The gallery will expand to the full width of whatever container it's inside, and behave according to the defined grid and breakpoints (more about those in configuration). 

## Options

When displaying all or multiple collections on a single page, an option can be used to seperate collections into sections using the `data-titles` data attribute:

``` html
<div id="flickrgal" data-collections='["My Collection", "Another Collection"]' data-titles></div>
```

# Configuration

## CSS

If you're using the included sass in your project, various aspects of the flickrGal layout and style are easy to configure. Important ones are at the top of [flickrgal.scss](https://github.com/bluefantail/flickrGal/blob/master/_sass/flickrgal.scss)

### Colours

Colours can be set using the following variables:

``` scss
// Colours
$colours: (
	primary-accent: #0076E3, // Main gallery accent colour
	secondary-accent: #ff1981, 
	lightbox: #000B10
);
```

### Image Grid

Behavior and properties of images in the grid can be modified using the image-grid map:

``` scss
// Image Variables
$image-grid: (
	aspect:  4/3, // Set image aspect ratio e.g. 4/3 == 4:3 
	padding: 5px, // Space between images
	default-cols: 3 // Default number of columns
);
```

### Breakpoints

Gallery breakpoints can be added, removed, and modified using the breakpoints map:

``` scss
// Gallery Breakpoints (max-width, columns)
$breakpoints: (
	(750px, 2),
	(450px, 1)
);
```

# Browser Compatibility
# Development