const express = require('express');
const app = express();
const axios = require('axios');
const xml2js = require('xml2js');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

const port = 3000;

const url =
	'mongodb+srv://admin:admin@cluster0.sjjhqsb.mongodb.net/?retryWrites=true&w=majority';

app.use(bodyParser.json());

// Function to make API requests and parse XML responses
async function fetchDataAndCombine() {
	try {
		const response1 = await axios.get(
			'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML',
		);
		const response2 = await axios.get(
			'https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/440?format=xml',
		);

		const xmlResponse1 = await parseXML(response1.data);
		const xmlResponse2 = await parseXML(response2.data);

		const combinedData = {
			makeId: '[value]',
			makeName: '[value]',
			vehicleTypes: [
				{
					typeId: '[value]',
					typeName: '[value]',
				},
				{
					typeId: '[value]',
					typeName: '[value]',
				},
			],
		};

		combinedData.xmlResponse1 = xmlResponse1;
		combinedData.xmlResponse2 = xmlResponse2;

		const client = new MongoClient(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		await client.connect();

		const db = client.db('admin');

		const collection = db.collection('your-collection-name');

		const result = await collection.insertOne(combinedData);

		console.log('Data inserted into MongoDB:', result);

		client.close();
	} catch (error) {
		console.error('Error:', error);
	}
}

// Function to parse XML into a JavaScript object
function parseXML(xml) {
	return new Promise((resolve, reject) => {
		xml2js.parseString(xml, (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

// Define a route to retrieve all data from the MongoDB collection
app.get('/alldata', async (req, res) => {
	try {
		const client = new MongoClient(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		await client.connect();

		const db = client.db('admin');

		const collection = db.collection('your-collection-name');

		const data = await collection.find({}).toArray();

		client.close();

		res.json(data);
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.post('/insertdata', async (req, res) => {
	try {
		const client = new MongoClient(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		await client.connect();

		const db = client.db('admin');

		const collection = db.collection('your-collection-name');

		const dataToInsert = req.body;

		const result = await collection.insertOne(dataToInsert);

		client.close();

		res.json({ message: 'Data inserted successfully', result });
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Call the function to fetch data and combine it
fetchDataAndCombine();

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
