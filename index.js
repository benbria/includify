// Based loosely on https://github.com/quarterto/rfolderify

var path = require('path');
var fs = require('fs');

var through = require('through');
var falafel = require('falafel');

var defaults = {require:"require"}

module.exports = function (file) {
    if (/\.json$/.test(file)) return through();

    var data = '';
    var dirname = path.dirname(file);
    var varNames = ['__filename', '__dirname', 'path', 'join'];
    var vars = [file, dirname, path, path.join];
    var pending = 0;

    var tr = through(write, end);
    return tr;

    // Read all the data into `buf`
    function write (buf) { data += buf }

    // Called when we're done reading data
    function end () {
        try {
            var output = parse();
        } catch (err) {
            this.emit('error', new Error(
                err.toString().replace('Error: ', '') + ' (' + file + ')')
            );
        }
        if(pending == 0) finish(output);
    }

    function finish(output) {
        tr.queue(String(output));
        tr.queue(null);
    }

    function parse() {
        var output = falafel(data, function (node) {
            if (node.type === 'CallExpression' &&
                node.callee.type === 'Identifier' &&
                node.callee.name === 'includify') {
                ++pending;

                // Parse arguemnts to calls to `includify(file)`
                var args = node.arguments;
                for (var i = 0; i < args.length; i++) {
                    var t = 'return ' + (args[i]).source();
                    args[i] = Function(varNames, t).apply(null, vars);
                }

                // Resolve the file to require relative the file which is requiring it
                var parentDir = path.dirname(file);
                var includeFile = path.resolve(parentDir, args[0])

                content = fs.readFileSync(includeFile, "utf-8");
                node.update(content);
            }
        });

        finish(output);
        return output;
    }
};
