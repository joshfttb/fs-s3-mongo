'use strict';

/* eslint-env mocha */
/* eslint new-cap: 0 */
// todo: remove this after finishing tests
/* eslint no-unused-vars: 0 */

const chai = require( 'chai' );
const expect = chai.expect;
const chaiaspromised = require( 'chai-as-promised' );
const sinonchai = require( 'sinon-chai' );
// only needed for dynamic generator
// const faker = require( 'faker' );
const mime = require( 'mime' );
const mongoose = require( 'mongoose' );
const Meta = require( '/schemas/metaDataSchema.js' );
const File = require( '/schemas/fileSchema.js' );
const Permissions = require( '/schemas/permissionSchema.js' );
const mongo = require( '../src/mongo.js' );

chai.use( sinonchai );
chai.use( chaiaspromised );

/*
TOP LEVEL OPERATIONS TO MONGO OPERATIONS
read -> verify,
search -> search, verify
inspect -> ?,
write -> verify and create,
copy - verify, return, create,
update - verify and update,
move -> verify, create, destroy,
rename -> verify, update,
destroy -> verify, destroy

NEEDED MONGO TOP LEVEL OPS
Search
Verify
Create
Update
Destroy
 */

/* GENERATORS
const pathGenerator = function pathGenerator( name, type ) {
    let path = [];
    const pathDepth = faker.random.number({ min: 1, max: 8 });
    for ( let i = 0; i < pathDepth; i++ ) {
        if ( i === pathDepth ) {
            const filetypes = [
                'txt',
                'png',
                'jpg',
                'pdf',
                'css',
                'html',
                'mp4',
            ];
            path = path.push(
                name || faker.lorem.words()[0] +
                '.' +
                type || faker.random.arrayElement( filetypes )
            );
        }
        else {
            path = path.push( faker.lorem.words()[0]);
        }
    }
    return path;
};

const generatePermissions = function generatePermissions( meta, read, write, destroy, manage, userId ) {
    let permissions;
    permissions = new Permissions({
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
        userId,
        groupId: null, // if applies to group
        read,
        write,
        destroy,
        // share: [String], add additional user with default permissions for collaboration
        manage, // update/remove existing permissions on resource
    });
    permissions.save();
};

const generateMeta = function generateMeta( name, type, read, write, destroy, manage, userId ) {
    let meta;
    let userIdVar;
    let parent;
    userIdVar = userId || mongoose.Types.ObjectId();
    pathGenerator( name, type ).forEach(( value, index, array ) => {
        meta = new Meta({
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
            size: faker.random.number({ min: 11111111, max: 9999999999 }), // in bytes
            dateCreated: faker.date.past(), // https://docs.mongodb.org/v3.0/reference/method/Date/
            lastModified: faker.date.recent(), // https://docs.mongodb.org/v3.0/reference/method/Date/
            get children() {
                if ( index !== array.length ) {
                    return array[index + 1];
                }
            },
        });
        meta.save();
        generatePermissions( meta, true, true, true, true, userId );
        parent = array.join( '/' ).slice( 0, index - 1 );
    });
    return { metaId: meta.id, mimeType: meta.mimeType, parent, userId: userIdVar };
};


const generateFile = function generateFile( meta, name ) {
    let file;
    file = new File({
        metaDataId: meta.metaId, // link to METADATA
        userId: meta.userId, // link to User Collection
        get name() {
            let nameVar;
            if ( meta.mimeType === 'folder' ) {
                nameVar = pathGenerator( name );
                nameVar += '/';
            }
            else {
                nameVar = pathGenerator( name, mime.extension( meta.mimeType ));
            }
            return nameVar;
        },
        parent: meta.parent,  // '/top/mid/'
    });
    file.save();
    return file;
};

// export our test functions jik we need them elsewhere
module.exports = {
    generateMeta,
    generatePermissions,
    generateFile,
};
 ***/
// HARDCODED FIXTURE VERSION
// create the path
const path = ['level1', 'level2', 'level3', test.txt];
// stub the userid
const userId = mongoose.Types.ObjectId();

// create the meta and permissions
const insertFixture = function insertFixture( pathVar, userIdVar ) {
    // for each level:
    pathVar.forEach(( value, index, array ) => {
        // create the meta
        const meta = new Meta({
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
        meta.save();
        // create the permission record
        const permissions = new Permissions({
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
            userIdVar,
            groupId: null, // if applies to group
            read: true,
            write: true,
            destroy: true,
            // share: [String], add additional user with default permissions for collaboration
            manage: true, // update/remove existing permissions on resource
        });
        permissions.save();
        // create the file record
        const file = new File({
            metaDataId: meta.id, // link to METADATA
            userId: userIdVar, // link to User Collection
            get name() {
                return array.join( '/' ).slice( 0, index );
            },
            get parent() {
                return array.join( '/' ).slice( 0, index - 1 );
            },
        });
        file.save();
        return file;
    });
};

describe( 'mongo top-level operations', () => {
    beforeEach( function beforeEach() {
        insertFixture( path, userId );
    });

    afterEach( function afterEach() {
        // make an array of all test meta ids
        let ids;
        ids = Meta.find({ guid: 'TESTDATA' }).fetch();
        ids = ids.map( function mapId( item ) {
            return item._id;
        });
        // now remove all the things
        Meta.remove({ _id: { $in: ids } });
        Permissions.remove({ resourceId: { $in: ids } });
        File.remove({ metaDataId: { $in: ids } });
    });


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
                expect( mongo.search({ name: 'test.txt' })).not.to.be.null();
            });
        // by size
            it( 'should find files by size', () => {
                expect( mongo.search({ size: { min: 11111111, max: 22222222 } })).not.to.be.null();
            });
        // created by date (min / max, use moment?)
            it( 'should find files by date created', () => {
                expect( mongo.search({
                    created: {
                        before: Date.now(),
                        after: Date.now() - 60000,
                    },
                })).not.to.be.null();
            });
        // verified by date (min / max, use moment?)
            it( 'should find files by date modified', () => {
                expect( mongo.search({
                    modified: {
                        before: Date.now(),
                        after: Date.now() - 60000,
                    },
                })).not.to.be.null();
            });
        // by user
            it( 'should find files by user', () => {
                expect( mongo.search({ userId: 'test.txt' })).not.to.be.null();
            });
        });
    });

    describe( 'verify', () => {
        const rejectUser = mongoose.Types.ObjectId();
        it( 'should allow reading a file with correct permissions', () => {
            expect( mongo.verify( userId, 'read', '/level1/level2/level3/test.txt' )).to.be.fulfilled();
        });
        it( 'should reject reading a file with correct permissions', () => {
            expect( mongo.verify( rejectUser, 'read', '/level1/level2/level3/test.txt' ))
                .to.be.rejectedWith( 'user does not have read permissions on this object' );
        });
        it( 'should allow updating a file with correct permissions', () => {
            expect( mongo.verify( userId, 'update', '/level1/level2/level3/test.txt' )).to.be.fulfilled();
        });
        it( 'should reject updating a file with correct permissions', () => {
            expect( mongo.verify( rejectUser, 'update', '/level1/level2/level3/test.txt' ))
                .to.be.rejectedWith( 'user does not have write permissions on this object' );
        });
        it( 'should allow destroying a file with correct permissions', () => {
            expect( mongo.verify( userId, 'destroy', '/level1/level2/level3/test.txt' )).to.be.fulfilled();
        });
        it( 'should reject destroying a file with correct permissions', () => {
            expect( mongo.verify( rejectUser, 'destroy', '/level1/level2/level3/test.txt' ))
                .to.be.rejectedWith( 'user does not have write permissions on this object' );
        });
        /*
        it( 'should allow changing permissions on a file with correct permissions', () => {
            expect( mongo.verify( userId, 'updatePermissions', '/level1/level2/level3.test.txt' )).to.be.fulfilled();
        });
        it( 'should reject changing permissions on a file with incorrect permissions', () => {
            expect( mongo.verify( rejectUser, 'updatePermissions', '/level1/level2/level3/test.txt' ))
                .to.be.rejectedWith( 'user does not have write permissions on this object' );
        });
        */
        it( 'should allow insertion of a file with correct permissions on the parent folder', () => {
            expect( mongo.verify( userId, 'write', '/level1/level2/permissions1.txt' )).to.be.fulfilled();
        });
        it( 'should reject insertion of a file with correct permissions on the parent folder', () => {
            expect( mongo.verify( rejectUser, 'write', '/level1/level2/permissions2.txt' ))
                .to.be.rejectedWith( 'user does not have write permissions on this object' );
        });
        // should not treat a file as a folder
        it( 'not allow insertion of a file into another file', () => {
            expect( mongo.verify( userId, 'write', '/level1/level2/level3/test.txt/nestedTest.txt' ))
                .to.be.rejectedWith( 'tried to add object to file' );
        });
        // should not create a duplicate file
        it( 'not allow insertion of a file into another file', () => {
            expect( mongo.verify( userId, 'write', '/level1/level2/level3/test.txt' ))
                .to.be.rejectedWith( 'object already exists at that path' );
        });
    });

    describe( 'create', () => {

    });

    describe( 'update', () => {

    });

    describe( 'destroy', () => {
        // if meta has multiple files, should only destroy the file and permission record
        // if meta has no other files, should remove meta record
    });
});
