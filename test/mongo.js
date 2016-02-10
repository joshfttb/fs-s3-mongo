
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
const brinkbitPermissions = require( 'brinkbit-permissions' );
const verify = brinkbitPermissions.verify;
const mongo = require( '../src/index.js' );
const File = mongo.schema.file;
const Meta = mongo.schema.meta;

chai.use( sinonchai );
chai.use( chaiaspromised );

// HARDCODED FIXTURE VERSION
// create the path
const path = [ 'level1', 'level2', 'level3', 'test.txt' ];
// stub the userid
const acceptUser = new mongoose.Types.ObjectId();
const rejectUser = new mongoose.Types.ObjectId();


// create the meta and permissions
const insertFixture = function insertFixture( pathVar ) {
    // for each level:
    const promises = pathVar.map(( value, index, array ) => {
        // create the meta
        let meta = new Meta({
            guid: 'TESTDATA', // s3 guid
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
            get children() {
                if ( index !== array.length ) {
                    return array[index + 1];
                }
            },
        });
        return meta.save()
            .then(( metaObj ) => {
                // overwrite meta with more meta
                meta = metaObj;
                // create the permission record for the good user
                const goodPermissions = new Permissions({
                    get resourceType() {
                        let resourceType;
                        if ( meta.mimeType === 'folder' ) {
                            resourceType = 'folder';
                        }
                        else {
                            resourceType = 'file';
                        }
                        return resourceType;
                    },  // project or file/folder and we can easily add additional resource types later
                    resourceId: meta.id, // links to metadata id or project id
                    appliesTo: 'user', // 'user', 'group', 'public'
                    userId: acceptUser,
                    groupId: null, // if applies to group
                    read: true,
                    write: true,
                    destroy: true,
                    // share: [String], add additional user with default permissions for collaboration
                    manage: true, // update/remove existing permissions on resource
                });
                const badPermissions = new Permissions({
                    get resourceType() {
                        let resourceType;
                        if ( meta.mimeType === 'folder' ) {
                            resourceType = 'folder';
                        }
                        else {
                            resourceType = 'file';
                        }
                        return resourceType;
                    },  // project or file/folder and we can easily add additional resource types later
                    resourceId: meta.id, // links to metadata id or project id
                    appliesTo: 'user', // 'user', 'group', 'public'
                    userId: rejectUser,
                    groupId: null, // if applies to group
                    read: false,
                    write: false,
                    destroy: false,
                    // share: [String], add additional user with default permissions for collaboration
                    manage: false, // update/remove existing permissions on resource
                });
                // create the good file record
                const goodFile = new File({
                    metaDataId: meta.id, // link to METADATA
                    userId: acceptUser, // link to User Collection
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
                    get parent() {
                        let parent;
                        parent = array.slice( 0, index ).join( '/' );
                        if ( parent ) parent += '/';
                        return parent;
                    },
                });
                const badFile = new File({
                    metaDataId: meta.id, // link to METADATA
                    userId: rejectUser, // link to User Collection
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
                    get parent() {
                        let parent;
                        parent = array.slice( 0, index ).join( '/' );
                        if ( parent ) parent += '/';
                        return parent;
                    },
                });
                return Promise.all([
                    goodPermissions.save(),
                    badPermissions.save(),
                    goodFile.save(),
                    badFile.save(),
                ]);
            })
            .catch(( e ) => {
                return Promise.reject( e );
            });
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
        Meta.find({ guid: 'TESTDATA' }).exec()
            .then(( docs ) => {
                ids = docs.map( function mapId( item ) {
                    return item._id;
                });
                const p1 = Meta.remove({ _id: { $in: ids } }).exec();
                const p2 = Permissions.remove({ resourceId: { $in: ids } }).exec();
                const p3 = File.remove({ metaDataId: { $in: ids } }).exec();
                // now remove all the things
                return Promise.all([ p1, p2, p3 ]);
            })
            .then(() => {
                done();
            })
            .catch(( e ) => {
                throw ( e );
            });
    });

    const userId = acceptUser.toString();
    describe( 'search', () => {
        describe( 'should find a file by various fields', () => {
        /* search operations
            name -> file
            size -> meta
            created -> meta
            modified -> meta
            user -> file
            group -> permissions
        */
        // by file name
            it( 'should find files by name', () => {
                return expect( mongo.search({ name: 'test.txt' })).not.to.be.null;
            });
        // by size
            it( 'should find files by size', () => {
                return expect( mongo.search({ size: { min: 11111111, max: 22222222 } })).not.to.be.null;
            });
        // created by date (min / max, use moment?)
            it( 'should find files by date created', () => {
                return expect( mongo.search({
                    created: {
                        before: Date.now(),
                        after: Date.now() - 60000,
                    },
                })).not.to.be.null;
            });
        // verified by date (min / max, use moment?)
            it( 'should find files by date modified', () => {
                return expect( mongo.search({
                    modified: {
                        before: Date.now(),
                        after: Date.now() - 60000,
                    },
                })).not.to.be.null;
            });
        // by user
            it( 'should find files by user', () => {
                return expect( mongo.search({ userId })).not.to.be.null;
            });
            it( 'should not return results user does not have access to', () => {

            });
        });
    });

    describe( 'getGUID', () => {
    });

    describe( 'insert', () => {
        // userId, path, guid
        let fileRec;
        before(( done ) => {
            mongo.create( userId, '/level1/l2branch/l3branch/created.txt', 'TESTDATA' )
                .then(() => {
                    fileRec = File.findOne({ name: '/level1/l2branch/l3branch/created.txt' });
                    done();
                });
        });
        it( 'should create the file and related records', () => {
            return Promise.all([
                expect( fileRec ).to.not.be.null,
                expect( Meta.findOne({ _id: fileRec.metaDataId })).to.not.be.null,
                expect( Permissions.findOne({ resourceId: fileRec.metaDataId })).to.not.be.null,
            ]);
        });
        it( 'should create the in-between folders', () => {
            return Promise.all([
                expect( File.findOne({ name: '/level1/l2branch/' })).to.not.be.null,
                expect( File.findOne({ name: '/level1/l2branch/l3branch' })).to.not.be.null,
            ]);
        });
    });

    // we don't need an update test, because we will either be updating the permissions or the file path
    describe( 'updatePermissions', () => {

    });

    describe( 'copy', () => {
        let oldFile;
        let newFile;
        // userId, old path, new path
        before(() => {
            mongo.copy( userId, '/level1/level2/level3/test.txt', '/copylevel/copy.txt' );
            oldFile = File.findOne({ name: '/level1/level2/level3/test.txt' });
            newFile = File.findOne({ name: '/copylevel/copy.txt' });
        });
        it( 'the old file should still exist', () => {
            return expect( oldFile ).to.not.be.null;
        });
        it( 'the file should exist at the new path with the same metaDataId', () => {
            return expect( newFile.metaDataId ).to.equal( oldFile.metaDataId );
        });
    });

    describe( 'move', () => {
        // userId, old path, new path
        const oldFileMetaId = File.findOne({ name: '/level1/level2/level3/test.txt' }).metaDataId;
        let oldFile;
        let newFile;
        before(() => {
            mongo.move( userId, '/level1/level2/level3/test.txt', '/movelevel/move.txt' );
            oldFile = File.findOne({ name: '/level1/level2/level3/test.txt' });
            newFile = File.findOne({ name: '/copylevel/copy.txt' });
        });
        it( 'the old file should not exist', () => {
            return expect( oldFile ).to.be.null;
        });
        it( 'the file should exist at the new path with the same metaDataId', () => {
            return expect( newFile.metaDataId ).to.equal( oldFile.metaDataId );
        });
    });

    describe( 'destroy', () => {
        let fileRec;
        let meta;
        before(() => {
            fileRec = File.findOne({ name: '/level1/level2/level3/test.txt' });
            meta = Meta.findOne({ _id: fileRec.metaDataId });
            const file = new File({
                metaDataId: meta.id, // link to METADATA
                userId, // link to User Collection
                name: '/level1/branch1/linkedrecord.txt',
                parent: '/level1/branch1/',
            });
            file.save();
        });
        // if meta has multiple files, should only destroy file record
        it( 'should only destroy the file record and intervening records', () => {
            mongo.destroy( userId, '/level1/branch1/linkedrecord.txt' );
            return Promise.all([
                expect( File.findOne({ name: '/level1/branch1/linkedrecord.txt' })).to.be.null,
                expect( File.findOne({ name: '/level1/branch1/' })).to.be.null,
                expect( Meta.findOne({ _id: fileRec.metaDataId })).to.not.be.null,
            ]);
        });
        // if meta has no other files, should remove meta record
        it( 'should also destroy the meta if there are no other file entries for one meta', () => {
            mongo.destroy( userId, '/level1/level2/level3/test.txt' );
            return Promise.all([
                expect( File.findOne({ name: '/level1/level2/level3/test.txt' })).to.be.null,
                expect( Meta.findOne({ _id: fileRec.metaDataId })).to.be.null,
            ]);
        });
    });

    it( 'should resolve with an array of resources when given a valid search object', () => {
        const searchObj = { id: 12345 };

        // TODO: Figure out proper number
        const numFiles = 4;

        return expect( mongo.search( searchObj )).to.be.fulfilled
            .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( numFiles );
    });

    it( 'should resolve with an array of sorted resources when given a search object and sorting parameters', () => {
        const searchObj = { id: 12345 };
        const sorting = 'alphabetical';

        // TODO: Figure out files
        const files = [ 'a.txt', 'b.txt', 'c.gif' ];

        return expect( mongo.search( searchObj, sorting )).to.be.fulfilled
            .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.deep.equal( files );
    });

    it( 'should resolve with an empty array when given a valid search object that doesn\'t match anything', () => {
        const searchObj = { id: null };

        return expect( mongo.search( searchObj )).to.be.fulfilled
            .and.eventually.have.property( 'data' ).to.be.instanceof( Array ).and.have.length( 0 );
    });

    it( 'should resolve with SUCCESS when updating with a valid search object and update object', () => {
        const searchObj = { id: 12345 };
        const updateObj = { metaData: 'someData' };

        return expect( mongo.update( searchObj, updateObj )).to.be.fulfilled
            .and.eventually.have.property( 'status', 'SUCCESS' );
    });

    it( 'should reject with 409/invalid resource attempting to update with an invalid object', () => {
        const searchObj = { id: null };
        const updateObj = { metaData: 'someData' };

        return expect( mongo.update( searchObj, updateObj )).to.be.rejected
            .and.eventually.deep.equal({
                code: 404,
                message: 'Resource does not exist.',
            });
    });

    it( 'should resolve with SUCCESS when deleting with a valid search object', () => {
        const searchObj = { id: 12345 };

        return expect( mongo.destroy( searchObj )).to.be.fulfilled
            .and.eventually.have.property( 'status', 'SUCCESS' );
    });

    it( 'should reject with 409/invalid resource attempting to delete with an invalid object', () => {
        const searchObj = { id: 12345 };

        return expect( mongo.destroy( searchObj )).to.be.rejected
            .and.eventually.deep.equal({
                code: 404,
                message: 'Resource does not exist.',
            });
    });
});
