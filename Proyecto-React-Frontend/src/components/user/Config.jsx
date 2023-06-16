import React from 'react'
import { useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { Global } from '../../helpers/Global'
import avatar from '../../assets/img/user.png'
import { SerializeForm } from '../../helpers/SerializeForm'
export const Config = () => {
  const {auth,setAuth} = useAuth()
  const [saved , setSaved ] = useState("not_saved")
  const updateUser = async (e) =>{
      e.preventDefault()
      // get data of form
      console.log(SerializeForm(e.target))
      let newUpdateUser = SerializeForm(e.target)
      const token = localStorage.getItem("token")
      // delete propieties innecesary
      delete newUpdateUser.file0
      // updae user in DDBB
      const request = await fetch(Global.url + "user/update" , {
        method: "PUT",
        body: JSON.stringify(newUpdateUser),
        headers:{
          "Content-Type":"application/json",
          "Authorization": token
        }
      })
      const data = await request.json()
       if(data.status == "success" && data.user){
        delete data.user.password
        setAuth(data.user)
         setSaved("saved")
       }else{
         setSaved("error")
       }
       const fileInput = document.querySelector("#file")

       if(data.status == "success" && fileInput.files[0]){
        const formData = new FormData()
        formData.append('file0', fileInput.files[0])

        const uploadRequest = await fetch(Global.url + "user/upload",{
          method: "POST",
          body: formData,
          headers:{
            "Authorization": token 
          }
        })
        const uploadData = await uploadRequest.json()
        console.log(uploadData);
        if(uploadData.status == "success" && uploadData.user){
          setAuth(uploadData.user)
          delete uploadData.user.password
          setSaved("saved")
        }else{
          setSaved("error")
        }

       }

  }
return (
  <>
      <header className="content__header content__header--public">
          <h1 className="content__title">Ajustes</h1>
      </header>
      <div className="content__posts">
      {saved=="saved" ? <strong className="alert alert-success"> Usuario actualizado correctamente </strong>: ""}
      {saved=="error" ? <strong className="alert alert-danger"> Error al actualizar el usuario</strong>: ""}
        <form className="config-form" onSubmit={updateUser}>
          <div className="form__group">
            <label htmlFor="name">Nombre</label>
            <input type="text" name="name" defaultValue={auth.name}/>
          </div>

          <div className="form__group">
            <label htmlFor="surname">Apellido</label>
            <input type="text" name="surname"  defaultValue={auth.surname}/>
          </div>

          <div className="form__group">
            <label htmlFor="nick">Nick</label>
            <input type="text" name="nick"  defaultValue={auth.nick}/>
          </div>

          <div className="form__group">
            <label htmlFor="email">Biografía</label>
            <textarea type="bio" name="email"  defaultValue={auth.bio}/>
          </div>

          <div className="form__group">
            <label htmlFor="email">Correo electrónico</label>
            <input type="email" name="email"  defaultValue={auth.email}/>
          </div>

          <div className="form__group">
            <label htmlFor="password">Contraseña</label>
            <input type="password" name="password" />
          </div>

          <div className="form__group">
            <label htmlFor="file0">Avatar</label>
            <div className="avatar">
              {/*Show img */}
              {auth.image != "default.png" && <img src={Global.url + "user/avatar/" + auth.image} className="container-avatar__img" alt="Foto de perfil"/>}
              {auth.image == "default.png" && <img src={avatar} className="container-avatar__img" alt="Foto de perfil"/>}
            </div>
            <input type="file" name="file0" id="file" />
          </div>
          <br></br>
          <input type="submit" value="Actualizar" className="btn btn-success"/>
        </form>
      </div>

  </>
)
}
