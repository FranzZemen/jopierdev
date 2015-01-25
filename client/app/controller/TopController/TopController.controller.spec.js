'use strict';

describe('Controller: TopControllerCtrl', function () {

  // load the controller's module
  beforeEach(module('bshJopierApp'));

  var TopControllerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TopControllerCtrl = $controller('TopControllerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
