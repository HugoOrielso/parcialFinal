// Import the modules
const express = require("express");
const cors = require("cors");
const initDB = require("./config/db.js");
const bcrypt = require("bcrypt");
const check = require("./middlewares/autentication.js");
const libJwt = require('./services/jwt.js')
console.log("Red social arrancada");
// Connection to the database
initDB()
// Create node server
const app = express();
const port = 3900
// Config cors
app.use(cors())
// Conver the data from body to objects Js
app.use(express.json())
app.use(express.urlencoded({extended: true}))
// Load config routes
const followController = require("./controllers/follow.js")
const userController = require("./controllers/user.js")
const publicationController = require("./controllers/publication.js")
// Create the routes
app.post("/api/user/register",userController.register)
app.post("/api/user/login", userController.login)
app.get("/api/user/profile/:id", check.auth,userController.profile)
app.get("/api/user/list/:page?",check.auth,userController.list)
app.put("/api/user/update",check.auth,userController.update)
app.get("/api/user/conters/:id",check.auth,userController.counters)
app.post("/api/user/upload",[check.auth,userController.uploads.single("file0")],userController.upload)
app.get("/api/user/avatar/:file",userController.avatar)
app.post("/api/follow/save",check.auth,followController.save)
app.delete("/api/follow/unfollow/:id",check.auth,followController.unfollow)
app.get("/api/follow/following/:id?/:page?",check.auth,followController.following)
app.get("/api/follow/followers/:id?/:page?",check.auth,followController.followers)
app.post("/api/publication/save",check.auth, publicationController.save)
app.get("/api/publication/detail/:id",check.auth, publicationController.detail)
app.delete("/api/publication/remove/:id",check.auth, publicationController.remove)
app.get("/api/publication/user/:id/:page?",check.auth, publicationController.user)
app.post("/api/publication/upload/:id",[check.auth,publicationController.uploads.single("file0")], publicationController.upload)
app.get("/api/publication/media/:file", publicationController.media)
app.get("/api/publication/feed/:page?",check.auth, publicationController.feed)

// test routes
app.get("/api/user/ruta-prueba",  (req, res) => {
    res.send("Hola")
})
// Put the server to listen http requets
app.listen(port, () => {
    console.log("Escuchando en el puerto: " + port);
})