// test actions
const User = require("../models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt.js");
const user = require("../models/user.js");
const mongoosePagination = require('mongoose-pagination');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const followService = require("../services/followService.js");
const modelPublication = require("../models/publication.js")

//  upload settings
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"./uploads/avatars/")
    },
    filename:(req,file,cb)=>{
        cb(null,"avatar-"+Date.now()+"-"+file.originalname)
    }
})


const uploads=multer({storage})

const register = async (req, res) => {
    let params = req.body;

    // Verificar si faltan datos
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar",
        });
    }
    // Crear un objeto del usuario
    try {
        // Controlar usuarios duplicados
        User.find({
            $or: [
                { email: params.email.toLowerCase() },
                { nick: params.nick.toLowerCase() },
            ],
        }).exec( async(error,users) =>{
            if (error) return res.status(500).json({status:"error",message:"error en la consulta"})
            if (users && users.length >= 1) {
                return res.status(200).send({
                    status: "success",
                    message: "El usuario ya existe",
                });
            }
            let pwd= await bcrypt.hash(params.password,10 )
            params.password = pwd
            let user_to_save = new User(params);
            user_to_save.save((err,user_stored) => {
                if (err || !user_stored) {
                    return res.status(400).json({
                        status: "error",
                        message: "Error al guardar el usuario",
                    });
                }
                return res.status(200).json({
                    status: "success",
                    message: "Usuario registrado correctamente",
                    user: user_stored,
                });
            })
        })
        // Devolver el resultado
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error en la consulta",
        });
    }
};

const login = (req,res)=>{
    // collect params body
    let params = req.body
    if (!params.email || !params.password) {
        return res.status(400).send({
            status:"error",
            message: "Faltan datos por enviar"
        })
    }
    // search user in db
    User.findOne({email:params.email})
    // .select({"password":0})
    .exec((err,user)=>{
        if(err || !user) return res.status(404).send({status:"error ", message:"Usuario no existe"})
        // compare password
            const pwd= bcrypt.compareSync(params.password,user.password)
            if (!pwd) {
                return res.status(404).send({
                    status:"error",
                    message: "No te has identificado correctamente"
                })
            }
        // get token
        const token = jwt.createToken(user)
        // return data user
        return res.status(200).send({
            status: "success",
            message: "Te has identificado correctamente",
            user:{
                id:user._id,
                name:user.name,
                nick:user.nick,
            },
            token
        })
    })
}

const profile = (req,res)=>{
    // get params of id_user by url
    const id = req.params.id
    // consult to get data of user
    user.findById(id)
    .select({password: 0,role: 0 })
    .exec(async(err,userProfile)=>{
        if(err || !userProfile) return res.status(404).send({
            status:"error",
            message:"Usuario no encontrado o hay un error"
        })
        const followInfo =  await followService.followThisUser(req.user.id,id)
        // subsequently return data follows
        return res.status(200).send({
            status:"success",
            user:userProfile,
            following: followInfo.following,
            follower: followInfo.follower   
        })
    })
}

const list = (req,res)=>{
    // check in what page we are
    let page = 1
    if (req.params.page) {
        page = req.params.page
    }
    page= parseInt(page)
    // consult with mongoose pagination   
    let itemsPerPAge = 5
    user.find()
    .select("-password -email -role -__v")
    .sort('_id')
    .paginate(page,itemsPerPAge,async(error,users,total)=>{
        if(error || !users) return res.status(404).send({
            status:"error",
            message:"No hay ususarios disponibles",
            error
        })
        let followUserIds = await followService.folloUserIds(req.user.id)

        return res.status(200).send({
            status:"success",
            page,
            itemsPerPAge,
            total,
            users,
            pages:Math.ceil(total/itemsPerPAge),
            user_following:followUserIds.following,
            user_follow_me:followUserIds.followers
        })
    })  
}


const update = (req,res)=>{

    // get data of user to update
    let userIdentity = req.user
    let userToUpdate = req.body
    // delete leftover fields
    delete userToUpdate.iat
    delete userToUpdate.exp
    delete userToUpdate.image
    delete userToUpdate.role

    // check if user exist
    
    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() },
        ],
    }).exec( async(error,users) =>{
        if (error) return res.status(500).json({status:"error",message:"error en la consulta"})

        let userIsset = false
        users.forEach(user => {
            if (user && user._id != userIdentity.id) {
                userIsset = true
        }
    })

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe",
            });
        }

        // if it comes the password encryp it
        if(userToUpdate.password){
            let pwd= await bcrypt.hash(userToUpdate.password,10 )
            userToUpdate.password = pwd
        }else{
            delete userToUpdate.password    
        }
        
        // find user to update

        try{
            let userUpdated = await User.findByIdAndUpdate({_id: userIdentity.id},userToUpdate,{new:true})
            if(!userUpdated){
                return res.status(400).json({
                    status:"error",
                    message:"Error al actualizar el usuario"
    
                })
            }
            // return result
            return res.status(200).send({
                status:"success",
                message:"Método actualizar",
                user: userToUpdate
            })

        }catch(error){
            return res.status(500).json({
                status:"error",
                message:"Error al actualizar el usuario",
            })
        }

        

    })
    
}

const upload = (req,res)=>{

    // get file of image and check if it exist
    if(!req.file){
        return res.status(404 ).send({
            status:"error",
            message:"Petición no tiene la imágen"
        })
    }
    // get the name of the archive
    let image = req.file.originalname
    // get information of the archive
    const imageSplit = image.split('\.')
    const extension = imageSplit[1]
    // check extension
    const extensionValid = {
        png:'png',
        jpg:'jpg',
        jpeg:'jpeg',
        gif:'gif'
    }
    // if it's not correc, delete archive
    if(extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif"){
        // delete archive
        const filePath = req.file.path
        const fileDelete = fs.unlinkSync(filePath)
        // return negative response 
        return res.status(400 ).send({
            status:"error",
            message:"Extension no valida"
        })
    }

    // if it's correct, save archive in database
    User.findByIdAndUpdate({_id: req.user.id},{image:req.file.filename},{new:true},(err,userUpdated)=>{
        if(err||!userUpdated){
            return res.status(500).send({
                status:"error",
                message:"Error al actualizar el usuario"
            })
        }
        return res.status(200).send({
            status:"success",
            user: userUpdated,
            file:req.file,
        })
    })
}

const avatar = (req,res)=>{
    // get param url
    let file = req.params.file
    // mount path o the real image  
    const filePath = './uploads/avatars/'+file
    // check if exist
    fs.stat(filePath,(error,exist)=>{
        if(!exist){
            return res.status(404).send({
                status:"error",
                message:"Imagen no existe"
            })
            
        }
        // return file
        return res.sendFile(path.resolve(filePath))

    })
}
const Follow = require("../models/follow.js")
const counters = async (req,res)=>{
    let userId = req.user.id
    if(req.param.id){
        userId = req.param.id
    }

    try {
        const following = await Follow.count({"user":userId})
        const followed = await Follow.count({"followed":userId})
        const publications = await modelPublication.count({"user":userId})
        return res.status(200).send({
            userId,
            following: following,
            followed: followed,
            publications: publications
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en los contadores",
            error
        })
    }
}

module.exports = {
    register,
    login,
    profile,
    list,
    update,
    uploads,
    upload,
    avatar,
    counters
}