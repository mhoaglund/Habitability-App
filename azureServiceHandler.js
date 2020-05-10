var azure = require('azure-storage');
var blobService = azure.createBlobService();
const config = require('config');

const {
    v4: uuidv4
} = require('uuid');
uuidv4();

//TODO: private getSecret for auth
//TODO: public upload for adding to blob
//TODO: public delete for removing from blob

exports.upload = function (_inputfile) {
    //naming the image with a uuid.
    //TODO: create a record in a table somwehere
    blobService.createBlockBlobFromLocalFile(config.get('appconfig.blobcontainer'), uuidv4(), _inputfile, function (error, result, response) {
        if (!error) {
            // file uploaded
        }
    });
    return true;
};

module.exports.delete = function () {
    return false;
};