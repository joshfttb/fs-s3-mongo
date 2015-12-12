var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//SCHEMAS
//define our file schema
var fileSchema = new Schema({
  name: String,
  path: String,
  size: Number,
  type: String,
  dateCreated: Date,
  lastModified: Date,
  owner: Objectid,
  permissions: [{
    userId: Objectid,
    permissions: [String] //read, write
  }]
});

//and attach it to our model
var File = mongoose.model('File'. fileSchema);