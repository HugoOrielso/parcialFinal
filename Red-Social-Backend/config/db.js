const mongoose = require('mongoose');
const textToConnection = "mongodb://127.0.0.1:27017/mi_red_social"
module.exports = () =>{
    const connection = async () => {
        try {
            await mongoose.connect(
                textToConnection,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                })
            console.log("Conectado a la base de datos")
            return
        } catch (error) {
            console.error(error);
            throw new Error("No se ha podido conectar a la base de datos")
        }
    }
    connection()
}