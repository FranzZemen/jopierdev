/**
 * Created by Franz on 1/24/2015.
 */

(function () {
    'use strict';

    function getOffsetRect(element) {
        var htmlElement = element[0];
        // (1) Get the enclosing rectangle.
        var box = htmlElement.getBoundingClientRect()
        var body = document.body
        var docElem = document.documentElement
        // (2) Calculate the page scroll. All browsers except IE<9 support `pageXOffset/pageYOffset`, and in IE when DOCTYPE is set, the scroll can be taken from documentElement(<html>), otherwise from `body` - so we take what we can.
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
        // (3) The document (`html` or `body`) can be shifted from left-upper corner in IE. Get the shift.
        var clientTop = docElem.clientTop || body.clientTop || 0
        var clientLeft = docElem.clientLeft || body.clientLeft || 0
        // (4) Add scrolls to window-relative coordinates and substract the shift of `html/body` to get coordinates in the whole document.
        var top = box.top + scrollTop - clientTop
        var left = box.left + scrollLeft - clientLeft
        return {top: Math.round(top), left: Math.round(left)}
    }

    angular.module('jopier', [])
        // ===============
        // Jopier Provider
        // ===============
        .provider('$jopier', function () {

            var buttonTemplate = '<button class="jopier-button" ng-click="editContent()" ng-show="renderButton">Joppy It</button>';

            var buttonOffsetLeftPixels = -10;
            var buttonOffsetTopPixels = -25;
            var formOffsetLeftPixels = +10;
            var formOffsetTopPixels = +25;

            var formTemplate =
                '<div class="jopier-form" ng-show="renderForm">' +
                '<div class="jopier-form-container"><form name="jopierForm" novalidate>' +
                '<div class="jopier-form-title"><span>Edit Content (this form is resizeable)</span></div>' +
                '<div class="jopier-form-control"><label>Key</label>:</div><div class="jopier-form-control"><input type="text" name="key" ng-model="key" disabled/></div>' +
                '<div class="jopier-form-control"><label>Content</label>:</div><div class="jopier-form-control"><textarea name="content" ng-model="content"/></div>' +
                '<div class="jopier-form-control jopier-form-buttons"><input type="submit" value="Save" ng-click="save()">&nbsp;&nbsp;<input type="button" value="Cancel" ng-click="cancel()"></div>' +
                '</form></div>' +
                '</div>';


            this.formTemplate = function (template) {
                if (template) {
                    formTemplate = template;
                } else {
                    return formTemplate;
                }
            };

            this.buttonTemplate = function (template) {
                if (template) {
                    buttonTemplate = template;
                } else {
                    return buttonTemplate;
                }
            };

            this.buttonOffsetLeftPixels = function (number) {
                buttonOffsetLeftPixels = number;
            };

            this.buttonOffsetTopPixels = function (number) {
                buttonOffsetTopPixels = number;
            };
            this.formOffsetLeftPixels = function (number) {
                formOffsetLeftPixels = number;
            };

            this.formOffsetTopPixels = function (number) {
                formOffsetTopPixels = number;
            };

            // ==============
            // Jopier Service
            // ==============
            function JopierService($q,$http) {
                var self = this; // Disable warning in ide on using this.
                self.formTemplate = function () {
                    return formTemplate;
                };
                self.buttonTemplate = function () {
                    return buttonTemplate;
                };
                self.content = function (key, content) {
                    if (content) {
                        return $q(function serviceGetContentSuccess(resolve, reject) {
                            $http.post('/jopier/' + key, {content:content}).
                                success(function (data, status, headers, config) {
                                    resolve('Success');
                            }).error(function (data, status, headers, config) {
                                    var err = new Error('Status ' + status + ': ' + data.message);
                                    reject(err);
                            });
                        });
                    } else {
                        return $q(function serviceGetContentError(resolve, reject) {
                            $http.get('/jopier/' + key).
                                success(function (data, status, headers, config) {
                                resolve(data.content);
                            }).error(function (data, status, headers, config) {
                                var err = new Error('Status ' + status + ': ' + data.message);
                                reject(err);
                            });
                        });
                    }
                };
                self.buttonOffsetLeftPixels = function () {
                    return buttonOffsetLeftPixels;
                };
                self.buttonOffsetTopPixels = function () {
                    return buttonOffsetTopPixels;
                };
                self.formOffsetLeftPixels = function () {
                    return formOffsetLeftPixels;
                };
                self.formOffsetTopPixels = function () {
                    return formOffsetTopPixels;
                };
            }


            this.$get = ['$q','$http', function ($q,$http) {
                return new JopierService($q, $http);
            }];
        })
        // ================
        // Jopier Directive
        // ================
        .directive('jopier', ['$compile', '$translate', '$jopier', '$interpolate', function ($compile, $translate, $jopier, $interpolate) {
            return {
                // TODO:  change copy of an attribute (img src or translate attribute)
                // TODO:  change copy of an expression, not of the expression itself
                restrict: 'A',
                priority: 10,
                scope: {
                    key: "@"
                },
                link: function (scope, element, attrs) {
                    var button,
                        form;

                    scope.attachTo = element;
                    // Remember the "key" which is the content
                    if (scope.key === undefined || scope.key === '') {
                        scope.key = element.html();
                    }
                    if (/^[{]{2}.+[}]{2}$/i.test(scope.key)) {
                        console.log('matches');
                        scope.key = $interpolate(scope.key)(scope.$parent);
                    }

                    var deregisterHide = scope.$on('jopier-hide', function () {
                        element.removeClass('jopier-target');
                        scope.renderButton = false;
                        scope.renderForm = false;
                    });
                    var deregisterShow = scope.$on('jopier-show', function () {
                        createButton();
                        element.addClass('jopier-target');
                        scope.renderButton = true;
                    });

                    function createButton() {
                        if (!button) {
                            button = $($jopier.buttonTemplate());
                            var linkFunction = $compile(button);
                            $('body').append(linkFunction(scope));
                        }
                    }

                    scope.showForm = function () {
                        if (!form) {
                            form = $($jopier.formTemplate());
                            var linkFunction = $compile(form);
                            $('body').append(linkFunction(scope));
                        }
                        scope.content = '...loading';
                        scope.renderForm = true;
                        $jopier.content(scope.key).then(
                            function (content) {
                                scope.content = content;
                            },
                            function(err) {
                                scope.content = 'Error getting content, check console log: ' + err.message;
                                console.error(err);
                                alert(scope.content);
                            }
                        )
                    };

                    element.on('$destroy', function () {
                        deregisterHide();
                        deregisterShow();
                    });
                }
            };
        }])
        // =======================
        // Jopier Button Directive
        // =======================
        .directive('jopierButton', ['$jopier', function ($jopier) {
            return {
                restrict: 'C',
                link: function (scope, element, attrs) {
                    element.mouseover(function () {
                        scope.attachTo.addClass('jopier-target-hover');
                    });
                    element.mouseleave(function () {
                        scope.attachTo.removeClass('jopier-target-hover');
                    });
                    element.on('$destroy', function () {
                        element.off('mouseover');
                        element.off('mouseleave');
                    });
                    var offsetRect = getOffsetRect(scope.attachTo);
                    element.css('left', (offsetRect.left + $jopier.buttonOffsetLeftPixels()) + 'px');
                    element.css('top', (offsetRect.top + $jopier.buttonOffsetTopPixels()) + 'px');

                    scope.editContent = function () {
                        scope.showForm();
                    };

                }
            };
        }])
        // =====================
        // Jopier Form Directive
        // =====================
        .directive('jopierForm', ['$jopier', function ($jopier) {
            return {
                restrict: 'C',
                link: function (scope, element, attrs) {

                    element.mouseover(function () {
                        scope.attachTo.addClass('jopier-target-hover');
                    });
                    element.mouseleave(function () {
                        scope.attachTo.removeClass('jopier-target-hover');
                    });


                    element.on('$destroy', function () {
                        element.off('mouseover');
                        element.off('mouseleave');
                    });

                    var offsetRect = getOffsetRect(scope.attachTo);
                    element.css('left', (offsetRect.left + $jopier.formOffsetLeftPixels()) + 'px');
                    element.css('top', (offsetRect.top + $jopier.formOffsetTopPixels()) + 'px');

                    scope.cancel = function () {
                        scope.content = '';
                        scope.renderForm = false;
                    };
                    scope.save = function () {
                        $jopier.content(scope.key, scope.content). then(
                            function () {
                                scope.attachTo.html(scope.content);
                                scope.content = '';
                                scope.renderForm = false;
                            },
                            function (err) {
                                scope.content = 'Error saving content, check console log: ' + err.message;
                                console.error(err);
                                alert(scope.content);
                            }
                        );
                    }
                }
            };
        }]);
})();
