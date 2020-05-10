var azure = require('azure-storage');
var blobService = azure.createBlobService();
var tableService = azure.createTableService();

const config = require('config');

const {
    v4: uuidv4
} = require('uuid');
uuidv4();

module.exports.structuredImport = function(_importPackage){
    //TODO: call everything in order and alert the file minder
    var _row = {
        id: entGen.String(_importPackage.id),
        uploaded: entGen.DateTime(_importPackage.uploaded)
    }
    [_importPackage.pic1, _importPackage.pic2, _importPackage.pic3].forEach(element => {
        if (blobUpload(element)) {
            console.log("Uploaded a pic.")
            _row[element.fieldname] = entGen.String(element.filename);
        }
    });

    [_importPackage.note1, _importPackage.note2, _importPackage.note3].forEach(element => {
        if(element != ""){
            //TODO figure out how to persist field name to here so we can use it
            //_row[element.fieldname] = entGen.String(element);
        }
    });
    //TODO smoketest to see if this gets hit before the foreaches are done
    tableUpload(_row)

}

//TODO: private getSecret for auth
function blobUpload(_inputfile) {
    //naming the image with a uuid.
    //TODO: create a record in a table somwehere
    if(!_inputfile) return;
    blobService.createBlockBlobFromLocalFile(config.get('appconfig.blobcontainer'), _inputfile.filename, _inputfile.path, function (error, result, response) {
        if (!error) {
            // file uploaded
            console.log("Upload success")
            return true;
        } else {
            return false;
        }
    });
};

//Create a row with inline notes from upload, and file names for images.
function tableUpload(_inputrow) {
    // var entity = {
    //     PartitionKey: entGen.String('submission'),
    //     RowKey: entGen.String(_inputrow.id),
    //     Note1: entGen.String(_inputrow['note1']),
    //     Note2: entGen.String(_inputrow['note2']),
    //     Note3: entGen.String(_inputrow['note3']),
    //     Pic1: entGen.String(_inputrow['pic1']),
    //     Pic2: entGen.String(_inputrow['pic2']),
    //     Pic3: entGen.String(_inputrow['pic3']),
    //     dateValue: entGen.DateTime(_inputrow.uploaded)
    // };
    tableService.insertEntity(config.get('appconfig.tablecontainer'), _inputrow, function (error, result, response) {
        if (!error) {
            console.log("Delete success")
            return true;
        } else {
            return false;
        }
    });
}

module.exports.deleteBlob = function (_filename, _clusterid) {
    blobService.deleteBlobIfExists(config.get('appconfig.blobcontainer'), _filename, function(error, result, response){
        if (!error) {
            console.log("Delete success")
            return true;
        } else {
            return false;
        }
    })
    return false;
};

module.exports.deleteRow = function (_rowKey, _partitionKey) {
    tableService.deleteEntity(config.get('appconfig.tablecontainer'), {
                PartitionKey: _partitionKey,
                RowKey: _rowKey
            }, function (error, result, response) {
        if (!error) {
            console.log("Delete entity successful")
            return true;
        } else {
            return false;
        }
    })
    return false;
};