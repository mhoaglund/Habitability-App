var azure = require('azure-storage');
var async = require('async');
var blobService = azure.createBlobService();
var tableService = azure.createTableService();
var entGen = azure.TableUtilities.entityGenerator;
const config = require('config');

const {
    v4: uuidv4
} = require('uuid');
uuidv4();

module.exports.structuredImport = function(_importPackage, _cb){
    //TODO: call everything in order and alert the file minder
    var date = new Date();
    var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    var _row = {
        PartitionKey: entGen.String('submission'),
        RowKey: entGen.String(_importPackage.id),
        uploaded: entGen.DateTime(new Date(now_utc))
    }

    var notes = [_importPackage.note1, _importPackage.note2];
    notes.forEach(element => {
        if (element.note != "") {
            _row[element.field] = entGen.String(element.note);
        }
    });
5
    var pics = [_importPackage.pic1, _importPackage.pic2];
    //TODO: flow control for this, we are breezing past it
    async.each(pics, function(item, callback){
        _row[item.fieldname] = entGen.String(item.filename);
        if (blobUpload(item)) {
            callback('Uploaded a file.');
        }
    }, function(err){
        if (err) {
            console.log("Upload loop error: " + err);
        } else {
            console.log("Upload loop is done");
        }
    });
    // pics.forEach(element => {
    //     _row[element.fieldname] = entGen.String(element.filename);
    //     if (blobUpload(element)) {
    //         console.log("Uploaded a pic.")
    //     }
    // });

    //TODO smoketest to see if this gets hit before the foreaches are done
    tableUpload(_row, function(result){
        _cb(result);
        // return result;
    })
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
function tableUpload(_inputrow, callback) {
    tableService.insertEntity(config.get('appconfig.tablecontainer'), _inputrow, function (error, result, response) {
        if (!error) {
            console.log(result)
            callback(true, null);
        } else {
            console.log(error)
            callback(false, null);
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