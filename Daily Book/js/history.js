/* Changes XML to JSON */

class HistoryController {
    constructor() {
    }

    initialize(scope, state) {
        this.scope = scope;
        this.state = state; // do we need this to be global.
        $('.navbar-fixed-top').hide();
        this.searchMenuShown = false;

        this.registerEvents();
    }

    registerEvents() {
        this.scope.navigateToHome = () => this.navigateToHome();
        this.scope.navigateToBible = () => this.navigateToBible();
        this.scope.navigateToBook = () => this.navigateToBook();
        $(document.body).on('mousedown', (e) => this.showMenu(e));

        // Destroy events handler that are belong to this layout.
        this.scope.$on('$destroy', () => {
            $(document.body).off('mousedown', (e) => this.showMenu(e));
            this.bibleMenuShown = false;
        });
    }

    run() {
        // Read localStorage.getItem('history')
        // history format: 2/17/2017_Mark 3:23-24;2/10/2017_Mark 3:21-22;12-10-2016_Genesis-1-1-1;12-10-2016-Exodus-1-2-1;

        // this.scope.entries.date
        // this.scope.entries.verse
        this.scope.entries = [];
        const history = localStorage.getItem('history'); // 2 17 2017_Mark 3:23-24; 29;2 10 2017_Mark 3:21-22;
        if (history) {
            const historyDateVerseList = history.split(';');
            historyDateVerseList.forEach((dateVerse) => {
                const date_book_chaters = dateVerse.split('_');
                this.scope.entries.push({ date: date_book_chaters[0], chapters: date_book_chaters[1] + ' ' + date_book_chaters[2] });
            });
        }
    }

    navigateToHome() {
        this.state.go('home');
        this.searchMenuShown = false;
    }

    navigateToBible() {
        this.state.go('bible');
        this.searchMenuShown = false;
    }

    navigateToBook() {
        this.state.go('book');
        this.searchMenuShown = false;
    }

    hideShowMenu() {
        // Angular has timing issue that event hanlder on the navigation UI isn't run if 
        // a navigation UI is hidden.
        $('.navbar-fixed-top').hide();
        this.searchMenuShown = false;
    }

    showMenu(e) {
        e.preventDefault();
        if (e.clientY < window.innerHeight / 10) {
            if (!this.searchMenuShown) {
                $('.navbar-fixed-top').show();
                this.searchMenuShown = true;
            }
        } else if (this.searchMenuShown) {
            this.hideShowMenu();
            this.searchMenuShown = false;
        }
    }
}

