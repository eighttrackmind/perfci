;(function(){

	"use strict";

	var config = require('cat-settings').loadSync(__dirname + '/config.json'),
		cradle = require('cradle'),
		objectid = require('objectid'),
		//suite = require('./sample-bench'),
		when = require('when');

	// model
	var state = {

		// connect to db
		connection: new cradle.Connection(config.db.host, config.db.port),

		// promise
		deferred: when.defer()
	};

	function save (data) {

		var deferred = when.defer();

		// save
		state
		.connection
		.database(config.db.database)
		.save(objectid().toString(), data, function (err, res) {

			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(res);
			}

		});

		return deferred.promise;

	}

	function toArray (arraylike) {
		return [].slice.call(arraylike);
	}

	function log () {
		toArray(arguments).forEach(function (arg) {
			console.info('perfci:', arg);
		});
	}

	function normalizeStats (raw) {
		return {
			mean: raw.mean,
			stddev: raw.deviation,
			count: raw.sample.length
		};
	}

	function complete () {

		var data = normalizeStats(this[0].stats);

		log('saving', data);

		save(data)
		.then(function (res) {
			log('saved', res);
			state.deferred.resolve(res);
		}, function (err) {
			state.deferred.reject(err);
			//throw err;
		});
	}

	function cycle (event) {
		log('cycle ' + event.target.stats.mean);
	}

	function init (suite) {

		// run benchmark
		setTimeout(function(){
			suite
			.on('cycle', cycle)
			.on('complete', complete)
			.run();
		}, 0);

		return state.deferred.promise;

	}

	module.exports = init;

})();