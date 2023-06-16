// import dependencies
const jwt = require('jwt-simple');
const moment = require('moment');
// secret password
const secret = 'CLAVE_SECRETA_del_proyecto_DE_LA_RED_soCIAL_987987';
const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        imagen: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    }
    // return token;
    return jwt.encode(payload, secret);
}
//export functions
module.exports={
    secret,
    createToken
}