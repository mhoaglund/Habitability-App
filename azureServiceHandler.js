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
        if(item && item.fieldname){
            _row[item.fieldname] = entGen.String(item.filename);
            if (blobUpload(item)) {
                callback('Uploaded a file.');
            }
        } else{
            callback('Skipped a blank entry');
        }

    }, function(err){
        if (err) {
            console.log("Upload loop error: " + err);
        } else {
            console.log("Upload loop is done");
        }
    });
    //TODO smoketest to see if this gets hit before the foreaches are done
    tableUpload(_row, function(result){
        _cb(result);
        // return result;
    })
}

//Continuation token stuff: https://coderead.wordpress.com/2012/08/20/handling-continuation-tokens-with-node-js-on-windows-azure-table-storage/

//TODO: skip the continuation token stuff for now. Save post timestamps as your token.
//When a timestamp gets passed in, select where older than it, then manually orderby on the server.
//Save the last timestamp in the new list and sned it.
module.exports.getEntities = function(_clienttoken = null, _cb){
    var query = new azure.TableQuery()
        .top(5);

    tableService.queryEntities(config.get('appconfig.tablecontainer'), query, _clienttoken, function (error, result, response) {
        if (!error) {
            // result.entries contains entities matching the query
            if(result.continuationToken){
                var token = result.continuationToken;
            }
            var cleaned = clean(result.entries);
            _cb(cleaned, token);
        } else {
            _cb("Nope");
        }
    });
}

function clean(coll){
    var simplified = [];
    coll.forEach(entity => {
        var new_entity = {};
        if (entity.note1) {
            new_entity.note1 = entity.note1["_"];
        }
        if (entity.note2) {
            new_entity.note2 = entity.note2["_"];
        }
        if (entity.pic1) {
            new_entity.pic1 = entity.pic1["_"];
        }
        if (entity.pic2) {
            new_entity.pic2 = entity.pic2["_"];
        }
        new_entity.timestamp = entity.Timestamp["_"];
        new_entity.id = entity.RowKey["_"];
        simplified.push(new_entity);
    });
    return simplified;
}

//TODO: private getSecret for auth
function blobUpload(_inputfile) {
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