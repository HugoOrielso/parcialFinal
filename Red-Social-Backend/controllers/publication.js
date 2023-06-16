// import model
const Publication = require('../models/publication.js'); 
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { RequiredError } = require('openai/dist/base.js');
const followService = require('../services/followService.js')


const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"./uploads/publications/")
    },
    filename:(req,file,cb)=>{
        cb(null,"pub-"+Date.now()+"-"+file.originalname)
    }
})
const uploads=multer({storage})




// save publication
const save = (req,res)=>{
    const params = req.body

    if(!params.text){return res.status(400).send({status: "error", message:"Debes enviar el texto de la publicación"})}

    let newPublication= new Publication(params)
    newPublication.user = req.user.id

    newPublication.save((error,publicationStored)=>{
        if(error  || !publicationStored){
            return res.status(400).send({status: "error", message:"No se ha guardado la publicación"})
        } 

        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publicationStored
        })

    })
}

const detail = (req,res)=>{
    // get id from url
    const punlicationId= req.params.id
    // find with conditional of id
    Publication.findById(punlicationId,(error,publicationStored)=>{

        if(error || !publicationStored){
            return res.status(400).send({
                status: "error",
                message: "No existe la publicación"
            })
        }
        return res.status(200).send({
            status: "success",
            message: "Mostrar publicación",
            publication: publicationStored
        })

    })
}


const remove = (req,res)=>{
    const publicationId = req.params.id

    Publication.find({"user": req.user.id, "_id":publicationId}).remove((error,publicationDelete)=>{
        if(error){
            return res.status(400).send({
                status: "error",
                message: "No se pudo eliminar la publicación"
            })
        }
        return res.status(200).send({
            status: 'success',
            message: 'Se ha eliminado la publicación',
            publication: publicationId
        })
    })
}

const user = (req,res)=>{
    // get id user
    const userId = req.params.id
    // check page
    let page = 1
    if(req.params.page) {page=req.params.page}
    const itemsPerPage = 5
    //find, populate, page, order
    Publication.find({"user":userId})
    .sort("-created_at")
    .populate('user', '-password -__v -role -email'   )
    .paginate(page,itemsPerPage,(error,publications,total)=>{
        if(error || !publications || publications.length <= 0) {
            return res.status(404).send({
                status: "error", 
                message:"No hay publicaciones para mostrar"
            })
        }
        // return result
        return res.status(200).send({
            status: "success",
            message: "Lista de publicaciones de el usuario ",
            publications,
            page,
            pages : Math.ceil(total/itemsPerPage),
            total
        })
    })

}

const upload = (req,res)=>{
    //get publication id
    const publicationId = req.params.id

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
    Publication.findByIdAndUpdate({"user": req.user.id, "_id":publicationId},{file:req.file.filename},{new:true},(err,publicationUpdated)=>{
        if(err||!publicationUpdated){
            return res.status(500).send({
                status:"error",
                message:"Error al actualizar el usuario"
            })
        }
        return res.status(200).send({
            status:"success",
            publication: publicationUpdated,
            file:req.file,
        })
    })
}
const media = (req,res)=>{
    // get param url
    let file = req.params.file
    // mount path o the real image  
    const filePath = './uploads/publications/'+file
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

const feed = async (req,res)=>{
    let page = 1
    if(req.params.page){ page = req.params.page}
    let itemsPerPage = 5


    try {
        const myFollows = await followService.folloUserIds(req.user.id)
        
        const publications =  Publication.find({user: myFollows.following})
        .populate("user", "-password -role -__v -email")
        .sort("-create_at")
        .paginate(page,itemsPerPage,(error,publications,total)=>{ 
            
            if(error || !publications){
                return res.status(500).send({
                    status: "error",
                    message: "No hay publicaciones para mostrar"
                })
            }
            
            return res.status(200).send({
                status: "success",
                message: "Feed de publicaciones",
                following: myFollows.following,
                total,
                page,
                itemsPerPage,
                pages: Math.ceil(total/itemsPerPage),
                publications
            })
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se ha podido listar las publicaciones del feed"
        })
    }
}

module.exports={
    save,
    detail,
    remove,
    user,
    upload,
    uploads,
    media,
    feed
}