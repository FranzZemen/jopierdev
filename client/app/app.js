'use strict';

angular.module('bshJopierApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'jopier',
    'pascalprecht.translate'
])
    .config(['$routeProvider','$locationProvider','$translateProvider', '$jopierProvider', function ($routeProvider, $locationProvider, $translateProvider, $jopierProvider) {
        $routeProvider
            .otherwise({
                redirectTo: '/'
            });

        var translations = {
            FIRST : 'First works!',
            SECOND : 'Second works!'
        };

        $translateProvider.translations('en',translations).preferredLanguage('en');

        $locationProvider.html5Mode(true);
    }]);
