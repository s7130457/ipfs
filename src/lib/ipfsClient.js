const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient('http://127.0.0.1:5002')
const fs = require('fs')

function IPFS() {
  this.fpath = `ipfs.json`
  this.data = fs.readFileSync(this.fpath);
  this.data = JSON.parse(this.data)
}

IPFS.prototype.add = async function (file) {
  const content = fs.readFileSync(file.path)
  const data = await ipfs.add({
    path: `./${file.originalname}`,
    content: content
  })

  console.log(data);
  const info = {
    type: file.mimetype,
    title: file.originalname,
    id: data.path,
    // cid: data.cid

  }
  this.data.push(info)
  save.call(this)
  return info
}

IPFS.prototype.list = function () {
  return this.data
}

IPFS.prototype.get = function (id) {
  const file = this.data.find(file => file.id === id)
  return file
}

IPFS.prototype.del = async function (obj) {
  this.data = this.data.filter(file => file.id !== obj.id)
  save.call(this)
  // const a = await ipfs.files.rm(`/ipfs/${obj.id}/170836966_4664369903579501_1771197942068864446_n.jpeg`)
  // console.log(a);
  return this.data
}

function save() {
  fs.writeFileSync(this.fpath, JSON.stringify(this.data))
}
module.exports = new IPFS()
