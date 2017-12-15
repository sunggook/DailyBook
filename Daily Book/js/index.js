function getObject(ctrlName, stateName) {
    const name = ctrlName || 'bibleController';

    if (stateName) {
        let locationHistory = localStorage.getItem('locationHistory');
        if (locationHistory) {
            let control = locationHistory.slice(0, locationHistory.indexOf(','));
            if (!control || control !== stateName) {
                // It prevents chapters from added sequentially.
                locationHistory = stateName + "," + locationHistory;
            }
        } else {
            locationHistory = stateName + ","
        }

        localStorage.setItem('locationHistory', locationHistory);
    }

    switch (name) {
        case 'homeController':
            return new HomeController();
        case 'bibleController':
            return new BibleController();
        case 'bookController':
            return new BookController();
        case 'chapterController':
            return new ChapterController();
        case 'versionsController':
            return new VersionsController();
        case 'searchController':
            return new SearchController();
        case 'historyController':
            return new HistoryController();
        default:
            throw 'unexpected';
    }
    

    return;
}

var app = angular.module("bibleModule", ["ui.router"])
                .config(function ($stateProvider, $locationProvider) {
                    $stateProvider
                        .state("home", {
                            url: "/home",
                            templateUrl: "Pages/home.html",
                            controller: "homeController",
                            controllerAs: "homeCtrl"
                        })
                        .state("bible", {
                            url: "/bible",
                            templateUrl: "Pages/bible.html",
                            controller: "bibleController",
                            controllerAs: "bibleCtrl"
                        })
                        .state("book", {
                            url: "/book",
                            templateUrl: "Pages/book.html",
                            controller: "bookController",
                            controllerAs: "bookCtrl"
                        })
                        .state("chapter", {
                            url: "/chapter",
                            templateUrl: "Pages/chapter.html",
                            controller: "chapterController",
                        })
                        .state("versions", {
                            url: "/versions",
                            templateUrl: "Pages/versions.html",
                            controller: "versionsController"
                        })
                        .state("search", {
                            url: "/search",
                            templateUrl: "Pages/search.html",
                            controller: "searchController"
                        })
                        .state("history", {
                            url: "/history",
                            templateUrl: "Pages/history.html",
                            controller: "historyController"
                        })

                    $locationProvider.html5Mode(true);
                })
                .controller("homeController", function ($scope, $rootScope, $state) {
                    let home = getObject('homeController', 'home');
                    home.initialize($scope, $state);
                    home.run();
                })
                .controller("bibleController", function ($scope, $state) {
                    let bible = getObject('bibleController', 'bible');
                    bible.initialize($scope, $state);
                    bible.run();
                })
                .controller("bookController", function ($scope, $state) {
                    let indexer = getObject('bookController', 'book');
                    indexer.initialize($scope, $state);
                    indexer.run();
                })
                .controller("chapterController", function ($scope, $rootScope, $state) {
                    let indexer = getObject('chapterController', 'chapter');
                    indexer.initialize($scope, $state, $rootScope);
                    indexer.run();
                })
                .controller("versionsController", function ($scope, $state) {
                    let versions = getObject('versionsController', 'versions');
                    versions.initialize($scope, $state);
                    versions.run();
                })
                .controller("searchController", function ($scope, $state) {
                    let search = getObject('searchController', 'search');
                    search.initialize($scope, $state);
                    search.run();
                })
                .controller("historyController", function ($scope, $state) {
                    let history = getObject('historyController', 'history');
                    history.initialize($scope, $state);
                    history.run();
                })

let $myState = null;
app.run(['$state', '$rootScope', function ($state, $rootScope) {
    $myState = $state;
    $state.transitionTo('home');
    localStorage.removeItem('locationHistory');
}])

app.directive('ngRightClick', function ($parse) {
    return function (scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function (event) {
            scope.$apply(function () {
                event.preventDefault();
                fn(scope, { $event: event });
            });
        });
    };
});

let isPhone = false;
if (Windows.Phone) {
    isPhone = true;
    var backButton = Windows.Phone.UI.Input.HardwareButtons,
        event = "backpressed";
} else if(Windows.UI.Core.SystemNavigationManager){
    //Desktop environment
    var systemNavigation = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
    systemNavigation.appViewBackButtonVisibility = 'visible';
    var backButton = systemNavigation,
        event = "backrequested";
}
backButton.addEventListener(event, (e) => {
    let locationHistory = localStorage.getItem('locationHistory');
    locationHistory = locationHistory.slice(locationHistory.indexOf(',') + 1);
    // "home,history,home,search"
    if (locationHistory) {
        let index = locationHistory.indexOf(",");
        if (index !== -1) {
            let control = locationHistory.slice(0, index);
            locationHistory = locationHistory.slice(index + 1);
            localStorage.setItem('locationHistory', locationHistory);

            // prevent default behavior of app termination.
            e.detail[0].handled = true;
            $myState.transitionTo(control);
        }
    }
}, false);

