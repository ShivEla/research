import io from 'socket.io-client';
import 'survey-react/survey.css';
import * as Survey from "survey-jquery";
import $ from "jquery";
import './defaultV2.css';
import 'surveyjs-widgets';

/**
 * This class handles the socket for communication between
 * the sockets present at server and sockets present at the 
 * web client side. It also handles interactivity for all 
 * the scenes except the first one. This SocketHandler also 
 * handles the survey. 
 * 
 */
export default class SocketHandler{
    constructor(scene, GameHandler){

        this.placeSceneFunction = (index) => {
        console.log('Placing next scene');
        /**
         * Initializations of scene for each Map
         */
        scene.sceneTime = 121;
        scene.currentlySelectedCar = null;
        scene.finalCustomerSelected=[];
        scene.finalCarSelected=[];
        scene.finalSelected = [];
        scene.carWaitingTime = [];
        scene.carCoord = [];
        scene.customerCoord = [];
        scene.customerWaitingTime = [];
        scene.customerDestination=[];
        scene.carDestination=[];
        scene.customerColor = [];
        scene.carColor = [];
        // this.GameHandler.hideAnyPath();
        // scene.hideBlueText = false;
        // scene.hideRedText = false;
        // scene.hideYellowText = false;
        // scene.hideGreenText = false;

        scene.inputCount = 0;
        // this.GameHandler.hideAnyPath();
        scene.currentMap = index-1;
        scene.Maps[index-1].show(scene);
        this.GameHandler.dots = [];
        this.GameHandler.carId = null;
        this.GameHandler.customerId = null;
        this.GameHandler.infoDist = null;
        this.GameHandler.pathButton = null;
        this.GameHandler.selectedCar = null;
        this.GameHandler.selectedCustomer = null;
        this.GameHandler.waitingCar = [null, null, null];
        this.GameHandler.waitingCustomer = [null, null, null];
        this.GameHandler.promptWaitTimeCustomer();
        this.GameHandler.promptWaitTimeCar();
        this.GameHandler.removeOutputPath();
        this.GameHandler.promptMessageText = null;
        scene.hideCustomerText = [true, true, true];
        scene.hideCarText = [true, true, true];
        
        scene.mapCountText1 = scene.add.text(7,40, (scene.currentMap+1) + "/15" ).setFontSize(28).setFontFamily('Trebuchet MS').setColor('#753422').setFontStyle('bold');
        //this.mapCountText= this.add.text(7,55,scene.id ).setFontSize(28).setFontFamily('Trebuchet MS').setColor('#753422').setFontStyle('bold');


        // let tot = this.Maps[0].data["colorID"].length;
        console.log("Info:", scene.customerWaitingTime, scene.carWaitingTime);

        for(let i=0;i<scene.customerWaitingTime.length;i++){
            scene.hideCustomerText[i] = false;
        }
        for(let i=0;i<scene.carWaitingTime.length;i++){
            scene.hideCarText[i] = false;
        }
        scene.updateWaitTime();
        


        /**
         * The following loop intiate all the functions which is needed to
         * draw path between customer and the car. It also send the final 
         * selection, if a path is selected back to the server.
         * 
         */
        for(let i=0; i< scene.Maps[scene.currentMap].cars.length; i++){
            scene.Maps[scene.currentMap].cars[i].instance.on('pointerdown', () => {
                this.GameHandler.hideAnyPath(); 
                this.GameHandler.removeOutputPath();
                this.GameHandler.removeSelectedCustomer();
                scene.socket.emit("selectedCar", i);
                if(scene.currentlySelectedCar==null){
                    this.GameHandler.drawSelectedCar(i);
                    // this.GameHandler.hideCustomers();
                    // this.GameHandler.createDots();
                    scene.currentlySelectedCar = i;
                    // scene.socket.emit('createDots');
                }else{
                    this.GameHandler.removeSelectedCar();
                    if(scene.currentlySelectedCar==i){
                        scene.currentlySelectedCar = null;
                        // this.GameHandler.destroyDots();
                        // this.GameHandler.showCustomers();
                    }else{
                        this.GameHandler.drawSelectedCar(i);
                        // this.GameHandler.destroyDots();
                        // this.GameHandler.createDots();
                        scene.currentlySelectedCar = i;
                        // scene.socket.emit('createDots');
                    }
                }
                this.GameHandler.hideAnyPath();
                this.GameHandler.removeOutputPath();
                if(scene.currentlySelectedCustomer!=null){
                    scene.Maps[scene.currentMap].cars[scene.currentlySelectedCar].drawIndividualPath(scene.currentlySelectedCustomer);
                    this.GameHandler.promptOutputPath(scene.currentlySelectedCar,scene.currentlySelectedCustomer);
                    this.GameHandler.handleButton(scene.currentlySelectedCar,scene.currentlySelectedCustomer);
                }
                console.log('Clicked car index: '+ i);
            })
        }
        /**
         * The following for loop handles the clicking for customer.
         * It also send the final selection, if a path is selected
         * back to the server.
         * 
         */
        for(let i=0; i< scene.Maps[scene.currentMap].customers.length; i++){
            scene.Maps[scene.currentMap].customers[i].instance.on('pointerdown', () => {
                console.log('Clicked customer index: '+ i);
                scene.currentlySelectedCustomer = i;
                this.GameHandler.removeSelectedCustomer();
                this.GameHandler.drawSelectedCustomer(i);
                this.GameHandler.hideAnyPath();
                this.GameHandler.removeOutputPath();
                if(scene.currentlySelectedCar!=null){
                    scene.Maps[scene.currentMap].cars[scene.currentlySelectedCar].drawIndividualPath(scene.currentlySelectedCustomer);
                    this.GameHandler.promptOutputPath(scene.currentlySelectedCar,scene.currentlySelectedCustomer);
                    this.GameHandler.handleButton(scene.currentlySelectedCar,scene.currentlySelectedCustomer);
                }
            })
        }
    }
        this.GameHandler =  GameHandler;
        this.currentlySelectedDot = null;
        /**
         * Here is the part which initiates the socket on the client side,
         * The following code also include major socket functions as described
         * below
         */
        //scene.socket =  io('http://localhost:3000/');
		scene.socket =  io('https://taxi-dispatcher.mpi-sws.org');

        /**
         * Called when the socket connects on the client side
         * gets connected with socket on the server side.
         */
        scene.socket.on('connect', () => {
            console.log('Connected!');
            scene.nextButton.setInteractive();
            scene.nextButton.setColor('#FF0000');
            scene.clearButton.setInteractive();
            scene.clearButton.setColor('#FF0000');
        })

        /**
         * Here Code is received from the server for this particular user.
         */
        scene.socket.on('couponCode', (message)=> {
            console.log(message);
            alert(message);
        });

        /**
         * The server here requesting the client to place next scene
         */
        scene.socket.on('placeScene', (index) =>{
            this.placeSceneFunction(index);
        })

        /**
         * This is a redundant function now, earlier used to handle 
         * customer to dot and back to customer conversion. However, 
         * this call is not needed anymore.
         */
        scene.socket.on('makeDotsWork', () => {
            for(let i=0; i<this.GameHandler.dots.length; i++){
                this.GameHandler.dots[i].on('pointerdown', () => {
                    this.GameHandler.hideAnyPath();
                    console.log('Clicked Dot Id: ', i);
                    this.GameHandler.removeOutputPath();
                    if(scene.currentlySelectedCar!=null){
                        scene.Maps[scene.currentMap].cars[scene.currentlySelectedCar].drawIndividualPath(i);
                        this.GameHandler.promptOutputPath(scene.currentlySelectedCar,i);
                        this.GameHandler.handleButton(scene.currentlySelectedCar,i);
                    }
                    
                })
            }
            

        })
        
        /**
         * The following socket trigger occurs when all the scenes
         * are done, and take survey button is called. surveyJSON
         * provides the JSON format survey which could be easily
         * remade for any other survey using surveyjs.io(for instructions). 
         */

        scene.socket.on('deleteNext',() => {
            scene.nextButton.destroy();
            // scene.clearButton.destroy();
            // Survey.StylesManager.applyTheme("defaultV2");
            
            var surveyJSON = {
            "title": "Survey",
            "logoPosition": "right",
            "showCompletedPage": false,
            "showTitle": false,
            "pages": [{
            "name": "page1",
            "elements": [
                {
                    "type": "text",
                    "name": "question0",
                    "title": "Your Prolific ID",
                    "isRequired": true,
                    "placeholder": "Prolific ID",
                    "maxLength": 25  
                },
                {
                "type": "radiogroup",
                "name": "question1",
                "title": "You identify yourself as",
                "isRequired": true,
                "choices": [{
                "value": "item1",
                "text": "Male"
                },
                {
                "value": "item2",
                "text": "Female"
                },
                {
                "value": "item3",
                "text": "Other"
                }
                ]
                // ],
                // "hasOther": true,
                // "otherText": "Prefer not to answer"
                },
                {
                "type": "radiogroup",
                "name": "question2",
                "title": "Your age",
                "isRequired": true,
                "choices": [
                {
                "value": "item1",
                "text": "18-24"
                },
                {
                "value": "item2",
                "text": "25-34"
                },
                {
                "value": "item3",
                "text": "35-44"
                },
                {
                "value": "item4",
                "text": "45-54"
                },
                {
                "value": "item5",
                "text": ">54"
                },
                {
                "value": "item6",
                "text": "Prefer not to answer"
                }
                ]
                },
                {
                    "type": "text",
                    "name": "question3",
                    "title": "Please enter your current country of residence",
                    "isRequired": true,
                    "placeholder": "Your country name",
                    "maxLength": 50  
                },
                {
                "type": "radiogroup",
                "name": "question4",
                "title": "What is the highest level of education you have completed?",
                "isRequired": true,
                "choices": [
                {
                "value": "item1",
                "text": "Less than high school diploma"
                },
                {
                "value": "item2",
                "text": "High school diploma"
                },
                {
                "value": "item3",
                "text": "Undergraduate degree"
                },
                {
                "value": "item4",
                "text": "Masters degree"
                },
                {
                "value": "item5",
                "text": "PhD degree"
                },
                {
                "value": "item6",
                "text": "Prefer not to answer"
                }
                ]
                },
                {
                "type": "radiogroup",
                "name": "question5",
                "title": "What is your total household income?",
                "isRequired": true,
                "choices": [
                {
                "value": "item1",
                "text": "Less than $10,000"
                },
                {
                "value": "item2",
                "text": "$10,000 to $29,999"
                },
                {
                "value": "item3",
                "text": "$30,000 to $59,999"
                },
                {
                "value": "item4",
                "text": "$60,000 to $89,999"
                },
                {
                "value": "item5",
                "text": "$90,000 to $119,999"
                },
                {
                "value": "item6",
                "text": "$120,000 or more"
                },
                {
                "value": "item7",
                "text": "Prefer not to answer"
                }
                ]
                    }
                ]
                }
                ]
            };

            var survey = new Survey.Model(surveyJSON);
            // survey.onComplete.add(function (sender) {
            //     document.querySelector('#surveyResult').textContent = "Result JSON:\n" + JSON.stringify(sender.data, null, 3);
            //   });
            function sendDataToServer(survey, options) {
                scene.socket.emit('survey-data', survey.data, scene.finalSelected);
            }

            scene.surveyButton = scene.add.text(1740,2,"Take Survey").setFontStyle('bold').setFontSize(28).setFontFamily('Trebuchet MS').setColor('#FF0000');
            scene.surveyButton.setInteractive();
            let mxidx = Math.min(scene.carWaitingTime.length, scene.customerWaitingTime.length);
            
            // scene.surveyButton.setColor('#00ffff');
            console.log("Mxidx", mxidx);
            scene.surveyButton.on('pointerdown', () => {
                if(scene.inputCount!=mxidx){
                    // this.scene.start("Instruction");
                    this.GameHandler.promptMessage('Match cabs and customers!');
                }else{
                    scene.scene.remove();
                    $("#surveyContainer").Survey({
                        model: survey,
                        onComplete: sendDataToServer
                    });
                }
                console.log('Clicked Survey');
            })
    
            scene.surveyButton.on('pointerover', () => {
                scene.surveyButton.setColor('#f39c12');
            })
    
            scene.surveyButton.on('pointerout', () => {
                scene.surveyButton.setColor('#FF0000');
            })
    
            

        })

        /**
         * This trigger is generated by the server to diable the car 
         * and customer interactivity. The function also make sure 
         * the wait times are removed too as soon as that customer 
         * or car is removed. 
         */
        scene.socket.on('disableCarCustomerInteractivity',(inp) => {
            scene.Maps[scene.currentMap].cars[inp[0]].instance.disableInteractive();
            scene.Maps[scene.currentMap].customers[inp[1]].instance.disableInteractive();
            scene.inputCount += 1;
            this.GameHandler.removeOutputPath();
            this.GameHandler.removeSelectedCar();
            this.GameHandler.removeSelectedCustomer();
            this.GameHandler.hideAnyPath();
            this.GameHandler.promptMessageText = null;
            scene.currentlySelectedCar = null;
            scene.currentlySelectedCustomer = null;
            scene.finalCustomerSelected.push(inp[1]);
            scene.finalCarSelected.push(inp[0]);
            scene.finalSelected.push(inp);

            scene.hideCustomerText[inp[1]] = true;
            if(this.GameHandler.waitingCustomer[inp[1]]!=null){
                this.GameHandler.waitingCustomer[inp[1]].destroy();
            }
            if(scene.customerTimeText[inp[1]]!=null){
                scene.customerTimeText[inp[1]].destroy();
            }

        
            scene.hideCarText[inp[0]] = true;
            if(this.GameHandler.waitingCar[inp[0]]!=null){
                this.GameHandler.waitingCar[inp[0]].destroy();
            }
            if(scene.carTimeText[inp[0]]!=null){
                scene.carTimeText[inp[0]].destroy();
            }

            
            // }
            let carSelected = scene.Maps[scene.currentMap].cars[inp[0]];
            let customerSelected1 = scene.Maps[scene.currentMap].customers[inp[1]];
            // let customerSelected2 = scene.Maps[scene.currentMap].customers[1];
            let v1 = scene.add.image(carSelected.screenX,carSelected.screenY, 'carBW');
            v1.setScale(scene.scalefactor);
            let v2 = scene.add.image(customerSelected1.screenX,customerSelected1.screenY, 'customerBW'+inp[1]);
            v2.setScale(scene.scalefactor);
            
            let mxidx = Math.min(scene.carWaitingTime.length, scene.customerWaitingTime.length);
            if(scene.inputCount === mxidx){
                if(scene.currentMap === 14){
                    this.GameHandler.promptMessage("Press Take Survey button!");    
                }
                else{
                    this.GameHandler.promptMessage("Press Next Map button!");
                }
            }
            
        })


    }
}
