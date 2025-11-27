import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error(err));

const express = require("express");
const app = express();

const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("todo");

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const cors = require("cors");
app.use(
	cors({
		origin: "https://todo-web-phi.vercel.app",
		// if using cookies / credentials: add credentials: true
	})
);

app.get("/tasks", async (req, res) => {
	const data = await db
		.collection("tasks")
		.aggregate([
			{
				$sort: {
					created: -1,
				},
			},
		])
		.toArray();

	//   setTimeout(() => {
	//     return res.json(data);
	//   }, 2000)

	return res.json(data);
});

app.get("/tasks/:id", async (req, res) => {
	const { id } = req.params;

	const data = await db
		.collection("tasks")
		.findOne({ _id: new ObjectId(id) });

	return res.json(data);
});

app.post("/tasks", async (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ msg: "name require" });

	const result = await db.collection("tasks").insertOne({
		name,
		done: false,
		created: new Date(),
	});

	return res.json({ _id: result.insertedId, name, done: false });
});

app.put("/tasks/:id", async (req, res) => {
	const { id } = req.params;
	const { name } = req.body;

	if (!name) return res.status(400).json({ msg: "name require" });

	try {
		const result = await db
			.collection("tasks")
			.updateOne({ _id: new ObjectId(id) }, { $set: { name } });

		return res.json(result);
	} catch (e) {
		return res.sendStatus(500);
	}
});

app.put("/tasks/:id/toggle", async (req, res) => {
	const { id } = req.params;

	const data = await db
		.collection("tasks")
		.findOne({ _id: new ObjectId(id) });

	const result = await db
		.collection("tasks")
		.updateOne({ _id: new ObjectId(id) }, { $set: { done: !data.done } });

	return res.json(result);
});

app.delete("/tasks/:id", async (req, res) => {
	const { id } = req.params;

	const result = await db
		.collection("tasks")
		.deleteOne({ _id: new ObjectId(id) });

	return res.json(result);
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
	console.log(`Todo server running on port ${PORT}`);
});
