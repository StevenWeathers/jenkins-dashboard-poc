var socket = io('/dashboard');
var dashboardApp = angular.module('dashboardApp', ['btford.socket-io','ngRoute','angles'])
.factory('mySocket', function (socketFactory) {
  var myIoSocket = io.connect('/dashboard');

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});

// configure our routes
dashboardApp.config(function($routeProvider, $locationProvider) {
  $routeProvider
    // route for the home page
    .when('/', {
      templateUrl : 'partials/home.html',
      controller  : 'JenkinsViewsCtrl'
    })
    // route for the jenkins single view page
    .when('/jenkins/:key/view/:viewname', {
      templateUrl : 'partials/jenkins-single.html',
      controller  : 'JenkinsSingleViewCtrl'
    });
});

// Global Controller to handle Header
dashboardApp.controller('DashboardController', function ($scope, mySocket,jenkinsViewService,jenkinsJobService) {
  $scope.weather = {};
  $scope.currentTime = moment().format('h:mm a');

  setInterval(function(){
    $scope.currentTime = moment().format('h:mm a');
  }, 1000);

  mySocket.on('weather', function(data){
    if (data.weather.main){
      data.weather.main.temp = Math.round(data.weather.main.temp);
      $scope.$apply(function() {
        $scope.weather = data.weather;
      });
    }
  });

  $scope.jenkinsJobs = jenkinsJobService;
  $scope.jenkinsViews = jenkinsViewService;

  $scope.jenkinsChartOptions = {
    segmentStrokeColor : "#1c1e22",
    animation : false
  };

  mySocket.on('jenkinsFedViews', function(data){
    $scope.$apply(function() {
      jenkinsViewService.UpdateFedViews(data.views);
      $scope.jenkinsViews = jenkinsViewService;
    });
  });

  mySocket.on('jenkinsViews', function(data){
    $scope.$apply(function() {
      jenkinsViewService.UpdateBedViews(data.views);
      $scope.jenkinsViews = jenkinsViewService;
    });
  });

  mySocket.on('jenkinsiOSViews', function(data){
    $scope.$apply(function() {
      jenkinsViewService.UpdateiOSViews(data.views);
      $scope.jenkinsViews = jenkinsViewService;
    });
  });

  mySocket.on('jenkinsFedBuild', function(data) {
    $scope.$apply(function() {
      jenkinsJobService.UpdateFedJobs(data.jobs);
      $scope.jenkinsJobs = jenkinsJobService;
    });
  });

  mySocket.on('jenkinsBuild', function(data) {
    $scope.$apply(function() {
      jenkinsJobService.UpdateBedJobs(data.jobs);
      $scope.jenkinsJobs = jenkinsJobService;
    });
  });

  mySocket.on('jenkinsiOSBuild', function(data) {
    $scope.$apply(function() {
      jenkinsJobService.UpdateiOSJobs(data.jobs);
      $scope.jenkinsJobs = jenkinsJobService;
    });
  });
});

// Homepage controller
dashboardApp.controller('JenkinsViewsCtrl', function ($scope) {});

// Single Jenkins View Controller
dashboardApp.controller('JenkinsSingleViewCtrl', function ($scope,$routeParams){
  $scope.jenkinsKey = $routeParams.key;
  $scope.jenkinsView = $routeParams.viewname;
});
