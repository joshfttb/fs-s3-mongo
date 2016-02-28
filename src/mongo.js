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
    return new Promise(( resolve, reject ) => {
        let guid;
        permissions.connect()
        .then(() => {
            // split the path. for each part:
            const pathArray = fullPath.split( '/' );
            pathArray.unshift( userId );
            const queries = pathArray.map(( value, index, array ) => {
                let query;
                // generate the current path
                const currentPath = '/' + array.slice( 0, index + 1 ).join( '/' );
                const parentPath = '/' + array.slice( 0, index ).join( '/' );
                // if this is the root, it has no parent in the db
                if ( parentPath === '/' ) {
                    // determine that the path exists
                    query = File.findOne({ name: currentPath }).exec();
                }
                // if this is not root
                else {
                    // determine that the path exists and has the correct parent
                    query = File.findOne({ $and: [{ name: currentPath }, { parents: parentPath }] }).exec();
                }
                return query;
            });
            Promise.all( queries )
                .then(( fileRecords ) => {
                    const permissionQueries = [];
                    fileRecords.forEach(( model, index, array ) => {
                        let file;
                        if ( model ) {
                            file = model._doc;
                        }
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
                            // as long as the file exists, sent it to the array
                            // if it does not exist, and it has passed the tests above, no problem
                            // we'll just be checking all of the parents
                            if ( file ) {
                                guid = file._id;
                                permissionQueries.push( permissions.verify( file._id, userId, operation ));
                            }
                        }
                    });
                    Promise.all( permissionQueries );
                })
                .then(() => {
                    resolve( guid );
                })
                .catch(( e ) => {
                    reject( e );
                });
        });
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
