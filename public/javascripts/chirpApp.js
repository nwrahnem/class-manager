var app = angular.module('chirpApp', ['ngRoute', 'ngResource', 'ngSanitize', 'ngAnimate', 'ngMessages', 'ui.calendar', 'ui.bootstrap']).run(function($rootScope, $http) {
    $rootScope.authenticated = false;
    $rootScope.current_user = '';
	$rootScope.file_chosen = false;
	
    $rootScope.signout = function(){
        $http.get('auth/signout');
        $rootScope.authenticated = false;
        $rootScope.current_user = '';
    };
});

//Validates if value in ngmodel is a number or empty
app.directive('number', function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function($scope, $element, $attrs, ngModel){
            ngModel.$validators.number = function(modelValue) {
                return !isNaN(modelValue) || modelValue === undefined;
            }
        }
    };
});

//Validates if value in ngmodel is a valid email
app.directive('emailValid', function($http, $q){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function($scope, $element, $attrs, ngModel){
            ngModel.$asyncValidators.emailValid = function(modelValue) {
            	return $http.post('/api/validation/email', {email: modelValue}).then(
                	function (response) {
                	    if(!response.data){
                            return $q.reject(response.data);
                        }
                 	    return true;
                	}
				);
            };
        }
    };
});

//Validates if value in ngmodel is a valid phone number (or empty)
app.directive('phone', function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function($scope, $element, $attrs, ngModel){
            ngModel.$validators.phone = function(modelValue) {
                var phoneNum = new RegExp("^(\\+\\d{1,2}\\s)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$");
                return phoneNum.test(modelValue) || modelValue == "" || modelValue === undefined;
            }
        }
    };
});

app.directive('bsActiveLink', ['$location', function ($location) {
return {
    restrict: 'A',
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
                }
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
      link: function(scope, elem) {
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
		})
		.otherwise({
			redirectTo: '/'
		});
});

app.factory('clientFieldService', function($resource){
    return $resource('/api/clients/:userid/:field');
});

app.factory('clientUpdateService', function($resource){
    return $resource('/api/clients/update');
});

app.factory('clientService', function($resource){
    return $resource('/api/clients/:userid/sortby/:sortby');
});

app.factory('courseService', function($resource){
    return $resource('/api/courses/:userid');
});

app.controller('mainController', function(clientService, courseService, clientFieldService, clientUpdateService, $scope, $rootScope){
	$scope.fileName = '';
	$scope.add_error_message = '';
	$scope.sortBy = "firstName";
	
	//--------Client and Course data initializations--------
	
	clientService.query({userid:$rootScope.current_user, sortby:$scope.sortBy}, function(data){
		$scope.clients = data;
	});
	courseService.query({userid:$rootScope.current_user}, function(data){
		$scope.courses = data;
	});
	var reader = new FileReader();
	
	
	//--------Client Functions--------

	//Add single client to database from modal
	var i=0;
	$scope.$on("clientAdded", function(event,arg){
        if(arg.client.clientID==''){
            //find smallest unused clientID and set clientID to it
            clientService.query({userid:$rootScope.current_user, sortby:"clientID"}, function(data){
                while(i<data.length && i==data[i].clientID){
                    i++;
                }
                arg.client.clientID=i;
                i=0;

                clientFieldService.save(arg.client, function(){
                    clientService.query({userid:$rootScope.current_user, sortby:$scope.sortBy}, function(data2){
                        $scope.clients = data2;
                    });
                })
            });
        }
    });

    $scope.$on("clientEdited", function(event,arg){
        clientUpdateService.save(arg.client, function(){
            clientService.query({userid:$rootScope.current_user, sortby:$scope.sortBy}, function(data){
                $scope.clients = data;
            });
        })
    });
	
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
					};
					clientService.save($scope.newClient, function(){
                        clientService.query({userid:$rootScope.current_user, sortby:$scope.sortBy}, function(data){
                            $scope.clients = data;
                        });
					})
				}
			};
			reader.onerror = errorHandler;
		}else{
			alert("Only csv files are accepted");
		}
    };
	
	//Remove client from database
	$scope.removeClient = function(client) {
		clientFieldService.remove({userid:client._id}, function(){
            clientService.query({userid:$rootScope.current_user, sortby:$scope.sortBy}, function(data){
                $scope.clients = data;
            });
		})
	};

    $scope.sort = function(item){
        $scope.sortBy = item;
        clientService.query({userid:$rootScope.current_user, sortby:item}, function(data){
            $scope.clients = data;
        });
    }
	
	//--------Course Functions--------
    $scope.$on("courseAdded", function(event,arg){
        courseService.save(arg.course, function(){
            courseService.query({userid:$rootScope.current_user}, function(data){
                $scope.courses = data;
            });
        })
    });

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
				};
				courseService.save($scope.newCourse, function(){
					courseService.query({userid:$rootScope.current_user}, function(data){
						$scope.courses = data;
					});
				})
			}
		};
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

});


function isCsv(file) {
	var parts = file.name.split('.');
	return (parts[parts.length - 1]).toLowerCase()=='csv';
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
          $scope.alertMessage = ('Event Dropped to make dayDelta ' + dayDelta);
        });
    };
     
     
    //with this you can handle the events that generated by resizing any event to different position in the calendar
    $scope.alertOnResize = function(event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view ){
        $scope.$apply(function(){
          $scope.alertMessage = ('Event Resized to make dayDelta ' + minuteDelta);
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


app.controller('modalController', function($scope, $uibModal, $log, $document){
	$scope.open = function () {
		var modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'addClients.html',
			controller: 'ModalInstanceCtrl',
			resolve: {
				items: function () {
					return $scope.items;
				}
			}
		});

		modalInstance.result.then(function (tclient) {
		    $scope.$emit('clientAdded',{client:tclient});
		}, function () {
		    $log.info('Modal dismissed at: ' + new Date());
		});
	};

    $scope.editClient = function (client) {
        $scope.client = client;
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'edit-modal-title',
            ariaDescribedBy: 'edit-modal-body',
            templateUrl: 'editClients.html',
            scope: $scope,
            controller: 'ModalInstanceCtrl',
            resolve: {
                items: function () {
                    return $scope.items;
                }
            }
        });

        modalInstance.result.then(function (tclient) {
            $scope.$emit('clientEdited',{client:tclient});
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openCourse = function () {
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'addClients.html',
            controller: 'ModalInstanceCtrl',
            resolve: {
                items: function () {
                    return $scope.items;
                }
            }
        });

        modalInstance.result.then(function (tcourse) {
            $scope.$emit('courseAdded',{course:tcourse});
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };
});

app.controller('ModalInstanceCtrl', function ($rootScope, $scope, $uibModalInstance) {
    $scope.userForm = {};
    $scope.tclient={
        userID: $rootScope.current_user,
        clientID:'',
        firstName:'',
        lastName:'',
        email:'',
        cellPhone:'',
        homePhone:''
    };
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
    };
    if($scope.client)
    $scope.tclient = $scope.client;

    $scope.submitForm = function () {
        if ($scope.userForm.$valid) {
            $uibModalInstance.close($scope.tclient);
        } else {
            alert("Invalid input");
        }
    };

    $scope.submitForm2 = function () {
        if ($scope.userForm.$valid) {
            $uibModalInstance.close($scope.tcourse);
        } else {
            alert("Invalid input");
        }
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        startingDay: 1
    };

    $scope.openDatePicker = function() {
        $scope.popup1.opened = true;
    };

    $scope.openDatePicker2 = function() {
        $scope.popup2.opened = true;
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
        opened: false
    };

    $scope.popup2 = {
        opened: false
    };
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