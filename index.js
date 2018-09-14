#!/usr/bin/env node

const fs = require('fs')
const uuid = require('uuid')
const commander = require('commander')
const signalhub = require('signalhub')
const webrtc = require('webrtc-swarm')
const clipboard = require('clipboardy')
const tempfile = require('tempfile')
const imgcat = require('imgcat')

const hosts = [
  'https://signalhub-bthesorceror.herokuapp.com/'
]

commander
  .command('get-image <id>')
  .description('retrieve data from network')
  .action((id) => {
    const hub = signalhub(id, hosts)
    const swarm = webrtc(hub, { wrtc: require('wrtc') })
    const filepath = tempfile()

    swarm.on('peer', (s) => {
      s.on('end', () => {
        swarm.close()
      })

      const writeStream = fs.createWriteStream(filepath)

      writeStream.on('close', async () => {
        try {
          const img = await imgcat(filepath)
          console.log(img)
        } catch (e) {
          console.error('Failed to load image')
        }
      })

      s.pipe(writeStream)
    })
  })

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
  .command('push <file>')
  .description('push data to network')
  .option('--image', 'pushing an image file', false)
  .action((file, options) => {
    const id = uuid.v1()
    const hub = signalhub(id, hosts)
    const swarm = webrtc(hub, { wrtc: require('wrtc') })

    if (options.image) {
      clipboard.writeSync(`discovery-experiment get-image ${id}`)
    } else {
      clipboard.writeSync(`discovery-experiment get ${id}`)
    }
    console.info('copied to clipboard')

    swarm.on('peer', (s) => {
      console.info('peer connected')
      const fileStream = fs.createReadStream(file)

      fileStream.on('end', () => {
        console.info('file transferred')
      })

      fileStream.pipe(s)
    })

    swarm.on('disconnect', () => {
      console.info('peer disconnected')
    })
  })

commander.parse(process.argv)
