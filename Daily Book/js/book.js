/// <reference path="../script/jquery-3.1.1.js" />

class BookController {
    constructor() {
    }

    initialize($scope, $state) {
        this.scope = $scope;
        this.state = $state;

        const bookJson = localStorage.getItem('book');
        if (bookJson && bookJson.length > "{}".length) {
            // it already has bibleBook object
            const data = JSON.parse(bookJson);
            this.bookName = data.bookName;
            this.chapter = data.chapter;
        } else {
            // It should load the bibleBook now.
            bibleBooks.readBibleJson();
            this.bookName = "Genesis";
            this.chapter = bibleBooks.bible.find(this.bookName);
        }

        this.scope.bookName = this.bookName;
        this.scope.navigateToHome = () => this.navigateToHome();
        this.scope.navigateToBible = () => this.navigateToBible();

        this.bookMenuShown = false;
        $('.navbar-fixed-top').hide();

        $(document.body).on('mousedown', (e) => this.showMenu(e));

        // Destroy events handler that are belong to this layout.
        this.scope.$on('$destroy', () => {
            $(document.body).off('mousedown', (e) => this.showMenu(e));
            this.bibleMenuShown = false;
        });
    }

    run() {
        let index = 1;
        let chapterIndexes = [];
        const totalChapters = this.chapter.length ? this.chapter.length : 1;
        while (index <= totalChapters + 2) { // 66 + 2 => 68 is divisible by 4.
            let group = {}

            for (var i = 0; i < 3; i++) {
                const item = 'item' + i.toString();
                if (index <= totalChapters) {
                    group[item] = {
                        index: index.toString()
                    }
                } else {
                    // we need to fill in the table to the end so ng-repeat could work.
                    group[item] = {
                        index: '',
                    }
                }
                index++;
            }
            chapterIndexes.push(group);
        }

        this.scope.indexes = chapterIndexes;
        this.scope.navigateToChapter = (e) => this.navigateToChapter(e);

        // Set predecided fontSize.
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize !== undefined) {
            // There is no deterministic event for angularjs to trigger after finishing
            // drawing. We here use setTimeout.
            setTimeout(() => {
                $('.book-table').css('font-size', fontSize);
            }, 100);
        }
    }

    navigateToChapter(chapterNumber) {
        const data = {
            chapterNumber: chapterNumber,
            bookName: this.bookName,
            chapters: this.chapter
        };

        localStorage.setItem('chapter', JSON.stringify(data));
        this.state.go('chapter');
        this.hideShowMenu();
    }

    navigateToHome() {
        this.state.go('home');
        this.hideShowMenu();
    }

    navigateToBible() {
        this.state.go('bible');
        this.hideShowMenu();
    }

    hideShowMenu() {
        // Angular has timing issue that event hanlder on the navigation UI isn't run if 
        // a navigation UI is hidden.
        $('.navbar-fixed-top').hide();
        this.bookMenuShown = false;
    }

    showMenu(e) {
        e.preventDefault();
        if (e.clientY < window.innerHeight / 10) {
            if (!this.bookMenuShown) {
                $('.navbar-fixed-top').show();
                this.bookMenuShown = true;
            }
        } else if (this.bookMenuShown) {
            this.hideShowMenu();
            this.bookMenuShown = false;
        }
    }
}

