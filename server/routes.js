/**
 * Main application routes
 */

(function () {
    'use strict';

    var errors = require('./components/errors');
    var Jopier = require('./components/jopierREST/core/Jopier');
    var jopier = new Jopier();

    module.exports = function (app) {

        // Insert routes below
        app.use('/api/things', require('./api/thing'));

        app.route(jopier.allPath()).get(jopier.all);
        app.route(jopier.getPath()).get(jopier.get);
        app.route(jopier.postPath()).post(jopier.post);

        app.route('/').get(function (req, res) {
            res.sendfile(app.get('appPath') + '/index.html');
        });
        app.route('/*').get(errors[404]);
        /*
         // All undefined asset or api routes should return a 404
         app.route('/:url(api|auth|components|app|bower_components|assets)/*')
         .get(errors[404]);

         // All other routes should redirect to the index.html
         app.route('/*')
         .get(function (req, res) {
         res.sendfile(app.get('appPath') + '/index.html');
         });
         */
    };
})();
