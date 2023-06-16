// import modules
const jwt = require('jwt-simple')
const moment = require('moment')
// impor secrest password
const libJwt = require('../services/jwt.js')
const secret = libJwt.secret
// export function of autentication

const auth = (req, res, next) =>{
    // check if arrive the headers of autentication
    if(!req.headers.authorization){
        return res.status(403).send({message: 'No tienes autorizacion, falta la cabecera de autorización'})
    }

    // clear token
    let token = req.headers.authorization.replace(/['"]+/g, '')
    try {
        let payload = jwt.decode(token, secret)
        console.log(payload.exp);
        // check if the token is expired
        if(payload.exp <= moment().unix()){
            return res.status(401).send({status: 'error',message: 'El token ha expirado'})
        }
        req.user = payload  
    } catch (error) {
        return res.status(403).send({status:"error",message: 'Token inválido',error})
    }
    // add data of the user to the request
    
    // execute the action
    next()
    
}

module.exports = {
    auth
}
// function of autentication


