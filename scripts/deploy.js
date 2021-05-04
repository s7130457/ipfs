const exec = require('child_process').exec
const execSync = require('child_process').execSync

let deployHost = '192.168.2.77'
let deployUser = 'root'
let deployLocation = `${deployUser}@${deployHost}:/root/build/backend`

let commit = getDate() + ' (' + execSync('git rev-parse --verify HEAD').toString().substr(0, 7) + ')'

execSync(`./node_modules/.bin/json -I -f dist/package.json -e 'this.gitVersion="${commit}"' `)

exec(`scp -r postman dist/* ${deployLocation}`, (err, stdout, stderr) => {
  if (err) console.log(err)
  console.log('\x1b[32m%s\x1b[0m', `Copied to ${deployHost} successfully`)
  exec(`ssh ${deployUser}@${deployHost} pm2 restart backend`, (err, stdout, stderr) => {
    if (err) console.log(err)
    console.log('\x1b[32m%s\x1b[0m', `Deployed to ${deployHost} successfully`)
  })
})

function getDate () {
  let now = new Date()
  let mm = now.getMonth() + 1
  var dd = now.getDate()

  return [now.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
  ].join('')
}
