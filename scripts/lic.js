#!/usr/bin/env node

const sha = require('js-sha3')
const fetch = require('node-fetch')

if (process.argv.length < 3) {
 console.log(`Usage: lic [ip]`)
 process.exit()
}

const ip = process.argv[2]
const url = `http://${ip}/api/license`
main()

async function main () {
  if (await _isLicensed()) {
    console.log('The device is licensed!');
    return
  }
  
  console.log(`Connect to ${ip} ...`)
  const info = await _getMachineInfo()
  console.log(info)
  
  console.log(`Create a ${info.model} license for ${ip} ...`)
  const license = sha.keccak256(`bxb9703838${info.deviceId}${info.serial}${info.model}`)
  
  console.log(`Setting the license...`)
  _setLicense(license)

  console.log(`Done.`)
}

async function _isLicensed () {
  let res = await fetch(`http://${ip}/api/sysinfo`)
  res = await res.json()
  return res.license
}

async function _getMachineInfo () {
  let info = await fetch(url)
  info = await info.json()
  return info
}

async function _setLicense (license) {
  let res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({license})
  })
  return (await res.json())
}