'use strict';

/* eslint no-unused-vars: 0 */
/* eslint no-loop-func: 0 */

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
    return new Promise(( resolve, reject ) => {
        const permissionQueries = [];
        const response = {};
        exports.connect()
            .then(() => {
                // split the path. for each part:
                const pathArray = fullPath.split( '/' );
                let queue = File.findOne({ name: userId }).exec();
                for ( let i = 0; i <= pathArray.length; i++ ) {
                    const name = pathArray[i];
                    const index = i - 1;
                    const array = pathArray;
                    queue = queue.then(( file ) => {
                        // if there is no resource, and this is not the end of the path, we have a problem
                        if ( !file && index !== array.length - 1 ) {
                            reject( 'RESOURCE_NOT_FOUND' );
                        }
                        // if this is the end of the path, and the resource does not exist, that's a problem for read and modify operations
                        else if ( !file
                            && index === array.length - 1
                            && (
                                operation === 'read' ||
                                operation === 'update' ||
                                operation === 'destroy'
                            )) {
                            reject( 'INVALID_RESOURCE_PATH' );
                        }
                        // if this is the end of the path, and the resource does exist, that's a problem for write operations
                        else if ( file
                            && index === array.length - 1
                            && operation === 'write' ) {
                            reject( 'RESOURCE_EXISTS' );
                        }
                        // if this is not the end of the path, and the resource is not a folder, that's a problem too
                        else if ( index !== array.length - 1
                            && file.mimeType !== 'folder' ) {
                            reject( 'INVALID_RESOURCE_PATH' );
                        }
                        else {
                            // as long as the file exists, send it to the array
                            // if it does not exist, and it has passed the tests above, no problem
                            // we'll just be checking all of the parents
                            if ( file ) {
                                // store the guid
                                response.guid = file._id;
                                // store if this is a parent to allow sanity check in other mongo ops
                                if ( index !== array.length ) {
                                    response.isParent = true;
                                }
                                else {
                                    response.isParent = false;
                                }
                                permissionQueries.push( permissions.verify( file._id, userId, operation ));
                            }
                        }
                        return File.findOne({ $and: [{ name }, { parents: file._id }] }).exec();
                    });
                }
                return queue;
            })
            .then(() => {
                Promise.all( permissionQueries );
            })
            .then(() => {
                response.status = 'SUCCESS';
                resolve( response );
            })
            .catch(( e ) => {
                reject( e );
            });
    });
};

// Search for a document, with an optional sorting parameter
module.exports.search = function search( toMatch, toSort ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

// Update any matched documents
module.exports.update = function update( toMatch, toUpdate ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

// Delete any matched documents
module.exports.destroy = function destroy( toMatch ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};
