const express = require('express')
const cors = require('cors')
const os = require('os')
const multer = require('multer')
const httpStatus = require('http-status')
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient('http://127.0.0.1:5002')
const router = express.Router()

const STORAGE = (os.platform() === 'darwin') ? './root/storage' : '/root/storage'

const upload = multer({ dest: STORAGE })

const app = express()
app.use(cors())
app.use('/api', router)

router.post('/api/media', upload.single('file'), async (req, res) => {
  console.log(123);
  const info = await ipfsService.add(req.file)
  const content = fs.readFileSync(req.file.path)
  const data = await ipfs.add({
    path: `./${req.file.originalname}`,
    content: content
  })
  

  fs.unlinkSync(req.file.path)
  return res.status(httpStatus.OK).json(info)
})


app.listen(8090, () => {
  console.log('start');
})

// export default app
