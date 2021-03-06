'use strict';

module.exports = function(app) {

    var env = app.get('env');
   var logger = require('./logger.js');

    //! \todo make pre render token an env var
    var use_prerender = (process.env.USE_PRERENDER === 'false') ? false : true;
    if (use_prerender) {
        logger.log('info','using prerender');
        app.use(require('prerender-node').set('prerenderToken', '02L7Pq1BhiL3t6gzWX78'));
    }

    var expressJwt = require('express-jwt');
    var jwt = require('jsonwebtoken');

    var secret = new Buffer('pT6ehAfy_LiHB1c7-GyUJUDsEjiJUt_w0qGa10TLJUMCho8gGqUjRDVobboLdwOy', 'base64');
    app.use('/api', expressJwt({secret: secret}).unless({ method: 'GET' }));

    app.use('/api/forecasts', require('./api/forecasts'));
    app.use('/api/min', require('./api/observations'));
    app.use('/api/ast', require('./api/ast'));
    app.use('/vendor/cloudinary/', require('./api/proxy'));

    var geocoder = require('geocoder');

    //! Error middle ware \todo make this better and inc better logging (winston)
    app.use(function (err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            logger.log('warn','UnauthorizedError');
            res.status(401).send('UnauthorizedError');
        }
        else{
            logger.log('error','Error occured', err);
            res.status(500);
            res.send('error', { error: err });
        }
    });

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(function(req, res) {
            res.send(404);
        });

    app.route('/404')
        .get(function(req, res) {
            res.status(404);
            res.sendfile(app.get('appPath') + '/index.html');
        });

    // match routes handled by our app. /todo there must be a better way !
    app.route(['/','/about*','/more*','/blogs*','/conditions*','/submit*','/share*','/weather*','/training*','/youth*','/gear*','/sponsors*','/forecasts*', '/collaborators*','/news*','/events*','/foundation*', '/spring*', '/ast*'])
        .get(function(req, res) {
            res.sendfile(app.get('appPath') + '/index.html');
        });

    //! for routes not found still use the app but return 404. The app should also not know the route and display the 404 page
    app.use(function(req, res, next) {
        res.status(404);
        res.sendfile(app.get('appPath') + '/index.html');
    });
};
