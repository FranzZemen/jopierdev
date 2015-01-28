/**
 * Created by Franz on 1/25/2015.
 */

(function () {
    'use strict';
    var bunyan = require('bunyan');
    var _ = require('lodash');
    var mongoskin = require('mongoskin');
    var ObjectID = require('mongodb').ObjectID;
    //var Promise = require('node-promise').Promise;

    /**
     *
     * @param siteKey The site for which content is being managed.  Defaults to the path parameter (not req.path) minus the /:key if not set, and default path if that's not set).
     * @param bunyanStreams
     * @param basePath Defaults to /jopier
     * @param mongoUri
     * @param collection
     * @constructor
     */
    function Jopier(siteKey, bunyanStreams, basePath, mongoUri, collection) {
        var log, db, getPath, postPath, allPath;

        if (bunyanStreams) {
            log = bunyan.createLogger({name: 'jopier', streams: bunyanStreams});
        } else {
            log = bunyan.createLogger({name: 'jopier', level: 'debug'});
        }
        if (!basePath) {
            basePath = '/jopier';
        }
        getPath = basePath + '/:key';
        postPath = basePath + '/:key';
        allPath = basePath;
        if (!mongoUri) {
            mongoUri = 'mongodb://localhost/jopier';
        }
        if (!collection) {
            collection = 'jopier';
        }
        if (!siteKey) {
            siteKey = basePath;
        }
        db = require('mongoskin').db(mongoUri);

        db.collection(collection).findOne({siteKey: siteKey}, function (err, result) {
            if (err) {
                log.error(err);
                throw err;
            } else {
                if (!result || result === '') {
                    db.collection(collection).insert({siteKey: siteKey, content: {}}, function (err, result) {
                        if (err) {
                            log.error(err);
                            throw err;
                        }
                    })
                }
            }
        });

        this.getPath = function () {
            return getPath;
        };
        this.postPath = function () {
            return postPath;
        };
        this.allPath = function () {
            return allPath;
        };

        var logIdentifier = {mongoUri: mongoUri, collection: collection, siteKey: siteKey};

        this.all = function (req, res, next) {
            log.debug({for: logIdentifier}, 'all middleware called');
            var msg;

            log.debug({for: logIdentifier}, 'Get All');

            db.collection(collection).findOne({siteKey: siteKey}, function (err, doc) {
                if (err) {
                    log.error(err);
                    res.status(500).send(err.message);
                }
                if (doc && doc.content) {
                    res.status(200).send(doc.content);
                } else {
                    msg = 'No content found';
                    log.debug({for: logIdentifier}, msg);
                    res.status(404).send(msg);
                }
            });
        };
        this.get = function (req, res, next) {
            log.debug({for: logIdentifier}, 'get middleware called');
            var key = req.params.key,
                msg;
            if (!key) {
                msg = 'Path param "key" not defined';
                log.warn({for: logIdentifier}, msg);
                res.status(400).send(msg);
            } else {
                log.debug({for: logIdentifier}, 'Get Content for key: ' + key);

                // Setup project using mongo Dot Notation for the deep key
                var projection = {};
                projection['content.' + key] = 1;
                db.collection(collection).findOne({siteKey: siteKey}, projection, function (err, doc) {
                    if (err) {
                        log.error(err);
                        res.status(500).send(err.message);
                    }
                    if (doc && doc.content) {
                        // Get the path to the content (keys to navigate down into the site collection.
                        var pathToContent = key.split('.');
                        // Point to the site
                        var content = doc.content;
                        for (var i = 0; i < pathToContent.length; i++) {
                            // Point to the next level down.  Final iteration results in the contents
                            content = content[pathToContent[i]];
                            if (!content) {
                                break;
                            }
                        }
                        if (content) {
                            if (typeof content === 'string') {
                                log.debug()
                                log.debug({for: logIdentifier}, 'Content for Key: ' + key + ' = ' + content);
                                res.status(200).send({key: key, content: content});
                            } else {
                                msg = 'Key ' + key + ' does not resolve to string content';
                                log.error({for: logIdentifier, content: content}, msg);
                                res.status(400).send(msg);
                            }
                        } else {
                            msg = 'No content found for key: ' + key;
                            log.debug({for: logIdentifier}, msg);
                            res.status(404).send(msg);
                        }
                    } else {
                        msg = 'No content found for key: ' + key;
                        log.debug({for: logIdentifier}, msg);
                        res.status(404).send(msg);
                    }
                });
            }
        };
        this.post = function (req, res, next) {
            log.debug({for: logIdentifier}, 'post middleware called');
            var key = req.params.key, msg;
            var content = req.body.content;
            if (!key) {
                msg = 'Path param "key" not defined';
                log.warn({for: logIdentifier}, msg);
                res.status(400).send(msg);
            } else if (!content) {
                msg = 'Body must include a field "content" that contains the content!';
                log.error({for: logIdentifier}, msg);
                res.status(400).send(msg);
            } else {
                var set = {};
                set['content.' + key] = content;
                db.collection(collection).update({siteKey: siteKey}, {$set: set}, function (err, result) {
                    if (err) {
                        log.error(err);
                        res.status(500).messag(err.message);
                    } else {
                        log.debug({for: logIdentifier}, 'Sucessfully saved')
                        res.status(200).send('Success');
                    }
                });
            }
        };
    }

    module.exports = Jopier;

})();
