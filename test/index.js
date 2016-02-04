'use strict';

/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */

const chai = require( 'chai' );
const expect = chai.expect;
const chaiaspromised = require( 'chai-as-promised' );
const sinonchai = require( 'sinon-chai' );
const sinon = require( 'sinon' );

const index = require( '../src/index.js' );
const s3 = require( '../src/s3.js' );
const mongo = require( '../src/mongo.js' );

chai.use( sinonchai );
chai.use( chaiaspromised );

const userId = 12345;

// Declare spies here to prevent rewrapping them
let s3ReadSpy;
let s3WriteSpy;
let s3CopySpy;
let s3DestroySpy;
let s3DownloadSpy;
let mongoInsertSpy;
let mongoSearchSpy;
let mongoUpdateSpy;
let mongoDestroySpy;
let mongoGetGUIDSpy;

beforeEach(() => {
    s3ReadSpy = sinon.spy( s3, 'read' );
    s3WriteSpy = sinon.spy( s3, 'write' );
    s3CopySpy = sinon.spy( s3, 'copy' );
    s3DestroySpy = sinon.spy( s3, 'destroy' );
    s3DownloadSpy = sinon.spy( s3, 'download' );
    mongoInsertSpy = sinon.spy( mongo, 'insert' );
    mongoSearchSpy = sinon.spy( mongo, 'search' );
    mongoUpdateSpy = sinon.spy( mongo, 'update' );
    mongoDestroySpy = sinon.spy( mongo, 'destroy' );
    mongoGetGUIDSpy = sinon.spy( mongo, 'getGUID' );
});

const s3Actions = [ 'read', 'write', 'copy', 'destroy', 'download' ];
const mongoActions = [ 'insert', 'search', 'update', 'destroy', 'getGUID' ];
afterEach(() => {
    s3Actions.forEach(( action ) => {
        s3[action].restore();
    });
    mongoActions.forEach(( action ) => {
        mongo[action].restore();
    });
});

describe( 'Top-level FS API', () => {
    it( 'should expose read', () => {
        expect( index.read ).to.be.a.function;
    });

    it( 'should expose search', () => {
        expect( index.search ).to.be.a.function;
    });

    it( 'should expose inspect', () => {
        expect( index.inspect ).to.be.a.function;
    });

    it( 'should expose download', () => {
        expect( index.download ).to.be.a.function;
    });

    it( 'should expose create', () => {
        expect( index.create ).to.be.a.function;
    });

    it( 'should expose bulk', () => {
        expect( index.bulk ).to.be.a.function;
    });

    it( 'should expose copy', () => {
        expect( index.copy ).to.be.a.function;
    });

    it( 'should expose update', () => {
        expect( index.update ).to.be.a.function;
    });

    it( 'should expose move', () => {
        expect( index.move ).to.be.a.function;
    });

    it( 'should expose rename', () => {
        expect( index.rename ).to.be.a.function;
    });

    it( 'should expose destroy', () => {
        expect( index.destroy ).to.be.a.function;
    });
});

describe( 'FS OPERATIONS:', () => {
    describe( 'read()', () => {
        it( 'should call into mongo.getGUID(), then s3.read() when given a path', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';

            index.read( path + resource, userId );

            expect( mongoGetGUIDSpy ).to.be.calledOnce;
            expect( mongoGetGUIDSpy ).to.be.calledWithExactly( path + resource, userId );
            expect( mongoGetGUIDSpy ).to.be.calledBefore( s3ReadSpy );

            expect( s3ReadSpy ).to.be.calledOnce;
            expect( s3ReadSpy ).to.be.calledWithExactly( mongoGetGUIDSpy.returnValues[ 0 ]);
            expect( s3ReadSpy ).to.be.calledAfter( mongoGetGUIDSpy );
        });
    });

    describe( 'search() ', () => {
        it( 'should call into mongo.search()', () => {
            const path = '/valid/path/here/';
            const query = '*';
            const sort = null;
            const flags = [];

            index.search( path, userId, query, sort, flags );

            expect( mongoSearchSpy ).to.be.calledOnce;
            expect( mongoSearchSpy ).to.be.calledWithExactly({ parent: path, userId: userId }, null );
        });

        it( 'should default to shallow searching', () => {
            expect( false ).to.be.true;
        });

        it( 'should allow deep searching when passed in the -r flag', () => {
            expect( false ).to.be.true;
        });
    });

    describe( 'inspect() ', () => {
        it( 'should call into mongo.search()', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';
            const fields = null;

            index.inspect( path + resource, userId, fields );

            expect( mongoSearchSpy ).to.be.calledOnce;
            expect( mongoSearchSpy ).to.be.calledWithExactly({ parent: path, name: resource, userId: userId }, null );
        });

        it( 'should return all metadata fields by default', () => {
            expect( false ).to.be.true;
        });

        it( 'should return only the specified fields, if given a fields array', () => {
            expect( false ).to.be.true;
        });
    });

    describe( 'download() ', () => {
        it( 'should call into mongo.getGUID(), then s3.download()', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';
            const compressionType = 'zip';

            index.download( path + resource, userId, compressionType );

            expect( mongoGetGUIDSpy ).to.be.calledOnce;
            expect( mongoGetGUIDSpy ).to.be.calledWithExactly( path + resource, userId );
            expect( mongoGetGUIDSpy ).to.be.calledBefore( s3DownloadSpy );

            expect( s3DownloadSpy ).to.be.calledOnce;
            expect( s3DownloadSpy ).to.be.calledWithExactly( mongoGetGUIDSpy.returnValues[0], 'zip' );
            expect( s3DownloadSpy ).to.be.calledAfter( mongoGetGUIDSpy );
        });
    });

    // TODO: Determine the mongo implementation for adding a resource
    describe( 'create() ', () => {
        it( 'should call into mongo.getGUID(), s3.write(), then mongo.insert()', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';
            const content = 'this is a content string';

            index.create( path + resource, userId, content, [ ]);

            expect( mongoGetGUIDSpy ).to.be.calledOnce;
            expect( mongoGetGUIDSpy ).to.be.calledWithExactly( path + resource, userId );
            expect( mongoGetGUIDSpy ).to.be.calledBefore( s3WriteSpy );

            expect( s3WriteSpy ).to.be.calledOnce;
            expect( s3WriteSpy ).to.be.calledWithExactly( mongoGetGUIDSpy.returnValues[0], content );
            expect( s3WriteSpy ).to.be.calledBefore( mongoInsertSpy );

            expect( mongoInsertSpy ).to.be.calledOnce;
            expect( mongoInsertSpy ).to.be.calledWithExactly({ TODO: 'TODO' });
            expect( mongoInsertSpy ).to.be.calledAfter( s3WriteSpy );
        });

        it( 'should by default return an error when attempting to overwrite an existing resource', () => {
            expect( false ).to.be.true;
        });

        it( 'should overwriting an existing resource when passed the force flag', () => {
            expect( false ).to.be.true;
        });
    });

    // TODO: determine bulk work flow
    describe( 'bulk() ', () => {
        it( 'TODO: all of it', () => {
            expect( false ).to.be.true;
        });
    });

    // TODO: Determine the mongo implementation for copying a resource
    describe( 'copy() ', () => {
        it( 'should call into mongo.getGUID() for the resource, mongo.search() for the destination, then mongo.insert(), then mongo.update', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';
            const destination = '/new/valid/path/here/';
            const newGUID = 'abcde12345';

            index.copy( path + resource, userId, destination, [ ]);

            expect( mongoGetGUIDSpy ).to.be.calledOnce;
            expect( mongoGetGUIDSpy ).to.be.calledWithExactly( path + resource, userId );
            expect( mongoGetGUIDSpy ).to.be.calledBefore( mongoSearchSpy );

            expect( mongoSearchSpy ).to.be.calledOnce;
            expect( mongoSearchSpy ).to.be.calledWithExactly({ parent: destination, name: resource, userId: userId }, null );
            expect( mongoSearchSpy ).to.be.calledBefore( s3CopySpy );

            expect( s3CopySpy ).to.be.calledOnce;
            expect( s3CopySpy ).to.be.calledWithExactly( mongoGetGUIDSpy.returnValues[0], newGUID );
            expect( s3CopySpy ).to.be.calledBefore( mongoInsertSpy );

            expect( mongoInsertSpy ).to.be.calledOnce;
            expect( mongoInsertSpy ).to.be.calledWithExactly({ TODO: 'TODO' });
            expect( mongoInsertSpy ).to.be.calledBefore( mongoUpdateSpy );

            expect( mongoUpdateSpy ).to.be.calledOnce;
            expect( mongoUpdateSpy ).to.be.calledWithExactly({ parent: path, name: resource, userId: userId }, { lastUpdatedTime: Date.now() });
        });

        it( 'should throw an error if the destination already exists, and there is no -u or -f flag', () => {
            expect( false ).to.be.true;
        });

        it( 'should generate unique name if the destination already exists, and the -u flag is passed in', () => {
            expect( false ).to.be.true;
        });

        it( 'should overwrite the existing resource if it already exists, and the -f flag is passed in', () => {
            expect( false ).to.be.true;
        });

        it( 'should copy directories recursively, by default', () => {

        });
    });

    it( 'update() ', () => {
        it( 'should call into mongo.getGUID(), s3.write(), then mongo.update()', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';
            const content = 'this is a content string';

            index.update( path + resource, userId, content, [ ]);

            expect( mongoGetGUIDSpy ).to.be.calledOnce;
            expect( mongoGetGUIDSpy ).to.be.calledWithExactly( path + resource, userId );
            expect( mongoGetGUIDSpy ).to.be.calledBefore( s3WriteSpy );

            expect( s3WriteSpy ).to.be.calledOnce;
            expect( s3WriteSpy ).to.be.calledWithExactly( mongoGetGUIDSpy.returnValues[0], content );
            expect( s3WriteSpy ).to.be.calledBefore( mongoUpdateSpy );

            expect( mongoUpdateSpy ).to.be.calledOnce;
            expect( mongoUpdateSpy ).to.be.calledWithExactly({ parent: path, userId: userId }, { lastUpdatedTime: Date.now() });
        });

        it( 'should by default return an error when attempting to update a nonexistant resource', () => {

        });

        it( 'should create a new resource if one does not exist, when passed the -f flag', () => {

        });
    });

    // TODO: Determine the mongo implementation for copying a resource
    describe( 'move() ', () => {
        it( 'should call into mongo.search() for the resource and for the destination, then mongo.update()', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';
            const destination = '/new/valid/path/here/';

            index.move( path + resource, userId, destination, [ ]);

            expect( mongoSearchSpy ).to.be.calledTwice;
            expect( mongoSearchSpy.getCall( 0 )).to.be.calledWithExactly({ parent: path, name: resource, userId: userId }, null );
            expect( mongoSearchSpy.getCall( 1 )).to.be.calledWithExactly({ parent: destination, name: resource, userId: userId }, null );
            expect( mongoSearchSpy.getCall( 1 )).to.be.calledBefore( mongoUpdateSpy );

            expect( mongoUpdateSpy ).to.be.calledOnce;
            expect( mongoUpdateSpy ).to.be.calledWithExactly({ parent: path, userId: userId }, { path: destination, lastUpdatedTime: Date.now() });
        });

        it( 'should throw an error if the destination already exists, and there is no -f flag', () => {
            expect( false ).to.be.true;
        });

        it( 'should overwrite the existing resource if it already exists, and the -f flag is passed in', () => {
            expect( false ).to.be.true;
        });

        it( 'should move directories recursively by default', () => {
            expect( false ).to.be.true;
        });
    });

    describe( 'rename() ', () => {
        it( 'should call into mongo.search() for the resource and for renamed version, then mongo.update()', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';
            const name = 'renamed.txt';

            index.rename( path + resource, userId, name, [ ]);

            expect( mongoSearchSpy ).to.be.calledTwice;
            expect( mongoSearchSpy.getCall( 0 )).to.be.calledWithExactly({ parent: path, name: resource, userId: userId }, null );
            expect( mongoSearchSpy.getCall( 1 )).to.be.calledWithExactly({ parent: path, name: name, userId: userId }, null );
            expect( mongoSearchSpy.getCall( 1 )).to.be.calledBefore( mongoUpdateSpy );

            expect( mongoUpdateSpy ).to.be.calledOnce;
            expect( mongoUpdateSpy ).to.be.calledWithExactly({ parent: path, name: resource, userId: userId }, { name: name, lastUpdatedTime: Date.now() });
        });

        it( 'should throw an error if the renamed resource already exists, and there is no -f flag', () => {
            expect( false ).to.be.true;
        });

        it( 'should overwrite the existing renamed resource if it already exists, and the -f flag is passed in', () => {
            expect( false ).to.be.true;
        });
    });

    describe( 'destroy() ', () => {
        it( 'should call into mongo.getGUID(), s3.destroy() then mongo.destroy()', () => {
            const path = '/valid/path/here/';
            const resource = 'test.txt';

            index.destroy( path + resource, userId );

            expect( mongoGetGUIDSpy ).to.be.calledOnce;
            expect( mongoGetGUIDSpy ).to.be.calledWithExactly( path + resource, userId );
            expect( mongoGetGUIDSpy ).to.be.calledBefore( s3DestroySpy );

            expect( s3DestroySpy ).to.be.calledOnce;
            expect( s3DestroySpy ).to.be.calledWithExactly( mongoGetGUIDSpy.returnValues[ 0 ]);
            expect( s3DestroySpy ).to.be.calledBefore( mongoDestroySpy );

            expect( mongoDestroySpy ).to.be.calledOnce;
            expect( mongoDestroySpy ).to.be.calledWithExactly({ parent: path, name: resource, userId: userId });
        });

        it( 'should return error INVALID_RESOURCE when there is no resource to destroy', () => {
            expect( false ).to.be.true;
        });

        it( 'should destroy directories recursively by default', () => {
            expect( false ).to.be.true;
        });
    });
});
