const electron = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const xml2js = require('xml2js')
const chalk = require('chalk')
const config = require('./config')
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
  
  // const XMLParser = new xml2js.Parser({explicitArray: false})
  // fs.readFile(path.resolve(__dirname, './xml/template.xml'), function (err, data) {
  //   if (!err) {
  //     console.log('hello')
  //     XMLParser.parseString(data, function (err, template) {
  //       console.log(template)
  //       console.log(Array.isArray(template.annotation.filename))
  //       console.log(template.annotation.object[0].bndbox)

  //     })
  //   } else {
  //     console.log(err)
  //   }
  // })


  // var builder = new xml2js.Builder();
  // var xml = builder.buildObject(obj);
  // console.log(xml)
  // <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  // <root id="my id">my inner text</root>

  // 向渲染进程发送待处理的图像
  contents.on('did-finish-load', function () {
    images = fs.readdirSync(datasetPath)
    console.log(JSON.stringify(images.map(function (img) {
      return path.resolve(datasetPath, img)
    })))
    contents.send('images-to-process', JSON.stringify(images.map(function (img) {
      return path.resolve(datasetPath, img)
    })))
    contents.send('image-types', JSON.stringify(config.types))
  })
  ipcMain.on('handled-images', function (event, message) {
    console.log(message)
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
          console.log(template)
          console.log(Array.isArray(template.annotation.filename))
          console.log(template.annotation.object[0])
          var annotation = template.annotation
          annotation.folder = folderName
          annotation.size = {width, height, depth}
          for (let image of images) {
            annotation.filename = path.basename(image.url, path.extname(image.url))
            annotation.object = image.areas.map(area => {
              let {xmin, ymin, xmax, ymax} = area
              return {
                name: area.typeName,
                pose: 'Unspecified',
                truncated: '0',
                difficult: '0',
                bndbox: {xmin, ymin, xmax, ymax}
              }
            })
            let xml = XMLBuilder.buildObject(template)
            console.log(xml)
            console.log(path.resolve(
              __dirname, 
              xmlSavePath, 
              `${path.basename(
                image.url, path.extname(image.url)
              )}.xml`
            ))
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
