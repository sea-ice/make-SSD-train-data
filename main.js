const electron = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const xml2js = require('xml2js')
const config = require('./config')
const {formatCurrentTime} = require('./utils/index')
const {app, ipcMain, BrowserWindow} = electron

let mainWindow
let createWindow = function () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  })
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './index.html'),
    protocol: 'file:',
    slashes: true
  }))
  mainWindow.on('closed', function () {
    mainWindow = null
  })
  let contents = mainWindow.webContents,
    datasetPath = path.resolve(__dirname, config.datasetPath),
    xmlSavePath = path.resolve(__dirname, config.xmlSavePath)
  try {
    fs.accessSync(datasetPath)
    fs.accessSync(xmlSavePath)
  } catch (e) {
    console.log('请确保配置的dataset路径和xml文件保存路径是存在的')
    process.exit(1)
  }

  // 向渲染进程发送待处理的图像
  contents.on('did-finish-load', function () {
    console.log(config.common)
    contents.send('image-config', JSON.stringify(config.common))

    images = fs.readdirSync(datasetPath)
    console.log(images)
    if (images[0].match(/\.DS_Store/)) images.splice(0, 1)
    contents.send('images-to-process', JSON.stringify(images.map(function (img) {
      return path.resolve(datasetPath, img)
    })))

    let typeImgsDir = path.resolve(__dirname, config.typesImgDir)
    let typeImages = fs.readdirSync(typeImgsDir)
    typeImages = typeImages.filter(img => img.match(/\.(png|jp(e)g|bmp)$/))
    config.types = typeImages.map((img, i) => {
      let firstDot = img.indexOf('.')
      firstDot = firstDot === -1 ? img.length : firstDot
      let typeName = path.basename(img).slice(0, firstDot)
      return {
        color: config.typeStrokeColor,
        name: typeName,
        sampleImage: path.resolve(typeImgsDir, img)
      }
    })
    // console.log(config.types)
    contents.send('image-types', JSON.stringify(config.types))
  })
  ipcMain.on('handled-images', function (event, message) {
    let images = JSON.parse(message),
        { 
          folderName = 'xml', 
          xmlSavePath, 
          size: {width, height, depth}
        } = config
    const XMLParser = new xml2js.Parser({explicitArray: false}),
          XMLBuilder = new xml2js.Builder({headless: true})
    fs.readFile(path.resolve(__dirname, './xml/template.xml'), function (err, data) {
      if (!err) {
        XMLParser.parseString(data, function (err, template) {
          var annotation = template.annotation
          annotation.folder = folderName
          annotation.size = {width, height, depth}
          let unlabeledImages = []
          for (let image of images) {
            annotation.filename = path.basename(image.url, path.extname(image.url))
            annotation.object = image.areas.map(area => {
              let {xmin, ymin, xmax, ymax} = area
              xmin = Math.round(xmin)
              ymin = Math.round(ymin)
              xmax = Math.round(xmax)
              ymax = Math.round(ymax)
              return {
                name: area.typeName,
                pose: 'Unspecified',
                truncated: '0',
                difficult: '0',
                bndbox: {xmin, ymin, xmax, ymax}
              }
            })
            if (!image.areas.length) unlabeledImages.push(image.name)
            let xml = XMLBuilder.buildObject(template)
            fs.writeFileSync(
              path.resolve(
                __dirname, 
                xmlSavePath, 
                `${path.basename(
                  image.url, path.extname(image.url)
                )}.xml`
              ), xml
            )
          }
          let time = new Date(),
          data = {unlabeledImages, images}
          fs.writeFileSync(
            path.resolve(
              __dirname,
              `./logs/${formatCurrentTime()}.json`
            ),
            JSON.stringify(data)
          )
        })
      } else {
        console.log(err)
      }
    })
  })
}

app.on('ready', createWindow)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
