//START MONGOOSE
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//todo: this needs to connect to something
mongoose.connect('mongodb://localhost/test');

//SCHEMAS
//define our file schema
var fileSchema = new Schema({
  name: String,
  path: String,
  size: Number,
  type: String,
  createdAt: Date,
  updatedAt: Date,
  owner: Objectid,
  permissions: [{
    userId: Objectid,
    permissions: [String]
  }]
});

//and attach it to our model
var File = mongoose.model('File'. fileSchema);

//define our structure schema
var structureSchema  = {
  user: Objectid,
  children: [{
    fileId: Objectid,
    //denormalize permissions
    permissions: [{
      userId: Objectid,
      permissions: [String]
    }],
    children: []
  }]
};

//and attach it to our model
var Structure = mongoose.model('Structure', structureSchema);

//OPERATIONS
//read
//search
//inspect
//download
//create
//bulk
//copy
//update
//move
//rename
//delete