// import model
const Follow = require('../models/follow.js');
const followService = require('../services/followService.js');
//Action of save a follower (action following)
const save= (req,res)=>{
    // get data from body
    const params = req.body;
    // get id from user identificated
    const identity = req.user
    // create object with model follow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    })
    userToFollow.save((err,followStored)=>{
        
            if(err||!followStored) return res.status(500).send({
                status: 'error',
                message: 'No se ha podido seguir al usuario'
            })
            return res.status(200).send({
                status: 'success',
                identity: req.user,
                follow: followStored
            })
    })
}
// leave to follow
const unfollow  = (req,res)=>{
    // get id of user identificated
    const userId = req.user.id
    // get id of user to unfollow
    const followedId = req.params.id
    // find the user to unfollow
    Follow.find({"user": userId, "followed": followedId}).remove((err,followDeleted)=>{
        if(err){
            return res.status(500).send({
                status: 'error',
                message: 'No se ha podido dejar de seguir al usuario'
            })
        }
        return res.status(200).send({
            status: 'success',
            message: 'Se ha dejado de seguir al usuario',
        })
    })
}
// show list of user who i follow or other user is following (following )
const following = (req,res)=>{
    // get id of user identificated
    let userId = req.user.id
    // check if id arrive for the params of url
    if(req.params.id)userId = req.params.id
    // check if page arrive, else will be page 1
    let page = 1
    if(req.params.page)page = req.params.page
    // users per page who i wanna show
    const itemsPerPage = 5
    // find to followers and show data from user and show page
    Follow.find({user: userId}).populate("user followed", "-password -role -__v -email").paginate(page,itemsPerPage,async (err,follows,total)=>{
        let followUserIds = await followService.folloUserIds(req.user.id)
        return res.status(200 ).send({
            status: 'success',
            message: 'Lista de usuarios que sigo',
            follows,
            total,
            pages: Math.ceil(total/itemsPerPage),
            user_following:followUserIds.following,
            user_follow_me:followUserIds.followers
        })
    })
}
// show list of users who follow to other user (followers)
const followers = (req,res)=>{
    // get id of user identificated
    let userId = req.user.id
    // check if id arrive for the params of url
    if(req.params.id)userId = req.params.id
    // check if page arrive, else will be page 1
    let page = 1
    if(req.params.page)page = req.params.page
    // users per page who i wanna show
    const itemsPerPage = 5
    // find the users who i follow
    Follow.find({followed: userId}).populate("user", "-password -role -__v -email").paginate(page,itemsPerPage,async (err,follows,total)=>{
        let followUserIds = await followService.folloUserIds(req.user.id)
        return res.status(200 ).send({
            status: 'success',
            message: 'Lista de usuarios que me siguen',
            follows,
            total,
            pages: Math.ceil(total/itemsPerPage),
            user_following:followUserIds.following,
            user_follow_me:followUserIds.followers
        })
    })
}
//export functions
module.exports={
    save,
    unfollow,
    following,
    followers
}