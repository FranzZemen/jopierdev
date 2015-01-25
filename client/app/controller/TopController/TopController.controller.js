'use strict';

angular.module('bshJopierApp')
  .controller('TopControllerCtrl', function ($scope) {
        $scope.val = "FIRST";
        $scope.val2 = "SECOND";

        $scope.toggleJopier = function() {
            if ($('.jopier-button').is(':visible')) {
                $scope.$root.$broadcast('jopier-hide');
            } else {
                $scope.$root.$broadcast('jopier-show');
                $scope.val = Math.random() < .5 ? "SECOND": "FIRST";
            }
        };
  });
