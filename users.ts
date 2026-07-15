

enum RoleTypes{
    admin = "admin",
    client= "client",
    manager= "manager"
}

interface User {
    id: number
    name: string
    phone: string
    email:string
    role: RoleTypes
}
const users : User[] = []

export function updateUser(id:number, newUserDetails: Partial<User>) : void{   
    
    console.log("update user") 
    return 
}


updateUser(1, {name: "Moshe"})

