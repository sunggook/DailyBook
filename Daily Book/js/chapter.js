
class ChapterController {
    constructor() {
        // table contents
        this.chapterMenuShown = false;
        this.contextMenuShown = false;
        this.state = null;
        this.scope = null;
        this.textSelected = {};
        this.chapters = null;
        this.underlines = [];
        this.startX = 0;

        this.contextMenuRect = {
            xOffset: 0,
            yOffset: 0,
            width: 0,
            height: 0
        }

        this.name = 'this is test';
    }

    initialize(scope, state) {
        this.scope = scope;
        this.state = state; // do we need this to be global.

        const chapterJson = localStorage.getItem('chapter');
        if (chapterJson && chapterJson.length > "{}".length) {
            // it already has bibleBook object
            const data = JSON.parse(chapterJson);
            this.scope.bookName = data.bookName;
            this.scope.chapterNumber = parseInt(data.chapterNumber);
            this.chapters = data.chapters;
        } else {
            // It should load the bibleBook now.
            bibleBooks.readBibleJson();
            this.bookName = "Genesis";
            this.scope.bookName = this.bookName;
            this.scope.chapterNumber = 1;
            this.chapters = bibleBooks.bible.find(this.bookName);
        }

        // Hightlights that is already set as underline.
        this.underlines.length = 0; // clean up.
        const highLightKey = this.scope.bookName + '_' + this.scope.chapterNumber;
        const highLightJson = localStorage.getItem(highLightKey);
        if (highLightJson && highLightJson.length > "{}".length) {
            this.underlines = JSON.parse(highLightJson);
        }

        if (!window.SpeechSynthesisUtterance) {
            // If SpeechSynthesisUtterance isn't supported, then hide the read feature
            $(".menu-lastitem").hide();
        }

        this.readProgress = false;
        this.registerEvents();
    }

    registerEvents() {

        this.scope.navigateToHome = () => this.navigateToHome();
        this.scope.navigateToBible = () => this.navigateToBible();
        this.scope.navigateToBook = () => this.navigateToBook();
        this.scope.changeFontSize = (fontSize) => this.changeFontSize(fontSize);

        this.scope.readingChapter = () => this.readingChapter();
        this.scope.pauseReadingChapter = () => this.pauseReadingChapter();
        this.scope.stopReadingChapter = () => this.stopReadingChapter();
        this.scope.showContextMenu = (e) => this.showContextMenu(e);

        $('.navbar-fixed-top').hide();
        $(document.body).on('mousedown', (e) => this.showMenu(e));

        this.scope.onTextClick = (e, verseIndex) => {
            if (this.textSelected[verseIndex]) {
                this.textSelected[verseIndex].style.color = 'black';
                delete this.textSelected[verseIndex];
            } else {
                this.textSelected[verseIndex] = e.currentTarget;
                this.textSelected[verseIndex].style.color = "blue";
            }
        }

        // touch event for page navigation.
        $(document.body).on('touchstart', '.verse-text', (e) => this.touchStartHandler(e))

        // Touch
        $(document.body).on('touchend', (e) => this.touchEndHandler(e));

        // Click event registr for context menu ui
        $("#contextMenu").on('click', 'a', (e, verseIndex) => this.contextMenuHandler(e, verseIndex));

        // Register destroy
        this.scope.$on('$destroy', () => {
            $(document.body).off('mousedown', (e) => this.showMenu(e));

            // How it removes methods?
            $(document.body).off('touchstart', (e) => this.touchStartHandler);
            $(document.body).off('touchend', (e) => this.touchEndHandler);

            this.chapterMenuShown = false;
        })
    }

    run() {
        // Add verses.
        const chapterLocal = (this.chapters instanceof Array) ? this.chapters[this.scope.chapterNumber - 1] : this.chapters;
        const verses = chapterLocal.VERS;
        let verseArr = [];

        for (var i = 0; i < verses.length; i++) {
            const verse = {
                index: i + 1,
                text: (i + 1).toString() + '    ' + verses[i]['#text']
            }
            verseArr.push(verse);
        }

        this.scope.verses = verseArr;

        // Set predecided fontSize.
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize !== undefined) {
            // There is no deterministic event for angularjs to trigger after finishing
            // drawing. We here use setTimeout.
            setTimeout(() => {
                this.changeFontSize(fontSize);

                // It doesn't work.
                window.scrollTo(0, 0);
                this.scope.$apply();
            }, 100);
        }

        // Underlines if it exists
        if (this.underlines.length > 0) {
            setTimeout(() => {
                // let table = document.getElementById('verseTable');
                let tdList = document.getElementsByTagName('td');

                for (var index = 0; index < tdList.length; index++) {
                    if (this.underlines.indexOf((index + 1).toString()) != -1) {
                        // It is underline td.
                        let classValue = tdList[index].getAttribute('class');

                        // Add underline class for given TD.
                        classValue += ' dotted';
                        tdList[index].setAttribute('class', classValue);
                    }
                }
            }, 100);
        }

        // Show menu info if it is started first time.
        if (document.getElementById('slide-panel')) {
            const chapterJson = localStorage.getItem('started');
            if (chapterJson) {
                $('#slide-panel').css('display', 'none');
            } else {
                $('#slide-panel').on('pointerdown', (e) => this.pointerDownHandler(e));
                localStorage.setItem('started', 'yes');
            }
        }
    }

    pointerDownHandler(e) {
        $('#slide-panel').off('pointerdown', this.pointerDownHandler);
        $('#slide-panel').css('display', 'none');
    }

    touchStartHandler(e) {
        this.startX = e.originalEvent.changedTouches[0].clientX;
    }

    touchEndHandler(e) {
        if (this.startX > 0) {
            let dist = e.originalEvent.changedTouches[0].clientX - this.startX;
            if (dist > 100) {
                this.startX = 0;
                this.navigateToPrev(this.scope.bookName, this.scope.chapterNumber);
            } else if (dist < -100) {
                this.startX = 0;
                this.navigateToNext(this.scope.bookName, this.scope.chapterNumber);
            }
        }
    }

    hideShowMenu() {
        // Angular has timing issue that event hanlder on the navigation UI isn't run if 
        // a navigation UI is hidden.
        $('.navbar-fixed-top').hide();
        this.chapterMenuShown = false;
    }

    showMenu(e) {
        if (e.clientY < window.innerHeight / 10) {
            if (!this.chapterMenuShown) {
                $('.navbar-fixed-top').show();
                this.chapterMenuShown = true;
            }
        } else if (this.chapterMenuShown) {
            this.hideShowMenu();
            this.chapterMenuShown = false;
        }

        // Remove context menu if the click is out of contextMenu box. If the click is made
        // inside the context menu, the handler will hide after selection operation.
        if (this.contextMenuShown) {
            if (!(e.clientX > this.contextMenuRect.left &&
                e.clientX < this.contextMenuRect.right &&
                e.clientY > this.contextMenuRect.top &&
                e.clientY < this.contextMenuRect.bottom)) {

                // Click out of context menu, hide it.
                $("#contextMenu").hide();
                this.contextMenuShown = false;
            }
        }
    }

    navigateToHome() {
        // Store hgihlights
        this.storeUnderlines();
        this.storeChapterOnHistory();
        this.state.go('home');
    }

    navigateToBible() {
        // Store hgihlights
        this.storeUnderlines();
        this.storeChapterOnHistory()
        this.state.go('bible');
    }

    navigateToBook() {
        // Store hgihlights
        this.storeUnderlines();
        this.storeChapterOnHistory()
        this.state.go('book');
    }

    navigateToPrev(bookName, chapterNumber) {
        if (chapterNumber > 1) {
            const data = {
                chapterNumber: chapterNumber - 1,
                bookName: bookName,
                chapters: this.chapters
            };
            this.navigate(this.scope, data);
        } else {
            // it is first page, do nothing now.
            // TODO: It might move to the previous chapter.
        }
    }

    navigateToNext(bookName, chapterNumber) {
        if (chapterNumber < this.chapters.length) {
            const data = {
                chapterNumber: chapterNumber + 1,
                bookName: bookName,
                chapters: this.chapters
            };
            this.navigate(this.scope, data);
        } else {
            // it is first page, do nothing now.
            // TODO: It might move to the previous chapter.
        }
    }

    navigate(store, data) {
        // Reset read location.
        this.readProgress = false;

        // Navigate itself with next/prev chapter only.
        localStorage.setItem('chapter', JSON.stringify(data));

        // Store hgihlights
        this.storeUnderlines();

        // Store to the history
        this.storeChapterOnHistory()

        let chapterController = new ChapterController();
        this.initialize(store, this.state);
        this.run();

        this.state.reload();
    }

    storeUnderlines() {
        // Store underlines.
        if (this.underlines.length > 0) {

            function sort_unique(arr) {
                return arr.sort().filter(function (el, i, a) {
                    return (i == a.indexOf(el));
                });
            }

            // Filter out any wrong doing (double value).
            this.underlines = sort_unique(this.underlines);

            const highLightKey = this.scope.bookName + '_' + this.scope.chapterNumber;
            localStorage.setItem(highLightKey, JSON.stringify(this.underlines));
        }
    }

    changeFontSize(size) {
        $('.verse-text').css('font-size', size);
        $('.verse-number').css('font-size', size);
        localStorage.setItem('fontSize', size);
        this.hideShowMenu();
    }

    readingChapter() {
        if (!window.SpeechSynthesisUtterance) {
            console.log('SpeechSynthesisUtterance is not supported');
            return;
        }
        if (this.readProgress === undefined ||
            this.readProgress === false) {
            // Get message
            const chapterLocal = this.chapters.length === 1 ? this.chapters  : this.chapters[this.scope.chapterNumber - 1];
            const verses = chapterLocal.VERS;
            let message = "";
            for (var i = 0; i < verses.length; i++) {
                message += verses[i]['#text'] + ', ' + ',' ; // ',' give pause to start new line
            }

            // Speech using SpeechSynthesis
            let msg = new SpeechSynthesisUtterance();
            let voices = window.speechSynthesis.getVoices();
            msg.voice = voices[1]; // Note: some voices don't support altering params
            msg.volume = 1; // 0 to 1
            msg.rate = 0.9; // 0.1 to 10
            msg.pitch = 2; //0 to 2
            msg.text = message;
            msg.lang = 'en-US';

            msg.onend = function (e) {
                console.log('Finished in ' + event.elapsedTime + ' seconds.');
                this.readProgress = false;
            };

            this.readProgress = true;

            speechSynthesis.speak(msg);
        } else {
            speechSynthesis.resume();
        }
        this.hideShowMenu();
    }

    stopReadingChapter() {
        speechSynthesis.cancel();
        this.readProgress = false;
        this.hideShowMenu();
    }

    pauseReadingChapter() {
        speechSynthesis.pause();
        this.hideShowMenu();
    }

    storeChapterOnHistory() {
        // Add an new entry, otherwse it will replace the first entry (the latest) with the 
        // extended info.
        function isSameDate(inDate) {
            const dates = Date().split(' ');
            const localDates = inDate.split(' ');
            if (localDates[0] === dates[1] &&
                localDates[1] === dates[2] &&
                localDates[2] === dates[3]) {
                return true;
            }
            return false;
        }

        function getCurrentDate() {
            const dates = Date().split(' ');
            return dates[1] + ' ' + dates[2] + ' ' + dates[3];
        }

        function isChapterRead() {
            if (window.scrollY > 1000) {
                return true;
            }
            return true;
        }

        if (!isChapterRead()) {
            // Page isn't read so we just return.
            return;
        }

        // Leave page, and store the chapter.
        let isNewEntryNeeded = false;
        let isAddEntry = false;
        let dateBookChapterList;
        let newHistory;

        const history = localStorage.getItem('history'); // "Feb 17 2017_1 John_1;2;Feb 15 2017_Mark_1"
        if (history) {
            dateBookChapterList = history.split(';'); // ["Feb 17 2017_1 John_1, 2", "Feb 15 2017_1 John_1"]
            const date_book_chapters = dateBookChapterList[0].split('_');
            const date = date_book_chapters[0];
            const bookName = date_book_chapters[1];
            let chapters = date_book_chapters[2];
            // Check if it is same date
            if (isSameDate(date)) {
                // The store one is same date, we need to update the entry with additional chapter if needed.
                if (this.scope.bookName === bookName) {
                    // book_chapter[1] -  3
                    const chapterList = chapters.split(', ');
                    let foundChapter = false;
                    const chaterNumberStr = this.scope.chapterNumber.toString();
                    for (let chp of chapterList) {
                        if (chp === chaterNumberStr) {
                            foundChapter = true;
                            break;
                        }
                    }

                    if (!foundChapter) {
                        chapters += ', ' + this.scope.chapterNumber;
                        newHistory = date + '_' + bookName + '_' + chapters;
                        isNewEntryNeeded = true;
                    }
                } else {
                    // Different book name, and store new one.
                    // 2 14 2017_Mark 2, 2 14 2017_Judge 3
                    newHistory = date + "_" + this.scope.bookName + '_' + this.scope.chapterNumber;
                    isNewEntryNeeded = true;
                    isAddEntry = true;
                }
            } else {
                // Different date, and store new one.
                newHistory = getCurrentDate() + "_" + this.scope.bookName + '_' + this.scope.chapterNumber;
                isNewEntryNeeded = true;
                isAddEntry = true;
            }
        } else {
            // No history
            newHistory = getCurrentDate() + "_" + this.scope.bookName + '_' + this.scope.chapterNumber;
            isNewEntryNeeded = true;
            isAddEntry = true;
        }

        if (isNewEntryNeeded) {
            let localHistory;

            if (isAddEntry) {
                if (history) {
                    localHistory = newHistory + ';' + history;
                } else {
                    localHistory = newHistory;
                }
            } else {
                if (dateBookChapterList.length > 1) {
                    const firstEntryLength = dateBookChapterList[0].length;
                    localHistory = newHistory + ';' + history.slice(firstEntryLength + 1);
                } else {
                    localHistory = newHistory;
                }
            }
            localStorage.setItem('history', localHistory);
        }
    }

    contextMenuHandler(e, verseIndex) {
        switch(e.target.outerText) 
        {
            case 'Underline':
                // Draw underline, and save book/chapter/verse to localStorage.

                let underlineedVerses= this.scope.bookName + "_" + this.scope.chapterNumber;

                let verses = "";
                Object.keys(this.textSelected).forEach((verseIndex) => {
                    // this.textSelected[verseIndex].style.borderBottom = "1px dotted #000";
                    let classValue = this.textSelected[verseIndex].getAttribute('class');

                    if (classValue.search('dotted') === -1) {
                        // underline
                        classValue += ' dotted';

                        // add to the underlines list
                        this.underlines.push(verseIndex);
                    } else {
                        // remove hightlight
                        classValue = classValue.replace('dotted', '');

                        // delete from the underlines list
                        const index = this.underlines.indexOf(verseIndex);
                        this.underlines.splice(index, 1);
                    }
                    this.textSelected[verseIndex].setAttribute('class', classValue);

                    this.textSelected[verseIndex].style.color = 'black';
                    delete this.textSelected[verseIndex];
                });

                break;
            case 'Copy':
                var textArea = document.createElement("textarea");

                // Place in top-left corner of screen regardless of scroll position.
                textArea.style.position = 'fixed';
                textArea.style.top = 0;
                textArea.style.left = 0;

                // Ensure it has a small width and height. Setting to 1px / 1em
                // doesn't work as this gives a negative w/h on some browsers.
                textArea.style.width = '2em';
                textArea.style.height = '2em';

                // We don't need padding, reducing the size if it does flash render.
                textArea.style.padding = 0;

                // Clean up any borders.
                textArea.style.border = 'none';
                textArea.style.outline = 'none';
                textArea.style.boxShadow = 'none';

                // Avoid flash of white box if rendered for any reason.
                textArea.style.background = 'transparent';

                // Set the selected verse to the text area for selection and 
                // append before execCommand, and remove it after that.
                Object.keys(this.textSelected).forEach((verseIndex) => {
                    textArea.value += "\n" + verseIndex + " " + this.textSelected[verseIndex].innerHTML;
                });

                document.body.appendChild(textArea);
                textArea.select();
                var successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                document.execCommand('copy');
                break;

            case 'Share':
                try {
                    var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
                    dataTransferManager.addEventListener("datarequested", (e) => {
                        // Data Request handler, which should fill shared data. ShareUI doesn't work
                        // without filling a data in request handler.

                        // Title is required, and others are optional?.
                        e.request.data.properties.title = this.scope.bookName + " " + this.scope.chapterNumber;
                        e.request.data.properties.description = "share verse";
                                
                        let verses = "";
                        Object.keys(this.textSelected).forEach((verseIndex) => {
                            verses += "\n" + verseIndex + " " + this.textSelected[verseIndex].innerHTML;
                        });

                        e.request.data.setText(verses);
                    });

                    Windows.ApplicationModel.DataTransfer.DataTransferManager.showShareUI();
                } catch (e) {
                    console.log(e.message);
                }
                break;
            case 'Commentary':
                let book = this.scope.bookName;
                book = book.replace(' ', '_');
                let lowestVerseIndex = 1000;
                        
                Object.keys(this.textSelected).forEach((verseIndex) => {
                    if (verseIndex < lowestVerseIndex) {
                        lowestVerseIndex = verseIndex;
                    }
                })

                let verseUrl = "http://biblehub.com/" + book.toLowerCase() + "/" + this.scope.chapterNumber + "-" + lowestVerseIndex + ".htm";
                window.open(verseUrl);
                break;
        }

        $("#contextMenu").hide();
        this.contextMenuShown = false;
        return false;
    }

    showContextMenu(e) {
        if (Object.keys(this.textSelected).length !== 0) {
            $("#contextMenu").css({
                display: "block",
                left: e.pageX,
                top: e.pageY
            })

            // Store context menu rect for checking click later whether it is under context menu
            // or not.
            this.contextMenuRect.left = e.pageX;
            this.contextMenuRect.top = e.pageY;
            this.contextMenuRect.right = e.pageX + e.target.clientWidth;
            this.contextMenuRect.bottom = e.pageY + e.target.clientHeight;

            this.contextMenuShown = true;
        }
    }
}

