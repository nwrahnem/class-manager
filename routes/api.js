var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
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
};

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
        Client.find(function(err, clients){
            if(err){
                return res.send(500, err);
            }
            return res.status(200).send(clients);
        });
    });
	
router.route('/clients/:userid')
//gets clients with userid
    .get(function(req, res){
        Client.find({userID: req.params.userid}, function(err, clients){
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
	//get all data matching field
	.get(function(req,res){
		Client.find({userID: req.params.userid}, req.params.field, function(err, clients){
			if(err)
                res.send(err);
            res.json(clients);
        });
    })

router.use('/courses/', isAuthenticated);

router.route('/courses')
	//creates a new course
    .post(function(req, res){
        var course = new Course();
		course.userID = req.body.userID;
        course.courseID = req.body.courseID;
		course.startDate = req.body.startDate;
		course.duration = req.body.duration;
		course.endDate = req.body.endDate;
		course.courseName = req.body.courseName;
		course.weekDay = req.body.weekDay;
		course.time = req.body.time;
		course.instructor = req.body.instructor;
		course.active = req.body.active;
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
	
module.exports = router;