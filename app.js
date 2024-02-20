//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/localToDoListDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    try {
        const document = await List.findOne({
            name: customListName
        });

        if (document) {
            res.render("list", {
                listTitle: document.name,
                newListItems: document.items
            });
            console.log('Document found:', document.name);
        } else {
            const list = new List({
                name: customListName,
                items: defaultItems
            });

            await list.save();
            res.redirect("/" + customListName);
            console.log('Document not found.');
        }
    } catch (error) {
        console.log("Error:", error);
    }
});

app.get("/", async(req, res) =>{
    const items = await Item.find({});
    
    if(items.length === 0){
        Item.insertMany(
            defaultItems
        ).then(function(){
            console.log("Data inserted.");
        }).catch(function(error){
            console.log(error);
        });
        res.redirect("/");
    }else {
        res.render("list", {
            listTitle: "Today",
            newListItems: items
        });
    }
});

app.post("/", async (req, res) => {
    try{
        const itemName = req.body.newItem;
        const listName = req.body.list;

        const item = new Item({
            name: itemName
        });

        if (listName === "Today"){
            await item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({name: listName});
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/"+listName);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/delete", async (req, res) => {
    const documentId = req.body.checkbox;
    const listName = req.body.listName;

    try {
        const foundListToDeleteFrom = await List.findOne({name: listName});
        const index = foundListToDeleteFrom.items.findIndex(item => item._id == documentId);
        foundListToDeleteFrom.items.splice(index, 1);
        await foundListToDeleteFrom.save();

        console.log('Item with ID ', documentId, ' removed.');
        res.redirect("/" + listName);
    } catch (err) {
        console.error("Error:", err); 
        res.status(500).json({
            error: 'An error occurred.'
        });
    }
});

app.get("/about", function(re, res){
    res.render("about");
});

app.listen(3000, function () {
    console.log("server started on port 3000");
});