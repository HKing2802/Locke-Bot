const assert = require('assert').strict;
const auth = require('../auth.json');
const db = require('../src/db.js');
const { silenceLogging } = require('../src/util.js').testing;

const testConfig = {
    host: auth.db_host,
    user: auth.db_user,
    password: auth.db_pass,
    schema: 'lockebot_test_db',
    port: 33060
}

describe('database handler', function () {

    before(() => {
        silenceLogging(true);
    });

    after(() => {
        silenceLogging(false);
    });

    it('connects', function (done) {
        assert(!(db.connected()));
        db.connect(testConfig)
            .then(() => {
                assert(db.connected());
                db.disconnect()
                    .then(() => {
                        done();
                    });
            })
            .catch(err => done(err));
    });

    it('disconnects', function (done) {
        db.connect(testConfig)
            .then(() => {
                assert(db.connected());
                db.disconnect()
                    .then(() => {
                        assert(!(db.connected()));
                        done();
                    })
            });
    });

    it('builds Query', function (done) {
        const mysqlx = require('@mysql/xdevapi');
        db.connect(testConfig)
            .then(() => {
                const query = db.buildQuery('SELECT * FROM messages');
                assert(query instanceof Object);
                db.disconnect()
                    .then(() => { done() })
            })
            .catch(err => done(err));
    });

    it('BuildQuery errors on not connected', function () {
        assert(!db.connected());
        try {
            const query = db.buildQuery('test');
            assert(false);
        } catch (error) {
            assert.equal(error.message, "Not connected to a Database");
        }
    })
});