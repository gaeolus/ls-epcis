
import amqp = require('amqp');
import mongodb = require('mongodb');
import assert = require('assert');
import sleep = require('sleep');

// sleep to wait some time to get the other services startet.
// TODO: Check until the service port is available
sleep.sleep(3);

var MongoClient = mongodb.MongoClient;

var mydb = null;

// store event in DB
var createDBitem = function(data) {
	assert.notEqual(mydb, null, 'Exiting because db connection is null!');
    
    var collection = mydb.collection('events');
    collection.insert(data, null, function(err, res) {
       assert.equal(null, err, 'Error on writing object to DB');
       console.log('Successfully wrote to DB');
    });
};

MongoClient.connect('mongodb://192.168.59.103/EPCIS', function(err, db) {
  assert.equal(null, err);
  mydb = db;
  console.log("Connected correctly to MongoDB server");
});

var connection = amqp.createConnection({
    host: '192.168.59.103',
    login: 'admin',
    password: 'admin'
});

connection.on('ready', function () {
    connection.queue('input.json', { autoDelete: false }, function (queue) {
        queue.bind(routing='input.json');
        console.log(' [*] Waiting for messages. To exit press CTRL+C');

        queue.subscribe(function (msg) {
            var message = msg.data.toString('utf-8');
            //console.log(" [x] Received %s", message);
			
            var jsonObj = JSON.parse(message);
            var aggregationEvents:Array<any> = jsonObj['aggregationEvents'];
            if(aggregationEvents) {
                aggregationEvents.forEach(function (element) {
                    createDBitem(element);
                });
            }
        });
    });
});


connection.on('error', function (err) {

    console.log("Error");
    console.log(err);
});
