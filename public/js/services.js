dashboardApp.factory('jenkinsViewService', function() {
    var jenkinsViewService = {};
    jenkinsViewService['fed'] = [];
    jenkinsViewService['bed'] = [];
    jenkinsViewService['ios'] = [];

    jenkinsViewService.UpdateFedViews = function (value) {
       jenkinsViewService['fed'] = value;
    };

    jenkinsViewService.UpdateBedViews = function (value) {
       jenkinsViewService['bed'] = value;
    };

    jenkinsViewService.UpdateiOSViews = function (value) {
       jenkinsViewService['ios'] = value;
    };

    return jenkinsViewService;
});

dashboardApp.factory('jenkinsJobService', function() {
    var jenkinsJobService = {};
    jenkinsJobService['fed'] = [];
    jenkinsJobService['bed'] = [];
    jenkinsJobService['ios'] = [];

    jenkinsJobService.UpdateFedJobs = function (value) {
       jenkinsJobService['fed'] = value;
    };

    jenkinsJobService.UpdateBedJobs = function (value) {
       jenkinsJobService['bed'] = value;
    };

    jenkinsJobService.UpdateiOSJobs = function (value) {
       jenkinsJobService['ios'] = value;
    };

    return jenkinsJobService;
});
