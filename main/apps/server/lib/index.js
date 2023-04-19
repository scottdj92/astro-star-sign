"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var PORT = 3000;
var app = (0, express_1["default"])();
//connect to database
// start server
app.get("/", function (req, res) {
    res.statusCode = 200;
    res.send("Hello world");
});
app.listen(PORT, function () {
    console.log("Server running on ".concat(PORT));
});
