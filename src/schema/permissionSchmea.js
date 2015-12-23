'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const permissionsSchema = new Schema({
    resourceType: String, // project or file/folder and we can easily add additional resource types later
    resourceId: Objectid, // links to metadata id or project id
    appliesTo: String, // 'user', 'group', 'public'
    userId: Objectid, // if applies to user
    groupId: Objectid, // if applies to group
    read: Boolean,
    write: Boolean,
    destroy: Boolean,
    share: [String], // add additional user with default permissions for collaboration
    manage: Boolean, // update/remove existing permissions on resource
});

Permissions = mongoose.model( 'Permissions', permissionsSchema );
