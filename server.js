'use strict';
const express = require("express");
const movies = require("./Movie data/data.json");
const app = express();

function Movies(title, poster_path, overview){
    this.title = title;
    this.poster_path = poster_path;
    this.overview = overview;
}

app.get('/', moviesHandler);
app.get('/favorite', favoriteMovies);
app.get('*', notFound);

function moviesHandler(req, res){
    let result = [];
    movies.data.forEach(value => {
        let oneMovie = new Movies(value.title, value.poster_path, value.overview);
        result.push(oneMovie);
    });
    return res.status(200).json(result);
}

function favoriteMovies(req, res){
    return res.status(200).send("Welcome to Favorite Page");
}

function notFound(req, res){
    return res.status(404).send("Requested page isn't found");
}

function serverError(req, res){
    res.status(500).send({
        "status": 500,
        "responseText": "Sorry, something went wrong within the local server"
      });
}

app.listen(3000, () => {
    console.log("Listen on 3000");
});