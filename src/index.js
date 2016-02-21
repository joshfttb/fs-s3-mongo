'use strict';

/* eslint no-unused-vars: 0 */
/* eslint no-else-return: 0 */

const mongo = require( './mongo.js' );
const s3 = require( './s3.js' );
const utils = require( './utils.js' );
const File = require( './schemas/fileSchema.js' );
const brinkbitPermissions = require( 'brinkbit-permissions' );
const verify = brinkbitPermissions.verify;
const connect = brinkbitPermissions.connect;

module.exports.schema = {
    file: File,
};

module.exports.alias = function alias( fullPath, operation ) {
    let lastGuid;
    const promises = [];
    connect
    .then(() => {
        // split the path
        const pathArray = fullPath.split( '/' );
        pathArray.forEach(( value, index, array ) => {
            const currentPath = array.slice( 0, index ).join( '/' );
            // determine that the path exists, has the correct parent, and is a folder
            File.findOne({ $and: [{ name: currentPath }, { parents: lastGuid }, { mimeType: 'folder' }] }).exec()
                .then(( file ) => {
                    // if there is no resource, and this is not the end of the path, we have a problem
                    if ( !file && index < array.length ) {
                        return Promise.reject( 'RESOURCE_NOT_FOUND' );
                    }
                    // if this is the end of the path, and the resource does not exist, that's a problem for read and modify operations
                    else if ( !file && index < array.length
                        && (
                            operation === 'read' ||
                            operation === 'update' ||
                            operation === 'destroy'
                        )) {
                        return Promise.reject( 'RESOURCE_NOT_FOUND' );
                    }
                    // if this is the end of the path, and the resource does exist, that's a problem for write operations
                    else if ( file && index < array.length && operation === 'write' ) {
                        return Promise.reject( 'RESOURCE_EXISTS' );
                    }
                    // if there is a file
                    else {
                        // store the guid
                        lastGuid = file._id;
                        // and send it to the map
                        promises.push( verify( lastGuid, operation ));
                    }
                });
            // todo: need to do a promise.all of guids into verify, and .then won't work in a map will it?
        });
    })
    .then(() => {
        Promise.all( promises );
    })
    .then(() => {
        Promise.resolve( lastGuid );
    })
    .catch(( e ) => {
        Promise.reject( e );
    });
};

module.exports.read = function read( path ) {
    return s3.read( path )
    .catch( utils.handleError );
};

module.exports.search = function search( searchObj ) {
    return mongo.search( searchObj )
    .catch( utils.handleError );
};

module.exports.write = function write( path, content ) {
    return s3.write( path, content )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then(( data ) => {
        mongo.update( path, data );
    })
    .catch( utils.handleError );
};

module.exports.update = function update( path, content ) {
    return s3.write( path, content )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then(( data ) => {
        mongo.update( path, data );
    })
    .catch( utils.handleError );
};

module.exports.copy = function copy( path, destination ) {
    return s3.copy( path, destination )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then(( data ) => {
        mongo.update( path, data );
    })
    .catch( utils.handleError );
};

module.exports.destroy = function destroy( path ) {
    return s3.destroy( path )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then( mongo.destroy )
    .catch( utils.handleError );
};
