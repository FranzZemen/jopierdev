'use strict';

angular.module('bshJopierApp')
  .controller('TopControllerCtrl', function ($scope,$jopier) {
        $scope.val = "FIRST";
        $scope.val2 = "SECOND";

        $scope.toggleJopier = function() {
            if ($('.jopier-button').is(':visible')) {
                $jopier.toggleActive(false);
            } else {
                $jopier.toggleActive(true);
            }
        };
  });
