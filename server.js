"use strict";
const express = require("express");
const movies = require("./Movie data/data.json");
const app = express();
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
const APIKEY = process.env.APIKEY;
const PORT = process.env.PORT;
const pg = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;

// const client = new pg.Client(DATABASE_URL);

//for heroku
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function Movies(id, title, release_date, poster_path, overview) {
  this.id = id;
  this.title = title;
  this.release_date = release_date;
  this.poster_path = poster_path;
  this.overview = overview;
}

app.use(express.json());
app.get("/", moviesHandler);
app.get("/favorite", favoriteMovies);
app.get("/trending", trendingHandler);
app.get("/search", searchHandler);
app.get("/topRated", topHandler);
app.get("/upcoming", upcomingHandler);
app.post("/addMovie", addHandler);
app.get("/getMovie", getHandler);
app.get("/movieById/:id", getMovieById);
app.put("/updateMovie/:id", updateMovieHandler);
app.delete("/deleteMovie/:id", deleteMovieHandler);

app.use(serverError);
app.get("*", notFound);

function moviesHandler(req, res) {
  let result = [];
  movies.data.forEach((value) => {
    let oneMovie = new Movies(
      value.id || "N/A",
      value.title,
      value.release_date || "N/A",
      value.poster_path,
      value.overview
    );
    result.push(oneMovie);
  });
  return res.status(200).json(result);
}

function trendingHandler(req, res) {
  let result = [];
  axios
    .get(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${APIKEY}&language=en-US`
    )
    .then((apiResponse) => {
      apiResponse.data.results.map((value) => {
        let oneMovie = new Movies(
          value.id,
          value.title,
          value.release_date,
          value.poster_path,
          value.overview
        );
        result.push(oneMovie);
      });
      return res.status(200).json(result);
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function searchHandler(req, res) {
  const search = req.query.search;
  let result = [];
  axios
    .get(
      `https://api.themoviedb.org/3/search/movie?api_key=${APIKEY}&language=en-US&query=${
        search || "spider-man"
      }&page=2`
    )
    .then((apiResponse) => {
      apiResponse.data.results.map((value) => {
        let oneMovie = new Movies(
          value.id || "N/A",
          value.title || "N/A",
          value.release_date || "N/A",
          value.poster_path || "N/A",
          value.overview || "N/A"
        );
        result.push(oneMovie);
      });
      return res.status(200).json(result);
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function topHandler(req, res) {
  let topRated = [];
  axios
    .get(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${APIKEY}&language=en-US&page=1`
    )
    .then((value) => {
      value.data.results.forEach((value) => {
        let oneMovie = new Movies(
          value.id,
          value.title,
          value.release_date,
          value.poster_path,
          value.overview
        );
        topRated.push(oneMovie);
      });
      return res.status(200).json(topRated);
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function upcomingHandler(req, res) {
  let upcoming = [];
  axios
    .get(
      `https://api.themoviedb.org/3/movie/upcoming?api_key=${APIKEY}&language=en-US&page=1`
    )
    .then((value) => {
      value.data.results.forEach((value) => {
        let oneMovie = new Movies(
          value.id,
          value.title,
          value.release_date,
          value.poster_path,
          value.overview
        );
        upcoming.push(oneMovie);
      });
      res.status(200).json(upcoming);
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function addHandler(req, res) {
  const movie = req.body;
  const sql = `INSERT INTO addMovies(title, release_date, poster_path, overview, comment) VALUES($1, $2, $3, $4, $5) RETURNING *`;
  const values = [
    movie.title,
    movie.release_date,
    movie.poster_path,
    movie.overview,
    movie.comment,
  ];
  client
    .query(sql, values)
    .then((result) => {
      res.status(201).json(result.rows);
    })
    .catch((error) => {
      console.log(error);
      serverError(error, req, res);
    });
}

function getHandler(req, res) {
  const sql = `SELECT * FROM addMovies`;

  client
    .query(sql)
    .then((result) => {
      return res.status(200).json(result.rows);
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function getMovieById(req, res) {
  let id = req.params.id;
  const sql = `SELECT * FROM addMovies WHERE id = $1;`;
  const values = [id];

  client
    .query(sql, values)
    .then((result) => {
      return res.status(200).json(result.rows[0]);
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function updateMovieHandler(req, res) {
  const id = req.params.id;
  const recipe = req.body;

  const sql = `UPDATE addMovies SET title = $1, release_date = $2,poster_path = $3, overview = $4, comment = $5 WHERE id = $6 RETURNING *;`;
  const values = [
    recipe.title,
    recipe.release_date,
    recipe.poster_path,
    recipe.overview,
    recipe.comment,
    id,
  ];

  client
    .query(sql, values)
    .then((result) => {
      return res.status(200).json(result.rows);
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function deleteMovieHandler(req, res) {
  const id = req.params.id;

  const sql = `DELETE FROM addMovies WHERE id=$1;`;
  const values = [id];

  client
    .query(sql, values)
    .then(() => {
      return res.status(204).json({});
    })
    .catch((error) => {
      serverError(error, req, res);
    });
}

function favoriteMovies(req, res) {
  return res.status(200).send("Welcome to Favorite Page");
}

function notFound(req, res) {
  return res.status(404).send("Requested page isn't found");
}

function serverError(error, req, res) {
  return res.status(500).send({
    status: 500,
    responseText: "Sorry, something went wrong within the local server",
  });
}

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Listen on ${PORT}`);
  });
});