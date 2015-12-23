'use strict';

const utils = require( './utils.js' );

/* eslint no-unused-vars: 0 */

module.exports.verify = function(user, operation, path) {

    let lastParent;
    let pathArray;
    let i;
    let folderFail;
    let isParent;
    let fileExists;
    let fileId;
    let permissionsArray;
    let permissions;

    //josh/test/docs/sext.doc

    //first we need to find out how far down the path currently exists

    //make the path into an array
    //todo: need to remove the first part if we have an '/' up front
    pathArray= path.split('/');

    // start pathFind as an empty string
    lastParent = '';

    //iterate down the path,
    i = 0;
    folderFail = false;
    do {
        //add the next part of the path
        lastParent += pathArray[i];

        //store the fileid
        //i=2, lastParent = josh.children.test.children.docs.fileId
        fileId = lastParent + '.fileId';

        //see if this is a folder
        if (!File.find({$and: [{_id: fileId}, {type: 'folder'}]}).fetch()) {
            folderFail = true;
        }

        //add '.children'
        //i=2, lastParent = josh.children.test.children.docs.children
        lastParent +='.children';

        //run the test
        isParent= Structure.find({[lastParent]: {$exists: true, $ne: null}}).fetch();

        //if there's another level and this was not a folder, we have a problem
        if (isParent && folderFail) {
            reject('tried to add object to file');
        }

        //if there is another level, increment
        if (isParent) i++;

    } while (isParent);

    //determine if the file exists, eg, is an exact match
    fileExists = (i === pathArray.length);

    //if this is not an exact match, and the last path was not a folder, we have a problem
    if (!fileExists && folderFail) {
        return new Promise(function (resolve, reject) {
            reject('tried to add object to file');
        }
    }

    //get permissions for the user on the last parent
    permissionsArray = File.find({_id: fileId}).fetch();
    permissionsArray.forEach(function (item) {
        if (user === item.userId) {
            permissions = item.permissions;
        }
    });

    //we now know where our path ends and what our user's permissions are on that end. time to test things
    //important lets:
    // fileExists
    // permissions

    //a file that already exists is required for some operations, and excluded for others
    //required for read, update, destroy
    if(!fileExists && operation === 'read' || 'update' || 'destroy') {
        return new Promise(function (resolve, reject) {
            reject('object does not exist);
        }
    }

    //can't exist for write
    if(fileExists && operation === 'write') {
        return new Promise(function (resolve, reject) {
            reject('object already exists at that path');
        }
    }

    //test permissions against various actions
    if(operation === 'read' &&
      permissions.indexOf('read') === -1) {
        reject('user does not have read permissions on this object')
    }
    if(operation === 'write' || 'update' || 'destroy' &&
      permissions.indexOf('write') === -1) {
        reject('user does not have write permissions on this object')
    }

    //if it gets this far it's succeeded!
    //return the parent path and remaining path
    return new Promise(function (resolve) {
        resolve ({
            lastParent: lastParent,
            remainingPath: pathArray.slice(i + 1, pathArray.length)
        })
    }
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
