'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    mimeType: String, // http://www.freeformatter.com/mime-types-list.html (includes folder type)
    size: Number, // in bytes
    dateCreated: Date, // https://docs.mongodb.org/v3.0/reference/method/Date/
    lastModified: Date, // https://docs.mongodb.org/v3.0/reference/method/Date/
    parents: [String], // an array of file and folder names
    name: String, // no resources end in /, folders are determined by mimeType
});

module.exports = mongoose.model( 'File', fileSchema );
