// Based loosely on https://github.com/quarterto/rfolderify

var transformTools = require('browserify-transform-tools');

var path = require('path');
var fs = require('fs');

module.exports = transformTools.makeFalafelTransform("includify",
    function (node, transformOptions, done) {
        if (node.type === 'CallExpression' &&
            node.callee.type === 'Identifier' &&
            node.callee.name === 'includify') {

            var file = transformOptions.file;

            // Parse arguemnts to calls to `includify(file)`
            var dirname = path.dirname(file);
            var varNames = ['__filename', '__dirname', 'path', 'join'];
            var vars = [file, dirname, path, path.join];
            var args = node.arguments;
            for (var i = 0; i < args.length; i++) {
                var t = 'return ' + (args[i]).source();
                args[i] = Function(varNames, t).apply(null, vars);
            }

            var includeType = args[1] || 'direct';

            // Resolve the file to require relative the file which is requiring it
            var includeFile = path.resolve(dirname, args[0])

            if(transformOptions.config && transformOptions.config.verbose) {
                console.log("includify - " + file + ": including " + includeFile + " as " + includeType);
            }

            fs.readFile(includeFile, function(err, contentBuffer) {
                if(err) {
                    return done(err);
                } else {
                    if(includeType === "direct") {
                        node.update(contentBuffer.toString("utf-8"));
                        done();
                    } else if(includeType === "base64") {
                        node.update("'" + contentBuffer.toString("base64") + "'");
                        done();
                    } else {
                        done(new Error("Unknown include type " + includeType));
                    }
                }
            });
        } else {
            done();
        }
    }
);
