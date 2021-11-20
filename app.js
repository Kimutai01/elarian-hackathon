require('dotenv').config(); // load configs from .env
const firebase = require("firebase/app");

const firebaseConfig = {
    apiKey: "AIzaSyAGSoMwtlv7Jh8H-GwCKqfZOdnul-7SuXQ",

    authDomain: "money-disbursion.firebaseapp.com",
  
    projectId: "money-disbursion",
  
    storageBucket: "money-disbursion.appspot.com",
  
    messagingSenderId: "194461712693",
  
    appId: "1:194461712693:web:c72ca3d859a14f4fe5cc7c"
  
};
firebase.initializeApp(firebaseConfig);
require('firebase/firestore')
require('firebase/auth')
const db = firebase.firestore()

// const addData = () => {
//     db.collection("users").add({
//         amount: 120000
//     }).then(() => {
//         console.log("Information added successfully");
//     })
// }

// addData()

const log = require('signale');



const { Elarian } = require('elarian');

let client;

const smsChannel = {
    number: process.env.SMS_SHORT_CODE,
    channel: 'sms',
};

const mpesaChannel = {
    number: process.env.MPESA_PAYBILL,
    channel: 'cellular',
};

const purseId = process.env.PURSE_ID;

const makeOrder = async (customer) => {
    log.info(`Processing order from ${customer.customerNumber.number}`);
    const {
        email,
        Password,
        daily
    } = await customer.getMetadata();
    const kim = new client.Customer({
        provider: 'cellular',
        number: '+254790841979'
    })
    await kim.sendMessage(
        smsChannel, {
            body: {
                text: `Hello ${name} have saved ${balance} and you'll recieve ${daily} amount `,
            },
        },
    );
    await customer.deleteAppData();
};

const processUssd = async (notification, customer, appData, callback) => {
    try {
        log.info(`Processing USSD from ${customer.customerNumber.number}`);
        const input = notification.input.text;
        console.log(input)

        let screen = 'home';
        if (appData) {
            screen = appData.screen;
        }

        const customerData = await customer.getMetadata();
        let {
            email,
            password,
            balance,
            daily
        } = customerData;
        const menu = {
            text: null,
            isTerminal: false,
        };
        let nextScreen = screen;
        console.log(nextScreen)
        if (screen === 'home' && input !== '') {
            if (input === '1') {
                nextScreen = 'request-name';
            } else if (input === '2') {
                nextScreen = 'quit';
            }
        }
        switch (nextScreen) {
        case 'quit':
            menu.text = 'Goodbye';
            menu.isTerminal = true;
            nextScreen = 'home';
            callback(menu, {
                screen: nextScreen,
            });
            break;
        case 'request-name':
            menu.text = `Okay , what is your email`
            nextScreen = 'request-password';
            callback(menu, {
                screen: nextScreen,
            });
            break;
        case 'request-password':
            email = input;
            menu.text = `Please enter your password :`;
            nextScreen = 'total-deposit';
            callback(menu, {
                screen: nextScreen,
            });
            break;
        case 'total-deposit':
            password=input
            menu.text = `Okay ${username} what amount do you want to save:`;
            nextScreen = 'daily-amount';
            callback(menu, {
                screen: nextScreen,
            });
            break;
        case 'daily-amount':
            balance=input;
            username = username;
            menu.text = `Okay ${username} what amount do you want to get daily:`;
            nextScreen = 'final-page';
            callback(menu, {
                screen: nextScreen,
            });
            break;
         case 'final-page':
            balance=balance;
            username = username;
            daily = input;

            menu.text = `Okay ${username} the amount you deposited is ${balance} and the daily amount is ${daily} (yes or no)`;
            nextScreen = 'finish-order';
            callback(menu, {
                screen: nextScreen,
            });
            break;
        case 'finish-order':
            acceptance = input;
            if (acceptance == "Yes" || acceptance == "yes"){
                menu.text = `You'll recieve an sms for your transactions`
            }else{
                menu.text = `You have cancelled the request. You can try again`
            }
            menu.isTerminal = true;
            nextScreen = 'home';
            callback(menu, {
                screen: nextScreen,
            });
            await makeOrder(customer);
            break;
        case 'home':
        default:
            menu.text = 'Welcome to my monie!\n1.To start saving \n 2. Quit';
            menu.isTerminal = false;
            callback(menu, {
                screen: nextScreen,
            });
            break;
        }
        await customer.updateMetadata({
            username,
            email,
            balance,
            daily
            
        });
        console.log(username)
        console.log(email)
        console.log(balance)
        console.log(daily)
    } catch (error) {
        log.error('USSD Error: ', error);
    }
};


const start = () => {
    client = new Elarian({
        appId: process.env.APP_ID,
        orgId: process.env.ORG_ID,
        apiKey: process.env.API_KEY,
    });

    client.on('ussdSession', processUssd);

    client
        .on('error', (error) => {
            log.warn(`${error.message || error} Attempting to reconnect...`);
            client.connect();
        })
        .on('connected', () => {
            log.success(`App is connected, waiting for customers on ${process.env.USSD_CODE}`);
        })
        .connect();
};
start();