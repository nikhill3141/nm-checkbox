//setup the http server 
//then setup the socket io

import { createServer } from "node:http";
import express, { Request, Response } from 'express'
import { Server } from "socket.io";
import path from "node:path";

async function start(){
  try {
    const PORT = 8080
    const app = express()
    const httpServer = createServer(app)
    const io = new Server(httpServer)
    const TOTAL = 500
    const checkboxStates = new Array(TOTAL).fill(null)

    app.get("/",(req:Request, res:Response) =>{
      return res.sendFile(path.resolve("public", "checkbox.html"))
    })

        //io connection
    io.on("connection",(socket)=>{
      console.log('A user connected:', socket.id);
      //emmit all the checkboxState for updated checkes
      socket.emit("server:checkboxStates",checkboxStates)


      //this will get the data proivded by client to server
      socket.on("client:checked",(data)=>{

        //update the state in backend
        checkboxStates[data.index] = data.checked 
        //server sends msg to all sockets after taking states
        io.emit("server:checked",data)
        // console.log(`change from client:${socket.id} Data:`, data)
      })
     
      
    })






    httpServer.listen(PORT, ()=>{
      console.log(`server is running on ${PORT}`)
    })
    
  } catch (error) {
    throw new Error("server error",error.message)
  }
}
start()

