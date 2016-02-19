'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    _id: String,
    mimeType: String, // http://www.freeformatter.com/mime-types-list.html (includes folder type)
    size: Number,
    dateCreated: Date,
    lastModified: Date,
    parents: [String],
    name: String, // if the resource is a folder, it ends in a '/'
});

module.exports = mongoose.model( 'File', fileSchema );
