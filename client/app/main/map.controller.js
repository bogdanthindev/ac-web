/* js-hint hacks. */
/* jshint unused:false  */
'use strict';

angular.module('avalancheCanadaApp')
    .controller('MapCtrl', function ($rootScope, $scope, $timeout, $templateCache, $state, acForecast, acObservation, obs, auth, $location) {
        angular.extend($scope, {
            current: {},
            drawer: {
                visible: false,
                enabled: true
            },
            filters: {
                obsPeriod: '7-days'
            },
            regionsVisible: true
        });

        if($state.current.data && $state.current.data.isLogin) {
            if(!auth.isAuthenticated) {
                auth.signin({authParams: {scope: 'openid profile'}});

                auth.config.auth0lib.on('hidden', function () {
                    if(!auth.isAuthenticated) {
                        $state.go('ac.map');
                    }
                });
            } else {
                $state.go('ac.map');
            }
        }

        if($state.current.data && $state.current.data.isShare) {
            $scope.current.ob = obs[0];
        } else {
            $scope.obs = obs;
        }

        $scope.showMore = function () {
            $rootScope.pageClass = 'page-down';
            $state.go('ac.more');
        };

        acForecast.fetch().then(function (forecasts) {
            $scope.regions = forecasts;
        });

        $scope.$on('ac.min.obclicked', function (e, obHtml) {
            var $modal = $('#mobileMapPopup');

            if(!$modal.length){
                var modalTemplate = $templateCache.get('min-report-popup-modal.html');
                var $modal = $(modalTemplate);
                $(document.body).append($modal);
            }

            $modal.find('.modal-body').html(obHtml);
            $modal.modal('show');
        });

        $scope.$watch('current.region', function (newRegion, oldRegion) {
            if(newRegion && newRegion !== oldRegion) {
                $scope.drawer.visible = false;
                $scope.imageLoaded = false;

                if(!newRegion.feature.properties.forecast) {
                    acForecast.getOne(newRegion.feature.id).then(function (forecast) {
                        newRegion.feature.properties.forecast = forecast;
                    });
                }

                $timeout(function () {
                    $scope.drawer.visible = true;
                }, 800);
            }
        });

        $scope.dateFilters = ['7-days', '14-days', '30-days'];
        $scope.toggleFilter = function (filter) {
            if(filter){
                var filterType = filter.split(':')[0];
                var filterValue = filter.split(':')[1];

                if(filterType === 'obsPeriod' && $scope.filters[filterType] !== filterValue) {
                    $scope.filters[filterType] = filterValue;
                    var period = filterValue.replace('-', ':');

                    acObservation.byPeriod(period).then(function (obs) {
                        $scope.obs = obs;
                    });

                    $timeout(function () {
                        var i = $scope.dateFilters.indexOf(filterValue);
                        $scope.dateFilters.splice(i, 1);
                        $scope.dateFilters.unshift(filterValue);
                        $scope.expanded = false;
                    }, 0);
                }

            } else {
                if($scope.filters.obsPeriod === '') {
                    $scope.toggleFilter('obsPeriod:' + $scope.dateFilters[0]);
                } else {
                    $scope.obs = [];
                    $scope.filters.obsPeriod = '';
                }
            }
        };

    });
