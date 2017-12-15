class HomeController {
    constructor() {
    }

    initialize(scope, state) {
        this.scope = scope;
        this.state = state;
    }

    run() {
        this.scope.openBible = () => {
            this.state.go('bible');
        }

        this.scope.openBook = () => {
            this.state.go('book');
        };

        this.scope.openChapter = () => {
            this.state.go('chapter');
        };

        this.scope.openSelection = () => {
            this.state.go('versions');
        };

        this.scope.openSearch = () => {
            this.state.go('search');
        };

        this.scope.openHistory = () => {
            this.state.go('history');
        };
    }
}
