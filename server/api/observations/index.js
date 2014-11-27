var express = require('express');
var router = express.Router();
var _ = require('lodash');
var jwt = require('express-jwt');
var multiparty = require('multiparty');
var minUtils = require('./min-utils');
var moment = require('moment');

var jwtCheck = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
});

router.post('/submissions', jwtCheck, function (req, res) {
    var form = new multiparty.Form();
    form.parse(req);

    minUtils.saveSubmission(req.user, form, function (err, obs) {
        if (err) {
            res.send(500, {error: 'error saving submission'})
        } else {
            res.json(201, obs);
        }
    });
});

router.get('/submissions', function (req, res) {
    var filters = req.query;
    console.log('fetching submissions with fiters: %s', JSON.stringify(filters));

    minUtils.getSubmissions(filters, function (err, subs) {
        if (err) {
            res.send(500, {error: 'error retreiving submissions'})
        } else {
            res.json(subs);
        }
    });
}); 

router.get('/submissions/:subid', function (req, res) {
    var subid = req.params.subid;

    minUtils.getSubmission(subid, function (err, sub) {
        if (err) {
            res.send(500, {error: 'error retreiving submission'})
        } else {
            res.json(sub);
        }
    });
});

router.get('/observations', function (req, res) {
    var filters = req.query;
    console.log('fetching submissions with fiters: %s', JSON.stringify(filters));

    minUtils.getObservations(filters, function (err, obs) {
        if (err) {
            res.send(500, {error: 'error retreiving observations'})
        } else {
            res.json(obs);
        }
    });
});

function flatten(obj){
    return _.reduce(obj, function (memo, v, k) {
        if (v) memo.push(k);
        return memo;
    }, []).join(', ');
}

router.get('/observations/:obid.:format?', function (req, res) {
    var params = {
        TableName: 'ac-obs',
        Key: {obid: req.params.obid}
    };

    minUtils.getObservation(req.params.obid, function (err, ob) {
        if (err) {
            res.send(500, {error: 'error retreiving observation'})
        } else {
            if(req.params.format === 'html'){
                console.log(ob)
                var locals = {
                    title: ob.title || 'title',
                    datetime: moment(ob.datetime).format('MMM Do, YYYY [at] HH:mm'),
                    ridingConditions: {
                        ridingQuality: ob.ridingConditions.ridingQuality.selected,
                        snowConditions: flatten(ob.ridingConditions.snowConditions.options),
                        rideType: flatten(ob.ridingConditions.rideType.options),
                        stayedAway: flatten(ob.ridingConditions.stayedAway.options),
                        weather: flatten(ob.ridingConditions.weather.options),
                    },
                    avalancheConditions: ob.avalancheConditions,
                    comment: ob.comment
                };

                console.log(locals)
                res.render('observations/ob', locals);
            } else {
                res.json(ob);
            }
        }
    });
});

router.get('/uploads/:year/:month/:day/:uploadid', function (req, res) {
    var params = {
        Bucket: 'ac-user-uploads',
        Key: [req.params.year, req.params.month, req.params.day, req.params.uploadid].join('/')
    };

    var s3 = new AWS.S3();
    s3.getObject(params).createReadStream().pipe(res);
});

module.exports = router;