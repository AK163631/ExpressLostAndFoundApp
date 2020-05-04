const fs = require("fs")
const RegisteredItem = require("./registeredItem")

// Error.html
const ERROR_FILE = "templates/error.html"
const ERROR_TAG = "{{error}}"

// item.html
const ITEM_FILE = "templates/item.html"
const ITEM_IMAGE_TAG = "{{item-img}}"
const ITEM_ID_TAG = "{{item-id}}"
const ITEM_CATEGORY_TAG = "{{item-category}}"
const ITEM_TIME_FOUND_TAG = "{{item-time-found}}"
const ITEM_LOCATION_TAG = "{{item-location}}"
const ITEM_DESCRIPTION_TAG = "{{item-description}}"

// index.html
const INDEX_FILE = "templates/index.html"
const UNAUTHENTICATED_USER_ITEM_IMG = '<div class="col-md-4"><img class="img-fluid d-block" src="/static/images/{{item-id}}.jpg"></div>'
const AUTHENTICATED_USER_ITEM_IMG = '<div class="col-md-4"><a href="/item/{{item-id}}"><img class="img-fluid d-block" src="/static/images/{{item-id}}.jpg"></a></div>'

// Add-item.html
const ADD_ITEM_FILE = "templates/add-item.html"

//admin-request-list.html
const ADMIN_REQUESTS_LIST_FILE = "templates/admin-request-list.html"
const REQUEST_BLOCK_HTML = '<div class="row">' +
    '<div class="col-md-12">' +
    '<p class="lead">User Email: {{email}}<br>Reason for Request: {{reason-for-request}}<br></p>' +
    '</div>' +
    '</div>' +
    '<div class="row">' +
    '<div class="col-md-12">' +
    '<a class="btn btn-primary" href="/approve-request/{{item-id}}">Approve</a>' +
    '<a class="btn btn-primary ml-1" href="/deny-request/{{item-id}}">Deny</a>' +
    '<a class="btn btn-primary ml-1" href="/item/{{item-id}}">View Item</a>' +
    '</div>' +
    '</div>'
const REQUEST_BLOCK_TAG = "{{request-block}}"
const REASON_FOR_REQUEST_TAG = "{{reason-for-request}}"
const EMAIL_TAG = "{{email}}"

// nav bar
const NAV_TAG = "{{nav-item}}"
const NAV_BUTTON_TAG = "{{nav-buttons}}"
const NAV_VIEW_ITEMS_BUTTON = ' <li class="nav-item"> <a class="nav-link text-white" href="/">View Items</a> </li>'
const NAV_ADD_ITEM_BUTTON = '<li class="nav-item" > <a class="nav-link text-white" href="/add-item">Add Item</a> </li>'
const ADMIN_NAV_REQUEST_LIST_BUTTON = '<li class="nav-item" > <a class="nav-link text-white" href="/request-list">View Requests</a> </li>'
const UNAUTHENTICATED_USER_NAV_LOGIN_AND_REGISTER_BUTTON = '<li class="nav-item" ><a class="nav-link text-white" href="/static-login.html">Log in</a> </li>' +
    '<li class="nav-item"> <a class="nav-link text-white" href="static-register.html">Register</a> </li>'
const AUTHENTICATED_USER_NAV_LOGOUT = '<li class="nav-item"><a class="nav-link text-white" href="/logout">Logout</a> </li>'


module.exports = class TemplatingEngine {
    constructor(email, accessLevel) {
        this.email = email
        this.accessLevel = accessLevel
    }

    generateAddItemPage() {
        return new Buffer(TemplatingEngine.replaceTags({
            [NAV_TAG]: AUTHENTICATED_USER_NAV_LOGOUT,
            // only admin can view this page second button
            [NAV_BUTTON_TAG]: this.getNavBarTemplateForCurrentUser()
        }, ADD_ITEM_FILE))
    }

    generateRequestListPage(requests, requestReasons, items) {
        if (this.accessLevel === 0) {
            let html = ""
            // item = RegisteredItem
            for (let itemId in requests) {
                let item = items[itemId]
                let user = requests[itemId]
                html += REQUEST_BLOCK_HTML
                    .split(ITEM_ID_TAG).join(itemId)
                    .split(EMAIL_TAG).join(user.email)
                    .split(REASON_FOR_REQUEST_TAG).join(requestReasons[itemId])
            }
            //console.log(html)
            return new Buffer(TemplatingEngine.replaceTags({[REQUEST_BLOCK_TAG]: html}, ADMIN_REQUESTS_LIST_FILE))
        }
        return new Buffer(TemplatingEngine.replaceTags({[ERROR_TAG]: "Access Denied"}, ERROR_FILE))
    }

    generateIndexPage(items) {
        return new Buffer(TemplatingEngine.replaceTags({
            [ITEM_IMAGE_TAG]: TemplatingEngine.generateImageColumns(AUTHENTICATED_USER_ITEM_IMG, items),
            [NAV_TAG]: AUTHENTICATED_USER_NAV_LOGOUT,
            // only admin can view this page second button
            [NAV_BUTTON_TAG]: this.getNavBarTemplateForCurrentUser()
        }, INDEX_FILE))
    }

    generateItemPage(item) {
        return new Buffer(TemplatingEngine.replaceTags({
            [ITEM_ID_TAG]: item.id,
            [ITEM_CATEGORY_TAG]: item.category,
            [ITEM_TIME_FOUND_TAG]: item.timeFound,
            [ITEM_LOCATION_TAG]: item.location,
            [ITEM_DESCRIPTION_TAG]: item.description,
            [NAV_TAG]: AUTHENTICATED_USER_NAV_LOGOUT,
            [NAV_BUTTON_TAG]: this.getNavBarTemplateForCurrentUser()
        }, ITEM_FILE))
    }

    getNavBarTemplateForCurrentUser() {
        if (this.accessLevel === 0) {
            return NAV_VIEW_ITEMS_BUTTON + NAV_ADD_ITEM_BUTTON + ADMIN_NAV_REQUEST_LIST_BUTTON
        }
        return NAV_VIEW_ITEMS_BUTTON + NAV_ADD_ITEM_BUTTON
    }

    static generateIndexPage(items) {
        // for when user is unauthenticated/public
        return new Buffer(TemplatingEngine.replaceTags({
            [ITEM_IMAGE_TAG]: TemplatingEngine.generateImageColumns(UNAUTHENTICATED_USER_ITEM_IMG, items),
            [NAV_BUTTON_TAG]: NAV_VIEW_ITEMS_BUTTON,
            [NAV_TAG]: UNAUTHENTICATED_USER_NAV_LOGIN_AND_REGISTER_BUTTON
        }, INDEX_FILE))
    }

    static generateImageColumns(USER_ITEM_HTML, items) {
        let html = ""
        for (let id in items) {
            html += USER_ITEM_HTML.split(ITEM_ID_TAG).join(id)
        }
        return html
    }

    static generateError(errorString) {
        return new Buffer(TemplatingEngine.replaceTags({[ERROR_TAG]: errorString}, ERROR_FILE))
    }

    static replaceTags(tagDict, templateFile) { // {"{{error}" : "user not found"}
        let buffer = fs.readFileSync(templateFile, 'utf8').toString();
        for (let key in tagDict) {
            buffer = buffer.split(key).join(tagDict[key]) //  will only replace the first instance of that tag
        }
        return buffer
    }

};