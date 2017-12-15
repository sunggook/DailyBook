class VersionsController {
    constructor() {
    }

    initialize(scope, state) {
        this.scope = scope;
        this.state = state;
        this.versionMenuShown = false;
    }

    run() {
        $('.navbar-fixed-top').hide();
        this.register();
    }

    register() {
        this.scope.selectVersion = (version) => this.selectTranslation(version);

        this.scope.navigateToHome = (e) => this.navigateToHome(e);
        this.scope.navigateToBible = (e) => this.navigateToBible(e);
        this.scope.navigateToBook = (e) => this.navigateToBook(e);

        $(document.body).on('mousedown', (e) => this.showMenu(e));
    }

    selectTranslation(version) {
        localStorage.setItem('version', version);
        this.state.go('bible');
    }

    navigateToHome() {
        this.state.go('home');
        this.hideShowMenu();
    }

    navigateToBible() {
        this.state.go('bible');
        this.hideShowMenu();
    }

    navigateToBook() {
        this.state.go('book');
        this.hideShowMenu();
    }

    hideShowMenu() {
        // Angular has timing issue that event hanlder on the navigation UI isn't run if 
        // a navigation UI is hidden.
        $('.navbar-fixed-top').hide();
        this.chapterMenuShown = false;
    }

    showMenu(e) {
        e.preventDefault();
        if (e.clientY < window.innerHeight / 10) {
            if (!this.versionMenuShown) {
                $('.navbar-fixed-top').show();
                this.versionMenuShown = true;
            }
        } else if (this.versionMenuShown) {
            this.hideShowMenu();
            this.versionMenuShown = false;
        }
    }
}
