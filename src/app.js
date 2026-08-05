import express from "express"

const app = express()

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.get("/", (req, res) => {
    res.send("Backend is running!")
})

export { app }
