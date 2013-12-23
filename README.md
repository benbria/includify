Include the contents of a file during browserify build.

Usage
=====

In your .js file:

    includify('./foo.js');

The 'includify' call will be replaced with the contents of foo.js.

You may optionally pass a second parameter to describe how the file should be included:

    // Will be replaced with the contents of foo.js (the default).
    includify('./foo.js', 'direct');

    // Will be replaced with a string containing the base64 encoding of foo.gif
    var imgUrl = "data:image/png;base64," + includify('./loading.gif', 'base64');