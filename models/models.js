var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientSchema = new mongoose.Schema({
	userID: String,
	clientID: Number,
	lastName: String,
	firstName: String,
	email: String,
	cellPhone: String,
	homePhone: String
});

var postSchema = new mongoose.Schema({
    created_by: String,		
    created_at: {type: Date, default: Date.now},
    text: String
});

var userSchema = new mongoose.Schema({
    username: String,
    password: String, //hash created from password
    created_at: {type: Date, default: Date.now}
})

var courseSchema = new mongoose.Schema({
	userID: String,
	courseID: String,
	startDate: String,
	duration: Number,
	endDate: String,
	courseName: String,
	weekDay: Number,
	time: Number,
	instructor: String,
	active: Number
})


mongoose.model('Post', postSchema);
mongoose.model('User', userSchema);
mongoose.model('Client', clientSchema);
mongoose.model('Course', courseSchema);