// server/app.js
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('superagent');

const app = express();
const cors = require('cors');

// Setup logger
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'));

// Serve static assets
app.use(express.static(path.resolve(__dirname, '..', 'build')));

app.use(cors());
app.use(bodyParser.json());

function getFootprint(name, amount) {
	const body = {
		"recipe": {
			"titles": [
						{
							"language": "DE",
							"value": name
						}
					],
			"location": "Zurich, Switzerland",
			"date": "2017-02-11",
			"ingredients": [
				{

					"names": [
						{
							"language": "DE",
							"value": name
						}
					],
					"amount": amount,
				}
			]
		}

	};
	return new Promise((resolve, reject) => {
		request.post('https://test.eaternity.ch/api/recipes?full-resource=true')
			.set('Authorization', 'Basic aDRjSzR0SDBOT2c3NUhqZkszMzlLbE9scGEzOWZKenhYdzo=')
			.set('Accept', 'application/json')
			.send(body)
			.end((err, res) => {
				if (err) {
					console.log(JSON.stringify(err, 0, 2));
					reject(err);
				} else {
					resolve(res);
				}
			});
	});
}

app.post('/co2', (req, res) => {
	let promises = req.body.map(item => getFootprint(item.name, item.amount));
	Promise.all(promises).then(values => {
			res.send(JSON.stringify(values.map((value, i) => {
				let result = {};
				result.name = req.body[i].name;
				result.amount = req.body[i].amount;
				result.co2 = value.body.recipe['co2-value'];
				result.nameFound = value.body.recipe.ingredients.map(v => v.names.map(w => w.value).join(' ')).join(' ');
				return result;
			}), 0, 2));
	});
});

// Always return the main index.html, so react-router render the route in the client
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
});

module.exports = app;
