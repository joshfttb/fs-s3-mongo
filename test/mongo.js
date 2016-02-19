
'use strict';

/* eslint-env mocha */
/* eslint new-cap: 0 */
/* eslint no-unused-expressions: 0 */
// todo: remove this after finishing tests
/* eslint no-unused-vars: 0 */
/* eslint no-shadow: 0 */

const chai = require( 'chai' );
const expect = chai.expect;
const chaiaspromised = require( 'chai-as-promised' );
const sinonchai = require( 'sinon-chai' );
const mime = require( 'mime' );
const mongoose = require( 'mongoose' );
const mongo = require( '../src/index.js' );
const File = mongo.schema.file;

chai.use( sinonchai );
chai.use( chaiaspromised );

// HARDCODED FIXTURE VERSION
// create the path
const path = [ 'level1', 'level2', 'level3', 'test.txt' ];
// stub the userid
const userId = new mongoose.Types.ObjectId();

// create the meta and permissions
const insertFixture = function insertFixture( pathVar ) {
    // for each level:
    const promises = pathVar.map(( value, index, array ) => {
        // create the file
        const file = new File({
            _id: 'TESTDATA',
            get mimeType() {
                let mimeVar;
                if ( index === array.length ) {
                    mimeVar = mime.lookup( value.split( '.' ).pop());
                }
                else {
                    mimeVar = 'folder';
                }
                return mimeVar;
            },
            size: 12345678,
            dateCreated: new Date(), // https://docs.mongodb.org/v3.0/reference/method/Date/
            lastModified: new Date(), // https://docs.mongodb.org/v3.0/reference/method/Date/
            get parents() {
                if ( index !== 0 ) {
                    return array[index];
                }
            },
            get name() {
                let name;
                if ( array.length === index + 1 ) {
                    name = array.join( '/' );
                }
                else {
                    name = array.slice( 0, index + 1 ).join( '/' ) + '/';
                }
                return name;
            },
        });
        return File.save();
    });
    return Promise.all( promises );
};


describe( 'mongo-wrapper', () => {
    beforeEach( function beforeEach( done ) {
        return insertFixture( path )
            .then(() => {
                done();
            })
            .catch(( e ) => {
                throw ( e );
            });
    });


    afterEach( function afterEach( done ) {
        // make an array of all test meta ids
        let ids;
        File.find({ guid: 'TESTDATA' }).exec()
            .then(( docs ) => {
                ids = docs.map( function mapId( item ) {
                    return item._id;
                });
                const p1 = Permissions.remove({ resourceId: { $in: ids } }).exec();
                const p2 = File.remove({ metaDataId: { $in: ids } }).exec();
                // now remove all the things
                return Promise.all([ p1, p2 ]);
            })
            .then(() => {
                done();
            })
            .catch(( e ) => {
                throw ( e );
            });
    });

    const userId = userId.toString();
    describe( 'search', () => {
        describe( 'should find a file by various fields', () => {
            // by file name
            // todo: change this
            const numFiles = 1;

            it( 'should find files by name', () => {
                const searchObj = { name: 'test.txt' };

                return expect( mongo.search( searchObj )).to.be.fulfilled
                    .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( numFiles );
            });

            // by size
            it( 'should find files by size', () => {
                const searchObj = { size: { min: 11111111, max: 22222222 } };

                return expect( mongo.search( searchObj )).to.be.fulfilled
                    .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( numFiles );
            });

            // created by date (min / max, use moment?)
            it( 'should find files by date created', () => {
                const searchObj = { created: { before: Date.now(), after: Date.now() - 60000 } };

                return expect( mongo.search( searchObj )).to.be.fulfilled
                    .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( numFiles );
            });

            // verified by date (min / max, use moment?)
            it( 'should find files by date modified', () => {
                const searchObj = { modified: { before: Date.now(), after: Date.now() - 60000 } };

                return expect( mongo.search( searchObj )).to.be.fulfilled
                    .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( numFiles );
            });

            // by user
            it( 'should find files by user', () => {
                const searchObj = userId;

                return expect( mongo.search( searchObj )).to.be.fulfilled
                    .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( numFiles );
            });

            it( 'should find and sort when given a sort object', () => {
                const searchObj = { name: 'test.txt' };
                const sortObj = { name: 1 };

                // todo: need to make the data to support this
                const files = [];

                return expect( mongo.search( searchObj, sortObj )).to.be.fulfilled
                    .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.deep.equal( files );
            });

            it( 'should resolve with an empty array when given a valid search object that doesn\'t match anything', () => {
                const searchObj = { name: 'test.txt' };
                return expect( mongo.search( searchObj )).to.be.fulfilled
                    .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( 0 );
            });
        });
    });

    describe( 'create', () => {
        // userId, path, guid

        let fileRec;
        const fullPath = '/level1/l2branch/l3branch/created.txt';
        const guid = 'TESTDATA';
        it( 'should create the file record return SUCCESS on a successful creation', () => {
            fileRec = () => {
                return expect( mongo.create( userId, fullPath, guid )).to.be.fulfilled
                    .and.to.not.be.null
                    .and.eventually.have.property( 'status', 'SUCCESS' );
            };
        });

        it( 'should create the file and related records', () => {
            return Promise.all([
                expect( File.findOne({ _id: guid }).exec()).to.eventually.not.be.null,
                expect( Permissions.findOne({ resourceId: fileRec.metaDataId }).exec()).to.eventually.not.be.null,
            ]);
        });
        it( 'should create the in-between folders', () => {
            return Promise.all([
                expect( File.findOne({ name: '/level1/l2branch/' }).exec()).to.not.be.null,
                expect( File.findOne({ name: '/level1/l2branch/l3branch/' }).exec()).to.not.be.null,
            ]);
        });
    });
    // todo: add a test for the tupe of update we're doing now

    describe( 'copy', () => {
        // userId, old path, new path
        const oldPath = '/level1/level2/level3/test.txt';
        const newPath = '/copylevel/copy.txt';
        let oldFile;
        it( 'should respond with success on a successful copy', () => {
            return expect( mongo.copy( userId, oldPath, newPath )).to.be.fulfilled
                .and.eventually.have.property( 'status', 'SUCCESS' );
        });
        it( 'the old file should still exist', () => {
            oldFile = () => {
                return expect( File.findOne({ name: oldPath }).exec()).to.not.be.null;
            };
        });
        it( 'the file should exist at the new path with the same metaDataId', () => {
            return expect( File.findOne({ name: newPath }).exec()).to.be.fulfilled
                .and.eventually.have.property( 'metaDataId', oldFile.metaDataId );
        });
    });
    describe( 'move', () => {
        // a rename is also a move
        // userId, old path, new path
        const oldPath = '/level1/level2/level3/test.txt';
        const newPath = '/movelevel/move.txt';
        let oldFile;
        it( 'should respond with success on a successful move', () => {
            return expect( mongo.move( userId, oldPath, newPath )).to.be.fulfilled
                .and.eventually.have.property( 'status', 'SUCCESS' );
        });
        it( 'the old file should not exist', () => {
            oldFile = () => {
                return expect( File.findOne({ name: oldPath }).exec()).to.eventually.be.null;
            };
        });
        it( 'the file should exist at the new path with the same metaDataId', () => {
            return expect( File.findOne({ name: newPath }).exec()).to.be.fulfilled
                .and.eventually.have.property( 'metaDataId', oldFile.metaDataId );
        });
    });
    describe( 'destroy', () => {
        // todo: this needs to be re-written to work with the new schema
        let fileRec;
        let metaId;
        const fileToDelete = '/level1/branch1/deleteme.txt';
        const parentToDelete = '/level1/branch1';
        before(( done ) => {
            const file = new File({
                metaDataId: metaId, // link to METADATA
                userId, // link to User Collection
                name: fileToDelete,
                parent: parentToDelete,
            });
            file.save()
            .then(() => {
                done();
            });
        });
        it( 'should respond with success on a successful delete', () => {
            return expect( mongo.destroy( userId, fileToDelete )).to.be.fulfilled
                .and.eventually.have.property( 'status', 'SUCCESS' );
        });
        // todo: this makes no sense, should be deleting children
        it( 'should only destroy the file record and intervening records', () => {
            return Promise.all([
                expect( File.findOne({ name: fileToDelete }).exec()).to.eventually.be.null,
                expect( File.findOne({ name: parentToDelete }).exec()).to.eventually.be.null,
            ]);
        });

        it( 'should also destroy the meta if there are no other file entries for the deleted file\'s meta', () => {
            mongo.destroy( userId, '/level1/level2/level3/test.txt' );
            return Promise.all([
                expect( File.findOne({ name: '/level1/level2/level3/test.txt' }).exec()).to.eventually.be.null,
            ]);
        });
    });
});
