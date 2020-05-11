var azure = require('azure-storage');
var blobService = azure.createBlobService();
var tableService = azure.createTableService();
var entGen = azure.TableUtilities.entityGenerator;
const config = require('config');

const {
    v4: uuidv4
} = require('uuid');
uuidv4();

module.exports.structuredImport = function(_importPackage){
    //TODO: call everything in order and alert the file minder
    var date = new Date();
    var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    var _row = {
        PartitionKey: entGen.String('submission'),
        RowKey: entGen.String(_importPackage.id),
        uploaded: entGen.DateTime(new Date(now_utc))
    }
    var pics = [_importPackage.pic1, _importPackage.pic2, _importPackage.pic3];
    //TODO: flow control for this, we are breezing past it
    pics.forEach(element => {
        _row[element.fieldname] = entGen.String(element.filename);
        if (blobUpload(element)) {
            console.log("Uploaded a pic.")
        }
    });
    var notes = [_importPackage.note1, _importPackage.note2, _importPackage.note3];
    notes.forEach(element => {
        if(element != ""){
            //TODO figure out how to persist field name to here so we can use it
            //_row[element.fieldname] = entGen.String(element);
        }
    });
    //TODO smoketest to see if this gets hit before the foreaches are done
    if(tableUpload(_row)){
        return true;
    } else {
        return false;
    }
}

module.exports.getEntities = function(_timestamp, _pagebreak = null){
    if(_pagebreak){
        //TODO: pagination using id of last entry previously retrieved
        return undefined;
    }
    if(!_timestamp){
            var query = new azure.TableQuery()
                .top(5);
    }

    tableService.queryEntities('mytable', query, null, function (error, result, response) {
        if (!error) {
            // result.entries contains entities matching the query
            return result.entries;
        }
    });
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

//TODO investigate return value
function tableUpload(_inputrow) {

    tableService.insertEntity(config.get('appconfig.tablecontainer'), _inputrow, function (error, result, response) {
        if (!error) {
            console.log("Add row success")
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