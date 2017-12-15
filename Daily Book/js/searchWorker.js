/// <reference group="Dedicated Worker" />

/*
    JSON format
    {
	"list": [{
			    "id":"word",
                "value": [
				1234,
				1342
			    ]
		    }, {
			    "id": "love",
                "value": [
				    1234,
				    1342
			    ]
		    }
	    ]
    }
*/
function WordSearcher() {
    this.newDB = false;
    this.bibleBookStore = null;
    this.books = ["Genesis",
                    "Exodus",
                    "Leviticus",
                    "Numbers",
                    "Deuteronomy",
                    "Joshua",
                    "Judges",
                    "Ruth",
                    "1 Samuel",
                    "2 Samuel",
                    "1 Kings",
                    "2 Kings",
                    "1 Chronicles",
                    "2 Chronicles",
                    "Ezra",
                    "Nehemiah",
                    "Esther",
                    "Job",
                    "Psalms",
                    "Proverbs",
                    "Ecclesiastes",
                    "Song of Solomon",
                    "Isaiah",
                    "Jeremiah",
                    "Lamentations",
                    "Ezekiel",
                    "Daniel",
                    "Hosea",
                    "Joel",
                    "Amos",
                    "Obadiah",
                    "Jonah",
                    "Micah",
                    "Nahum",
                    "Habakkuk",
                    "Zephaniah",
                    "Haggai",
                    "Zechariah",
                    "Malachi",
                    "Matthew",
                    "Mark",
                    "Luke",
                    "John",
                    "Acts",
                    "Romans",
                    "1 Corinthians",
                    "2 Corinthians",
                    "Galatians",
                    "Ephesians",
                    "Philippians",
                    "Colossians",
                    "1 Thessalonians",
                    "2 Thessalonians",
                    "1 Timothy",
                    "2 Timothy",
                    "Titus",
                    "Philemon",
                    "Hebrews",
                    "James",
                    "1 Peter",
                    "2 Peter",
                    "1 John",
                    "2 John",
                    "3 John",
                    "Jude",
                    "Revelation"
    ];
}

WordSearcher.prototype = {
    set: function (words, scope) {
        this.words = words;
        this.scope = scope;
    },
    _openDB: function () {
        if (searcher.db) {
            searcher.db.close();
            searcher.db = null;
        }

        return new Promise ((resolve, reject) => {
            let request = indexedDB.open("dailyBook", 2);

            // Add asynchronous callback functions
            request.onsuccess = function (evt) {
                searcher.db = evt.target.result;
                resolve();
            };

            request.onerror = (evt) => {
                reject('DB opening error');
            }

            request.onblocked = (evt) => {
                reject('DB opening blocked');
            }
        });
    },
    createDB: function() {
        return new Promise(function(resolve, reject) {
            // create indexed db
            let request = indexedDB.open("dailyBook", 2);

            // Add asynchronous callback functions
            searcher.populate = false;
            request.onsuccess = function (evt) {
                console.log('DB already created');
                searcher.db = evt.target.result;
                resolve('success');
            };

            request.onupgradeneeded = function (evt) {
                let db = evt.target.result;
                
                console.log("WordSearcher::onupgradeneeded, create  DB")
                let objectStore = db.createObjectStore('searchKey', {
                    keyPath: 'word',
                    autoIncrement: false
                })
                searcher.populate = true;
            };

            request.onerror = function (evt) {
                console.log("WordSearcher: Error on opening a DB, " + evt.message);
            }
        })
    },
    populateDB: function (bookJson) {
        return new Promise(function(resolve, reject) {
            if (searcher.populate) {
                let http = new XMLHttpRequest();
                const dbPath = "/book/bible_search.json";
                http.open("GET", dbPath, false);
                http.send();

                const jsonDB = JSON.parse(http.response);
                searcher._populateDB(resolve, reject, jsonDB);
            } else {
                resolve('success');
            }
        });
    },
    _populateDB: function (resolve, reject, jsonDB) {
        // populate the db with json based loop up table if it is first opening
        // db with specific version.
        let txn = searcher.db.transaction(['searchKey'], "readwrite");
        txn.onerror = (e) => {
            console.log('DB transaction ' + e.message);
            reject("failed");
        }

        txn.oncomplete = (e) => {
            resolve("success");
        }

        this.bibleBookStore = txn.objectStore("searchKey");
        let counts = 0;
        let totalCounts = Object.keys(jsonDB).length;
        Object.keys(jsonDB).forEach((item) => {
            const data = {
                word: item,
                list: JSON.stringify(jsonDB[item])
            }

            let request = searcher.bibleBookStore.add(data);
            request.onsuccess = (evt) => {
                if (evt.target.result !== data.word) {
                    console.log("Miss matched data added, actual:" + data.word + ", added:" + evt.target.result);
                    reject('failed');
                }
                counts++;
            }

            request.onerror = (evt) => {
                console.log('book store addition failed');
                reject('failed');
            }
        })
    },
    search: function (words, scope) {
        return new Promise(function(resolve, reject) {
            searcher.dbOpened = true;
            let rankedList = [];

            let promise = searcher._openDB();
            promise.then(() => {
                // Search multiple words in one transaction
                let txn = searcher.db.transaction(["searchKey"], "readonly");
                txn.onerror = (e) => {
                    reject('DB transaction error' + e);
                };
                txn.onabort = (e) => {
                    reject("DB transaction abort ' + e");
                };

                let rankedList;
                // The oncomplete event handler is called asynchronously once reading is finished and the data arrays are fully populated. This
                // completion event will occur later than the cursor iterations defined below, because the transaction will not complete until
                // the cursors are finished.
                txn.oncomplete = () => {
                    searcher.db.close();
                    resolve(rankedList);;
                }

                let listAll = [];
                let counts = 0;
                const expectedCounts = searcher.words.length;
                let objectStore = txn.objectStore("searchKey");
                searcher.words.forEach((word) => {
                    let objectRequest = objectStore.get(word.toLowerCase());
                    objectRequest.onsuccess = (evt) => {
                        // event.target.result.name: 'love'
                        // event.target.result.value: "[0x00111234, 0x011321, 0x00111235]"
                        if (evt.target.result) {
                            const values = JSON.parse(evt.target.result.list);
                            // ob.result
                            listAll.push(values);
                            if (++counts == expectedCounts) {
                                rankedList = searcher._ranking(listAll);
                            }
                        }
                    };
                    objectRequest.onerror = (evt) => {
                        if (++counts == expectedCounts &&
                            expectedCounts !== 1) {
                            rankedList = searcher._ranking(listAll);
                        }
                    }
                })
            }, (msg) => {
                console.log('DB opening error');
                reject('failed');
            })
        })
    },
    _ranking: function (listAll) {

        // Return array of ranked list that has.
        let rankedList = [];
        let rankedResults = {};
        for (let i = 0, len = listAll.length ; i < len; i++) {
            const localList = listAll[i];

            let j = 0;
            let k = 0;
            let preJ = 0;
            let preK = 0;

            while (j < rankedList.length && k < localList.length) {
                if (rankedList[j] < localList[k]) {
                    preJ = j++;
                } else if (rankedList[j] > localList[k]) {
                    rankedResults[localList[k]] = 1;
                    preK = k++;
                } else {
                    if (preK != 0 && localList[preK] !== localList[k]) {
                        rankedResults[localList[k]]++;
                    }
                    preK = k;
                    j++;
                    k++;
                }
            }

            if (k === 0) {
                rankedList.push(localList[k]); // store it to the rankedList
                rankedResults[localList[k]] = 1;
                k++;
            }
            while (k < localList.length) {
                if (localList[preK] !== localList[k]) {
                    rankedList.push(localList[k]); // store it to the rankedList
                    rankedResults[localList[k]] = 1;
                }
                preK = k++;
            }
        }

        // Convert scope to the scope index for faster comparison
        let scopeIndex;
        switch (searcher.scope) {
            case 'All':
                scopeIndex = 66;
                break;
            case 'Old Testament':
                scopeIndex = 67;
                break;
            case 'New Testament':
                scopeIndex = 68;
                break;
            default:
                for (let i = 0; i < this.books.length; i++) {
                    if (this.books[i] === searcher.scope) {
                        scopeIndex = i;
                        break;
                    }
                }
        }

        // Rank based on the number of counts, and filter the result based on the scope.
        let foundRankedList = [];
        i = 0;
        let comparedCount = listAll.length;
        let counts = 0;
        while (i++ < listAll.length) {
            for (key of Object.keys(rankedResults)) {
                if (comparedCount === rankedResults[key]) {
                    let add = false;
                    if (scopeIndex == 66) {
                        // Everything okay
                        add = true;
                    } else {
                        const bookIndex = key >> 16 & 0xff;

                        if (scopeIndex === 67) {
                            if (bookIndex < 39) {
                                add = true;
                            }
                            // Old Testament only
                        } else if (scopeIndex === 68) {
                            // New Testament only
                            if (bookIndex > 38 && bookIndex < 67) {
                                add = true;
                            }
                        } else if (bookIndex === scopeIndex) {
                            // Specific bible only
                            add = true;
                        }
                    }
                    if (add) {
                        foundRankedList.push(key);
                        if (foundRankedList.length === 100) {
                            break;
                        }
                    }
                }
            }
            if (foundRankedList.length === 100) {
                break;
            }
            comparedCount--;
        }

        if (rankedResults.length == 0) {
            // No ranked results, then we just add list
            listAll.forEach((list) => {
                Array.prototype.push.apply(foundRankedList, list);
            });
        }

        return searcher.convertToVerses(foundRankedList);
    },
    convertToVerses: function (rankedList) {
        // Return list of found verses " Book chapter: verse   text"
        // eg. "Genesis 1: 1, In the begging.."

        let normalizedResults = [];
        rankedList.forEach((item) => {
            // book, chapter, verse index start from the 1.
            const verse = item & 0xff; // verse 0x33
            const chapter = (item >> 8) & 0xff; // chapter: 0x22
            const bookIndex = (item >> 16) & 0xff; // book: 0x11

            normalizedResults.push(bookIndex + "," + chapter + "," + verse);
        })

        return normalizedResults;
    }
}

function Test() {
    var test = 'test';
    this.that = 'that'
};

Test.prototype = {
    at: function () {
        console.log(this.test);
        console.log(this.that);
    }
}

Test.prototype.it = function () {
    console.log(this.test);
    console.log(this.that);
}

let searcher;
onmessage = (event) => {
    if (event.data.command === 'search') {
        if (event.data.words[0] === "deletedelete") {
            let request = indexedDB.deleteDatabase('dailyBook');
            postMessage({ from: 'searcher', error: "Deleted existing DB" })
            return;
        } else if (event.data.words[0] === "rebuild") {
            searcher = new WordSearcher();
            searcher.createDB()
                .then(searcher.populateDB)
                .then((e) => {
                    postMessage({ from: 'searcher', command: event.data.command, results: e });
                });
            return;
        }

        searcher = new WordSearcher();
        searcher.words = event.data.words;
        searcher.scope = event.data.scope;

        searcher.search()
            .then((foundList) => {
                postMessage({ from: 'searcher', command: event.data.command, results: 'success', message: foundList })
            }).catch((message) => {
                postMessage({ from: 'searcher', command: event.data.command, results: 'failed', message: message });
            });
    } else if (event.data.command === 'build') {
        searcher = new WordSearcher();
        searcher.createDB()
            .then(searcher.populateDB)
            .catch((msg) => {
                postMessage({ from: 'searcher', command: event.data.command, results: 'failed', message: msg });
                })
            .then((e) => {
                postMessage({ from: 'searcher', command: event.data.command, results: 'success'});
            })
    } else {
        postMessage({ from: 'searcher', command: event.data.command, message: "invalid parameter: unexpected command, " + event.data.command, results: "failed" });
    }
}

