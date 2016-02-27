'use strict';

/* eslint no-unused-vars: 0 */
/* eslint no-else-return: 0 */

const utils = require( './utils.js' );
const File = require( '../src/schemas/fileSchema.js' );
const permissions = require( 'fs-brinkbit-permisions' );

const mongoose = require( 'mongoose' );
const conn = mongoose.connection;
mongoose.Promise = Promise;

module.exports.connect = function mongoConnect() {
    return new Promise(( resolve, reject ) => {
        // check to see if we're already connected
        if ( conn.readyState === 1 ) {
            // if so, begin
            resolve();
        }
        // if not, connect
        else {
            let mongoAddress;
            if ( process.env.NODE_ENV === 'development' ) {
                mongoAddress = 'mongodb://' + process.env.IP + ':27017';
            }
            else {
                mongoAddress = 'mongodb://localhost:27017';
            }

            mongoose.connect( mongoAddress );
            conn.on( 'error', ( err ) => {
                reject( err );
            });

            conn.on( 'connected', () => {
                resolve();
            });
            // if this never resolves or errors, mongo might not be started.
        }
    });
};

module.exports.alias = function alias( fullPath, userId, operation ) {
    let lastGuid;
    const promises = [];
    permissions.connect()
        .then(() => {
            // split the path. for each part:
            fullPath.split( '/' ).unshift( userId ).forEach(( value, index, array ) => {
                // generate the current path
                const currentPath = array.slice( 0, index ).join( '/' );
                // determine that the path exists, has the correct parent, and is a folder
                // todo: the '/' on the end is going to be a problem
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
                        // if this is not the end of the path and the resource exists
                        else {
                            // store the guid
                            lastGuid = file._id;
                            // and send it to the map
                            promises.push( permissions.verify( userId, operation, lastGuid ));
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

module.exports.search = function search( pathObj ) {
    // TODO: hit mongo and search
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

module.exports.update = function update( pathObj, data ) {
    // TODO: hit mongo and update

    //

    return Promise.reject( 'NOT_IMPLEMENTED' );
};

module.exports.destroy = function destroy( pathObj ) {
    // TODO: hit mongo and delete

    return Promise.reject( 'NOT_IMPLEMENTED' );
};
