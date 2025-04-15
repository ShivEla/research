const server = require('express');
const app = server();
const https = require('http').createServer(app);
const cors = require('cors');
const path = require('path');
const serveStatic = require('serve-static')
const fs = require('fs');
const io = require('socket.io')(https,{
    cors: {
        origin: '*',
        method: ["GET","POST"]
    }
});
const { v4: uuidv4 } = require('uuid');
const dateTime = require('node-datetime');
const storeDirectory  = "./Data2/";
const util = require('util');

/**
 * This struct is used to store all the info 
 * which is needed to store in the json file. 
 * However, If needed to store more info, 
 * just add a new field in here and get the 
 * data from the client and store it in the 
 * struct. Finally, this struct is getting 
 * saved as json.
 */
class StateMachine{
    constructor(id, startTime){
        this.id = id;
        this.currentState = 1;
        this.stateData = [];
        this.startTimeScenarios = [];
        this.endTimeScenarios = [];
        this.startTime = startTime;
        this.endTime = null;
    }

    addEndTime(endTime){
        this.endTime = endTime;
    }

    addSurveyData(surveyData){
        this.surveyData = surveyData;
    }
}

app.use(cors())
app.use((serveStatic(__dirname + "/FormApp/dist")));


let totalslides = 15;
let statestore = [];


/**
 * This trigger start as soon as the browser client
 * socket establishes a connection with server 
 * side socket.
 */
io.on('connection', function(socket){

    /**
     * Each new connection is added to a new room, so 
     * that the each of the request from the server 
     * is made distinct.
     */
    let roomId = uuidv4();
    socket.join(roomId);
    console.log(roomId);
    console.log(socket.rooms);
    console.log(socket.rooms.has(roomId));
    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S');
    let newState = new StateMachine(roomId, formatted);
    statestore.push(newState);
    for(let i=0; i<statestore.length; i++){
        if(statestore[i].id === roomId){
            if(statestore[i].stateData.length<statestore[i].currentState){
                statestore[i].stateData.push([]);
                // statestore[i].stateData[statestore[i].currentState-1].push([statestore[i].currentState]);
                // statestore[i].stateData[statestore[i].currentState-1].push([formatted]);
                statestore[i].startTimeScenarios.push([formatted]);    
                break;
            }else{
                // statestore[i].stateData[statestore[i].currentState-1].push([formatted]);
                statestore[i].startTimeScenarios.push([formatted]);    
            }
        }
    }
    
    /**
     * The trigger here is initiated as soon as input from
     *  the last scenario is received or the time is up.
     *  In either of those scenario, the following trigger
     *  gives the browser the scenario number which they
     *  need to show. This function could alos be modified
     *  if there is a need to randomize the input.
     */
    socket.on('NextScene',function(socketID, l){
        console.log('Sending Next Scene');
        
        let current = 0;
        let dt = dateTime.create();
        let formatted = dt.format('Y-m-d H:M:S');
        for(let i=0; i<statestore.length; i++){
            if(statestore[i].id === roomId){
                statestore[i].stateData[statestore[i].currentState-1] = l;
                if(statestore[i].stateData.length<=statestore[i].currentState){
                    console.log('New Entry');
                    // statestore[i].stateData[statestore[i].stateData.length-1].push([formatted]);
                    statestore[i].startTimeScenarios.push([formatted]);    
                    statestore[i].endTimeScenarios.push([formatted]);
                    statestore[i].stateData.push([]);
                    statestore[i].stateData[statestore[i].currentState-1].push([statestore[i].currentState]);
                    // statestore[i].stateData[statestore[i].currentState-1].push([formatted]);
                    break;
                }else{
                    console.log('Old Entry');
                    // statestore[i].stateData[statestore[i].currentState-1].push([formatted]);    
                    statestore[i].startTimeScenarios.push([formatted]);    
                    statestore[i].endTimeScenarios.push([formatted]);
            
            
                }
            }
        }
        for(let i=0; i<statestore.length; i++){
            if(statestore[i].id === roomId){
                current = statestore[i].currentState+1;
                statestore[i].currentState+=1;
                break;
            }
        }
        if(current<totalslides+1){
            io.to(roomId).emit('placeScene', current);
            if(current == totalslides){
                io.to(roomId).emit('deleteNext');
            }
        }
    })

    /**
     * Here, the required input is received by the server which the user
     *  have put on the browser. Here carId and customerId are the Ids
     *  which are mapped by the customer for the scenario last asked.
     */
    socket.on('selectedCustomer',function(carId,customerID){
        console.log('Received Car Input')
        let cur = [];
        cur.push(carId);
        cur.push(customerID);
        for(let i=0; i<statestore.length; i++){
            if(statestore[i].id === roomId){
                statestore[i].stateData[statestore[i].currentState-1].push(cur);
            }
        }
        console.log(roomId, cur);
        io.to(roomId).emit('disableCarCustomerInteractivity',cur);
    })
    
    /**
     * This trigger is not used in the latest version. 
     * Earlier it was used to send the signal from the
     * server to convert customer instance to a dot 
     * instance.
     */
    socket.on('createDots',function(){
        console.log('Making Dots Work!!');
        io.to(roomId).emit('makeDotsWork');
    })

    /**
     * This trigger is called by the web client as soon 
     * as the survey is filled by the user. The data 
     * variable contains the data added by the users 
     * on the site.
     */
    socket.on('survey-data',function(data, l){
        
        console.log(roomId,data,l);
        let finalId = 0;
        for(let i=0; i<statestore.length; i++){
            if(statestore[i].id === roomId){
                statestore[i].addSurveyData(data);
                finalId = i;
            }
        }
        statestore[finalId].stateData[statestore[finalId].currentState-1] = l;
        let fileName = roomId.concat(".json");
        let dt = dateTime.create();
        let formatted = dt.format('Y-m-d H:M:S');
        statestore[finalId].addEndTime(formatted);    
        statestore[finalId].endTimeScenarios.push([formatted]);
        statestore[finalId].stateData[statestore[finalId].currentState-1].push([statestore[finalId].currentState]);
        console.log(fileName);
        fs.writeFile(path.join(__dirname,storeDirectory,fileName), JSON.stringify(statestore[finalId]), 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log("JSON file has been saved.");
        });
        console.log(statestore[finalId]);
        let finalMessage = "Thank you for your response. Your response has been recorded. As a last step, please enter the following code on Prolific to complete the survey : C18EHJ1N";
        // let message = finalMessage.concat(roomId, ". You can close the Tab.");
        
        io.to(roomId).emit('couponCode', finalMessage);
    })
})


const port = process.env.PORT || 3000; 

// var privateKey = fs.readFileSync('/etc/mpiacme/taxi-dispatcher.mpi-sws.org/taxi-dispatcher.mpi-sws.org.pem').toString();
// var certificate = fs.readFileSync('/etc/mpiacme/taxi-dispatcher.mpi-sws.org/taxi-dispatcher.mpi-sws.org.pem').toString();
// var ca = fs.readFileSync('/etc/mpiacme/taxi-dispatcher.mpi-sws.org/taxi-dispatcher.mpi-sws.org.pem').toString();

https.listen(port, () => {
    console.log('Server Started');
});
