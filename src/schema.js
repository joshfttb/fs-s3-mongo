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

//todo: export this correctly
//todo: lodash or underscore

var verification = new Promise(function (resolve, reject, user, operation, path) {
  var lastParent;
  var pathArray;
  var i;
  var folderFail;
  var isParent;
  var fileExists;
  var fileId;
  var permissionsObject;
  var permissions;

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
      //todo: reject that shit
    }

    //if there is another level, increment
    if (isParent) i++;

  } while (isParent);

  //determine if the file exists, eg, is an exact match
  fileExists = i === pathArray.length;

  //if this is not an exact match, and the last path was not a folder, we have a problem
  if (!fileExists && folderFail) {
    //todo: reject that shit
  }

  //get permissions for the user on the last parent
  permissionsObject = File.find({_id: id}, {permissions: 1});
  _.forEach(permissionsObject, function() {
    if (user === permissionsObject.userId) {
      permissions = permissionsObject.permissions
    }
  });
  //split permissions into an array
  permissions = permissions.split(',');

  //we now know where our path ends and what our user's permissions are on that end. time to test things
  //important vars:
  // fileExists
  // permissions

  //todo: a file that already exists is required for some operations, and excluded for others


  //todo: test permissions against various actions


});

//todo: remember to remove the children array if it's empty!