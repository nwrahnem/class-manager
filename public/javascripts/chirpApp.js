var app = angular.module('chirpApp', ['ngRoute', 'ngResource']).run(function($rootScope, $http) {
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
    //the timeline display
        .when('/', {
            templateUrl: 'main.html',
            controller: 'mainController'
        })
        //the login display
        .when('/login', {
            templateUrl: 'login.html',
            controller: 'authController'
        })
        //the signup display
        .when('/signup', {
            templateUrl: 'register.html',
            controller: 'authController'
        })
		.when('/courses', {
            templateUrl: 'courses.html',
            controller: 'mainController'
        })
		.when('/clients', {
            templateUrl: 'clients.html',
            controller: 'mainController'
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
	var i=0;
	clientService.query({userid:$rootScope.current_user}, function(data){
		$scope.clients = data;
	});
	courseService.query({userid:$rootScope.current_user}, function(data){
		$scope.courses = data
	});
	var reader = new FileReader();
	
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
	
	$scope.addCourse = function() {
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
	
	$scope.removeCourse = function(course) {
		courseService.remove({userid:course._id}, function(){
			courseService.query({userid:$rootScope.current_user}, function(data){
				$scope.courses = data;
			});
		})
	}
	
	$scope.removeClient = function(client) {
		clientService.remove({userid:client._id}, function(){
			clientService.query({userid:$rootScope.current_user}, function(data){
				$scope.clients = data;
			});
		})
	}
	
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