//This thing maintains a list of files to delete from the local drive.
//After the azure service layer is done uploading, it drops the name in here for deletion.
//This will be configurable for delete-on-arrival or scheduled batch delete ops.
const fs = require('fs');
const path = require('path');
var appDir = path.dirname(require.main.filename);
var CronJob = require('cron').CronJob;
var job = new CronJob('0 0 0 * * *', function () {
    this.clean(true);
}, null, true, 'America/Chicago');
job.start();

function clean(all = false){
    if(all){
        var directory = './uploads';
        fs.readdir(directory, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        });
        fs.readdir(appDir, (err, files) => {
            if (err) throw err;
            for (const file of files) {
                if(path.extname(file) === '.png'){
                    console.log("Deleting a generated post...")
                    fs.unlink(path.join(appDir, file), err => {
                        if (err) throw err;
                    });
                }

            }
        });
    } else {
        async.each(toRemove, function (entry, callback) {
            try {
                //TODO check on this path
                var path = './uploads/' + entry
                fs.unlink(path, (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                })
            } catch (err) {
                continue
            }
        }, function (err) {
            toRemove = [];
        });
    }
}

toRemove = [];
module.exports.toRemove = this.toRemove
module.exports.clean = clean
