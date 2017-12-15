class SearchController {
    constructor() {
        // table contents
        this.books = [];
    }

    initialize(scope, state) {
        this.scope = scope;
        this.state = state; // do we need this to be global.
        this.searchMenuShown = false;
        $('.navbar-fixed-top').hide();

        this.registerEvents();

        // create wobworker
        this.worker = new Worker("/js/searchWorker.js");
    }

    registerEvents() {
        this.scope.navigateToHome = () => this.navigateToHome();
        this.scope.navigateToBible = () => this.navigateToBible;
        this.scope.navigateToBook = () => this.navigateToBook;
        this.scope.changeFontSize = (size) => this.changeFontSize(size);

        document.body.onmousedown = (e) => this.showMenu(e);
        $('#button-search').on('click', (e) => this.searchWords(e));

        // hide the result box
        $('#div-result').hide();
    }

    run() {
        if (!this.books.length) {
            let http = new XMLHttpRequest();
            const bookPath = "book/bibleBookList.json";
            http.open("GET", bookPath, false);
            http.send();

            this.books.push('All');
            this.books.push('Old Testament');
            this.books.push('New Testament');
            JSON.parse(http.response).books.forEach((book) => {
                this.books.push(book);
            })
        }

        this.scope.books = this.books;

        // If this is first search after installation, then we need to build
        // the DB.
        const db = window.localStorage.getItem('dbCreated1');
        if (!db) {
            // Show waiting icon
            $('#button-id').html(' Building...');
            $("#waiting-id").show();

            // Post message to the web worker.
            this.worker.onmessage = (e) => {
                $("#waiting-id").hide();
                if (e.data.command === 'build' && e.data.results === 'success') {
                    window.localStorage.setItem('dbCreated', { built: 'yes' });
                } else {
                    console.log('Failed to create searching DB');
                }
            }
            this.worker.postMessage({ command: 'build' });

        } else {
            $('#button-id').html(' Searching...');
            $('#waiting-id').hide();
        }
    }

    navigateToHome() {
        this.searchMenuShown = false;
        this.state.go('home');
        this.hideShowMenu();
    }

    navigateToBible() {
        this.searchMenuShown = false;
        this.state.go('bible');
        this.hideShowMenu();
    }

    navigateToBook() {
        this.searchMenuShown = false;
        this.state.go('book');
        this.hideShowMenu();
    }

    hideShowMenu() {
        // Angular has timing issue that event hanlder on the navigation UI isn't run if 
        // a navigation UI is hidden.
        $('.navbar-fixed-top').hide();
        this.searchMenuShown = false;
    }

    changeFontSize(size) {
        $('.verse-text').css('font-size', size);
        this.hideShowMenu();
    }

    showMenu(e) {
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

    searchWords() {
        this.worker.onmessage = (e) => {
            $('#waiting-id').hide();

            $('#div-result').hide();
            if (e.data.results === 'success') {
                this.displayResults(e.data.message);
            } else {
                this.scope.results = "No Results";
            }
        }

        // Searching words.
        const words = $("#input-search").val();
        const searchWords = words.split(' ');

        // Get scoped book info if is other than default (all).
        const scope = $('#book-selection').val();

        // Sent message to the web worker
        $('#waiting-id').html(' Searching...');
        $('#waiting-id').show();
        this.worker.postMessage({ command: 'search', scope: scope, words: searchWords });
    }

    displayResults(results) {
        // "0,12,1", "Exdus,1,23"
        let resultList = [];

        // There is case where one verse contains same word multiple times, it needs to 
        // show single verse in this case though.
        let preVerse = '';
        if (results) {
            results.forEach((verse) => {
                const verses = verse.split(',');
                const text = bibleBooks.findVerse(verses[0], verses[1], verses[2]);
                if (text !== '') {
                    if (preVerse !== verse) {
                        let bookName = bibleBooks.findBookName(verses[0]);
                        resultList.push(bookName + " " + (parseInt(verses[1]) + 1) + ": " +
                            (parseInt(verses[2]) + 1) + "  " + text);
                        preVerse = verse;
                    }
                }
            });
        }

        this.scope.results = resultList;
        this.scope.$apply();
        $('#div-result').show();
    }
}

