var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var validate = require('validate.js');
var moment = require('moment');
var Client = mongoose.model('Client');
var Course = mongoose.model('Course');

//Used for routes that must be authenticated.
function isAuthenticated (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects

    //allow all get request methods
    if(req.method === "GET"){
        return next();
    }
    if (req.isAuthenticated()){
        return next();
    }

    // if the user is not authenticated then redirect him to the login page
    return res.redirect('/#login');
}

//Register the authentication middleware
router.use('/clients/', isAuthenticated);

router.route('/clients')
	//creates a new client
    .post(function(req, res){
        var client = new Client();
		client.userID = req.body.userID;
        client.clientID = req.body.clientID;
		client.lastName = req.body.lastName;
		client.firstName = req.body.firstName;
		client.email = req.body.email;
		client.cellPhone = req.body.cellPhone;
		client.homePhone = req.body.homePhone;
		Client.findOneAndUpdate({clientID: req.body.clientID}, {$set:req.body}, {upsert:true}, function(err, doc){
			if (err){
				console.log(err);
                return res.send(500, err);
			}else{
			return res.json(doc);
			}
		});
    })
    //gets all clients
    .get(function(req, res){
        Client.find({}).sort({firstName: 1}).exec(function(err, clients){
            if(err){
                return res.send(500, err);
            }
            return res.status(200).send(clients);
        });
    });
	
router.route('/clients/:userid')
//gets clients with userid
    .get(function(req, res){
        Client.find({userID: req.params.userid}).sort({firstName: 1}).exec(function(err, clients){
            if(err)
                res.send(err);
            res.json(clients);
        });
    })
    //updates specified client
    .put(function(req, res){
        Client.findById(req.params.id, function(err, client){
            if(err)
                res.send(err);

            post.created_by = req.body.created_by;
            post.text = req.body.text;

            post.save(function(err, client){
                if(err)
                    res.send(err);

                res.json(client);
            });
        });
    })
    //deletes the client
    .delete(function(req, res) {
        Client.remove({_id: req.params.userid}, function(err){
            if (err)
                res.send(err);
            res.json("deleted :(");
        });
    });

router.route('/clients/:userid/:field')

	.get(function(req,res){
		Client.find({userID: req.params.userid}, req.params.field, function(err, clients){
			if(err)
                res.send(err);
            res.json(clients);
        });
    });

router.route('/clients/:userid/sortby/:sortby')
//get all data and sort it by sortby
    .get(function(req, res){
        var sortby = req.params.sortby;
        if(sortby=="firstName") {
            Client.find({userID: req.params.userid}).sort({firstName: 1}).exec(function (err, clients) {
                if (err)
                    res.send(err);
                res.json(clients);
            });
        }else if(sortby=="lastName") {
            Client.find({userID: req.params.userid}).sort({lastName: 1}).exec(function (err, clients) {
                if (err)
                    res.send(err);
                res.json(clients);
            });
        }else if(sortby=="clientID") {
            Client.find({userID: req.params.userid}).sort({clientID: 1}).exec(function (err, clients) {
                if (err)
                    res.send(err);
                res.json(clients);
            });
        }
    })

router.route('/clients/update')
//creates a new client
    .post(function(req, res){
        var client = new Client();
        client.userID = req.body.userID;
        client.clientID = req.body.clientID;
        client.lastName = req.body.lastName;
        client.firstName = req.body.firstName;
        client.email = req.body.email;
        client.cellPhone = req.body.cellPhone;
        client.homePhone = req.body.homePhone;
        Client.findOneAndUpdate({clientID: req.body.clientID}, {$set:req.body}, function(err, doc){
            if (err){
                console.log(err);
                return res.send(500, err);
            }else{
                return res.json(doc);
            }
        });
    })

router.use('/courses/', isAuthenticated);

router.route('/courses')
	//creates a new course
    .post(function(req, res){
		req.body.startDate = moment(req.body.startDate).format('DD/MM/YYYY');
		req.body.endDate = moment(req.body.endDate).format('DD/MM/YYYY');
		req.body.time = moment(req.body.time).format('hhmm');
		Course.findOneAndUpdate({courseID: req.body.courseID}, {$set:req.body}, {upsert:true}, function(err, doc){
			if (err){
				console.log(err);
                return res.send(500, err);
			}else{
			return res.json(doc);
			}
		});
    })
    //gets all courses
    .get(function(req, res){
        Course.find(function(err, courses){
            if(err){
                return res.send(500, err);
            }
            return res.status(200).send(courses);
        });
    });
	
router.route('/courses/:userid')
//gets courses with userid
    .get(function(req, res){
        Course.find({userID: req.params.userid}, function(err, courses){
            if(err)
                res.send(err);
            res.json(courses);
        });
    })
    //TODO: updates specified course
    .put(function(req, res){
        Client.findById(req.params.userid, function(err, client){
            if(err)
                res.send(err);

            post.created_by = req.body.created_by;
            post.text = req.body.text;

            post.save(function(err, client){
                if(err)
                    res.send(err);

                res.json(client);
            });
        });
    })
    .delete(function(req, res) {
        Course.remove({_id: req.params.userid}, function(err){
            if (err)
                res.send(err);
            res.json("deleted :(");
        });
    });


router.route('/validation/email')
//returns true or false whether the request is an email or not
    .post(function(req, res){
        var constraints = {
            from: {
                email: true
            }
        };
        res.send(validate({from: req.body.email}, constraints) === undefined || req.body.email == "");
    });
	
module.exports = router;