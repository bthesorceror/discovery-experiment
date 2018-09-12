#!/usr/bin/env node

const fs = require('fs')
const commander = require('commander')
const signalhub = require('signalhub')
const webrtc = require('webrtc-swarm')

const hosts = ['rocky-bastion-23364.herokuapp.com']

commander
  .command('get <id>')
  .description('retrieve data from network')
  .action((id) => {
    const hub = signalhub(id, hosts)
    const swarm = webrtc(hub, { wrtc: require('wrtc') })

    swarm.on('peer', (s) => {
      s.on('end', () => {
        swarm.close()
      })

      s.pipe(process.stdout)
    })
  })

commander
  .command('push <id> <file>')
  .description('push data to network')
  .action((id, file) => {
    const hub = signalhub(id, hosts)
    const swarm = webrtc(hub, { wrtc: require('wrtc') })

    swarm.on('peer', (s) => {
      fs.createReadStream(file).pipe(s)
    })

    swarm.on('disconnect', () => {
      console.info('Disconnected')
    })
  })

commander.parse(process.argv)
