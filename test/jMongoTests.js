'use strict';

/* eslint-env mocha */
/* eslint new-cap: 0 */
// todo: remove this after finishing tests
/* eslint no-unused-vars: 0 */

const chai = require( 'chai' );
const expect = chai.expect;
const chaiaspromised = require( 'chai-as-promised' );
const sinonchai = require( 'sinon-chai' );
const faker = require( 'faker' );
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
(verify always includes return guid or fail)
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

describe( 'mongo top-level operations', () => {
    beforeEach( function beforeEach() {

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
        it( 'should find a file by various fields', () => {

        });
    });

    describe( 'verify', () => {
    });

    describe( 'create', () => {
    });

    describe( 'update', () => {
    });

    describe( 'destroy', () => {
    });
});
