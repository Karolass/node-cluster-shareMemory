var cluster = require('cluster'),
    memored = require('memored');
var http = require('http');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log("master start...");

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
        // console.log(Object.keys(cluster.workers).length);
    }

    cluster.on('listening',function(worker,address){
        console.log('listening: worker ' + worker.process.pid +', Address: '+address.address+":"+address.port);
    });

    cluster.on('exit', function(worker, code, signal) {
        if (worker.suicide == true)
            console.log('worker ' + worker.process.pid + ' suicide');
        else
            console.log('worker ' + worker.process.pid + ' died');
    });
} else {
    // this is suicide
    // cluster.worker.kill();
    // this is died
    // process.exit();
    http.createServer(function(req, res) {
        // res.writeHead(200);
        // res.end("hello world\n");

        // find all keys of share memory 
        memored.keys(function(err, keys) {
            var count = 0, memoryUsage = 0;
            for (var i = 0; i < keys.length; i++) {

                // read all value of share memory
                memored.read(keys[i], function(err, value) {
                    count++;
                    memoryUsage += value;

                    if (count == keys.length) {
                        var json = JSON.stringify({
                            'memory': memoryUsage + " MB"
                        });
                        res.writeHead(200, {
                            'Content-Length': json.length,
                            'Content-Type': "application/json"
                        });
                        res.end(json);
                    }
                });
            }
        });
    }).listen(3000);

    // init, store value share mamory
    memored.store(process.pid, Math.round(process.memoryUsage().rss/1024/1024), function() {});
    // interval, store value share mamory
    setInterval(function() {
        memored.store(process.pid, Math.round(process.memoryUsage().rss/1024/1024), function() {});
    }, 5000);
}