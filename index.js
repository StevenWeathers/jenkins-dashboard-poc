var moment = require('moment');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var fedDashboard = io.of('/dashboard');

var currentWeather = {};
var jenkinsJobs = {};

// Setup Weather
currentWeather['eventName'] = 'weather';
currentWeather['cityId'] = '4480125';
currentWeather['data'] = {};

// Setup FED Jenkins Builds
jenkinsJobs['fed'] = {};
jenkinsJobs['fed']['url'] = 'http://somedomain.com/fed/';
jenkinsJobs['fed']['eventName'] = 'jenkinsFedBuild';
jenkinsJobs['fed']['views'] = [];
jenkinsJobs['fed']['viewsEventName'] = 'jenkinsFedViews';
jenkinsJobs['fed']['jobs'] = {};

/**
 * Get the Current Weather for Mooresville NC
 */
getWeather = function(){
  currentWeather['data'] = {};
  request({url:'http://api.openweathermap.org/data/2.5/weather?id='+currentWeather['cityId']+'&units=imperial', 'json':true}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      currentWeather['data'] = body;
    } else {
      console.log('weather error');
    }
    fedDashboard.emit(currentWeather['eventName'], {"weather": currentWeather['data']});
  });
};

/**
 * Get Jenkins "Views" Data
 * TODO - Consider deprecating for the following call as a single every 5 second call
 * in place of the current getJenkinsJobs call
 * api/json?tree=views[name,url,jobs[name,color,lastBuild[number,executor[progress]]]]
 * @param  {String} keyName the name of the key in the jenkinsJobs object
 */
getJenkinsViews = function(keyName) {
  jenkinsJobs[keyName]['views'] = [];
  request({url:jenkinsJobs[keyName]['url']+'api/json?tree=views[url,name]', 'json':true}, function (error, response, body) {
    if (!error && response.statusCode == 200 && typeof body.views === 'object') {
      body.views.forEach(function(view){
        var dashboardUrl = '/#/jenkins/'+keyName+'/view/'+view.name;
        view.dashboardUrl = dashboardUrl;
        jenkinsJobs[keyName]['views'].push(view);
      });
      fedDashboard.emit(jenkinsJobs[keyName]['viewsEventName'], {views: jenkinsJobs[keyName]['views']});
    } else {
      console.log('jenkins view '+keyName+' error');
    }
  });
};

/**
 * [getJenkinsJobs description]
 * @param  {String} keyName  the name of the key in the jenkinsJobs object
 */
getJenkinsJobs = function(keyName) {
  var buildingColors = ['notbuilt_anime', 'red_anime', 'yellow_anime','blue_anime'];
  var jobObject = jenkinsJobs[keyName]['jobs'];
  var eventName = jenkinsJobs[keyName]['eventName'];

  jobObject['jobs'] = {};

  request({url: jenkinsJobs[keyName]['url'] + 'api/json?tree=views[name,url,jobs[name,color,url,lastBuild[number,url,executor[progress],result,timestamp]]]', 'json':true}, function (error, response, body) {
    if (!error && response.statusCode == 200 && typeof body.views === 'object') {
      body.views.forEach(function(view){
        jobObject[view.name] = {};
        jobObject[view.name]['active'] = [];
        jobObject[view.name]['failed'] = [];
        jobObject[view.name]['unstable'] = [];
        jobObject[view.name]['success'] = [];
        jobObject[view.name]['status'] = {};
        jobObject[view.name]['status']['active'] = 0;
        jobObject[view.name]['status']['failed'] = 0;
        jobObject[view.name]['status']['unstable'] = 0;
        jobObject[view.name]['status']['success'] = 0;

        view.jobs.forEach(function(job){
          if (buildingColors.indexOf(job.color) > -1){
            ++jobObject[view.name]['status']['active'];
            jobObject[view.name]['active'].push(job);
          }
          if (job.lastBuild){
            var finalTimestamp = moment(job.lastBuild.timestamp).format('MM/DD/YY h:mm a');
            job.lastBuild.timestamp = finalTimestamp;
            if (job.lastBuild.result === 'FAILURE') {
              ++jobObject[view.name]['status']['failed'];
              jobObject[view.name]['failed'].push(job);
            } else if (job.lastBuild.result === 'UNSTABLE') {
              ++jobObject[view.name]['status']['unstable'];
              jobObject[view.name]['unstable'].push(job);
            } else if (job.lastBuild.result === 'SUCCESS') {
              ++jobObject[view.name]['status']['success'];
              jobObject[view.name]['success'].push(job);
            }
          }
        });
      });
    } else {
      console.log('jenkins job '+keyName+' error');
    }
    fedDashboard.emit(eventName, {jobs: jobObject});
  });
};

setInterval(function(){
  getJenkinsJobs('fed');
}, 5000); // 5 seconds

setInterval(function(){
  getWeather();
}, 300000); // 5 minute

fedDashboard.on('connection', function(socket){
  fedDashboard.emit(currentWeather['eventName'], {"weather": currentWeather['data']});
  getJenkinsViews('fed');

  fedDashboard.emit(jenkinsJobs['fed']['eventName'], {jobs: jenkinsJobs['fed']['jobs']});
});

app.use(express.static(process.cwd() + '/public'));
app.set('view engine', 'jade');

app.get('/', function(req, res){
  res.render('index');
});

app.get('/:keyname/view/:viewname', function(req, res){
  var viewName = req.params.viewname;
  var keyName = req.params.keyname;
  res.redirect('/#/jenkins/'+keyName+'/view/'+viewName+'/');
});

app.get('/getConsoleOutput', function(req, res){
  var consoleUrl = req.query.lastBuildUrl + 'logText/progressiveHtml?start=0';

  request({url:consoleUrl}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body);
    } else {
      console.log('getConsoleOutput error');
      res.send('getConsoleOutput error');
    }
  });
});

http.listen(8085, function(){
  getWeather();
  getJenkinsJobs('fed');
  console.log('listening on *:8085');
});
