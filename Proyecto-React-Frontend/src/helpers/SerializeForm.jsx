import React from 'react'

export const SerializeForm = (form) => {
    const formData = new FormData(form)

    const completeObj = {}
    console.log(formData);
    for(let [name,value] of formData){
        completeObj[name] = value
    }
    return completeObj
}
