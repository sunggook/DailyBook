/// <reference path="../script/angular.js" />
/// <reference path="../script/angular-route.min.js" />
let bibleBooks = {
    currentBookName: "",
    chapters: {},
    bible: null,
    state: null, // can it be shared with others?
    add: function (name, chapters) {
        this.chapters[name] = chapters;
    },
    findBook: function (name) {
        if (name in this.chapters) {
            return this.chapters[name];
        }
        return null;
    },
    findVerse: function(bookIndex, chapterIndex, verseIndex) {
        if (!this.bible) {
            this.readBibleJson("American Standard Version");
        }
        let foundText = '';
        const books = this.bible.XMLBIBLE.BIBLEBOOK;
        if (bookIndex in books) {
            const book = books[bookIndex];
            if (chapterIndex in book.CHAPTER) {
                const chapter = book.CHAPTER[chapterIndex];
                if (verseIndex in chapter['VERS']) {
                    foundText = chapter['VERS'][verseIndex]['#text'];
                } else {
                    console.log('Failed to find verse index');
                }
            } else {
                console.log('Failed to find chapter index');
            }
        } else {
            console.log('Failed to find book name by its book index');
        }
        return foundText;
    },
    findBookName: function (bookIndex) {
        if (!this.bible) {
            this.readBibleJson("American Standard Version");
        }

        let bookName = '';
        const books = this.bible.XMLBIBLE.BIBLEBOOK;
        if (bookIndex in books) {
            bookName = books[bookIndex]['-bname'];
        } else {
            console.log('Failed to find book name by its book index');
        }

        return bookName;
    },
    readBibleJson: function (version) {
        if (this.bible == null) {
            let http = new XMLHttpRequest();
            version = version || "American Standard Version";
            version = version.replace(/\s+/g, '');
            const versionPath = "book/" + version + ".json";
            http.open("GET", versionPath, false);
            http.send();

            this.bible = JSON.parse(http.response);
        }
    }
};

// window.bibleBooks = bibleBooks;
// how to share bible book over bible, indexer, and chapter.
// main shared contents: $scope, $state, $bible
// sub shared contents: selected bible book, selected index of the bible.

class BibleController {

    constructor() {
    }

    initialize(scope, state) {
        this.scope = scope;
        this.state = state;

        this.sortByAlphabetEnabled = false;

        this.oldBooks = [];
        this.newBooks = [];

        this.oldBooksSorted = [];
        this.newBooksSorted = [];

        let localVersion = localStorage.getItem('version');

        if (!localVersion || localVersion.length <= "{}".length) {
            localVersion = "American Standard Version";
        }

        if (this.version !== localVersion) {
            this.version = localVersion;
            bibleBooks.bible = null;
        }

        this.scope.bibleVersion = this.version;
    }

    run() {
        bibleBooks.readBibleJson(this.version);

        const jsonBooks = bibleBooks.bible.XMLBIBLE.BIBLEBOOK;
        let index = 0;
        let dec = 0;

        while (index < jsonBooks.length + 2) { // 2 = dec:1 + extra cell;
            let groupBooks = {};

            for (var i = 0; i < 2; i++) {
                const item = 'item' + i.toString();
                if (index !== 39 && index !== 67) { // this is max of old testaments.
                    groupBooks[item] = {
                        name: jsonBooks[index - dec]['-bname'],
                    }

                    // store the chapter with its bible chapter.
                    bibleBooks.add(jsonBooks[index - dec]['-bname'], jsonBooks[index - dec]['CHAPTER']);
                } else {
                    // we need to fill in the table to the end so ng-repeat could work.
                    groupBooks[item] = {
                        name: " ",
                        chapter: {}
                    }
                    dec++;
                }
                index++;
            }
            if (index <= 40) {
                this.oldBooks.push(groupBooks);
            } else {
                this.newBooks.push(groupBooks);
            }
        }

        this.scope.oldBooks = this.oldBooks;
        this.scope.newBooks = this.newBooks;

        this.scope.openChapter = (bookName) => {
            const chapter = bibleBooks.findBook(bookName);
            this.navigateToIndex(bookName, chapter);
        };

        this.sortByAlphabetEnabled = localStorage.getItem('sortBy');

        if (this.sortByAlphabetEnabled === "true") {
            // Make it reverse so sortByAlphabet could show alphabet.
            this.sortByAlphabetEnabled = false;
            this.sortByAlphabet();
        }

        // Set predecided fontSize.
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize !== undefined) {
            // There is no deterministic event for angularjs to trigger after finishing
            // drawing. We here use setTimeout.
            setTimeout(() => {
                this.changeFontSize(fontSize);
            }, 10);
        }

        this.register();
    }

    register() {
        this.scope.navigateToHome = () => this.navigateToHome();
        this.scope.sortByAlphabet = () => this.sortByAlphabet();

        this.scope.changeFontSize = (size) => this.changeFontSize(size);

        $(document.body).on('mousedown', (e) => this.showMenu(e));
        $('.navbar-fixed-top').hide();

        // Destroy events handler that are belong to this layout.
        this.scope.$on('$destroy', () => {
            $(document.body).off('mousedown', (e) => this.showMenu(e));
            this.bibleMenuShown = false;
        });
    }

    navigateToIndex(bookName, chapter) {
        bibleBooks.currentBookName = bookName;
        const data = {
            bookName: bookName,
            chapter: chapter
        }
        localStorage.setItem('book', JSON.stringify(data));
        this.state.go('book');
    }

    navigateToHome() {
        this.state.go('home');
        this.hideShowMenu();
    }

    sortByAlphabet() {
        if (this.sortByAlphabetEnabled) {
            // Sort the bible with bible orders.
            this.scope.oldBooks = this.oldBooks;
            this.scope.newBooks = this.newBooks;
        } else {
            // Sort the bible alphabetically.
            if (this.oldBooksSorted.length === 0) {
                function populateBooks(books, booksTargetSorted) {
                    let bookList = [];
                    books.forEach((nameGroup) => {
                        for (let key in nameGroup) {
                            if (key.indexOf("item") !== -1 && nameGroup[key].name !== " ") {
                                bookList.push(nameGroup[key].name);
                            }
                        }
                    });

                    bookList = bookList.sort();

                    let index = 0;
                    while (index <= bookList.length) {
                        let groupBooks = {};
                        for (var i = 0; i < 2; i++) {
                            const item = 'item' + i.toString();
                            if (index !== bookList.length) {
                                groupBooks[item] = {
                                    name: bookList[index],
                                }
                            } else {
                                groupBooks[item] = {
                                    name: "",
                                }
                            }
                            index++;
                        }
                        booksTargetSorted.push(groupBooks);
                    }
                }
                populateBooks(this.oldBooks, this.oldBooksSorted);
                populateBooks(this.newBooks, this.newBooksSorted);
            }

            this.scope.oldBooks = this.oldBooksSorted;
            this.scope.newBooks = this.newBooksSorted;
        }

        this.sortByAlphabetEnabled = !this.sortByAlphabetEnabled;
        localStorage.setItem('sortBy', this.sortByAlphabetEnabled);

        // Set predecided fontSize.
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize !== undefined) {
            // There is no deterministic event for angularjs to trigger after finishing
            // drawing. We here use setTimeout.
            setTimeout(() => {
                this.changeFontSize(fontSize);
            }, 10);
        }
        this.hideShowMenu();
    }

    hideShowMenu() {
        // Angular has timing issue that event hanlder on the navigation UI isn't run if 
        // a navigation UI is hidden.
        $('.navbar-fixed-top').hide();
        this.bibleMenuShown = false;
    }

    showMenu(e) {
        e.preventDefault();
        if (e.clientY < window.innerHeight / 10) {
            if (!this.bibleMenuShown) {
                $('.navbar-fixed-top').show();
                this.bibleMenuShown = true;
            }
        } else if (this.bibleMenuShown) {
            this.hideShowMenu();
            this.bibleMenuShown = false;
        }
    }

    changeFontSize(size) {
        $('.book-name').css('font-size', size);
        localStorage.setItem('fontSize', size);
    }
}

