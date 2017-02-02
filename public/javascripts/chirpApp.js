var app = angular.module('chirpApp', ['ngRoute', 'ngResource', 'ui.calendar', 'ui.bootstrap']).run(function($rootScope, $http) {
    $rootScope.authenticated = false;
    $rootScope.current_user = '';
	$rootScope.file_chosen = false;
	
    $rootScope.signout = function(){
        $http.get('auth/signout');
        $rootScope.authenticated = false;
        $rootScope.current_user = '';
    };
});

app.directive('bsActiveLink', ['$location', function ($location) {
return {
    restrict: 'A', //use as attribute 
    link: function (scope, elem) {
        //after the route has changed
        scope.$on("$routeChangeSuccess", function () {
            var hrefs = ['/#' + $location.path(),
                         '#' + $location.path(),
                         $location.path()];
            angular.forEach(elem.find('a'), function (a) {
                a = angular.element(a);
                if (-1 !== hrefs.indexOf(a.attr('href'))) {
                    a.parent().addClass('active');
                } else {
                    a.parent().removeClass('active');   
                };
            });     
        });
    }
}
}]);

app.directive('fdInput', function($rootScope){
return {
      scope: {
		//bind 	to the scope
        fileName: '=',
		fileUpFn: '&'
      },
      link: function(scope, elem, attrs) {
        elem.on('change', function(evt) {
			scope.fileUpFn();
			var files = evt.target.files;
			if(isCsv(files[0])){
				$rootScope.file_chosen = true;
				scope.fileName = files[0].name;
				scope.$apply();
			}
        });
      }
    }
  });
  
  
app.config(function($routeProvider){
    $routeProvider
		//main page
        .when('/', {
            templateUrl: 'main.html',
            controller: 'mainController'
        })
        //login display
        .when('/login', {
            templateUrl: 'login.html',
            controller: 'authController'
        })
        //signup display
        .when('/signup', {
            templateUrl: 'register.html',
            controller: 'authController'
        })
		//courses page
		.when('/courses', {
            templateUrl: 'courses.html',
            controller: 'mainController'
        })
		//clients page
		.when('/clients', {
            templateUrl: 'clients.html',
            controller: 'mainController'
        })
		//calendar page
		.when('/calendar', {
			templateUrl: 'calendar.html',
            controller: 'calendarController'
		});
});

app.factory('clientService', function($resource){
    return $resource('/api/clients/:userid/:field');
});

app.factory('courseService', function($resource){
    return $resource('/api/courses/:userid');
});

app.controller('mainController', function(clientService, courseService, $scope, $rootScope){
	$scope.fileName = '';
	$scope.add_error_message = '';
	$scope.tclient={
		userID: $rootScope.current_user,
		clientID:'',
		firstName:'',
		lastName:'',
		email:'',
		cellPhone:'',
		homePhone:''
	}
	$scope.tcourse={
		userID: $rootScope.current_user,
		courseID:'',
		startDate:'',
		duration:'',
		endDate:'',
		courseName:'',
		weekDay:'',
		time:'',
		instructor:'',
		active:''
	}
	
	
	//--------Client and Course data initializations--------
	
	clientService.query({userid:$rootScope.current_user}, function(data){
		$scope.clients = data;
	});
	courseService.query({userid:$rootScope.current_user}, function(data){
		$scope.courses = data;
	});
	var reader = new FileReader();
	
	
	//--------Client Functions--------
	
	//Add single client to database
	var i=0;
	$scope.addClient = function() {
		if($scope.tclient.clientID==''){
			//find smallest unused clientID and set clientID to it
			sort($scope.clients);
			while(i<$scope.clients.length && i!=$scope.clients[i]){
				i++;
			}
			
			$scope.tclient.clientID=i;
			i=0;
		}
			
        clientService.save($scope.tclient, function(){
			clientService.query({userid:$rootScope.current_user}, function(data){
				$scope.clients = data;
			});
		})
    };
	
	//Add multiple clients by upload
	$scope.addClients = function() {
        var file = document.getElementById('file').files[0];
		if(isCsv(file)){
			reader.readAsText(file);
			reader.onload = function(event){
				var csv = event.target.result;
				var allTextLines = csv.split(/\r\n|\n/);
				var line;
				for (var i=1; i<allTextLines.length; i++) {
					line = allTextLines[i].split(',');
					$scope.newClient = {
						userID: $rootScope.current_user,
						clientID: line[0],
						lastName: line[1], 
						firstName: line[2], 
						email: line[3], 
						cellPhone: line[4],	
						homePhone: line[5]
					}
					clientService.save($scope.newClient, function(){
						$scope.clients = clientService.query({userid:$rootScope.current_user});
					})
				}
			}
			reader.onerror = errorHandler;
		}else{
			alert("Only csv files are accepted");
		}
    };
	
	//Remove client from database
	$scope.removeClient = function(client) {
		clientService.remove({userid:client._id}, function(){
			clientService.query({userid:$rootScope.current_user}, function(data){
				$scope.clients = data;
			});
		})
	}
	
	
	//--------Course Functions--------
	//Add single course to database
	var i=0;
	$scope.addCourse = function() {
        courseService.save($scope.tcourse, function(){
			courseService.query({userid:$rootScope.current_user}, function(data){
				$scope.courses = data;
			});
		})
    };
	
	//Add multiple courses by upload
	$scope.addCourses = function() {
        var file = document.getElementById('file').files[0];
		reader.readAsText(file);
		reader.onload = function(event){
			var csv = event.target.result;
			var allTextLines = csv.split(/\r\n|\n/);
			var line;
			for (var i=1; i<allTextLines.length; i++) {
				line = allTextLines[i].split(',');
				$scope.newCourse = {
					userID: $rootScope.current_user,
					courseID: line[0],
					startDate: line[1],
					duration: line[2],
					endDate: line[3],
					courseName: line[4],
					weekDay: line[5],
					time: line[6],
					instructor: line[7],
					active: line[8]
				}
				courseService.save($scope.newCourse, function(){
					courseService.query({userid:$rootScope.current_user}, function(data){
						$scope.courses = data;
					});
				})
			}
		}
		reader.onerror = errorHandler;
    };
	
	//Remove course from database
	$scope.removeCourse = function(course) {
		courseService.remove({userid:course._id}, function(){
			courseService.query({userid:$rootScope.current_user}, function(data){
				$scope.courses = data;
			});
		})
	}
	
	
	//--------Clear Modal on close--------//
	$('#addModal').on('hidden.bs.modal', function (e) {
		$scope.$apply(function(){
			$scope.tclient={
				userID: $rootScope.current_user,
				clientID:'',
				firstname:'',
				lastname:'',
				email:'',
				cellphone:'',
				homephone:''
			}
		})
	})
	
	$('#courseModal').on('hidden.bs.modal', function (e) {
		$scope.$apply(function(){
			$scope.tcourse={
				userID:$rootScope.current_user,
				courseID:'',
				startDate:'',
				duration:'',
				endDate:'',
				courseName:'',
				weekDay:'',
				time:'',
				instructor:'',
				active:''
			}
		})
	})
});

function sort(array){
	array.sort(function(a,b){
		if (a.clientID < b.clientID) {
			return -1;
		}
		if (a.clientID > b.clientID) {
			return 1;
		}
		return 0;
	})
}

function isCsv(file) {
	var parts = file.name.split('.');
	if((parts[parts.length - 1]).toLowerCase()=='csv'){
		return true;
	}
	return false;
}


function errorHandler(evt) {
  if(evt.target.error.name == "NotReadableError") {
	  console.log("Cannot read file !");
  }
}


app.controller('calendarController', function($scope, $rootScope, $compile, uiCalendarConfig, courseService){
	var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    var currentView = "month";
	$scope.courses=[];
	
    courseService.query({userid:$rootScope.current_user}, function(data){
		for(var i = 0; i < data.length; i++){
			var date = data[i].startDate.split('/');
			var time = data[i].time;
			for(var j = 0; j < data[i].duration; j++){
				var newDate = new Date(date[2], date[1], date[0], Math.floor(time/100), time%100);
				newDate.setDate(newDate.getDate() + 7 * j);

				var course = {
					id: data[i].courseID, 
					title: data[i].courseName,
					start: newDate,
					end: newDate,
					allDay: false
				};
				
				$scope.courses.push(course);
			}
		}
	});
     
	 
    //with this you can handle the events that generated by clicking the day(empty spot) in the calendar
    $scope.dayClick = function( date, allDay, jsEvent, view ){
        $scope.$apply(function(){
          $scope.alertMessage = ('Day Clicked ' + date);
        });
		console.log("?");
    };
     
     
    //with this you can handle the events that generated by droping any event to different position in the calendar
     $scope.alertOnDrop = function(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view){
        $scope.$apply(function(){
          $scope.alertMessage = ('Event Droped to make dayDelta ' + dayDelta);
        });
    };
     
     
    //with this you can handle the events that generated by resizing any event to different position in the calendar
    $scope.alertOnResize = function(event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view ){
        $scope.$apply(function(){
          $scope.alertMessage = ('Event Resized to make dayDelta ' + minuteDelta);
        });
    };
     
	//add event
    $scope.addEvent = function() {
      $scope.events.push({
        title: 'Open Sesame',
        start: new Date(y, m, 28),
        end: new Date(y, m, 29),
        className: ['openSesame']
      });
    };
    //remove event
    $scope.remove = function(index) {
      $scope.events.splice(index,1);
    };
     
     /* Change View */
    $scope.changeView = function(view,calendar) {
		console.log('$');
      uiCalendarConfig.calendars[calendar].fullCalendar('changeView',view);
    };
    /* Change View */
    $scope.renderCalender = function(calendar) {
      if(uiCalendarConfig.calendars[calendar]){
        uiCalendarConfig.calendars[calendar].fullCalendar('render');
      }
	  console.log("!");
    };
	
    /* config object */
    $scope.uiConfig = {
      calendar:{
        height: 450,
        editable: true,
        header:{
          left: 'title',
          center: '',
          right: 'today prev,next'
        },
        eventClick: $scope.alertOnEventClick,
        eventDrop: $scope.alertOnDrop,
        eventResize: $scope.alertOnResize,
        eventRender: $scope.eventRender
      }
    };
	
    /* event sources array*/
    $scope.eventSources = [$scope.courses];

});

app.controller('authController', function($scope, $http, $rootScope, $location){
    $scope.user = {username: '', password: ''};
    $scope.error_message = '';

    $scope.login = function(){
        $http.post('/auth/login', $scope.user).success(function(data){
            if(data.state == 'success'){
                $rootScope.authenticated = true;
                $rootScope.current_user = data.user.username;
                $location.path('/');
            }
            else{
                $scope.error_message = data.message;
            }
        });
    };

    $scope.register = function(){
        $http.post('/auth/signup', $scope.user).success(function(data){
            if(data.state == 'success'){
                $rootScope.authenticated = true;
                $rootScope.current_user = data.user.username;
                $location.path('/');
            }
            else{
                $scope.error_message = data.message;
            }
        });
    };
});