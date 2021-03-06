const express = require('express')
const cors = require('cors')
const os = require('os')
const ipfsClient = require('ipfs-http-client')
const multer = require('multer')
const fs = require('fs')

const ipfs = ipfsClient('http://127.0.0.1:5002')
const STORAGE = (os.platform() !== 'linux') ? './root/storage' : '/root/storage'
const upload = multer({ dest: STORAGE })

const app = express()
app.use(cors())

const fpath = `./ipfs.json`
let jsonData = fs.readFileSync(fpath);
jsonData = JSON.parse(jsonData)

app.listen(8090, () => console.log(`server run 8090`))

app.get('/api/media', async (req, res) => {
  return res.status(200).json(jsonData)
})

app.post('/api/media', upload.single('file'), async (req, res) => {
  let chunks = []
  const readStream = fs.createReadStream(req.file.path)
  readStream.on('data', function(chunk) {
    chunks.push(chunk)
  })
  readStream.on('end', async () => {
    const data = await ipfs.add({
      path: `./${req.file.originalname}`,
      content: chunks
    })
    console.log(data);
    const info = {
      type: req.file.mimetype,
      title: req.file.originalname,
      id: data.path,
    }
    const file = jsonData.find(file => file.id === info.id)
    if (!file) {
      jsonData.push(info)
      fs.writeFileSync(fpath, JSON.stringify(jsonData))
    }
    fs.unlinkSync(req.file.path)
    return res.status(200).json(info)
  })
})

app.delete('/api/media/:id', async (req, res) => {
  jsonData = jsonData.filter(file => file.id !== req.obj.id)
  fs.writeFileSync(fpath, JSON.stringify(jsonData))
  return res.status(200).json(jsonData)
})

app.param('id', (req, res, next, id) => {
  const obj = jsonData.find(file => file.id === id)
  req.obj = obj
  next()
})