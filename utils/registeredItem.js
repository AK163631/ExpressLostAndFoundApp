const UserConnection = require("./userConnection")

class registeredItem {
    constructor(category, timeFound, location, description, image) {
        this.imageId = UserConnection.makeid(10)
        this.category = category
        this.timeFound = timeFound
        this.location = location
        this.description = description
        this.image = image
    }


}