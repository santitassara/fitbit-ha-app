
import * as fs from "fs";
import * as messaging from "messaging";

import { me } from "appbit";
import { gettext } from "i18n";
import { settingsType, settingsFile } from "../common/constants";
import { sendData } from "../common/utils";

import document from "document";

let Available = false;
const CategoriesList = document.getElementById("categoryList");
const EntityList = document.getElementById("entityList");
const AddressText = document.getElementById("addressText");
AddressText.text = gettext("unavailable");

// Load settings
let settings = loadSettings();

// Register for the unload event
me.onunload = saveSettings;

// List of {id: "", name: "", state: ""}
let Categories = [];
let Entities = [];
const NextStates = {
    on: "turn_off",
    off: "turn_on",
    open: "close_cover",
    opening: "close_cover",
    closing: "open_cover",
    closed: "open_cover",
}

// const handleOnClick = () => {
//     {
//         console.log("CLICKED");
//         document.getElementById("itemCategory").style.display = "none";
//         document.getElementById("categoryGroup").style.display = "none";

//          document.getElementById("itemText").style.display = "inline";
//          document.getElementById("itemState").style.display = "inline";
//          document.getElementById("tile-divider-bottom").style.display = "inline";


//       }
// }

// Update list data
function setupList(list, data) {
    console.log("DATA");
    console.log(JSON.stringify(data));
    list.delegate = {
        getTileInfo: function (index) {
            return {
                type: "item-pool",
                category: data[index].id.split(".")[0],
                name: data[index].name,
                state: data[index].state,
                index: index
            };
        },
        configureTile: function (tile, info) {
            if (info.type === "item-pool") {
                tile.getElementById("itemText").text = `${info.name}`;
                tile.getElementById("itemState").text = `${gettext(info.state)}`;
                let categoryExists = false;
                for (let i = 0; i < Categories.length; i++) {
                    if (Categories[i] === info.category) {
                        categoryExists = true;
                        break;
                    }
                }
                if (!categoryExists) {
                    //tile.getElementById("itemText").text = `${info.name}`;
                    //tile.getElementById("itemState").text = `${gettext(info.state)}`;

                    // Remover cualquier asignación previa del evento click
                    //tile.getElementById("itemTouch").onclick = null;

                    // Agregar la categoría al array para realizar un seguimiento de su existencia
                    Categories.push(info.category);
                    tile.getElementById("itemCategory").text = `${info.category}`  
                    
                    // if (info.category === "sensor") {
                        //Categories.push("Sensors")
                        //console.log(Categories);

                    // }

                    let touch = tile.getElementById("itemTouch");
                //touch.onclick = () => sendData({key: "change", entity: Entities[info.index].id, state: NextStates[info.state]});
                touch.onclick = () => handleOnClick();
                } else {
                    // Si la categoría ya existe, oculta el mosaico
                    // tile.style.display = "none";
                }

                // tile.getElementById("itemText").text = `${info.name}`;
                // if (info.category === "sensor") {
                //     Categories.push("Sensors")
                //     console.log(Categories);

                //     //  tile.getElementById("itemCategory").text = `Sensors`   
                // }

               
                

            }
        }
    };
    list.length = data.length;
}

// function setupCategoryList(list, data) {
//     console.log("DATA2");
//     console.log(JSON.stringify(data));
//     list.delegate = {
//         getTileInfo: function(index) {
//             return {
//                 type: "category-pool",
//                 id: data[index].id,
//                 name: data[index].name,

//             };
//         },
//         configureTile: function(tile, info) {
//             if (info.type === "category-pool") {
//                 if (info.id.split(".")[0] === "sensor"){
//                     tile.getElementById("categoryText").text = `Sensors`;
//                 }

//                 let touch = tile.getElementById("categoryTouch");
//                 touch.onclick = () => handleOnClick();
//             }
//         }
//     };
//     list.length = data.length;
// }
const handleOnClick = () => {
    {
        console.log("CLICKED");
        document.getElementById("itemCategory").style.display = "none";
        document.getElementById("itemTouch").style.display = "none";
         document.getElementById("itemText").style.display = "inline";
         document.getElementById("itemState").style.display = "inline";
         document.getElementById("tile-divider-bottom").style.display = "inline";
         document.getElementById("arrowTitle").style.display = "inline";

         


         
      }
}



// Received message
messaging.peerSocket.onmessage = (evt) => {
    console.log(`Received: ${JSON.stringify(evt)}`);
    if (evt.data.key === "clear") {
        Entities = [];
        settings.entities = [];
    }
    else if (evt.data.key === "add") {
        Entities.push({ id: evt.data.id, name: evt.data.name, state: evt.data.state });
        settings.entities.push({ name: evt.data.id });
        setupList(EntityList, Entities);
        Categories.push({ id: evt.data.id });
        //  console.log("CATEGORIES");
        //  console.log(JSON.stringify(Categories));
        //  setupCategoryList(CategoriesList, Categories);
    }
    else if (evt.data.key === "change") {
        Entities.forEach((entity, index) => {
            if (entity.id === evt.data.id) {
                //DEBUG console.log(`Updated: ${evt.data.id} to ${evt.data.state}`);
                Entities[index].state = evt.data.state;
                setupList(EntityList, Entities);
            }
        })
    }
    else if (evt.data.key === "api") {
        if (evt.data.value === "ok") {
            Available = true;
            AddressText.text = evt.data.name;
        }
        else {
            Available = false;
            AddressText.text = evt.data.value;
        }
    }
    else if (evt.data.key === "url") {
        settings.url = evt.data.value;
        sendData({ key: "url", value: settings.url });
    }
    else if (evt.data.key === "port") {
        settings.port = evt.data.value;
        sendData({ key: "port", value: settings.port });
    }
    else if (evt.data.key === "token") {
        settings.token = evt.data.value;
        sendData({ key: "token", value: settings.token });
    }
    else if (evt.data.key === "force") {
        settings.force = evt.data.value;
        sendData({ key: "force", value: settings.force });
    }
}

// Message socket opens
messaging.peerSocket.onopen = () => {
    console.log("Socket open");
    sendData({ key: "url", value: settings.url });
    sendData({ key: "port", value: settings.port });
    sendData({ key: "token", value: settings.token });
    sendData({ key: "entities", value: settings.entities });
    sendData({ key: "force", value: settings.force });
};

// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log("Socket closed");
};

// Load settings
function loadSettings() {
    try {
        return fs.readFileSync(settingsFile, settingsType);
    }
    catch (ex) {
        console.error("Error loading settings");
        // Default values
        return {
            url: "localhost",
            port: "8123",
            token: "",
            force: true
        };
    }
}

// Save settings
function saveSettings() {
    fs.writeFileSync(settingsFile, settings, settingsType);
}
