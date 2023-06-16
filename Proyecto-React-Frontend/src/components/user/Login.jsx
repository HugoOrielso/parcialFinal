import React from 'react'
import { Global } from '../../helpers/Global'
import { useForm } from '../../hooks/useForm'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
export const Login =   () => {

  const { form, changed } = useForm({})
  const [ saved, setSaved ] = useState("not_sended")
  const {setAuth} = useAuth()
  // login user
  const loginUser = async (e)=>{
    e.preventDefault()
    // data from form
    let userToLogin = form
    // request to backend
    const request = await fetch(Global.url + "user/login", {
      method: "POST",
      body: JSON.stringify(userToLogin),
      headers:{
        "content-type":"application/json"
      }
    })
    const data = await request.json()
    if(data.status == "success"){
      localStorage.setItem("token", data.token)
      localStorage.setItem("user",JSON.stringify(data.user) )
      setSaved("login")

      // set data in the auth
      setAuth(data.user)

      // Redirect
      setTimeout(()=>{
        window.location.reload()
      },1000)
    }else{
      setSaved("error")
    }
  }

  return (
    <>
    <header className="content__header content__header--public">
        <h1 className="content__title">Login</h1>
    </header>

    <div className="content__posts"> 
    {saved=="login" ? <strong className="alert alert-success"> Usuario identificado correctamente </strong>: ""}
    {saved=="error" ? <strong className="alert alert-danger"> Usuario no identificado </strong>: ""}
      <form className="login-form" onSubmit={loginUser}>
        <div className="form__group">
                <label htmlFor="password">Email</label>
                <input type="email" name="email" onChange={changed}/>
        </div>
        <div className="form__group">
                <label htmlFor="password">Contraseña</label>
                <input type="password" name="password" onChange={changed}/>
        </div>
        <input type="submit" value="Identificarse" className="btn btn-success"/>
        </form>   
    </div>

</>
  )
}
