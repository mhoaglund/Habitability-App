//This thing maintains a list of files to delete from the local drive.
//After the azure service layer is done uploading, it drops the name in here for deletion.
//This will be configurable for delete-on-arrival or scheduled batch delete ops.
const fs = require('fs');
var CronJob = require('cron').CronJob;
var job = new CronJob('0 0 0 * * *', function () {
    this.clean();
}, null, true, 'America/Chicago');
job.start();

function clean(){
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

toRemove = [];
module.exports.toRemove = this.toRemove