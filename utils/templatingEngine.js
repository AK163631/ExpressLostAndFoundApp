const fs = require("fs")
const RegisteredItem = require("./registeredItem")

// Error.html
const ERROR_FILE = "templates/error.html"
const ERROR_TAG = "{{error}}"

// item.html
const ITEM_FILE = "templates/item.html"
const ITEM_IMAGE_TAG = "{{item-img}}"
const ITEM_DESCRIPTION_TAG = "{{item-description}}"
const ITEM_ID_TAG = "{{item-id}}"

// index.html
const INDEX_FILE = "templates/index.html"
const UNAUTHENTICATED_USER_ITEM_IMG = '<div class="col-md-4"><img class="img-fluid d-block" src="../webroot/static/images/{{item-id}}.jpg"></div>'
const AUTHENTICATED_USER_ITEM_IMG = UNAUTHENTICATED_USER_ITEM_IMG // TODO change to add href

// nav bar
const NAV_TAG = "{{nav-item}}"
const NAV_BUTTON_TAG = "{{nav-buttons}}"
const NAV_VIEW_ITEMS_BUTTON = ' <li class="nav-item"> <a class="nav-link text-white" href="/">View Items</a> </li>'
const ADMIN_NAV_REQUEST_LIST_BUTTON = '<li class="nav-item" > <a class="nav-link text-white" href="/request-list">View Requests</a> </li>'
const UNAUTHENTICATED_USER_NAV_LOGIN_AND_REGISTER_BUTTON = '<li class="nav-item" ><a class="nav-link text-white" href="static-login.html">Log in</a> </li>' +
    '<li class="nav-item"> <a class="nav-link text-white" href="static-register.html">Register</a> </li>'
const AUTHENTICATED_USER_NAV_LOGOUT = '<li class="nav-item" ><a class="nav-link text-white" href="logout">Logout</a> </li>'


module.exports = class TemplatingEngine {
    constructor(email, accessLevel) {
        this.email = email
        this.accessLevel = accessLevel
    }

    generateRequestListPage() {
        if (this.accessLevel === 0) {
            return new Buffer("Admin only: request list page")
        }
        return new Buffer(TemplatingEngine.replaceTags({[ERROR_TAG]: "Access Denied"}, ERROR_FILE))
    }

    generateIndexPage() {
        // TODO add image tags
        if (this.accessLevel === 0) {
            return new Buffer(TemplatingEngine.replaceTags({
                [NAV_TAG]: AUTHENTICATED_USER_NAV_LOGOUT,
                // only admin can view this page second button
                [NAV_BUTTON_TAG]: NAV_VIEW_ITEMS_BUTTON + ADMIN_NAV_REQUEST_LIST_BUTTON
            }, INDEX_FILE))
        }
        return new Buffer(TemplatingEngine.replaceTags({
            [NAV_TAG]: AUTHENTICATED_USER_NAV_LOGOUT,
            [NAV_BUTTON_TAG]: NAV_VIEW_ITEMS_BUTTON
        }, INDEX_FILE))
    }

    generateItemPage(item) {
        // TODO testing only
        return new Buffer("This is Item page for: " + this.email)
    }

    static generateIndexPage(items) {
        // for when user is unauthenticated
        let html = ""
        for (let item in items) {
            html += UNAUTHENTICATED_USER_ITEM_IMG.replace(ITEM_ID_TAG, item.imageId)
        }
        return new Buffer(TemplatingEngine.replaceTags({
            [ITEM_IMAGE_TAG]: html,
            [NAV_BUTTON_TAG]: NAV_VIEW_ITEMS_BUTTON,
            [NAV_TAG]: UNAUTHENTICATED_USER_NAV_LOGIN_AND_REGISTER_BUTTON
        }, INDEX_FILE))
    }

    static generateError(errorString) {
        return new Buffer(TemplatingEngine.replaceTags({[ERROR_TAG]: errorString}, ERROR_FILE))
    }

    static replaceTags(tagDict, templateFile) { // {"{{error}" : "user not found"}
        let buffer = fs.readFileSync(templateFile, 'utf8').toString();
        for (let key in tagDict) {
            buffer = buffer.replace(key, tagDict[key])
        }
        return buffer
    }

};